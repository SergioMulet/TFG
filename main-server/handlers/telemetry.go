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
	BoatName   string    `json:"boat_name"`
	OwnerEmail string    `json:"owner_email"`
	Latitude   float64   `json:"latitude"`
	Longitude  float64   `json:"longitude"`
	Timestamp  time.Time `json:"timestamp"`
}

func SyncOfflineTelemetry(c *gin.Context) {
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
			map[string]string{"boat_name": data.BoatName, "owner_email": data.OwnerEmail},
			map[string]interface{}{"latitude": data.Latitude, "longitude": data.Longitude},
			data.Timestamp,
		)
		writeAPI.WritePoint(p)
	}

	writeAPI.Flush()

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": fmt.Sprintf("Sincronizadas %d coordenadas offline", len(batch)),
	})
}
