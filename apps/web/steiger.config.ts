import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
	...fsd.configs.recommended,
	{
		// Next.jsのApp Routerディレクトリは除外
		files: ["./src/**"],
		ignores: ["./src/app/**"],
	},
]);
