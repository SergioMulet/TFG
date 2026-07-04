package ws

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

var testUpgrader = websocket.Upgrader{
	CheckOrigin: func(_ *http.Request) bool { return true },
}

// makeWSConn starts a throwaway HTTP/WS server, dials it, registers the
// server-side conn with h, and returns the client-side conn.
// The server is cleaned up automatically via t.Cleanup.
func makeWSConn(t *testing.T, h *hub) *websocket.Conn {
	t.Helper()
	registered := make(chan struct{})

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := testUpgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		h.Register(conn)
		close(registered)
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				break
			}
		}
	}))

	wsURL := "ws" + strings.TrimPrefix(srv.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		srv.Close()
		t.Fatalf("ws dial: %v", err)
	}

	t.Cleanup(func() {
		clientConn.Close()
		srv.Close()
	})

	<-registered
	return clientConn
}

// ── Registration ──────────────────────────────────────────────────────────────

func TestHub_Register_AddsConnectionToMap(t *testing.T) {
	h := &hub{clients: make(map[*websocket.Conn]bool)}
	makeWSConn(t, h)

	h.mu.Lock()
	n := len(h.clients)
	h.mu.Unlock()

	if n != 1 {
		t.Errorf("expected 1 registered client, got %d", n)
	}
}

func TestHub_Register_MultipleConnectionsAllTracked(t *testing.T) {
	h := &hub{clients: make(map[*websocket.Conn]bool)}
	makeWSConn(t, h)
	makeWSConn(t, h)
	makeWSConn(t, h)

	h.mu.Lock()
	n := len(h.clients)
	h.mu.Unlock()

	if n != 3 {
		t.Errorf("expected 3 registered clients, got %d", n)
	}
}

// ── Broadcast ─────────────────────────────────────────────────────────────────

func TestHub_Broadcast_DeliveredToAllClients(t *testing.T) {
	h := &hub{clients: make(map[*websocket.Conn]bool)}
	c1 := makeWSConn(t, h)
	c2 := makeWSConn(t, h)

	msg := []byte(`{"ships":[]}`)
	h.Broadcast(msg)

	readWithDeadline := func(c *websocket.Conn, label string) {
		c.SetReadDeadline(time.Now().Add(time.Second))
		_, got, err := c.ReadMessage()
		if err != nil {
			t.Errorf("%s ReadMessage: %v", label, err)
			return
		}
		if !bytes.Equal(got, msg) {
			t.Errorf("%s got %q, want %q", label, got, msg)
		}
	}

	readWithDeadline(c1, "client-1")
	readWithDeadline(c2, "client-2")
}

// ── Drop on write failure ─────────────────────────────────────────────────────

func TestHub_Broadcast_DropsConnectionOnWriteFailure(t *testing.T) {
	h := &hub{clients: make(map[*websocket.Conn]bool)}

	// serverSide receives the server-side *websocket.Conn after the upgrade.
	serverSide := make(chan *websocket.Conn, 1)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := testUpgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		h.Register(conn)
		serverSide <- conn
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				break
			}
		}
	}))
	t.Cleanup(srv.Close)

	wsURL := "ws" + strings.TrimPrefix(srv.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("ws dial: %v", err)
	}
	t.Cleanup(func() { clientConn.Close() })

	sc := <-serverSide // wait until the server-side conn is registered

	// Close the server-side conn directly: the very next WriteMessage on it
	// returns "use of closed network connection" immediately and deterministically.
	sc.Close()

	h.Broadcast([]byte("msg"))

	h.mu.Lock()
	n := len(h.clients)
	h.mu.Unlock()

	if n != 0 {
		t.Errorf("expected 0 clients after write to closed conn, got %d", n)
	}
}
