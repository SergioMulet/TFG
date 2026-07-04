package handlers_test

import (
	"bytes"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"main_server/handlers"
)

func init() { gin.SetMode(gin.TestMode) }

func newRouter() *gin.Engine { return gin.New() }

// ── IsShipRegistered — parameter validation ───────────────────────────────────

func TestIsShipRegistered_MissingShipId_Returns400(t *testing.T) {
	r := newRouter()
	r.GET("/ships/registered", handlers.IsShipRegistered)

	req := httptest.NewRequest(http.MethodGet, "/ships/registered?owner_email=owner@test.com", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestIsShipRegistered_MissingOwnerEmail_Returns400(t *testing.T) {
	r := newRouter()
	r.GET("/ships/registered", handlers.IsShipRegistered)

	req := httptest.NewRequest(http.MethodGet, "/ships/registered?ship_id=ship1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestIsShipRegistered_MissingBothParams_Returns400(t *testing.T) {
	r := newRouter()
	r.GET("/ships/registered", handlers.IsShipRegistered)

	req := httptest.NewRequest(http.MethodGet, "/ships/registered", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// ── DeleteShip — parameter validation ────────────────────────────────────────

func TestDeleteShip_MissingOwnerEmail_Returns400(t *testing.T) {
	r := newRouter()
	r.DELETE("/ships/:id", handlers.DeleteShip)

	req := httptest.NewRequest(http.MethodDelete, "/ships/myship", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// ── SyncOfflineTelemetry — body validation ────────────────────────────────────

func TestSyncOfflineTelemetry_InvalidJSON_Returns400(t *testing.T) {
	r := newRouter()
	r.POST("/telemetry/sync", handlers.SyncOfflineTelemetry)

	req := httptest.NewRequest(http.MethodPost, "/telemetry/sync",
		strings.NewReader(`{not valid json`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestSyncOfflineTelemetry_EmptyBody_Returns400(t *testing.T) {
	r := newRouter()
	r.POST("/telemetry/sync", handlers.SyncOfflineTelemetry)

	req := httptest.NewRequest(http.MethodPost, "/telemetry/sync",
		strings.NewReader(``))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// ── UploadShipImage — file validation ────────────────────────────────────────

// buildMultipartRequest creates a POST request with a single file part.
func buildMultipartRequest(t *testing.T, url, fieldName, filename, contentType string, size int) *http.Request {
	t.Helper()
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)

	ph := make(textproto.MIMEHeader)
	ph.Set("Content-Disposition", fmt.Sprintf(`form-data; name="%s"; filename="%s"`, fieldName, filename))
	ph.Set("Content-Type", contentType)
	fw, err := mw.CreatePart(ph)
	if err != nil {
		t.Fatalf("CreatePart: %v", err)
	}
	fw.Write(bytes.Repeat([]byte{'X'}, size))
	mw.Close()

	req := httptest.NewRequest(http.MethodPost, url, &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	return req
}

func TestUploadShipImage_NoFile_Returns400(t *testing.T) {
	r := newRouter()
	r.POST("/ships/:id/image", handlers.UploadShipImage)

	// Send a request with no multipart form at all.
	req := httptest.NewRequest(http.MethodPost, "/ships/ship1/image", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestUploadShipImage_TooLarge_Returns413(t *testing.T) {
	r := newRouter()
	r.POST("/ships/:id/image", handlers.UploadShipImage)

	req := buildMultipartRequest(t, "/ships/ship1/image",
		"image", "big.jpg", "image/jpeg", 5<<20+1) // one byte over the 5 MiB limit
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("expected 413, got %d", w.Code)
	}
}

func TestUploadShipImage_UnsupportedMimeType_Returns415(t *testing.T) {
	r := newRouter()
	r.POST("/ships/:id/image", handlers.UploadShipImage)

	req := buildMultipartRequest(t, "/ships/ship1/image",
		"image", "file.txt", "text/plain", 100)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnsupportedMediaType {
		t.Errorf("expected 415, got %d", w.Code)
	}
}
