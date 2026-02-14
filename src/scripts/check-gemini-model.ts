
import { GoogleGenAI } from "@google/genai";
import { env } from "@/env";

async function test() {
  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  
  // Try to list models (if supported) or just test connection
  console.log("Testing Gemini Live connection with model:", env.GEMINI_MODEL);

  try {
    const session = await client.live.connect({
      model: env.GEMINI_MODEL,
      config: { responseModalities: ["TEXT"] },
      callbacks: {
        onopen: () => console.log("SUCCESS: Session opened!"),
        onmessage: (msg) => console.log("Message:", msg.text ? "Text received" : "No text"),
        onclose: (e) => console.log("Closed:", e.code, e.reason),
        onerror: (e) => console.error("Error:", e.error)
      }
    });

    // Send a message
    console.log("Sending message...");
    await session.sendClientContent({
      turns: [{ role: "user", parts: [{ text: "Hello" }] }],
      turnComplete: true
    });

    // Wait 5s
    await new Promise(resolve => setTimeout(resolve, 5000));
    await session.close();
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

test();
