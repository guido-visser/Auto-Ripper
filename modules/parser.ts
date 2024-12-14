/**
 * This parser takes the output from makemkvcon64.exe and structures it into a
 * more manageable TypeScript object. It also extracts key title information from TINFO and SINFO lines.
 *
 * According to the user:
 *   infoId 8  = Chapter count
 *   infoId 9  = Duration
 *   infoId 10 = Size
 *   infoId 16 = Source file name (e.g. 00000.mpls, 00010.m2ts, etc.)
 *   infoId 25 = Segment count
 *   infoId 26 = Segment map
 *   infoId 27 = MKV File name (e.g. title_t00.mkv)
 *
 * For SINFO (Track) information:
 *   infoId 1  = Type (e.g. "Video", "Audio", "Subtitles")
 *   infoId 2  = Name
 *   infoId 3  = Language ID
 *   infoId 4  = Language
 *   infoId 6  = Codec Short
 *   infoId 7  = Codec
 *   infoId 14 = Channels
 *   infoId 17 = Sample rate
 *   infoId 18 = Bits per sample
 *
 * After parsing, we produce a `titlesByMkv` dictionary that maps the mkv filename to a structured object containing:
 *   - titleId
 *   - mkvName
 *   - chapterCount
 *   - duration
 *   - size
 *   - sourceFileName
 *   - segmentCount
 *   - segmentMap
 *   - videoTracks, audioTracks, subtitleTracks: arrays of track data derived from SINFO
 */

interface MakemkvMessage {
	code: number;
	flags: number;
	numParams: number;
	message: string;
	formattedMessage: string;
	params: string[];
}

interface MakemkvDrive {
	driveNumber: number;
	type: number;
	bus: number;
	flags: number;
	name: string;
	discType: string;
	discPath: string;
}

interface MakemkvCInfo {
	paramCode: number;
	paramFlags: number;
	paramString: string;
}

interface MakemkvTInfo {
	titleNumber: number;
	infoId: number;
	isString: boolean;
	value: string;
}

interface MakemkvSInfo {
	titleNumber: number;
	trackNumber: number;
	infoId: number;
	paramFlags: number;
	value: string;
}

/**
 * A structured representation of a track extracted from SINFO entries.
 */
interface TrackInfo {
	trackNumber: number;
	type?: string;
	name?: string;
	languageId?: string;
	language?: string;
	codecShort?: string;
	codec?: string;
	channels?: number;
	sampleRate?: number;
	bitsPerSample?: number;
}

/**
 * A structured representation of a title extracted from TINFO and SINFO entries.
 */
interface TitleInfo {
	titleId: number;
	mkvName?: string;
	chapterCount?: number;
	duration?: string;
	size?: string;
	sourceFileName?: string;
	segmentCount?: number;
	segmentMap?: string;
	videoTracks: TrackInfo[];
	audioTracks: TrackInfo[];
	subtitleTracks: TrackInfo[];
}

interface TitlesByMkv {
	[mkvName: string]: TitleInfo;
}

export interface ParseResult {
	messages: MakemkvMessage[];
	drives: MakemkvDrive[];
	discInfo: MakemkvCInfo[];
	titleCount?: number;
	tinfo: MakemkvTInfo[];
	sinfo: MakemkvSInfo[];
	titlesByMkv: TitlesByMkv;
}

/**
 * Utility function to parse a single line of makemkvcon output into fields.
 */
function parseFields(line: string): string[] {
	const fields: string[] = [];
	let i = 0;
	let current = "";
	let inQuotes = false;

	while (i < line.length) {
		const char = line[i];

		if (inQuotes) {
			if (char === '"') {
				// Check for escaped quote
				if (i + 1 < line.length && line[i + 1] === '"') {
					current += '"';
					i += 2;
				} else {
					inQuotes = false;
					i++;
				}
			} else {
				current += char;
				i++;
			}
		} else {
			if (char === '"') {
				inQuotes = true;
				i++;
			} else if (char === ",") {
				fields.push(current);
				current = "";
				i++;
			} else {
				current += char;
				i++;
			}
		}
	}

	if (current.length > 0) {
		fields.push(current);
	}

	return fields;
}

/**
 * Parse a single line from the makemkvcon output.
 */
function parseLine(line: string, result: ParseResult) {
	line = line.trim();
	if (!line) return;

	const colonIndex = line.indexOf(":");
	if (colonIndex < 0) return;

	const recordType = line.substring(0, colonIndex);
	const rest = line.substring(colonIndex + 1);

	switch (recordType) {
		case "MSG":
			{
				const fields = parseFields(rest);
				const code = parseInt(fields[0], 10);
				const flags = parseInt(fields[1], 10);
				const numParams = parseInt(fields[2], 10);
				const message = fields[3] || "";
				const formattedMessage = fields[4] || "";
				const params = fields.slice(5);
				result.messages.push({
					code,
					flags,
					numParams,
					message,
					formattedMessage,
					params,
				});
			}
			break;

		case "DRV":
			{
				const fields = parseFields(rest);
				const driveNumber = parseInt(fields[0], 10);
				const type = parseInt(fields[1], 10);
				const bus = parseInt(fields[2], 10);
				const flags = parseInt(fields[3], 10);
				const name = fields[4] || "";
				const discType = fields[5] || "";
				const discPath = fields[6] || "";
				result.drives.push({
					driveNumber,
					type,
					bus,
					flags,
					name,
					discType,
					discPath,
				});
			}
			break;

		case "CINFO":
			{
				const fields = parseFields(rest);
				const paramCode = parseInt(fields[0], 10);
				const paramFlags = parseInt(fields[1], 10);
				const paramString = fields[2] || "";
				result.discInfo.push({ paramCode, paramFlags, paramString });
			}
			break;

		case "TCOUNT":
			{
				const fields = parseFields(rest);
				const numberOfTitles = parseInt(fields[0], 10);
				result.titleCount = numberOfTitles;
			}
			break;

		case "TINFO":
			{
				const fields = parseFields(rest);
				const titleNumber = parseInt(fields[0], 10);
				const infoId = parseInt(fields[1], 10);
				const isString = parseInt(fields[2], 10) === 1;
				const value = fields[3] || "";
				result.tinfo.push({ titleNumber, infoId, isString, value });
			}
			break;

		case "SINFO":
			{
				const fields = parseFields(rest);
				const titleNumber = parseInt(fields[0], 10);
				const trackNumber = parseInt(fields[1], 10);
				const infoId = parseInt(fields[2], 10);
				const paramFlags = parseInt(fields[3], 10);
				const value = fields[4] || "";
				result.sinfo.push({
					titleNumber,
					trackNumber,
					infoId,
					paramFlags,
					value,
				});
			}
			break;

		default:
			// Ignore other record types or add handling if needed
			break;
	}
}

/**
 * Build track info objects from SINFO entries per title.
 */
function buildTracksForTitle(sinfoEntries: MakemkvSInfo[]): {
	videoTracks: TrackInfo[];
	audioTracks: TrackInfo[];
	subtitleTracks: TrackInfo[];
} {
	// Group by trackNumber
	const tracksByNumber: { [trackNumber: number]: Partial<TrackInfo> } = {};

	for (const s of sinfoEntries) {
		if (!tracksByNumber[s.trackNumber]) {
			tracksByNumber[s.trackNumber] = { trackNumber: s.trackNumber };
		}

		const track = tracksByNumber[s.trackNumber];

		switch (s.infoId) {
			case 1:
				track.type = s.value; // "Video", "Audio", "Subtitles"
				break;
			case 2:
				track.name = s.value;
				break;
			case 3:
				track.languageId = s.value;
				break;
			case 4:
				track.language = s.value;
				break;
			case 6:
				track.codecShort = s.value;
				break;
			case 7:
				track.codec = s.value;
				break;
			case 14:
				track.channels = parseInt(s.value, 10);
				break;
			case 17:
				track.sampleRate = parseInt(s.value, 10);
				break;
			case 18:
				track.bitsPerSample = parseInt(s.value, 10);
				break;
		}
	}

	const videoTracks: TrackInfo[] = [];
	const audioTracks: TrackInfo[] = [];
	const subtitleTracks: TrackInfo[] = [];

	for (const tNum in tracksByNumber) {
		const track = tracksByNumber[tNum] as TrackInfo;
		if (track.type === "Video") {
			videoTracks.push(track);
		} else if (track.type === "Audio") {
			audioTracks.push(track);
		} else if (track.type === "Subtitles") {
			subtitleTracks.push(track);
		}
	}

	return { videoTracks, audioTracks, subtitleTracks };
}

/**
 * After parsing all TINFO and SINFO entries, we group them by mkv filename.
 */
function groupTinfoByMkv(result: ParseResult) {
	// Group all TINFO by titleNumber
	const titlesByNumber: { [titleNumber: number]: MakemkvTInfo[] } = {};
	for (const entry of result.tinfo) {
		if (!titlesByNumber[entry.titleNumber]) {
			titlesByNumber[entry.titleNumber] = [];
		}
		titlesByNumber[entry.titleNumber].push(entry);
	}

	// Group SINFO by titleNumber as well
	const sinfoByTitle: { [titleNumber: number]: MakemkvSInfo[] } = {};
	for (const s of result.sinfo) {
		if (!sinfoByTitle[s.titleNumber]) {
			sinfoByTitle[s.titleNumber] = [];
		}
		sinfoByTitle[s.titleNumber].push(s);
	}

	const titlesByMkv: TitlesByMkv = {};

	for (const titleNumberStr in titlesByNumber) {
		const titleNumber = parseInt(titleNumberStr, 10);
		const entries = titlesByNumber[titleNumber];
		const mkvEntry = entries.find(
			(e) => e.infoId === 27 && e.value.endsWith(".mkv")
		);

		if (!mkvEntry) {
			// If there's no MKV file name entry, skip this title
			continue;
		}
		const mkvName = mkvEntry.value;

		const chapterCountEntry = entries.find((e) => e.infoId === 8);
		const durationEntry = entries.find((e) => e.infoId === 9);
		const sizeEntry = entries.find((e) => e.infoId === 10);
		const sourceFileNameEntry = entries.find((e) => e.infoId === 16);
		const segmentCountEntry = entries.find((e) => e.infoId === 25);
		const segmentMapEntry = entries.find((e) => e.infoId === 26);

		// Build track info from SINFO
		const sinfoEntries = sinfoByTitle[titleNumber] || [];
		const { videoTracks, audioTracks, subtitleTracks } =
			buildTracksForTitle(sinfoEntries);

		const titleInfo: TitleInfo = {
			titleId: titleNumber,
			mkvName,
			chapterCount: chapterCountEntry
				? parseInt(chapterCountEntry.value, 10)
				: undefined,
			duration: durationEntry ? durationEntry.value : undefined,
			size: sizeEntry ? sizeEntry.value : undefined,
			sourceFileName: sourceFileNameEntry
				? sourceFileNameEntry.value
				: undefined,
			segmentCount: segmentCountEntry
				? parseInt(segmentCountEntry.value, 10)
				: undefined,
			segmentMap: segmentMapEntry ? segmentMapEntry.value : undefined,
			videoTracks,
			audioTracks,
			subtitleTracks,
		};

		titlesByMkv[mkvName] = titleInfo;
	}

	result.titlesByMkv = titlesByMkv;
}

/**
 * Main parser function.
 * Provide the entire output as a string, it returns a structured ParseResult.
 */
export function parseMakemkvOutput(output: string): ParseResult {
	const lines = output.split("\n");

	const result: ParseResult = {
		messages: [],
		drives: [],
		discInfo: [],
		tinfo: [],
		sinfo: [],
		titlesByMkv: {},
	};

	for (const line of lines) {
		parseLine(line, result);
	}

	// Once done parsing all lines, group TINFO and SINFO by mkv filename into a structured form
	groupTinfoByMkv(result);

	return result;
}
