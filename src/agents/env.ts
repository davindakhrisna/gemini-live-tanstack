import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		GEMINI_API_KEY: z.string().nonempty(),
		LIVEKIT_API_KEY: z.string().nonempty(),
		LIVEKIT_API_SECRET: z.string().nonempty(),
	},

	clientPrefix: "VITE_",
	client: {
		VITE_LIVEKIT_URL: z.string().url().nonempty(),
	},

	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
