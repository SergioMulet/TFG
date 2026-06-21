package mqtt

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"main_server/handlers"
	"main_server/repositories"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
)

func StartSubscriber() {
	broker := os.Getenv("MQTT_BROKER")
	opts := mqtt.NewClientOptions().AddBroker(broker)
	opts.SetClientID("maritime_backend_sub")

	opts.SetDefaultPublishHandler(func(client mqtt.Client, msg mqtt.Message) {
		var payload handlers.TelemetryPayload
		if err := json.Unmarshal(msg.Payload(), &payload); err != nil {
			log.Printf("⚠️ Error parseo MQTT: %v", err)
			return
		}

		if payload.Timestamp.IsZero() {
			payload.Timestamp = time.Now()
		}

		org := os.Getenv("INFLUX_ORG")
		bucket := os.Getenv("INFLUX_BUCKET")
		writeAPI := repositories.Infra.Influx.WriteAPI(org, bucket)

		p := influxdb2.NewPoint(
			"boat_telemetry",
			map[string]string{"boat_name": payload.BoatName, "owner_email": payload.OwnerEmail},
			map[string]interface{}{"latitude": payload.Latitude, "longitude": payload.Longitude},
			payload.Timestamp,
		)
		writeAPI.WritePoint(p)
		writeAPI.Flush()
		fmt.Printf("--- [MQTT] telemetry from: %s ---\n", payload.BoatName)

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
