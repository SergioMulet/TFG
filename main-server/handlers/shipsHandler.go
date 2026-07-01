package handlers

import (
	"encoding/json"
	"log"
	"net/http"

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
	ID   string  `json:"id"`
	Lat  float64 `json:"lat"`
	Lng  float64 `json:"lng"`
	Type string  `json:"type"`
}

type ShipDetails struct {
	ShipId string        `json:"ship_id"`
	Type   string        `json:"type"`
	Lat    float64       `json:"lat"`
	Lng    float64       `json:"lng"`
	Route  []Coordinates `json:"route"`
}

func toShipData(positions []repositories.ShipPosition) []ShipData {
	ships := make([]ShipData, len(positions))
	for i, p := range positions {
		ships[i] = ShipData{ID: p.ID, Lat: p.Lat, Lng: p.Lng, Type: p.Type}
	}
	return ships
}

func GetShips(c *gin.Context) {
	positions, err := repositories.FetchAllShipPositions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, toShipData(positions))
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

	if positions, err := repositories.FetchAllShipPositions(); err == nil {
		if data, err := json.Marshal(toShipData(positions)); err == nil {
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
	positions, err := repositories.FetchAllShipPositions()
	if err != nil {
		log.Printf("⚠️ Could not broadcast ships: %v", err)
		return
	}

	data, err := json.Marshal(toShipData(positions))
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

	registered, err := repositories.ShipExists(shipId, ownerEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ShipRegistration{Registered: registered})
}

func GetShipDetails(c *gin.Context) {
	shipId := c.Param("id")

	route, err := repositories.FetchShipRoute(shipId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	details := ShipDetails{
		ShipId: shipId,
		Type:   route.Type,
		Lat:    route.Lat,
		Lng:    route.Lng,
	}
	if details.Type == "" {
		details.Type = "other"
	}
	for _, p := range route.Points {
		details.Route = append(details.Route, Coordinates{Lat: p.Lat, Lng: p.Lng})
	}

	c.JSON(http.StatusOK, details)
}

// GetShipsByOwner lists every ship ever registered by the given owner_email.
func GetShipsByOwner(c *gin.Context) {
	email := c.Param("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email param is required"})
		return
	}

	positions, err := repositories.FetchShipPositionsByOwner(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, toShipData(positions))
}

// DeleteShip permanently erases all telemetry recorded for the given
// (ship_id, owner_email) pair.
func DeleteShip(c *gin.Context) {
	shipId := c.Param("id")
	ownerEmail := c.Query("owner_email")
	if shipId == "" || ownerEmail == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ship id and owner_email are required"})
		return
	}

	if err := repositories.DeleteShipTelemetry(shipId, ownerEmail); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	BroadcastShips()
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}
