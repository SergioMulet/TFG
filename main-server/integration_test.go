//go:build integration

package main_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
	paho "github.com/eclipse/paho.mqtt.golang"
	supabase "github.com/supabase-community/supabase-go"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"

	"main_server/handlers"
	"main_server/middleware"
	mqttpkg "main_server/mqtt"
	"main_server/repositories"
)

const (
	influxOrg    = "testorg"
	influxBucket = "testbucket"
	influxToken  = "test-token-integration"
	validToken   = "integration-valid-token"
)

var (
	testRouter *gin.Engine
	mqttPub    paho.Client
)

// ── TestMain — spin up containers, wire infrastructure ────────────────────────

func TestMain(m *testing.M) {
	ctx := context.Background()
	gin.SetMode(gin.TestMode)

	// ── InfluxDB 2.x ─────────────────────────────────────────────────────────
	influxC, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: testcontainers.ContainerRequest{
			Image:        "influxdb:2.7",
			ExposedPorts: []string{"8086/tcp"},
			Env: map[string]string{
				"DOCKER_INFLUXDB_INIT_MODE":        "setup",
				"DOCKER_INFLUXDB_INIT_USERNAME":    "admin",
				"DOCKER_INFLUXDB_INIT_PASSWORD":    "password12",
				"DOCKER_INFLUXDB_INIT_ORG":         influxOrg,
				"DOCKER_INFLUXDB_INIT_BUCKET":      influxBucket,
				"DOCKER_INFLUXDB_INIT_ADMIN_TOKEN": influxToken,
			},
			WaitingFor: wait.ForHTTP("/health").
				WithPort("8086/tcp").
				WithStartupTimeout(90 * time.Second),
		},
		Started: true,
	})
	if err != nil {
		log.Fatalf("start InfluxDB container: %v", err)
	}
	defer influxC.Terminate(ctx)

	influxHost, _ := influxC.Host(ctx)
	influxMapped, _ := influxC.MappedPort(ctx, "8086/tcp")
	influxURL := fmt.Sprintf("http://%s:%s", influxHost, influxMapped.Port())

	// ── Mosquitto 2.x ─────────────────────────────────────────────────────────
	mosquittoC, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: testcontainers.ContainerRequest{
			Image:        "eclipse-mosquitto:2",
			ExposedPorts: []string{"1883/tcp"},
			Files: []testcontainers.ContainerFile{{
				Reader:            strings.NewReader("listener 1883\nallow_anonymous true\n"),
				ContainerFilePath: "/mosquitto/config/mosquitto.conf",
				FileMode:          0644,
			}},
			WaitingFor: wait.ForListeningPort("1883/tcp").
				WithStartupTimeout(30 * time.Second),
		},
		Started: true,
	})
	if err != nil {
		log.Fatalf("start Mosquitto container: %v", err)
	}
	defer mosquittoC.Terminate(ctx)

	mqttHost, _ := mosquittoC.Host(ctx)
	mqttMapped, _ := mosquittoC.MappedPort(ctx, "1883/tcp")
	mqttBroker := fmt.Sprintf("tcp://%s:%s", mqttHost, mqttMapped.Port())

	// ── InfluxDB client ───────────────────────────────────────────────────────
	os.Setenv("INFLUX_ORG", influxOrg)
	os.Setenv("INFLUX_BUCKET", influxBucket)
	repositories.Infra.Influx = influxdb2.NewClientWithOptions(
		influxURL, influxToken,
		influxdb2.DefaultOptions().SetLogLevel(0),
	)
	defer repositories.Infra.Influx.Close()

	// ── MQTT subscriber ───────────────────────────────────────────────────────
	subClient, err := mqttpkg.Connect(mqttBroker, "integration-subscriber")
	if err != nil {
		log.Fatalf("MQTT subscriber connect: %v", err)
	}
	defer subClient.Disconnect(250)

	// ── MQTT publisher (test helper) ──────────────────────────────────────────
	mqttPub = newMQTTPub(mqttBroker, "integration-publisher")
	defer mqttPub.Disconnect(250)

	// ── Mock Supabase server ──────────────────────────────────────────────────
	supaServer := newMockSupabaseServer()
	defer supaServer.Close()
	supaClient, err := supabase.NewClient(supaServer.URL, "mock-anon-key", nil)
	if err != nil {
		log.Fatalf("supabase client: %v", err)
	}
	repositories.Infra.Supabase = supaClient

	// ── Router ────────────────────────────────────────────────────────────────
	testRouter = buildRouter(supaClient)

	os.Exit(m.Run())
}

// ── Setup helpers ─────────────────────────────────────────────────────────────

func buildRouter(supaClient *supabase.Client) *gin.Engine {
	r := gin.New()
	public := r.Group("/api")
	public.GET("/ships", handlers.GetShips)
	public.GET("/ships/registered", handlers.IsShipRegistered)
	public.GET("/ships/:id", handlers.GetShipDetails)
	public.DELETE("/ships/:id", handlers.DeleteShip)
	public.GET("/ships/owner/:email/list", handlers.GetShipsByOwner)

	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleWare(supaClient))
	protected.POST("/telemetry/sync", handlers.SyncOfflineTelemetry)

	r.GET("/ws/ships", handlers.ShipsWebSocket)
	return r
}

func newMQTTPub(broker, clientID string) paho.Client {
	opts := paho.NewClientOptions().
		AddBroker(broker).
		SetClientID(clientID)
	c := paho.NewClient(opts)
	if token := c.Connect(); token.Wait() && token.Error() != nil {
		log.Fatalf("MQTT publisher connect: %v", token.Error())
	}
	return c
}

// newMockSupabaseServer returns an httptest.Server that mimics Supabase's
// GET /auth/v1/user endpoint: accepts validToken, rejects everything else.
func newMockSupabaseServer() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasSuffix(r.URL.Path, "/user") {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		if r.Header.Get("Authorization") == "Bearer "+validToken {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]any{
				"id":    "00000000-0000-0000-0000-000000000001",
				"aud":   "authenticated",
				"email": "test@test.com",
			})
		} else {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]any{
				"code":       401,
				"error_code": "not_authorized",
				"message":    "invalid token",
			})
		}
	}))
}

// ── Per-test helpers ──────────────────────────────────────────────────────────

// uniqueID returns a collision-free identifier prefixed with prefix.
func uniqueID(prefix string) string {
	return fmt.Sprintf("%s-%d", prefix, time.Now().UnixNano())
}

// publishTelemetry serialises payload and publishes it to the Mosquitto broker.
func publishTelemetry(t *testing.T, payload repositories.TelemetryPayload) {
	t.Helper()
	data, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}
	topic := fmt.Sprintf("maritime/boats/%s-%s/telemetry", payload.ShipId, payload.OwnerEmail)
	token := mqttPub.Publish(topic, 1, false, data)
	token.Wait()
	if token.Error() != nil {
		t.Fatalf("publish MQTT: %v", token.Error())
	}
}

// waitForPosition polls FetchAllShipPositions until shipId appears or timeout.
func waitForPosition(t *testing.T, shipId string, timeout time.Duration) repositories.ShipPosition {
	t.Helper()
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		positions, err := repositories.FetchAllShipPositions()
		if err == nil {
			for _, p := range positions {
				if p.ID == shipId {
					return p
				}
			}
		}
		time.Sleep(200 * time.Millisecond)
	}
	t.Fatalf("ship %q not found in InfluxDB within %v", shipId, timeout)
	return repositories.ShipPosition{}
}

// syncRequest sends POST /api/telemetry/sync with validToken and returns the recorder.
func syncRequest(t *testing.T, payloads []repositories.TelemetryPayload) *httptest.ResponseRecorder {
	t.Helper()
	body, _ := json.Marshal(payloads)
	req := httptest.NewRequest(http.MethodPost, "/api/telemetry/sync", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+validToken)
	w := httptest.NewRecorder()
	testRouter.ServeHTTP(w, req)
	return w
}

// ── Integration tests ─────────────────────────────────────────────────────────

// TestMQTTIngestion verifies the path: MQTT publish → subscriber → InfluxDB.
func TestMQTTIngestion(t *testing.T) {
	shipId := uniqueID("mqtt-ship")
	payload := repositories.TelemetryPayload{
		ShipId:     shipId,
		OwnerEmail: "mqtt@test.com",
		ShipType:   "cargo",
		Latitude:   41.3851,
		Longitude:  2.1734,
		Timestamp:  time.Now().UTC(),
	}

	publishTelemetry(t, payload)

	pos := waitForPosition(t, shipId, 10*time.Second)

	if pos.Lat != payload.Latitude {
		t.Errorf("Latitude: got %v, want %v", pos.Lat, payload.Latitude)
	}
	if pos.Lng != payload.Longitude {
		t.Errorf("Longitude: got %v, want %v", pos.Lng, payload.Longitude)
	}
	if pos.Type != payload.ShipType {
		t.Errorf("Type: got %q, want %q", pos.Type, payload.ShipType)
	}
}

// TestRESTSync verifies the path: POST /api/telemetry/sync → repository → InfluxDB.
func TestRESTSync(t *testing.T) {
	shipId := uniqueID("rest-ship")
	payload := repositories.TelemetryPayload{
		ShipId:     shipId,
		OwnerEmail: "rest@test.com",
		ShipType:   "tanker",
		Latitude:   40.0000,
		Longitude:  3.0000,
		Timestamp:  time.Now().UTC(),
	}

	w := syncRequest(t, []repositories.TelemetryPayload{payload})
	if w.Code != http.StatusOK {
		t.Fatalf("sync returned %d: %s", w.Code, w.Body.String())
	}

	pos := waitForPosition(t, shipId, 5*time.Second)

	if pos.Lat != payload.Latitude {
		t.Errorf("Latitude: got %v, want %v", pos.Lat, payload.Latitude)
	}
	if pos.Lng != payload.Longitude {
		t.Errorf("Longitude: got %v, want %v", pos.Lng, payload.Longitude)
	}
	if pos.Type != payload.ShipType {
		t.Errorf("Type: got %q, want %q", pos.Type, payload.ShipType)
	}
}

// TestWebSocketBroadcast verifies that a coordinate persisted via REST sync
// is immediately broadcast to a connected WebSocket client.
func TestWebSocketBroadcast(t *testing.T) {
	// A real HTTP server is required for the WebSocket upgrade.
	srv := httptest.NewServer(testRouter)
	defer srv.Close()

	wsURL := "ws" + strings.TrimPrefix(srv.URL, "http") + "/ws/ships"
	wsConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("WS dial: %v", err)
	}
	defer wsConn.Close()

	// Read the initial snapshot sent on connect; this also confirms that
	// ws.Hub.Register has been called for this connection before we proceed.
	wsConn.SetReadDeadline(time.Now().Add(5 * time.Second))
	if _, _, err := wsConn.ReadMessage(); err != nil {
		t.Fatalf("read initial snapshot: %v", err)
	}

	// Persist a new ship via the sync endpoint (direct handler call so that
	// BroadcastShips fires in the same goroutine, keeping the test deterministic).
	shipId := uniqueID("ws-ship")
	payload := repositories.TelemetryPayload{
		ShipId:     shipId,
		OwnerEmail: "ws@test.com",
		ShipType:   "yacht",
		Latitude:   39.5,
		Longitude:  2.5,
		Timestamp:  time.Now().UTC(),
	}
	w := syncRequest(t, []repositories.TelemetryPayload{payload})
	if w.Code != http.StatusOK {
		t.Fatalf("sync returned %d: %s", w.Code, w.Body.String())
	}

	// Read the broadcast pushed by BroadcastShips.
	wsConn.SetReadDeadline(time.Now().Add(5 * time.Second))
	_, msg, err := wsConn.ReadMessage()
	if err != nil {
		t.Fatalf("read broadcast: %v", err)
	}

	var ships []handlers.ShipData
	if err := json.Unmarshal(msg, &ships); err != nil {
		t.Fatalf("unmarshal broadcast: %v", err)
	}

	found := false
	for _, s := range ships {
		if s.ID == shipId {
			found = true
			if s.Lat != payload.Latitude {
				t.Errorf("broadcast Lat: got %v, want %v", s.Lat, payload.Latitude)
			}
			if s.Lng != payload.Longitude {
				t.Errorf("broadcast Lng: got %v, want %v", s.Lng, payload.Longitude)
			}
			break
		}
	}
	if !found {
		t.Errorf("ship %q not found in broadcast (received %d ships)", shipId, len(ships))
	}
}

// TestAuthMiddleware verifies that the auth middleware correctly gates the
// protected sync endpoint and leaves public endpoints unaffected.
func TestAuthMiddleware(t *testing.T) {
	t.Run("missing token returns 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/telemetry/sync",
			strings.NewReader("[]"))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		testRouter.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Errorf("got %d, want 401", w.Code)
		}
	})

	t.Run("invalid token returns 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/telemetry/sync",
			strings.NewReader("[]"))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer this-token-is-not-valid")
		w := httptest.NewRecorder()
		testRouter.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Errorf("got %d, want 401", w.Code)
		}
	})

	t.Run("valid token is admitted", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/telemetry/sync",
			strings.NewReader("[]"))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+validToken)
		w := httptest.NewRecorder()
		testRouter.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("got %d, want 200", w.Code)
		}
	})

	t.Run("public endpoint accessible without token", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/ships", nil)
		w := httptest.NewRecorder()
		testRouter.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("got %d, want 200", w.Code)
		}
	})
}
