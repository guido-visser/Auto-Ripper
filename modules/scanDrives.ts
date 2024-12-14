import { Config } from "../types.ts";
import { execCommand } from "./execCommand.ts";
import { parseMakeMKVOutput } from "./parsers/scanDrivesOutputParser.ts";

export async function scanDrives(config: Config) {
	const output = await execCommand([
		config.dependencies.makemkv,
		"-r",
		"--cache=1",
		"info",
		"--noscan",
	]);
	const info = parseMakeMKVOutput(output);
	return info;
}
