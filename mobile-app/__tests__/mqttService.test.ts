import { mqttService } from '@/services/mqttService';

// Each call to mqtt.connect() returns a fresh stub client so tests are isolated.
jest.mock('mqtt', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(() => ({
      connected: true,
      reconnecting: false,
      publish: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      end: jest.fn(),
    })),
  },
}));

beforeEach(() => {
  // Wipe the cached client so mqttService.connect() creates a fresh stub.
  (mqttService as any).client = null;
  mqttService.connect();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('mqttService.publish', () => {
  it('resolves true when the broker acknowledges (QoS 1 PUBACK)', async () => {
    const client = mqttService.getClient() as any;
    client.publish.mockImplementation(
      (_topic: string, _msg: string, _opts: any, cb: (err?: Error) => void) => cb(),
    );

    const result = await mqttService.publish('test/topic', '{}');

    expect(result).toBe(true);
  });

  it('resolves false when no acknowledgement arrives before the timeout', async () => {
    const client = mqttService.getClient() as any;
    // Never calls the callback — simulates a dropped PUBACK.
    client.publish.mockImplementation(() => {});

    const promise = mqttService.publish('test/topic', '{}', 100);
    jest.advanceTimersByTime(100);

    expect(await promise).toBe(false);
  });

  it('passes the exact topic string to the underlying MQTT client', async () => {
    const client = mqttService.getClient() as any;
    client.publish.mockImplementation(
      (_topic: string, _msg: string, _opts: any, cb: (err?: Error) => void) => cb(),
    );

    const topic = 'maritime/boats/Abarth-owner@test.com/telemetry';
    await mqttService.publish(topic, '{}');

    expect(client.publish).toHaveBeenCalledWith(
      topic,
      '{}',
      expect.any(Object),
      expect.any(Function),
    );
  });
});
