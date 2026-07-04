import mqtt from 'mqtt';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';
const MQTT_URL    = process.env.MQTT_URL    ?? 'mqtt://localhost:1883';

export default async function globalSetup() {
  await waitForBackend();
  await seedShips();
}

async function waitForBackend(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await sleep(1000);
  }
  throw new Error(`Backend at ${BACKEND_URL}/health did not become ready after ${maxRetries}s`);
}

async function seedShips() {
  const client = await connectMQTT();
  const now = Date.now();

  // Three route points for cargo-001 so FetchShipRoute returns a real polyline.
  const cargoRoute = [
    [41.30,   2.10,   now - 2 * 3_600_000],
    [41.35,   2.15,   now -     3_600_000],
    [41.3851, 2.1734, now],
  ];
  for (const [lat, lng, ts] of cargoRoute) {
    await publish(client, 'maritime/boats/cargo-001-e2e@test.com/telemetry', JSON.stringify({
      ship_id: 'cargo-001',
      owner_email: 'e2e@test.com',
      ship_type: 'cargo',
      latitude: lat,
      longitude: lng,
      timestamp: new Date(ts).toISOString(),
    }));
  }

  // Single point for each remaining ship.
  for (const [id, type, lat, lng] of [
    ['tanker-001', 'tanker', 39.4699, -0.3763],
    ['yacht-001',  'yacht',  43.3183, -1.9812],
  ]) {
    await publish(client, `maritime/boats/${id}-e2e@test.com/telemetry`, JSON.stringify({
      ship_id: id,
      owner_email: 'e2e@test.com',
      ship_type: type,
      latitude: lat,
      longitude: lng,
      timestamp: new Date(now).toISOString(),
    }));
  }

  // Allow MQTT messages to be processed and written to InfluxDB before tests start.
  await sleep(2000);
  client.end();
}

function connectMQTT() {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(MQTT_URL, { connectTimeout: 10_000 });
    client.on('connect', () => resolve(client));
    client.on('error', reject);
  });
}

function publish(client, topic, payload) {
  return new Promise((resolve, reject) =>
    client.publish(topic, payload, { qos: 1 }, err => (err ? reject(err) : resolve())),
  );
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
