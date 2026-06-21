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

  // Send telemtry JSON
  public publish(topic: string, message: string): boolean {
    if (this.client && this.client.connected) {
      this.client.publish(topic, message, { qos: 1 });
      return true;
    } else {
      console.warn('Trying to publish but MQTT is offline.');
      return false;
    }
  }

  public getClient() {
    return this.client;
  }
}

export const mqttService = new MqttService();
