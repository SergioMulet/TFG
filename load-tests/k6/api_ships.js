import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = 'https://shipstracker.francecentral.cloudapp.azure.com';

const shipDuration = new Trend('api_ships_duration_ms', true);
const errorRate = new Rate('api_ships_error_rate');

// Ramping concurrency — find the saturation point (~2 min total)
export const options = {
  stages: [
    { duration: '30s', target: 400 },
    { duration: '45s', target: 700 },
    { duration: '45s', target: 900 },
    { duration: '45s', target: 1100 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    // Test fails if p95 > 500 ms or error rate > 1 %
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    api_ships_error_rate: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/ships`);

  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'body is JSON array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body));
      } catch {
        return false;
      }
    },
  });

  shipDuration.add(res.timings.duration);
  errorRate.add(!ok);

  // Realistic client think-time: one request per second per VU
  sleep(1);
}
