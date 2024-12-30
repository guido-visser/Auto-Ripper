import { parseArgs } from "https://deno.land/std/cli/parse_args.ts";
import { Config, PluginOutput } from "./types.ts";
import MakeMKV from "./plugins/makemkv/makemkv.ts";
import Handbrake from "./plugins/handbrake/handbrake.ts";
import { help } from "./modules/help.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";
import generateConfig from "./modules/generateConfig.ts";

const plugins: { [key: string]: any } = {
	makemkv: MakeMKV,
	handbrake: Handbrake,
};

if (!(await exists("./config.json"))) {
	await generateConfig();
}

const configText = await Deno.readTextFile("./config.json");
const config: Config = JSON.parse(configText);

const args = parseArgs(Deno.args, {
	string: ["drive", "output"],
	boolean: ["help", "version"],
	alias: {
		h: "help",
		v: "version",
		d: "drive",
		o: "output",
	},
	default: {
		drive: "0",
		output: "./output",
	},
});

async function main() {
	if (args.help || !args) {
		help();
		Deno.exit(0);
	}

	let prevPluginOutput: PluginOutput;
	for (let i = 0; i < config.plugins.length; i++) {
		const pluginRef = config.plugins[i];
		if (!plugins[pluginRef.name]) {
			console.log(
				`Plugin '${pluginRef.name}' not supported. Skipping...`
			);
			continue;
		}

		if (!pluginRef.enabled) {
			console.log(pluginRef.name, "disabled, skipping...");
			continue;
		}
		const plugin = new plugins[pluginRef.name](config, prevPluginOutput);

		prevPluginOutput = await plugin.init(pluginRef);
	}
}

main().catch(console.error);
