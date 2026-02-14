import sharp from "sharp";

export async function frameToJpegBase64(input: {
	data: Uint8Array;
	width: number;
	height: number;
}) {
	const jpegBuffer = await sharp(Buffer.from(input.data), {
		raw: {
			width: input.width,
			height: input.height,
			channels: 4,
		},
	})
		.jpeg({ quality: 70 })
		.toBuffer();

	return jpegBuffer.toString("base64");
}
