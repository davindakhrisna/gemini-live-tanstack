import { frameToJpegBase64 } from "@/lib/sharp";
import { connectGeminiSession } from "@/lib/gemini";
import { env } from "@/env";
import { AccessToken } from "livekit-server-sdk";
import { os } from "@orpc/server";
import * as z from "zod";
import { VideoBufferType } from "@livekit/rtc-node";

export const livekitRouter = {
	getToken: os
		.input(
			z.object({ room: z.string(), identity: z.string(), addGrant: z.any() }),
		)
		.handler(async ({ input }) => {
			const apiKey = env.LIVEKIT_API_KEY;
			const apiSecret = env.LIVEKIT_API_SECRET;

			if (!apiKey || !apiSecret) {
				throw new Error("Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET");
			}

			const token = new AccessToken(apiKey, apiSecret, {
				identity: input.identity,
			});

			token.addGrant(input.addGrant);

			return { token: await token.toJwt() };
		}),
};

export const agentRouter = {
	start: os
		.input(z.object({ token: z.string() }))
		.handler(async ({ input }) => {
			try {
				const url = env.VITE_LIVEKIT_URL;
				const token = input.token;

				console.log("[agent] Starting agent check URL:", url);

				if (!url || !token) throw new Error("Missing LiveKit URL or Token");

				const { Room, RoomEvent, TrackKind, TrackSource, VideoStream } =
					await import("@livekit/rtc-node");
				const room = new Room();

				console.log("[agent] connecting...");
				await room.connect(url, token);
				console.log("[agent] connected!");

				const local = room.localParticipant;
				const encoder = new TextEncoder();

				const sendFeedback = async (message: string) => {
					if (!local) return;
					await local.publishData(encoder.encode(message), {
						reliable: true,
						topic: "ai-feedback",
					});
				};

				const gemini = await connectGeminiSession(async (text) => {
					console.log("[gemini]", text);
					await sendFeedback(text);
				});

				let running = false;

				room.on(RoomEvent.TrackSubscribed, async (track, pub) => {
					console.log("[agent] subscribed:", pub.source, pub.kind);

					if (pub.kind !== TrackKind.KIND_VIDEO) return;
					if (pub.source !== TrackSource.SOURCE_SCREENSHARE) return;

					if (running) return;
					running = true;

					console.log("[agent] GOT SCREEN TRACK - Starting VideoStream");

					await sendFeedback("👀 Bot connected. Watching your screen...");

					const videoStream = new VideoStream(track);

					let lastSent = 0;
					let lastPromptSent = Date.now() - 2000; // Let some frames flow first (2s delay)
					let busy = false;

					try {
						for await (const frameEvent of videoStream) {
							const { frame } = frameEvent;

							if (frame.width < 32 || frame.height < 32) continue;

							const now = Date.now();

							if (now - lastSent < 15000) continue; // 2 FPS (500ms)
							lastSent = now;

							if (busy) continue;
							busy = true;

							try {
								const rgbaFrame = frame.convert(VideoBufferType.RGBA);
								if (!rgbaFrame.data) continue;

								const base64 = await frameToJpegBase64({
									data: rgbaFrame.data,
									width: rgbaFrame.width,
									height: rgbaFrame.height,
								});

								await gemini.sendFrame(base64);

								if (now - lastPromptSent >= 4000) {
									lastPromptSent = now;
									console.log("[agent] PROMPTING GEMINI for description...");
									await gemini.sendText(
										"Describe the code and text currently visible on screen in detail.",
									);
								}

								console.log("[agent] sent frame to gemini");
							} finally {
								busy = false;
							}
						}
					} catch (err) {
						console.error("[agent] video stream error:", err);
						running = false;
					}
				});
			} catch (err) {
				console.error("[agent] FATAL ERROR:", err);
				throw err;
			}
		}),
};
