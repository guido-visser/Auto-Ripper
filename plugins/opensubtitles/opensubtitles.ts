import { Config, PluginOutput, PluginRef } from "../../types.ts";
import { existsSync } from "https://deno.land/std@0.203.0/fs/mod.ts";
import { dirname, join } from "https://deno.land/std@0.203.0/path/mod.ts";
import OS from "opensubtitles-api";
import mediainfo from "node-mediainfo";

export default class OpenSubtitles {
	config: Config;
	prev: PluginOutput;
	pluginName = "OpenSubtitles";
	os: OS = null;

	constructor(config: Config, prevPluginOutput: PluginOutput) {
		this.config = config;
		this.prev = prevPluginOutput;
	}

	init = async (ref: PluginRef) => {
		console.log(`[${this.pluginName}] Plugin Initialized`);
		this.os = new OS({
			useragent: "UserAgent",
			username: ref.options?.username,
			password: ref.options?.password,
		});

		const media = await mediainfo(this.prev.fullPath);
		const metadata = media.media.track.find((t) => t["@type"] === "Video");

		const searchOptions = {
			sublanguageid: this.config.defaults.subLanguages.join(","),
			//path: this.prev.fullPath,
			//filename: this.prev.title,
			query:
				this.prev.title.indexOf("(") !== -1
					? this.prev.title.split("(")[0].trim()
					: this.prev.title,
			fps: metadata.FrameRate,
			limit: "best",
		};

		const result = await this.os.search(searchOptions);
		console.log(result);
		debugger;
	};

	/* downloadMovieSubtitle = async (metadata) => {
		
	}; */
}
