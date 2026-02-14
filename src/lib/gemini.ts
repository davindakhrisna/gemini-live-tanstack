import { GoogleGenAI, type LiveServerMessage, Modality } from "@google/genai";
import { env } from "@/env";

export async function connectGeminiSession(onText: (text: string) => void) {
	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

	const client = new GoogleGenAI({ apiKey });

	let connected = false;

	const session = await client.live.connect({
		model: env.GEMINI_MODEL,
		config: {
			responseModalities: [Modality.AUDIO],
			systemInstruction: "You are a technical vision observer. Your task is to provide accurate, concise descriptions of the Neovim editor and code visible in the 'video' stream. Report only what you actually see. Do not imagine desktop elements, clocks, or status bars. If text is visible, describe the code or content. Avoid conversational filler.",
			speechConfig: {
				voiceConfig: {
					prebuiltVoiceConfig: {
						voiceName: "Aoede",
					},
				},
			},
		},
		callbacks: {
			onopen: () => {
				connected = true;
				console.log("[gemini-live] session opened");
			},
			onmessage: (message: LiveServerMessage) => {
				const content = message.serverContent;
				if (!content?.modelTurn?.parts) return;

				let text = "";
				for (const part of content.modelTurn.parts) {
					if (part.text) {
						text += part.text;
					}
				}

				if (text) {
					onText(text);
				}
			},
			onerror: (e: ErrorEvent) => {
				console.error("[gemini-live] error:", e.error);
			},
			onclose: (e: CloseEvent) => {
				connected = false;
				console.log("[gemini-live] session closed:", e.code, e.reason);
			},
		},
	});

	return {
		get isConnected() {
			return connected;
		},

		async sendFrame(base64Jpeg: string) {
			if (!connected) return;
			session.sendRealtimeInput({
				video: {
					mimeType: "image/jpeg",
					data: base64Jpeg,
				},
			});
		},

		async sendText(text: string) {
			if (!connected) return;
			session.sendClientContent({
				turns: [
					{
						role: "user",
						parts: [{ text }],
					},
				],
				turnComplete: true,
			});
		},

		async close() {
			connected = false;
			session.close();
		},
	};
}
