#!/usr/bin/env bun

// Simple WebSocket connection test
console.log("Testing WebSocket connection...");

try {
  console.log("🔄 Creating WebSocket connection to ws://localhost:8080");
  const ws = new WebSocket("ws://localhost:8080");
  
  console.log("📡 WebSocket created, waiting for connection...");
  
  ws.onopen = () => {
    console.log("✅ WebSocket connected successfully");
    console.log("📤 Sending ping message");
    ws.send(JSON.stringify({ type: "ping" }));
  };
  
  ws.onmessage = (event) => {
    console.log("📨 Message received:", event.data);
    try {
      const parsed = JSON.parse(event.data);
      console.log("📋 Parsed message:", parsed);
    } catch (e) {
      console.log("⚠️ Could not parse message as JSON");
    }
  };
  
  ws.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
  };
  
  ws.onclose = (event) => {
    console.log("🔌 WebSocket connection closed");
    console.log("   Code:", event.code);
    console.log("   Reason:", event.reason);
    console.log("   Was clean:", event.wasClean);
    process.exit(0);
  };
  
  // Close after 5 seconds
  setTimeout(() => {
    console.log("⏰ Closing connection after timeout");
    ws.close();
  }, 5000);
  
} catch (error) {
  console.error("💥 Failed to create WebSocket:", error);
}