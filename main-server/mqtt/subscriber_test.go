package mqtt

import (
	"encoding/json"
	"testing"
	"time"

	"main_server/repositories"
)

// TestDecodeMQTTPayload exercises the JSON unmarshal that the default publish
// handler performs on every incoming MQTT message.

func TestDecodeMQTTPayload_ValidJSON_AllFieldsParsed(t *testing.T) {
	raw := []byte(`{
		"ship_id":     "boat42",
		"owner_email": "captain@sea.com",
		"ship_type":   "cargo",
		"latitude":    41.3851,
		"longitude":   2.1734,
		"timestamp":   "2024-03-15T10:00:00Z"
	}`)

	var p repositories.TelemetryPayload
	if err := json.Unmarshal(raw, &p); err != nil {
		t.Fatalf("unexpected parse error: %v", err)
	}

	if p.ShipId != "boat42" {
		t.Errorf("ShipId = %q, want %q", p.ShipId, "boat42")
	}
	if p.OwnerEmail != "captain@sea.com" {
		t.Errorf("OwnerEmail = %q, want %q", p.OwnerEmail, "captain@sea.com")
	}
	if p.ShipType != "cargo" {
		t.Errorf("ShipType = %q, want %q", p.ShipType, "cargo")
	}
	if p.Latitude != 41.3851 {
		t.Errorf("Latitude = %v, want %v", p.Latitude, 41.3851)
	}
	if p.Longitude != 2.1734 {
		t.Errorf("Longitude = %v, want %v", p.Longitude, 2.1734)
	}

	want := time.Date(2024, 3, 15, 10, 0, 0, 0, time.UTC)
	if !p.Timestamp.Equal(want) {
		t.Errorf("Timestamp = %v, want %v", p.Timestamp, want)
	}
}

func TestDecodeMQTTPayload_MalformedJSON_ReturnsError(t *testing.T) {
	malformed := []byte(`{ship_id: not-valid-json`)

	var p repositories.TelemetryPayload
	if err := json.Unmarshal(malformed, &p); err == nil {
		t.Error("expected an error for malformed JSON, got nil")
	}
}

func TestDecodeMQTTPayload_EmptyPayload_ReturnsError(t *testing.T) {
	var p repositories.TelemetryPayload
	if err := json.Unmarshal([]byte{}, &p); err == nil {
		t.Error("expected an error for empty payload, got nil")
	}
}

func TestDecodeMQTTPayload_PartialJSON_DoesNotPanic(t *testing.T) {
	// A partial payload should not panic — missing fields get zero values.
	raw := []byte(`{"ship_id":"onlyid"}`)
	var p repositories.TelemetryPayload
	if err := json.Unmarshal(raw, &p); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if p.ShipId != "onlyid" {
		t.Errorf("ShipId = %q, want %q", p.ShipId, "onlyid")
	}
	if p.Latitude != 0 || p.Longitude != 0 {
		t.Errorf("expected zero lat/lng for missing fields, got lat=%v lng=%v", p.Latitude, p.Longitude)
	}
}
