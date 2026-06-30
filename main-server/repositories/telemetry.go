package repositories

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
	"github.com/influxdata/influxdb-client-go/v2/api/write"
)

const measurement = "boat_telemetry"

// TelemetryPayload is a single ship position report, whether it arrives over
// MQTT or via the offline-sync HTTP endpoint.
type TelemetryPayload struct {
	ShipId     string    `json:"ship_id"`
	OwnerEmail string    `json:"owner_email"`
	ShipType   string    `json:"ship_type"`
	Latitude   float64   `json:"latitude"`
	Longitude  float64   `json:"longitude"`
	Timestamp  time.Time `json:"timestamp"`
}

// ShipPosition is the latest known position of a single ship.
type ShipPosition struct {
	ID   string
	Lat  float64
	Lng  float64
	Type string
}

// RoutePoint is a single coordinate in a ship's recorded route.
type RoutePoint struct {
	Lat float64
	Lng float64
}

// ShipRoute is a ship's recent route plus the latest metadata seen along it.
type ShipRoute struct {
	OwnerEmail string
	Type       string
	Lat        float64
	Lng        float64
	Points     []RoutePoint
}

// escapeFluxString escapes a value for safe interpolation into a Flux
// double-quoted string literal.
func escapeFluxString(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, `"`, `\"`)
	return s
}

func influxOrgBucket() (string, string) {
	return os.Getenv("INFLUX_ORG"), os.Getenv("INFLUX_BUCKET")
}

func newTelemetryPoint(data TelemetryPayload) *write.Point {
	timestamp := data.Timestamp
	if timestamp.IsZero() {
		timestamp = time.Now()
	}

	return influxdb2.NewPoint(
		measurement,
		map[string]string{"ship_id": data.ShipId, "owner_email": data.OwnerEmail, "ship_type": data.ShipType},
		map[string]interface{}{"latitude": data.Latitude, "longitude": data.Longitude},
		timestamp,
	)
}

// WriteTelemetryPoints writes a batch of telemetry payloads to InfluxDB.
func WriteTelemetryPoints(payloads []TelemetryPayload) {
	org, bucket := influxOrgBucket()
	writeAPI := Infra.Influx.WriteAPI(org, bucket)

	for _, payload := range payloads {
		writeAPI.WritePoint(newTelemetryPoint(payload))
	}
	writeAPI.Flush()
}

// WriteTelemetryPoint writes a single telemetry payload to InfluxDB.
func WriteTelemetryPoint(payload TelemetryPayload) {
	WriteTelemetryPoints([]TelemetryPayload{payload})
}

// queryLatestPositions returns the latest known position of every distinct
// ship within rangeStart, optionally narrowed down to a single owner.
func queryLatestPositions(rangeStart string, ownerEmail string) ([]ShipPosition, error) {
	org, bucket := influxOrgBucket()
	queryAPI := Infra.Influx.QueryAPI(org)

	ownerFilter := ""
	if ownerEmail != "" {
		ownerFilter = fmt.Sprintf(`|> filter(fn: (r) => r["owner_email"] == "%s")`, escapeFluxString(ownerEmail))
	}

	fluxQuery := fmt.Sprintf(`
		from(bucket: "%s")
			|> range(start: %s)
			|> filter(fn: (r) => r["_measurement"] == "%s")
			%s
			|> filter(fn: (r) => r["_field"] == "latitude" or r["_field"] == "longitude")
			|> last()
			|> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
	`, bucket, rangeStart, measurement, ownerFilter)

	result, err := queryAPI.Query(context.Background(), fluxQuery)
	if err != nil {
		return nil, err
	}
	defer result.Close()

	vesselsMap := make(map[string]*ShipPosition)
	latestTime := make(map[string]time.Time)

	for result.Next() {
		record := result.Record()

		shipId, shipIdOk := record.ValueByKey("ship_id").(string)
		recordOwnerEmail, emailOk := record.ValueByKey("owner_email").(string)
		if !shipIdOk || shipId == "" || !emailOk || recordOwnerEmail == "" {
			continue
		}

		recordTime := record.Time()
		if seen, ok := latestTime[shipId]; ok && !recordTime.After(seen) {
			continue
		}
		latestTime[shipId] = recordTime

		lat, _ := record.ValueByKey("latitude").(float64)
		lng, _ := record.ValueByKey("longitude").(float64)
		shipType, _ := record.ValueByKey("ship_type").(string)
		if shipType == "" {
			shipType = "other"
		}

		vesselsMap[shipId] = &ShipPosition{ID: shipId, Lat: lat, Lng: lng, Type: shipType}
	}

	ships := make([]ShipPosition, 0, len(vesselsMap))
	for _, v := range vesselsMap {
		ships = append(ships, *v)
	}
	return ships, nil
}

// FetchAllShipPositions returns the latest known position of every ship
// reported in the last 30 days, across all owners.
func FetchAllShipPositions() ([]ShipPosition, error) {
	return queryLatestPositions("-30d", "")
}

// FetchShipPositionsByOwner returns the latest known position of every ship
// ever reported by the given owner.
func FetchShipPositionsByOwner(ownerEmail string) ([]ShipPosition, error) {
	return queryLatestPositions("-100y", ownerEmail)
}

// ShipExists reports whether any telemetry has ever been recorded for the
// given (ship_id, owner_email) pair.
func ShipExists(shipId, ownerEmail string) (bool, error) {
	org, bucket := influxOrgBucket()
	queryAPI := Infra.Influx.QueryAPI(org)

	fluxQuery := fmt.Sprintf(`
		from(bucket: "%s")
			|> range(start: -100y)
			|> filter(fn: (r) => r["_measurement"] == "%s")
			|> filter(fn: (r) => r["ship_id"] == "%s")
			|> filter(fn: (r) => r["owner_email"] == "%s")
			|> limit(n: 1)
	`, bucket, measurement, escapeFluxString(shipId), escapeFluxString(ownerEmail))

	result, err := queryAPI.Query(context.Background(), fluxQuery)
	if err != nil {
		return false, err
	}
	defer result.Close()

	return result.Next(), nil
}

// FetchShipRoute returns the full recorded history of positions for a single
// ship, ordered oldest to newest, along with the most recently seen
// owner_email/ship_type metadata.
func FetchShipRoute(shipId string) (ShipRoute, error) {
	org, bucket := influxOrgBucket()
	queryAPI := Infra.Influx.QueryAPI(org)

	fluxQuery := fmt.Sprintf(`
		from(bucket: "%s")
			|> range(start: -100y)
			|> filter(fn: (r) => r["_measurement"] == "%s")
			|> filter(fn: (r) => r["ship_id"] == "%s")
			|> filter(fn: (r) => r["_field"] == "latitude" or r["_field"] == "longitude")
			|> sort(columns: ["_time"], desc: false)
			|> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
	`, bucket, measurement, escapeFluxString(shipId))

	result, err := queryAPI.Query(context.Background(), fluxQuery)
	if err != nil {
		return ShipRoute{}, err
	}
	defer result.Close()

	var route ShipRoute
	for result.Next() {
		record := result.Record()
		lat, _ := record.ValueByKey("latitude").(float64)
		lng, _ := record.ValueByKey("longitude").(float64)

		route.Points = append(route.Points, RoutePoint{Lat: lat, Lng: lng})
		route.Lat, route.Lng = lat, lng
		if e, ok := record.ValueByKey("owner_email").(string); ok && e != "" {
			route.OwnerEmail = e
		}
		if t, ok := record.ValueByKey("ship_type").(string); ok && t != "" {
			route.Type = t
		}
	}

	return route, nil
}

// DeleteShipTelemetry permanently erases all telemetry recorded for the
// given (ship_id, owner_email) pair.
func DeleteShipTelemetry(shipId, ownerEmail string) error {
	org, bucket := influxOrgBucket()
	deleteAPI := Infra.Influx.DeleteAPI()

	predicate := fmt.Sprintf(
		`_measurement="%s" and ship_id="%s" and owner_email="%s"`,
		measurement, escapeFluxString(shipId), escapeFluxString(ownerEmail),
	)

	start := time.Unix(0, 0)
	stop := time.Now()
	return deleteAPI.DeleteWithName(context.Background(), org, bucket, start, stop, predicate)
}
