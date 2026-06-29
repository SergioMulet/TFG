package mqtt

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"main_server/handlers"
	"main_server/repositories"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

func StartSubscriber() {
	broker := os.Getenv("MQTT_BROKER")
	opts := mqtt.NewClientOptions().AddBroker(broker)
	opts.SetClientID("maritime_backend_sub")

	opts.SetDefaultPublishHandler(func(client mqtt.Client, msg mqtt.Message) {
		var payload repositories.TelemetryPayload
		if err := json.Unmarshal(msg.Payload(), &payload); err != nil {
			log.Printf("⚠️ Error parseo MQTT: %v", err)
			return
		}

		repositories.WriteTelemetryPoint(payload)
		fmt.Printf("--- [MQTT] telemetry from: %s ---\n", payload.ShipId)

		handlers.BroadcastShips()
	})

	client := mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		log.Fatalf("Error MQTT connection: %v", token.Error())
	}

	if token := client.Subscribe("maritime/boats/+/telemetry", 1, nil); token.Wait() && token.Error() != nil {
		log.Fatalf("Error MQTT subscription: %v", token.Error())
	}
	log.Println("listening to MQTT telemetry...")
}
