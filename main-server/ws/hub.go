package ws

import (
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

type hub struct {
	mu      sync.Mutex
	clients map[*websocket.Conn]bool
}

var Hub = &hub{
	clients: make(map[*websocket.Conn]bool),
}

func (h *hub) Register(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[conn] = true
}

func (h *hub) Unregister(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, conn)
	conn.Close()
}

func (h *hub) Broadcast(message []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()

	for conn := range h.clients {
		if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
			log.Printf("⚠️ WS write error, dropping client: %v", err)
			conn.Close()
			delete(h.clients, conn)
		}
	}
}
