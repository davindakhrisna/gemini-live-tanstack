import type { RoomConnectOptions } from "livekit-client";
import { Room } from "livekit-client";
import { orpc } from "@/orpc/client";

export async function connectLiveKit(roomName: string) {
	const { token } = await orpc.livekit.getToken.call({ room: roomName });

	const connectOpts: RoomConnectOptions = {
		autoSubscribe: true,
	};

	const room = new Room({
		adaptiveStream: true,
	});

	try {
		await room.connect(import.meta.env.VITE_LIVEKIT_URL, token, connectOpts);
		return room;
	} catch (error) {
		console.error("Failed to connect to LiveKit:", error);
		throw error;
	}
}
