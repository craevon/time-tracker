import { BrowserWindow, defineElectrobunRPC, Updater } from "electrobun/bun";
import type { TimeTrackerRPC } from "./rpc";
import {
	getActivities,
	createActivity,
	updateActivity,
	deleteActivity,
	reorderActivities,
	startSession,
	stopSession,
	getSessions,
	deleteSession,
	getRunningSession,
} from "./db";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log("Vite dev server not running. Run 'bun run dev:hmr' for HMR support.");
		}
	}
	return "views://mainview/index.html";
}

const url = await getMainViewUrl();

// ---- RPC handlers (bun side) ----
const rpc = defineElectrobunRPC<TimeTrackerRPC>("bun", {
	maxRequestTime: 5000,
	handlers: {
		requests: {
			getActivities: () => getActivities(),
			createActivity: ({ name, color, icon }) => createActivity(name, color, icon),
			updateActivity: ({ id, name, color, icon, position }) =>
				updateActivity(id, name, color, icon, position),
			deleteActivity: ({ id }) => deleteActivity(id),
			reorderActivities: ({ ids }) => reorderActivities(ids),
			startSession: ({ activityId }) => startSession(activityId),
			stopSession: ({ sessionId }) => stopSession(sessionId),
			getSessions: (params) => getSessions(params?.activityId, params?.limit),
			deleteSession: ({ id }) => deleteSession(id),
			getRunningSession: () => getRunningSession(),
		},
	},
});

// ---- Create main window ----
const mainWindow = new BrowserWindow<typeof rpc>({
	title: "Time Tracker",
	url,
	frame: {
		width: 920,
		height: 680,
		x: 200,
		y: 100,
	},
	rpc,
});

console.log("Time Tracker started! Window id:", mainWindow.id);
