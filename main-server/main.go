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

	// Ship browsing/positions are intentionally public (the web dashboard has
	// no auth of its own); only the offline-sync endpoint requires a logged-in user.
	public := router.Group("/api")
	{
		public.GET("/ships", handlers.GetShips)
		public.GET("/ships/registered", handlers.IsShipRegistered)
		public.GET("/ships/:id", handlers.GetShipDetails)
		public.DELETE("/ships/:id", handlers.DeleteShip)
		public.GET("/ships/owner/:email/list", handlers.GetShipsByOwner)
	}

	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleWare(repositories.Infra.Supabase))
	{
		protected.POST("/telemetry/sync", handlers.SyncOfflineTelemetry)
	}

	router.GET("/ws/ships", handlers.ShipsWebSocket)

	// deploy server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("HTTP server ready at: %s", port)
	router.Run(":" + port)
}
