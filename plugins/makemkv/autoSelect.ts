import { Config } from "../../types.ts";
import { ParseResult } from "./parser.ts";

export const autoSelect = (
	config: Config,
	titles: ParseResult["titlesByMkv"]
) => {
	const audioResult: { [key: string]: number[] } = {};
	const subtitleResult: number[] = [];

	const calculateScore = (currentTitle: ParseResult["titlesByMkv"][0]) => {
		// Assign a score to each track based on audioCodec and audioName preferences
		// Lower score is better.
		// Score calculation:
		//   codecScore = index in audioCodec array, if not found = large number
		//   nameScore = index in audioName array, if not found = large number
		// trackScore = (codecScore * 1000) + nameScore
		// Multiplying codecScore by 1000 ensures codec preference is weighted more heavily.
		const scoredTracks = currentTitle.audioTracks.map((track) => {
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

		if (!audioResult[currentTitle.mkvName]) {
			audioResult[currentTitle.mkvName] = [];
		}

		audioResult[currentTitle.mkvName].push(
			scoredTracks[0].track.trackNumber
		);
	};

	let videoResult: number;
	let largestTitle: number = 0;
	let name: string;
	Object.keys(titles).forEach((title) => {
		const currentTitle = titles[title];

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

	const currentTitle = titles[name];
	const willHaveLanguageMatch = !!currentTitle.audioTracks.find((t) =>
		config.defaults.audioLanguages.includes(t.languageId)
	);

	if (!willHaveLanguageMatch) {
		console.log(
			"No audiotrack found that matches your default languages. Picking the best match based upon audio codec and name"
		);
		audioResult[currentTitle.mkvName].push(-1);
	}

	if (willHaveLanguageMatch) {
		for (const lang of config.defaults.audioLanguages) {
			// Filter tracks that match the language and are audio tracks
			let langTracks;
			if (willHaveLanguageMatch) {
				langTracks = currentTitle.audioTracks.filter(
					(t) =>
						t.type === "Audio" &&
						t.languageId &&
						t.languageId.toLowerCase() === lang.toLowerCase()
				);
			}

			if (langTracks?.length === 0) {
				// No track matches this language
				continue;
			}

			calculateScore(currentTitle);
		}
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

	return {
		audio: audioResult[name],
		subtitles: subtitleResult,
		video: videoResult,
		name,
	};
};
