import { PluginRef } from "../../types.ts";
import { execCommand } from "../../execCommand.ts";
import { parseMakemkvOutput } from "./parser.ts";

export async function scanDrives(ref: PluginRef) {
	const output = await execCommand([
		ref.path,
		"-r",
		"--cache=1",
		"info",
		"--noscan",
	]);
	const info = parseMakemkvOutput(output);
	return info;
}
