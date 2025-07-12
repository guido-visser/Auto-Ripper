import * as path from "node:path";
import jsonfile from "jsonfile";
import { v4 as uuidv4 } from "npm:uuid";

export class Queue {
	queueFile: string;
	instanceId: string;

	constructor() {
		this.queueFile = path.resolve("./handbrake-queue.json");
		this.instanceId = uuidv4();
	}

	async join() {
		let queue: string[] = [];
		try {
			queue = await jsonfile.readFile(this.queueFile);
			if (!Array.isArray(queue)) queue = [];
		} catch (_) {
			queue = [];
		}
		if (!queue.includes(this.instanceId)) {
			queue.push(this.instanceId);
			await jsonfile.writeFile(this.queueFile, queue, { spaces: 2 });
		}
	}

	async waitTurn() {
		// Initial check in case we're already at the front
		try {
			const queue = await jsonfile.readFile(this.queueFile);
			if (queue[0] === this.instanceId) return;
		} catch (_) {
			// ignore
		}

		console.log("[HandBrake] Waiting for turn in queue...");
		// Use Deno's file watcher to wait for changes
		for await (const event of Deno.watchFs(this.queueFile)) {
			if (event.kind === "modify" || event.kind === "create") {
				try {
					const queue = await jsonfile.readFile(this.queueFile);
					if (queue[0] === this.instanceId) break;
					console.log("[HandBrake] Still wating in queue");
				} catch (_) {
					// ignore
				}
			}
		}
	}

	async leave() {
		let queue: string[] = [];
		try {
			queue = await jsonfile.readFile(this.queueFile);
			const idx = queue.indexOf(this.instanceId);
			if (idx !== -1) {
				queue.splice(idx, 1);
				await jsonfile.writeFile(this.queueFile, queue, { spaces: 2 });
			}
		} catch (_) {
			// ignore
		}
	}
}
