import { useState, useEffect, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';

const MQTT_OPTIONS:any = {
  keepalive: 60,
  protocolId: 'MQTT',
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
};

export const useMqtt = (brokerUrl: string, topics: string[]) => {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [messages, setMessages] = useState<Record<string, any>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const mqttClient = mqtt.connect(brokerUrl, MQTT_OPTIONS);

    mqttClient.on('connect', () => {
      setIsConnected(true);
      topics.forEach((topic) => mqttClient.subscribe(topic));
    });

    mqttClient.on('message', (topic, payload) => {
      try {
        const json = JSON.parse(payload.toString());
        setMessages((prev) => ({ ...prev, [topic]: json }));
      } catch (e) {
        setMessages((prev) => ({ ...prev, [topic]: payload.toString() }));
      }
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT Error:', err);
      mqttClient.end();
    });

    setClient(mqttClient);

    return () => {
      if (mqttClient) mqttClient.end();
    };
  }, [brokerUrl]);

  const publish = useCallback((topic: string, message: string) => {
    if (client) client.publish(topic, message);
  }, [client]);

  return { messages, isConnected, publish };
};