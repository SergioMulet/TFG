package repositories

import (
	"context"
	"testing"
	"time"

	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
	"github.com/influxdata/influxdb-client-go/v2/api"
)

// ── escapeFluxString ──────────────────────────────────────────────────────────

func TestEscapeFluxString(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{"plain", "hello", "hello"},
		{"backslash", `a\b`, `a\\b`},
		{"quote", `a"b`, `a\"b`},
		// Backslash immediately before a quote: the backslash must be doubled
		// BEFORE the quote is escaped — wrong order would produce triple-backslash.
		{"backslash-then-quote", `a\"b`, `a\\\"b`},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := escapeFluxString(tc.input)
			if got != tc.want {
				t.Errorf("escapeFluxString(%q) = %q, want %q", tc.input, got, tc.want)
			}
		})
	}
}

// ── newTelemetryPoint ─────────────────────────────────────────────────────────

func TestNewTelemetryPoint_Measurement(t *testing.T) {
	p := newTelemetryPoint(TelemetryPayload{Timestamp: time.Now()})
	if p.Name() != "boat_telemetry" {
		t.Errorf("measurement = %q, want %q", p.Name(), "boat_telemetry")
	}
}

func TestNewTelemetryPoint_Tags(t *testing.T) {
	data := TelemetryPayload{
		ShipId:     "ship1",
		OwnerEmail: "owner@test.com",
		ShipType:   "yacht",
		Timestamp:  time.Now(),
	}
	p := newTelemetryPoint(data)

	tags := make(map[string]string)
	for _, tag := range p.TagList() {
		tags[tag.Key] = tag.Value
	}

	if tags["ship_id"] != data.ShipId {
		t.Errorf("tag ship_id = %q, want %q", tags["ship_id"], data.ShipId)
	}
	if tags["owner_email"] != data.OwnerEmail {
		t.Errorf("tag owner_email = %q, want %q", tags["owner_email"], data.OwnerEmail)
	}
	if tags["ship_type"] != data.ShipType {
		t.Errorf("tag ship_type = %q, want %q", tags["ship_type"], data.ShipType)
	}
}

func TestNewTelemetryPoint_Fields(t *testing.T) {
	data := TelemetryPayload{
		Latitude:  41.3851,
		Longitude: 2.1734,
		Timestamp: time.Now(),
	}
	p := newTelemetryPoint(data)

	fields := make(map[string]interface{})
	for _, f := range p.FieldList() {
		fields[f.Key] = f.Value
	}

	if fields["latitude"] != data.Latitude {
		t.Errorf("field latitude = %v, want %v", fields["latitude"], data.Latitude)
	}
	if fields["longitude"] != data.Longitude {
		t.Errorf("field longitude = %v, want %v", fields["longitude"], data.Longitude)
	}
}

func TestNewTelemetryPoint_ZeroTimestampReplacedWithNow(t *testing.T) {
	before := time.Now()
	p := newTelemetryPoint(TelemetryPayload{}) // zero Timestamp
	after := time.Now()

	pt := p.Time()
	if pt.Before(before) || pt.After(after) {
		t.Errorf("point time %v not in [%v, %v]; expected ~now when Timestamp is zero", pt, before, after)
	}
}

func TestNewTelemetryPoint_NonZeroTimestampPreserved(t *testing.T) {
	ts := time.Date(2024, 1, 15, 12, 0, 0, 0, time.UTC)
	p := newTelemetryPoint(TelemetryPayload{Timestamp: ts})
	if !p.Time().Equal(ts) {
		t.Errorf("point time = %v, want %v", p.Time(), ts)
	}
}

// ── DeleteShipTelemetry — predicate format ────────────────────────────────────

// mockInfluxClient satisfies influxdb2.Client; only DeleteAPI() is overridden.
type mockInfluxClient struct {
	influxdb2.Client
	del *captureDeleteAPI
}

func (m *mockInfluxClient) DeleteAPI() api.DeleteAPI { return m.del }

// captureDeleteAPI satisfies api.DeleteAPI; only DeleteWithName is overridden.
type captureDeleteAPI struct {
	api.DeleteAPI
	predicate string
}

func (c *captureDeleteAPI) DeleteWithName(_ context.Context, _, _ string, _, _ time.Time, pred string) error {
	c.predicate = pred
	return nil
}

func TestDeleteShipTelemetry_PredicateTargetsShipAndOwner(t *testing.T) {
	del := &captureDeleteAPI{}
	Infra.Influx = &mockInfluxClient{del: del}
	t.Cleanup(func() { Infra.Influx = nil })

	if err := DeleteShipTelemetry("myship", "owner@test.com"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	want := `_measurement="boat_telemetry" and ship_id="myship" and owner_email="owner@test.com"`
	if del.predicate != want {
		t.Errorf("predicate\n got:  %s\n want: %s", del.predicate, want)
	}
}

func TestDeleteShipTelemetry_PredicateEscapesSpecialChars(t *testing.T) {
	del := &captureDeleteAPI{}
	Infra.Influx = &mockInfluxClient{del: del}
	t.Cleanup(func() { Infra.Influx = nil })

	// Ship ID contains a quote; owner e-mail contains a backslash then a quote.
	if err := DeleteShipTelemetry(`ship"1`, `owner\"@test.com`); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	want := `_measurement="boat_telemetry" and ship_id="ship\"1" and owner_email="owner\\\"@test.com"`
	if del.predicate != want {
		t.Errorf("predicate\n got:  %s\n want: %s", del.predicate, want)
	}
}
