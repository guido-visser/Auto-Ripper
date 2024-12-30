import { PluginRef } from "../../types.ts";
import { execCommand } from "../../execCommand.ts";
import { parseMakemkvOutput, ParseResult } from "./parser.ts";

export async function getDiscInfo(
	ref: PluginRef,
	driveIndex: number
): Promise<ParseResult> {
	const output = await execCommand([
		ref.path,
		"-r",
		"info",
		`disc:${driveIndex}`,
		"--directio=true",
		"--noscan",
	]);
	return parseMakemkvOutput(output);
}
