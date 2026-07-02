package handlers

import (
	"net/http"

	"main_server/repositories"

	"github.com/gin-gonic/gin"
)

const maxShipImageBytes = 5 << 20 // 5 MiB

var allowedShipImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
}

// UploadShipImage stores (or replaces) the photo for a ship in Supabase
// Storage.
func UploadShipImage(c *gin.Context) {
	shipId := c.Param("id")
	if shipId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ship id is required"})
		return
	}

	fileHeader, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image file is required"})
		return
	}
	if fileHeader.Size > maxShipImageBytes {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "image must be 5MB or smaller"})
		return
	}

	contentType := fileHeader.Header.Get("Content-Type")
	if !allowedShipImageTypes[contentType] {
		c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "only JPEG, PNG or WEBP images are allowed"})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer file.Close()

	if err := repositories.UploadShipImage(shipId, file, contentType); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"image_url": repositories.ShipImageUrl(shipId)})
}
