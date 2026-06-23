import mqtt from 'mqtt';

class MqttService {
  private client: mqtt.MqttClient | null = null;
  private brokerUrl = 'ws://192.168.1.132:9001';

  constructor() {}

  public connect() {
    if (this.client?.connected || this.client?.reconnecting) return;
    console.log('--- [MQTT] Trying to connect to mosquito broker... ---');

    this.client = mqtt.connect(this.brokerUrl, {
      clientId: `mobile_app_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 0,
    });

    this.client.on('connect', () => {
      console.log('--- [MQTT] Mobile phone connected ---');
    });

    this.client.on('error', (err) => {
      console.error('--- [MQTT] Error in MQTT mobile phone client ---');
    });

    this.client.on('close', () => {
      console.log('--- [MQTT] connection closed ---');
    });
  }

  public waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) return resolve();

      let timeout = setTimeout(() => {
        reject(new Error('MQTT connection timeout'));
      }, 5000);

      this.client?.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.client?.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  public disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
      console.log('--- [MQTT] Client disconnected manually ---');
    }
  }

  // Send telemtry JSON. Resolves only once the broker acknowledges the
  // message (QoS 1 PUBACK), since `client.connected` can stay true for a
  // while after the broker has actually dropped the connection (e.g. while
  // backgrounded and unable to send keepalive pings).
  public publish(topic: string, message: string, ackTimeoutMs = 5000): Promise<boolean> {
    if (!this.client || !this.client.connected) {
      console.warn('Trying to publish but MQTT is offline.');
      return Promise.resolve(false);
    }

    const client = this.client;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('--- [MQTT] Publish not acknowledged in time, treating as failed ---');
        resolve(false);
      }, ackTimeoutMs);

      client.publish(topic, message, { qos: 1 }, (error) => {
        clearTimeout(timeout);
        if (error) {
          console.error('--- [MQTT] Publish failed ---', error);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  public getClient() {
    return this.client;
  }
}

export const mqttService = new MqttService();
