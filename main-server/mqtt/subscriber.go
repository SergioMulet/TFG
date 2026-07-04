package mqtt

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"main_server/handlers"
	"main_server/repositories"

	paho "github.com/eclipse/paho.mqtt.golang"
)

var defaultHandler paho.MessageHandler = func(_ paho.Client, msg paho.Message) {
	var payload repositories.TelemetryPayload
	if err := json.Unmarshal(msg.Payload(), &payload); err != nil {
		log.Printf("⚠️ Error parseo MQTT: %v", err)
		return
	}
	repositories.WriteTelemetryPoint(payload)
	fmt.Printf("--- [MQTT] telemetry from: %s ---\n", payload.ShipId)
	handlers.BroadcastShips()
}

// Connect creates and connects an MQTT client to broker with the given
// clientID, subscribes to the fleet telemetry topic, and returns the live
// client. It is the testable entry point also used by StartSubscriber.
func Connect(broker, clientID string) (paho.Client, error) {
	opts := paho.NewClientOptions().
		AddBroker(broker).
		SetClientID(clientID).
		SetDefaultPublishHandler(defaultHandler)

	client := paho.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		return nil, token.Error()
	}
	if token := client.Subscribe("maritime/boats/+/telemetry", 1, nil); token.Wait() && token.Error() != nil {
		client.Disconnect(100)
		return nil, token.Error()
	}
	return client, nil
}

// StartSubscriber connects to the MQTT broker specified by the MQTT_BROKER
// environment variable and begins listening for telemetry messages.
func StartSubscriber() {
	client, err := Connect(os.Getenv("MQTT_BROKER"), "maritime_backend_sub")
	if err != nil {
		log.Fatalf("Error MQTT connection: %v", err)
	}
	_ = client
	log.Println("listening to MQTT telemetry...")
}
