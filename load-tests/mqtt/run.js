// MQTT ingestion load test — incremental stages
// Simulates boats publishing telemetry at a realistic GPS interval.
// New clients are added at each stage; existing ones keep running.
//
// Usage (from repo root):
//   node load-tests/mqtt/run.js
//
// Override broker:
//   MQTT_BROKER_URL=wss://other-host/mqtt node load-tests/mqtt/run.js

import mqtt from 'mqtt';

const BROKER_URL =
  process.env.MQTT_BROKER_URL ||
  'wss://shipstracker.francecentral.cloudapp.azure.com/mqtt';
const INTERVAL = 5000; // ms between publishes per client (realistic GPS rate)

const STAGES = [
  { target: 700, durationMs: 30_000 },
  { target: 750, durationMs: 30_000 },
  { target: 800, durationMs: 30_000 },
];

let sent = 0;
let errors = 0;
let connected = 0;
const allClients = [];

function spawnClient(i) {
  const clientId = `load-boat-${i}`;
  const topic = `maritime/boats/${clientId}-load@test.com/telemetry`;
  // Distribute boats worldwide (prime-step spread across lat/lng ranges)
  let lat = -60 + ((i * 73) % 130); // -60 to +70
  let lng = -180 + ((i * 137) % 360); // -180 to +180
  // Each boat moves in a unique heading (~50 m per message)
  const dLat = 0.00045 * Math.cos((i * 37) % 360);
  const dLng = 0.00045 * Math.sin((i * 37) % 360);

  const client = mqtt.connect(BROKER_URL, {
    clientId,
    clean: true,
    connectTimeout: 5000,
    reconnectPeriod: 0,
  });

  client.on('connect', () => {
    connected++;
    client._interval = setInterval(() => {
      lat += dLat;
      lng += dLng;
      const msg = JSON.stringify({
        ship_id: clientId,
        owner_email: 'load@test.com',
        ship_type: 'cargo',
        latitude: lat,
        longitude: lng,
        timestamp: new Date().toISOString(),
      });
      client.publish(topic, msg, { qos: 1 }, (err) => {
        if (err) errors++;
        else sent++;
      });
    }, INTERVAL);
  });

  client.on('error', () => {
    errors++;
    client.end();
  });

  allClients.push(client);
}

function stopAll() {
  allClients.forEach((c) => {
    clearInterval(c._interval);
    c.end();
  });
}

async function runStage(stage, stageNum, prevTarget) {
  const newClients = stage.target - prevTarget;
  console.log(
    `\n── Stage ${stageNum}: spawning ${newClients} clients (total ${stage.target}) ──`,
  );

  for (let i = prevTarget; i < stage.target; i++) spawnClient(i);

  const sentBefore = sent;
  const errorsBefore = errors;
  const stageStart = Date.now();

  await new Promise((resolve) => setTimeout(resolve, stage.durationMs));

  const stageSent = sent - sentBefore;
  const stageErrors = errors - errorsBefore;
  const elapsed = ((Date.now() - stageStart) / 1000).toFixed(0);
  const rate = (stageSent / (stage.durationMs / 1000)).toFixed(1);
  const successRate =
    stageSent + stageErrors > 0
      ? ((stageSent / (stageSent + stageErrors)) * 100).toFixed(1)
      : '100.0';

  console.log(
    `   connected=${connected}/${stage.target}  sent=${stageSent}  errors=${stageErrors}  rate=${rate} msg/s  success=${successRate}%  duration=${elapsed}s`,
  );
}

async function main() {
  console.log(`MQTT load test — ${STAGES.length} stages, interval=${INTERVAL}ms`);
  console.log(`Broker: ${BROKER_URL}\n`);

  let prevTarget = 0;
  for (let i = 0; i < STAGES.length; i++) {
    await runStage(STAGES[i], i + 1, prevTarget);
    prevTarget = STAGES[i].target;
  }

  console.log(
    `\n── Total: sent=${sent}  errors=${errors}  success_rate=${((sent / (sent + errors || 1)) * 100).toFixed(1)}% ──`,
  );
  stopAll();
  process.exit(0);
}

main();
