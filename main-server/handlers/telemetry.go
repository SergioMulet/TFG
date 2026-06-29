package handlers

import (
	"fmt"
	"net/http"

	"main_server/repositories"

	"github.com/gin-gonic/gin"
)

func SyncOfflineTelemetry(c *gin.Context) {
	fmt.Println("[SyncOff] offline synchronization...")
	var batch []repositories.TelemetryPayload
	if err := c.ShouldBindJSON(&batch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	repositories.WriteTelemetryPoints(batch)
	BroadcastShips()

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": fmt.Sprintf("Sincronizadas %d coordenadas offline", len(batch)),
	})
}
