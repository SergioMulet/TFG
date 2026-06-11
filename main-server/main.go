package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "up",
			"message": "Maritime Identification Backend running perfectly",
		})
	})

	router.Run(":8080")
}