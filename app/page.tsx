"use client";

import { useState, useEffect, useRef } from "react"; // Added useRef for auto-scroll
import { useMqtt } from "@/hooks/useMqttHook";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trash2, Radio, RotateCcw, Activity, MapPin, Layers, Unlock, Lock, WifiOff, Loader2, Terminal, ChevronRight } from "lucide-react";
import Image from "next/image";
import { logo } from "@/public/images";

export default function SmartBinNexus() {
  const { messages, isConnected, publish } = useMqtt("wss://broker.emqx.io:8084/mqtt", [
    "smartbin/status/bin1",
    "smartbin/status/bin2",
  ]);

  const [lastSeen, setLastSeen] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<{ time: string; msg: string; type: 'info' | 'warn' | 'success' }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Function to add a new log entry
  const addLog = (msg: string, type: 'info' | 'warn' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ time, msg, type }, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  // Monitor Incoming Messages for Logs
  useEffect(() => {
    const now = Date.now();
    Object.keys(messages).forEach((topic) => {
      const id = topic.endsWith('bin1') ? "Kajiado" : "Kawangware";
      const data = messages[topic];
      
      // Update Heartbeat
      setLastSeen((prev) => ({ ...prev, [topic]: now }));

      // Add Log for new data
      addLog(`Heartbeat received from ${id}: Fill at ${data.fill}cm`, 'info');
      
      if (data.full === "true") {
        addLog(`CRITICAL: ${id} Bin is reaching maximum capacity!`, 'warn');
      }
    });
  }, [messages]);

  // Monitor Connection Status for Logs
  useEffect(() => {
    if (isConnected) addLog("Uplink Established: MQTT Protocol Synchronized", "success");
    else addLog("Uplink Interrupted: Attempting Reconnection...", "warn");
  }, [isConnected]);

  const handlePublish = (id: string) => {
    const location = id === "1" ? "Kajiado" : "Kawangware";
    publish(`smartbin/cmd/bin${id}`, "OPEN");
    addLog(`Command Sent: Initializing Service Hatch for ${location}`, "success");
  };

  // ... (renderBinCard logic remains exactly as you have it)
  // Note: Inside renderBinCard, update the Button to use handlePublish(id)

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Section (Same as your code) */}
        {/* ... */}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Ensure you pass the correct props to renderBinCard */}
          {renderBinCard("1", "smartbin/status/bin1")}
          {renderBinCard("2", "smartbin/status/bin2")}
        </div>

        {/* --- NEW PROFESSIONAL LOGS SECTION --- */}
        <Card className="bg-zinc-900 border-zinc-800 rounded-none shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-zinc-800 bg-zinc-950 py-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-zinc-500" />
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                System Telemetry Logs
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[8px] border-zinc-700 text-zinc-500 font-mono">
              REAL_TIME_STREAM
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              className="h-48 overflow-y-auto font-mono text-[11px] p-4 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700"
              ref={scrollRef}
            >
              {logs.length === 0 ? (
                <p className="text-zinc-600 animate-pulse">Initializing data stream...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-3 border-b border-zinc-800/50 pb-1">
                    <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                    <span className={`flex items-center gap-1 ${
                      log.type === 'warn' ? 'text-amber-500' : 
                      log.type === 'success' ? 'text-emerald-500' : 
                      'text-zinc-300'
                    }`}>
                      <ChevronRight className="w-3 h-3" />
                      {log.msg}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <div className="bg-zinc-950 px-4 py-2 border-t border-zinc-800 flex justify-between items-center">
            <p className="text-[9px] text-zinc-600 font-bold uppercase">
              Relay Node: broker.emqx.io:8084
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
              <span className="text-[9px] text-zinc-500">LIVE_FEED</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}