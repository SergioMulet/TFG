package repositories

import (
	"encoding/json"
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

// FetchShipCountry returns the ISO 3166-1 alpha-2 country code stored for the
// given ship, or an empty string if none was set.
func FetchShipCountry(shipId string) (string, error) {
	data, _, err := Infra.Supabase.From("Ships").
		Select("country", "", false).
		Eq("ship_id", shipId).
		Execute()
	if err != nil {
		return "", err
	}

	var rows []struct {
		Country *string `json:"country"`
	}
	if err := json.Unmarshal(data, &rows); err != nil {
		return "", err
	}
	if len(rows) == 0 || rows[0].Country == nil {
		return "", nil
	}
	return *rows[0].Country, nil
}
