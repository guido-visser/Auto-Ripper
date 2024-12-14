import { Config } from "../types.ts";
import { ParseResult } from "./parser.ts";

export const autoSelect = (
	titles: ParseResult["titlesByMkv"],
	config: Config
) => {
	const titleKeys = Object.keys(titles);

	for (let i = 0; i < titleKeys.length; i++) {
		const title = titleKeys[i];

		const metadata = titles[title];

		const defaultAudio = metadata.audioTracks.filter((audio) =>
			config.defaults.languages.includes(audio.languageId)
		);
		const defaultSubs = metadata.subtitleTracks.filter((sub) =>
			config.defaults.languages.includes(sub.languageId)
		);
	}
};
