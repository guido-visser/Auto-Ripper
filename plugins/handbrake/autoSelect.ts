import { Config, HandBrakeOutput, HBTitle } from "../../types.ts";
import { ParseResult } from "../makemkv/parser.ts";

export const autoSelect = (config: Config, fileInfo: HandBrakeOutput) => {
	const audioResult: number[] = [];
	const subtitleResult: number[] = [];
	const addedLanguages: string[] = [];

	const calculateScore = (currentTitle: HBTitle, lang?: string) => {
		// Assign a score to each track based on audioCodec and audioName preferences
		// Lower score is better.
		// Score calculation:
		//   codecScore = index in audioCodec array, if not found = large number
		//   nameScore = index in audioName array, if not found = large number
		// trackScore = (codecScore * 1000) + nameScore
		// Multiplying codecScore by 1000 ensures codec preference is weighted more heavily.
		const filteredTracks = currentTitle.AudioList.filter(
			(track) => track.LanguageCode === lang
		);
		const scoredTracks = (filteredTracks || currentTitle.AudioList).map(
			(track) => {
				const codecScore = config.defaults.audioCodec.indexOf(
					track.CodecName || ""
				);
				const finalCodecScore = codecScore === -1 ? 9999 : codecScore;

				const nameScore = config.defaults.audioName.indexOf(
					track.Name || ""
				);
				const finalNameScore = nameScore === -1 ? 9999 : nameScore;

				const trackScore = finalCodecScore * 1000 + finalNameScore;
				return { track, trackScore };
			}
		);

		// Sort by trackScore ascending, pick the best one
		scoredTracks.sort((a, b) => a.trackScore - b.trackScore);

		if (lang && !addedLanguages.includes(lang)) {
			audioResult.push(scoredTracks[0].track.TrackNumber);
			addedLanguages.push(lang);
		} else if (!lang) {
			audioResult.push(scoredTracks[0].track.TrackNumber);
		}
	};

	fileInfo.TitleList.forEach((currentTitle) => {
		const willHaveLanguageMatch = !!currentTitle.AudioList.find((t) =>
			config.defaults.audioLanguages.includes(t.LanguageCode)
		);

		if (!willHaveLanguageMatch) {
			calculateScore(currentTitle);
		}

		if (willHaveLanguageMatch) {
			for (const lang of config.defaults.audioLanguages) {
				// Filter tracks that match the language and are audio tracks
				let langTracks;
				if (willHaveLanguageMatch) {
					langTracks = currentTitle.AudioList.filter(
						(t) =>
							t.LanguageCode &&
							t.LanguageCode.toLowerCase() === lang.toLowerCase()
					);
				}

				if (langTracks?.length === 0) {
					// No track matches this language
					continue;
				}

				calculateScore(currentTitle, lang);
			}
		}

		for (let i = 0; i < config.defaults.subLanguages.length; i++) {
			const lang = config.defaults.subLanguages[i];
			// Filter subtitle tracks by language
			const langSubs = currentTitle.SubtitleList.filter(
				(t) =>
					t.LanguageCode &&
					t.LanguageCode.toLowerCase() === lang.toLowerCase()
			);

			if (langSubs.length === 0) {
				// No subtitle matches this language
				continue;
			}

			// Just pick the first one
			subtitleResult.push(langSubs[0].TrackNumber);
		}
	});

	return {
		audio: audioResult,
		subtitles: subtitleResult,
	};
};
