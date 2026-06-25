package main

import (
	"log"
	"os"

	"main_server/handlers"
	"main_server/middleware"
	"main_server/mqtt"
	"main_server/repositories"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	// start db
	repositories.InitInfrastructure()
	defer repositories.Infra.Influx.Close()

	// start mqtt in background
	mqtt.StartSubscriber()

	router := gin.Default()
	router.Use(cors.Default())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "up", "message": "Backend running perfectly"})
	})

	// routes
	api := router.Group("/api")
	api.Use(middleware.AuthMiddleWare(repositories.Infra.Supabase))
	{
		api.POST("/telemetry/sync", handlers.SyncOfflineTelemetry)
	}

	router.GET("/api/ships", handlers.GetShips)
	router.GET("/api/ships/registered", handlers.IsShipRegistered)
	router.GET("/api/ships/:id", handlers.GetShipDetails)
	router.GET("/api/ships/owner/:email", handlers.GetShipNameByOwner)
	router.GET("/ws/ships", handlers.ShipsWebSocket)

	// deploy server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("HTTP server ready at: %s", port)
	router.Run(":" + port)
}
