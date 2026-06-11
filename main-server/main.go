package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
)

func AuthMiddleWare(supabaseClient *supabase.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication header needed"})
			c.Abort()
			return
		}

		// standart format: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "El formato debe ser 'Bearer <token>'"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		authenticatedUser := supabaseClient.Auth.WithToken(tokenString)

		user, err := authenticatedUser.GetUser()
		if err != nil || user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido o caducado"})
			c.Abort()
			return
		}

		c.Set("userID", user.ID)
		c.Next()
	}
}

func main() {
	_ = godotenv.Load()
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SECRET_KEY")

	supabaseClient, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		log.Fatalf("An error occured while initilizing supabase: %v", err)
	}
	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "up",
			"message": "Maritime Identification Backend running perfectly",
		})
	})

	protected := router.Group("/api")
	protected.Use(AuthMiddleWare(supabaseClient))
	{
		protected.POST("/users", func (c *gin.Context) {
			userID, _ := c.Get("userID")

		c.JSON(http.StatusOK, gin.H{
				"status":  "authenticated",
				"message": "Welcome to Maritime Identification Platform",
				"uid":     userID,
		})
	})
}

	router.Run(":8080")
}
