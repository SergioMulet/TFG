package handlers

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"main_server/repositories"

	"github.com/gin-gonic/gin"
	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
)

type TelemetryPayload struct {
	ShipId     string    `json:"ship_id"`
	OwnerEmail string    `json:"owner_email"`
	ShipType   string    `json:"ship_type"`
	Latitude   float64   `json:"latitude"`
	Longitude  float64   `json:"longitude"`
	Timestamp  time.Time `json:"timestamp"`
}

func SyncOfflineTelemetry(c *gin.Context) {
	fmt.Println("[SyncOff] offline synchronization...")
	var batch []TelemetryPayload
	if err := c.ShouldBindJSON(&batch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	org := os.Getenv("INFLUX_ORG")
	bucket := os.Getenv("INFLUX_BUCKET")
	writeAPI := repositories.Infra.Influx.WriteAPI(org, bucket)

	for _, data := range batch {
		if data.Timestamp.IsZero() {
			data.Timestamp = time.Now()
		}
		p := influxdb2.NewPoint(
			"boat_telemetry",
			map[string]string{"ship_id": data.ShipId, "owner_email": data.OwnerEmail, "ship_type": data.ShipType},
			map[string]interface{}{"latitude": data.Latitude, "longitude": data.Longitude},
			data.Timestamp,
		)
		writeAPI.WritePoint(p)
	}

	writeAPI.Flush()
	BroadcastShips()

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": fmt.Sprintf("Sincronizadas %d coordenadas offline", len(batch)),
	})
}
