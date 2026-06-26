package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"main_server/repositories"
	"main_server/ws"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Coordinates struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type ShipData struct {
	ID  string  `json:"id"`
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type ShipDetails struct {
	ShipId     string        `json:"ship_id"`
	OwnerEmail string        `json:"owner_email"`
	Type       string        `json:"type"`
	Lat        float64       `json:"lat"`
	Lng        float64       `json:"lng"`
	Route24    []Coordinates `json:"route24"`
}

func fetchShips() ([]ShipData, error) {
	org := os.Getenv("INFLUX_ORG")
	bucket := os.Getenv("INFLUX_BUCKET")
	queryAPI := repositories.Infra.Influx.QueryAPI(org)

	fluxQuery := fmt.Sprintf(`
		from(bucket: "%s")
			|> range(start: -30d)
			|> filter(fn: (r) => r["_measurement"] == "boat_telemetry")
			|> filter(fn: (r) => r["_field"] == "latitude" or r["_field"] == "longitude")
			|> last()
			|> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
	`, bucket)

	result, err := queryAPI.Query(context.Background(), fluxQuery)
	if err != nil {
		return nil, err
	}

	vesselsMap := make(map[string]*ShipData)

	for result.Next() {
		record := result.Record()

		shipId, shipIdOk := record.ValueByKey("ship_id").(string)
		ownerEmail, emailOk := record.ValueByKey("owner_email").(string)

		if shipId == "" || !shipIdOk || !emailOk || ownerEmail == "" {
			continue
		}

		lat, _ := record.ValueByKey("latitude").(float64)
		lng, _ := record.ValueByKey("longitude").(float64)

		vesselsMap[shipId] = &ShipData{
			ID:  shipId,
			Lat: lat,
			Lng: lng,
		}
	}

	var ships []ShipData
	for _, v := range vesselsMap {
		ships = append(ships, *v)
	}

	return ships, nil
}

func GetShips(c *gin.Context) {
	ships, err := fetchShips()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ships)
}

// ShipsWebSocket upgrades the connection and streams ship position snapshots:
// one immediately on connect, then one every time BroadcastShips is called.
func ShipsWebSocket(c *gin.Context) {
	conn, err := wsUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("⚠️ WS upgrade error: %v", err)
		return
	}

	ws.Hub.Register(conn)
	defer ws.Hub.Unregister(conn)

	if ships, err := fetchShips(); err == nil {
		if data, err := json.Marshal(ships); err == nil {
			conn.WriteMessage(websocket.TextMessage, data)
		}
	}

	// Keep reading so a client disconnect is detected and the connection is unregistered.
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

// BroadcastShips re-queries the current ship snapshot and pushes it to every
// connected WebSocket client. Call this after any telemetry write.
func BroadcastShips() {
	ships, err := fetchShips()
	if err != nil {
		log.Printf("⚠️ Could not broadcast ships: %v", err)
		return
	}

	data, err := json.Marshal(ships)
	if err != nil {
		log.Printf("⚠️ Could not marshal ships for broadcast: %v", err)
		return
	}

	ws.Hub.Broadcast(data)
}

type ShipRegistration struct {
	Registered bool `json:"registered"`
}

// IsShipRegistered reports whether any telemetry has ever been recorded for
// the given (ship_id, owner_email) pair.
func IsShipRegistered(c *gin.Context) {
	shipId := c.Query("ship_id")
	ownerEmail := c.Query("owner_email")
	if shipId == "" || ownerEmail == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ship_id and owner_email are required"})
		return
	}

	org := os.Getenv("INFLUX_ORG")
	bucket := os.Getenv("INFLUX_BUCKET")
	queryAPI := repositories.Infra.Influx.QueryAPI(org)

	fluxQuery := fmt.Sprintf(`
		from(bucket: "%s")
			|> range(start: -100y)
			|> filter(fn: (r) => r["_measurement"] == "boat_telemetry")
			|> filter(fn: (r) => r["ship_id"] == "%s")
			|> filter(fn: (r) => r["owner_email"] == "%s")
			|> limit(n: 1)
	`, bucket, shipId, ownerEmail)

	result, err := queryAPI.Query(context.Background(), fluxQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer result.Close()

	c.JSON(http.StatusOK, ShipRegistration{Registered: result.Next()})
}

func GetShipDetails(c *gin.Context) {
	shipId := c.Param("id")
	org := os.Getenv("INFLUX_ORG")
	bucket := os.Getenv("INFLUX_BUCKET")
	queryAPI := repositories.Infra.Influx.QueryAPI(org)

	fluxQuery := fmt.Sprintf(`
		from(bucket: "%s")
			|> range(start: -24h)
			|> filter(fn: (r) => r["_measurement"] == "boat_telemetry")
			|> filter(fn: (r) => r["ship_id"] == "%s")
			|> filter(fn: (r) => r["_field"] == "latitude" or r["_field"] == "longitude")
			|> sort(columns: ["_time"], desc: false)
			|> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
	`, bucket, shipId)

	result, err := queryAPI.Query(context.Background(), fluxQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer result.Close()

	details := ShipDetails{ShipId: shipId, Type: "other"}
	var route []Coordinates

	for result.Next() {
		record := result.Record()
		lat, _ := record.ValueByKey("latitude").(float64)
		lng, _ := record.ValueByKey("longitude").(float64)

		route = append(route, Coordinates{Lat: lat, Lng: lng})
		details.Lat, details.Lng = lat, lng
		if e, ok := record.ValueByKey("owner_email").(string); ok && e != "" {
			details.OwnerEmail = e
		}
		if t, ok := record.ValueByKey("ship_type").(string); ok && t != "" {
			details.Type = t
		}
	}
	details.Route24 = route

	c.JSON(http.StatusOK, details)
}

// GetShipDetailsByOwner returns the ship_id, type and last known coordinates
// reported by the given owner_email.
func GetShipDetailsByOwner(c *gin.Context) {
	email := c.Param("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email param is required"})
		return
	}
	escapedEmail := strings.ReplaceAll(email, `"`, `\"`)

	org := os.Getenv("INFLUX_ORG")
	bucket := os.Getenv("INFLUX_BUCKET")
	queryAPI := repositories.Infra.Influx.QueryAPI(org)

	fluxQuery := fmt.Sprintf(`
		from(bucket: "%s")
			|> range(start: -100y) // maybe a user has not log in since a long time
			|> filter(fn: (r) => r["_measurement"] == "boat_telemetry")
			|> filter(fn: (r) => r["owner_email"] == "%s")
			|> filter(fn: (r) => r["_field"] == "latitude" or r["_field"] == "longitude")
			|> last()
			|> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
	`, bucket, escapedEmail)

	result, err := queryAPI.Query(context.Background(), fluxQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer result.Close()

	if !result.Next() {
		c.Status(http.StatusNoContent)
		return
	}

	record := result.Record()
	shipId, ok := record.ValueByKey("ship_id").(string)
	if !ok || shipId == "" {
		c.Status(http.StatusNoContent)
		return
	}

	details := ShipDetails{ShipId: shipId, OwnerEmail: email, Type: "other"}
	details.Lat, _ = record.ValueByKey("latitude").(float64)
	details.Lng, _ = record.ValueByKey("longitude").(float64)
	if t, ok := record.ValueByKey("ship_type").(string); ok && t != "" {
		details.Type = t
	}

	c.JSON(http.StatusOK, details)
}
