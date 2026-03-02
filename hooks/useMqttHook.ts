import { useState, useEffect, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';

export const useMqtt = (brokerUrl: string, topics: string[]) => {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [messages, setMessages] = useState<Record<string, any>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // FIX: Ensure this only runs on the client side
    if (typeof window === "undefined") return;

    // FIX: Force wss if the site is on HTTPS (Vercel)
    const secureUrl = brokerUrl.replace("ws://", "wss://");
    
    const options = {
      connectTimeout: 4000,
      reconnectPeriod: 1000,
      path: '/mqtt', // Required for many brokers like EMQX/HiveMQ
    };

    const mqttClient = mqtt.connect(secureUrl, options);

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
      console.error('Connection error: ', err);
      mqttClient.end();
    });

    setClient(mqttClient);

    return () => {
      if (mqttClient) mqttClient.end();
    };
  }, []); // Empty dependency array to prevent multiple connections

  const publish = useCallback((topic: string, message: string) => {
    if (client) client.publish(topic, message);
  }, [client]);

  return { messages, isConnected, publish };
};