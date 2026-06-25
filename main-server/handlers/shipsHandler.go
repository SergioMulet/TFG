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
	ID      string        `json:"id"`
	Name    string        `json:"name"`
	Type    string        `json:"type"`
	Lat     float64       `json:"lat"`
	Lng     float64       `json:"lng"`
	Route24 []Coordinates `json:"route24"`
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

		boatName, nameOk := record.ValueByKey("boat_name").(string)
		ownerEmail, emailOk := record.ValueByKey("owner_email").(string)

		if boatName == "" || !nameOk || !emailOk || ownerEmail == "" {
			continue
		}

		lat, _ := record.ValueByKey("latitude").(float64)
		lng, _ := record.ValueByKey("longitude").(float64)

		vesselsMap[boatName] = &ShipData{
			ID:  boatName,
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
// the given (boat_name, owner_email) pair. The mobile app calls this before
// turning location sending on for the first time: if the pair is unknown,
// the app must first prove ownership of the boat before any coordinates are
// accepted.
//
// NOTE: ownership verification itself (e.g. validating a registration
// document) is out of scope for this project and is currently simulated on
// the client. This endpoint only answers "have we seen this boat+owner
// before", it does not perform any ownership check itself.
func IsShipRegistered(c *gin.Context) {
	boatName := c.Query("boat_name")
	ownerEmail := c.Query("owner_email")
	if boatName == "" || ownerEmail == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "boat_name and owner_email are required"})
		return
	}

	org := os.Getenv("INFLUX_ORG")
	bucket := os.Getenv("INFLUX_BUCKET")
	queryAPI := repositories.Infra.Influx.QueryAPI(org)

	fluxQuery := fmt.Sprintf(`
		from(bucket: "%s")
			|> range(start: -100y)
			|> filter(fn: (r) => r["_measurement"] == "boat_telemetry")
			|> filter(fn: (r) => r["boat_name"] == "%s")
			|> filter(fn: (r) => r["owner_email"] == "%s")
			|> limit(n: 1)
	`, bucket, boatName, ownerEmail)

	result, err := queryAPI.Query(context.Background(), fluxQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer result.Close()

	c.JSON(http.StatusOK, ShipRegistration{Registered: result.Next()})
}

func GetShipDetails(c *gin.Context) {
	boatID := c.Param("id") // currently is the boat_name
	org := os.Getenv("INFLUX_ORG")
	bucket := os.Getenv("INFLUX_BUCKET")
	queryAPI := repositories.Infra.Influx.QueryAPI(org)

	fluxQuery := fmt.Sprintf(`
		from(bucket: "%s")
			|> range(start: -24h)
			|> filter(fn: (r) => r["_measurement"] == "boat_telemetry")
			|> filter(fn: (r) => r["boat_name"] == "%s")
			|> filter(fn: (r) => r["_field"] == "latitude" or r["_field"] == "longitude")
			|> sort(columns: ["_time"], desc: false)
			|> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
	`, bucket, boatID)

	result, err := queryAPI.Query(context.Background(), fluxQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var route []Coordinates
	var lastLat, lastLng float64
	shipType := "other"

	for result.Next() {
		record := result.Record()
		lat, _ := record.ValueByKey("latitude").(float64)
		lng, _ := record.ValueByKey("longitude").(float64)

		coor := Coordinates{Lat: lat, Lng: lng}
		route = append(route, coor)

		lastLat = lat
		lastLng = lng
		if t, ok := record.ValueByKey("ship_type").(string); ok && t != "" {
			shipType = t
		}
	}

	details := ShipDetails{
		ID:      boatID,
		Name:    boatID,
		Type:    shipType,
		Lat:     lastLat,
		Lng:     lastLng,
		Route24: route,
	}

	c.JSON(http.StatusOK, details)
}

// GetShipNameByOwner returns the most recent boat_name reported by the given
// owner_email, so the mobile app can prefill the boat name it last used.
func GetShipNameByOwner(c *gin.Context) {
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
			|> filter(fn: (r) => r["_field"] == "latitude")
			|> last()
	`, bucket, escapedEmail)

	result, err := queryAPI.Query(context.Background(), fluxQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var boatName string
	if result.Next() {
		boatName, _ = result.Record().ValueByKey("boat_name").(string)
	}

	c.JSON(http.StatusOK, gin.H{"boat_name": boatName})
}
