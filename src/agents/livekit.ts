import { AccessToken } from "livekit-server-sdk";
import { env } from "./env";

export async function agentJoinRoom(roomName: string) {
	const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
		identity: "Gemini Live",
	});

	token.addGrant({
		roomJoin: true,
		room: roomName,
		canPublish: false,
		canSubscribe: true,
	});

	return await token.toJwt();
}
