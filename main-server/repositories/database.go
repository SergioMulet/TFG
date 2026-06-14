package repositories

import (
	"log"
	"os"

	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
	"github.com/supabase-community/supabase-go"
)

type Infrastructure struct {
	Supabase *supabase.Client
	Influx   influxdb2.Client
}

var Infra Infrastructure

func InitInfrastructure() {
	subURL := os.Getenv("SUPABASE_URL")
	subKey := os.Getenv("SUPABASE_SECRET_KEY")
	subClient, err := supabase.NewClient(subURL, subKey, nil)
	if err != nil {
		log.Fatalf("Error Supabase: %v", err)
	}

	influxURL := os.Getenv("INFLUX_URL")
	influxToken := os.Getenv("INFLUX_TOKEN")
	influxClient := influxdb2.NewClient(influxURL, influxToken)

	Infra = Infrastructure{
		Supabase: subClient,
		Influx:   influxClient,
	}
	log.Println("--- Databases up ---")
}
