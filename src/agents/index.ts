import { joinRoom } from "./livekit";

async function main() {
	const roomName = process.argv[2];

	if (!roomName) {
		throw new Error(
			"Missing room name. Usage: tsx agents/screen-bot/index.ts <room>",
		);
	}

	const room = await joinRoom(roomName);

	room.on("trackPublished", async (pub, participant) => {
		console.log("[agent] trackPublished", {
			kind: pub.kind,
			source: pub.source,
			trackSid: pub.trackSid,
			name: pub.trackName,
			mimeType: pub.mimeType,
			from: participant.identity,
		});

		await pub.setSubscribed(true);
	});

	room.on("trackSubscribed", (track, pub, participant) => {
		console.log("[agent] trackSubscribed", {
			kind: track.kind,
			trackSid: pub.trackSid,
			name: pub.trackName,
			from: participant.identity,
		});
	});
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
