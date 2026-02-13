import { Track, type Room } from "livekit-client";

export async function startScreenShare(room: Room) {
	const stream = await navigator.mediaDevices.getDisplayMedia({
		video: true,
		audio: false,
	});

	const screenTrack = stream.getVideoTracks()[0];

	await room.localParticipant.publishTrack(screenTrack, {
		source: Track.Source.ScreenShare,
	});

	return stream;
}
