import { Room } from "@livekit/rtc-node";
import { AccessToken } from "livekit-server-sdk";
import { env } from "./env";

export async function joinRoom(roomName: string) {
	const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
		identity: "gemini-screen-bot",
		name: "Gemini Screen Bot",
	});

	token.addGrant({
		roomJoin: true,
		room: roomName,
		canPublish: false,
		canSubscribe: true,
	});

	const room = new Room();
	await room.connect(env.VITE_LIVEKIT_URL, await token.toJwt());

	console.log(`[agent] connected to room ${roomName}`);

	return room;
}
