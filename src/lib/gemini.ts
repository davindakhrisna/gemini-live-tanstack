import { GoogleGenAI } from "@google/genai";
import { env } from "@/env";

export async function connectGeminiSession(onText: (text: string) => void) {
	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

	const client = new GoogleGenAI({ apiKey });

	const session = await client.live.connect({
		model: env.GEMINI_MODEL,
		config: {
			responseModalities: ["TEXT"],
		},
	});

	// background receive loop
	(async () => {
		try {
			for await (const msg of session.receive()) {
				const text =
					msg?.candidates?.[0]?.content?.parts
						?.map((p: any) => p.text)
						?.filter(Boolean)
						?.join("") ?? "";

				if (text) onText(text);
			}
		} catch (err) {
			console.error("[gemini-live] receive loop error:", err);
		}
	})();

	return {
		async sendFrame(base64Jpeg: string) {
			await session.sendRealtimeInput({
				media: [
					{
						mimeType: "image/jpeg",
						data: base64Jpeg,
					},
				],
			});
		},

		async sendText(text: string) {
			await session.send({
				input: text,
			});
		},

		async close() {
			await session.close();
		},
	};
}
