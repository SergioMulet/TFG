package repositories

import (
	"io"

	storage_go "github.com/supabase-community/storage-go"
)

// shipImagesBucket is the Supabase Storage bucket
const shipImagesBucket = "ship-images"

// UploadShipImage uploads (or replaces) the photo for the given ship.
func UploadShipImage(shipId string, data io.Reader, contentType string) error {
	upsert := true
	_, err := Infra.Supabase.Storage.UploadFile(shipImagesBucket, shipId, data, storage_go.FileOptions{
		ContentType: &contentType,
		Upsert:      &upsert,
	})
	return err
}

// ShipImageUrl returns the public URL for a ship's photo. The URL is always
// returned, whether or not a photo has actually been uploaded for that ship.
func ShipImageUrl(shipId string) string {
	return Infra.Supabase.Storage.GetPublicUrl(shipImagesBucket, shipId).SignedURL
}
