package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
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

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Formato inválido. Usa 'Bearer <token>'"})
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
