import { createRPC, Electroview } from "electrobun/view";
import type { TimeTrackerRPC } from "../../bun/rpc";

// Create an RPC instance for webview→bun calls
export const rpc = createRPC<
	TimeTrackerRPC["webview"],
	TimeTrackerRPC["bun"]
>();

// Initialize Electroview – this sets up the WebSocket transport to the Bun process
// and wires it to our rpc instance automatically.
new Electroview({ rpc });

export type Activity = TimeTrackerRPC["bun"]["requests"]["getActivities"]["response"] extends Array<infer T> ? T : never;
export type Session = TimeTrackerRPC["bun"]["requests"]["getSessions"]["response"] extends Array<infer T> ? T : never;
