import { Config } from "../../types.ts";
import { ParseResult } from "./parser.ts";

export const autoSelect = (
	config: Config,
	titles: ParseResult["titlesByMkv"]
) => {
	const audioResult: number[] = [];
	const subtitleResult: number[] = [];
	let videoResult: number;
	let largestTitle: number = 0;
	let name: string;

	Object.keys(titles).forEach((title) => {
		const currentTitle = titles[title];
		for (const lang of config.defaults.audioLanguages) {
			// Filter tracks that match the language and are audio tracks
			const langTracks = currentTitle.audioTracks.filter(
				(t) =>
					t.type === "Audio" &&
					t.languageId &&
					t.languageId.toLowerCase() === lang.toLowerCase()
			);

			if (langTracks.length === 0) {
				// No track matches this language
				continue;
			}

			// Assign a score to each track based on audioCodec and audioName preferences
			// Lower score is better.
			// Score calculation:
			//   codecScore = index in audioCodec array, if not found = large number
			//   nameScore = index in audioName array, if not found = large number
			// trackScore = (codecScore * 1000) + nameScore
			// Multiplying codecScore by 1000 ensures codec preference is weighted more heavily.
			const scoredTracks = langTracks.map((track) => {
				const codecScore = config.defaults.audioCodec.indexOf(
					track.codec || ""
				);
				const finalCodecScore = codecScore === -1 ? 9999 : codecScore;

				const nameScore = config.defaults.audioName.indexOf(
					track.name || ""
				);
				const finalNameScore = nameScore === -1 ? 9999 : nameScore;

				const trackScore = finalCodecScore * 1000 + finalNameScore;
				return { track, trackScore };
			});

			// Sort by trackScore ascending, pick the best one
			scoredTracks.sort((a, b) => a.trackScore - b.trackScore);

			audioResult.push(scoredTracks[0].track.trackNumber);
		}

		for (const lang of config.defaults.subLanguages) {
			// Filter subtitle tracks by language
			const langSubs = currentTitle.subtitleTracks.filter(
				(t) =>
					t.type === "Subtitles" &&
					t.languageId &&
					t.languageId.toLowerCase() === lang.toLowerCase()
			);

			if (langSubs.length === 0) {
				// No subtitle matches this language
				continue;
			}

			// Just pick the first one
			subtitleResult.push(langSubs[0].trackNumber);
		}

		//Video Title selection logic

		const [numberString, unit] = currentTitle.size.split(" ");
		let number;
		if (unit === "GB") {
			number = parseFloat(numberString) * 1000;
		} else if (unit === "MB") {
			number = parseFloat(numberString);
		}

		if (number > largestTitle) {
			videoResult = currentTitle.titleId;
			largestTitle = number;
			name = currentTitle.mkvName;
		}
	});

	return {
		audio: audioResult,
		subtitles: subtitleResult,
		video: videoResult,
		name,
	};
};
