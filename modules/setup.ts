import { execCommand } from "../execCommand.ts";
import { Software } from "../types.ts";

export const getInstalledSoftware = async () => {
	const raw = await execCommand([
		"powershell.exe",
		"-NoProfile",
		"-Command",
		// This command retrieves properties from the Uninstall registry key,
		// selects the fields we care about, and then converts them to JSON.
		"Get-ItemProperty 'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' |",
		"Select-Object (DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation) |",
		"ConvertTo-Json",
	]);
	const softwareParsed = JSON.parse(raw);
	const makeMkvExists = softwareParsed.filter((s: Software) => {
		return s.DisplayName?.toLowerCase().indexOf("mkv") !== -1;
	});
	debugger;
};

export const Setup = async () => {
	console.log(
		"It looks like this is the first time you're booting up. Lets get everything configured!"
	);
	console.log("");
	await getInstalledSoftware();
};

//HKEY_LOCAL_MACHINE\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\makemkvcon.exe
