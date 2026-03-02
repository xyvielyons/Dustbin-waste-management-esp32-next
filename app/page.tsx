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

  const renderBinCard = (id: string, topic: string) => {
    const data = messages[topic];
    const lastUpdate = lastSeen[topic];
    const isStale = !lastUpdate || (Date.now() - lastUpdate > 12000); // Stale if no data for 12s

    // If no data has ever arrived or data is older than 12 seconds
    if (!data || isStale) {
      return (
        <Card className="border-2 border-dashed border-zinc-200 bg-zinc-50/50 transition-all duration-500">
          <CardContent className="flex flex-col items-center justify-center h-[400px] space-y-4">
            <div className="relative">
              <WifiOff className="w-12 h-12 text-zinc-300" />
              <Loader2 className="w-12 h-12 text-zinc-400 animate-spin absolute top-0 left-0 opacity-20" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">
                {id === "1" ? "Kajiado" : "Kawangware"} Node Offline
              </p>
              <p className="text-[10px] text-zinc-400 font-mono mt-1">
                Waiting for 5s Heartbeat...
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const currentFill = parseFloat(data.fill) || 25;
    const fillPercent = Math.max(0, Math.min(100, ((25 - currentFill) / 20) * 100));
    const isFull = data.full === "true" || fillPercent >= 95;
    const isOverride = data.ovr === "true";

    return (
      <Card className={`group transition-all duration-300 border-2 ${isFull ? 'border-zinc-800 shadow-xl' : 'border-zinc-100 shadow-sm'}`}>
        <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0 py-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isFull ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-400'}`}>
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-black tracking-tight text-zinc-800 uppercase italic">
                 {id === "1" ? "Kajiado" : "Kawangware"} Bin
              </CardTitle>
              <CardDescription className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Link: {id === "1" ? "STA-01" : "STA-02"}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {isOverride ? <Unlock className="w-4 h-4 text-zinc-900" /> : <Lock className="w-4 h-4 text-zinc-200" />}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* ... (Rest of your existing progress bar and data grid logic) ... */}
          <div className="flex justify-between mb-4 items-end">
             <div className="flex flex-col">
               <span className="text-5xl font-black tracking-tighter text-zinc-900 italic">
                 {fillPercent.toFixed(0)}<span className="text-xl not-italic text-zinc-300 ml-1">%</span>
               </span>
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Real-time Fill</span>
             </div>
             <Badge variant="outline" className={`px-3 py-1 font-mono text-[10px] transition-colors ${isOverride ? "bg-zinc-900 text-white border-zinc-900" : isFull ? "bg-white text-zinc-900 border-zinc-900 border-2" : "bg-zinc-50 text-zinc-500 border-zinc-200"}`}>
               {isOverride ? ":: OVERRIDE" : isFull ? ":: CRITICAL" : ":: NOMINAL"}
             </Badge>
          </div>
          
          <div className="space-y-1 mb-8">
            <Progress value={fillPercent} className="h-4 bg-zinc-100 rounded-none" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-sm">
              <p className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Last Update</p>
              <p className="text-xs font-mono font-bold text-zinc-800">
                {Math.floor((Date.now() - lastUpdate) / 1000)}s ago
              </p>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-sm">
              <p className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Depth</p>
              <p className="text-xs font-mono font-bold text-zinc-800">{data.fill}cm</p>
            </div>
          </div>

          <Button 
            onClick={() => publish(`smartbin/cmd/bin${id}`, "OPEN")}
            disabled={isOverride}
            className="w-full h-12 bg-zinc-900 text-white font-black text-xs uppercase tracking-widest"
          >
            {isOverride ? "Hatch Open" : "Initialize Service Open"}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header - Fixed Image integration */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-zinc-200 pb-8 gap-4">
          <div className="flex items-center gap-6">
            <div className="relative w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl shadow-sm p-2 flex items-center justify-center border border-zinc-100">
              <Image src={logo} alt="NEMA Logo" fill className="object-contain p-2" priority />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-zinc-900" />
                <span className="font-black text-zinc-900 tracking-widest text-[10px] uppercase">National Environment Management Authority Waste Management NEMA</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-zinc-900 uppercase italic leading-tight">
                Oloolaiser High Waste Management Portal
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Broker Status</p>
                <p className={`text-xs font-black uppercase ${isConnected ? 'text-zinc-900' : 'text-zinc-300'}`}>
                  {isConnected ? "Linked" : "Signal Loss"}
                </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-zinc-900 animate-pulse' : 'bg-red-400'}`} />
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {renderBinCard("1", "smartbin/status/bin1")}
          {renderBinCard("2", "smartbin/status/bin2")}
        </div>
        
        {/* Logs */}
        {/* ... (System logs remain as before) ... */}
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