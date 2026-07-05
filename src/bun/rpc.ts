import type { RPCSchema } from "electrobun/bun";

// ---- Shared types used on both sides ----
export type Activity = {
	id: number;
	name: string;
	color: string;
	icon: string;
	position: number;
	created_at: string;
};

export type Session = {
	id: number;
	activity_id: number;
	activity_name: string;
	activity_color: string;
	activity_icon: string;
	started_at: string;
	ended_at: string | null;
	notes: string;
	duration_seconds: number | null;
};

// ---- RPC Schema ----

export interface TimeTrackerRPC {
	bun: RPCSchema<{
		requests: {
			// Activities
			getActivities: { params: undefined; response: Activity[] };
			createActivity: {
				params: { name: string; color: string; icon: string };
				response: Activity;
			};
			updateActivity: {
				params: { id: number; name: string; color: string; icon: string; position?: number };
				response: Activity;
			};
			deleteActivity: { params: { id: number }; response: void };
			reorderActivities: { params: { ids: number[] }; response: void };
			// Sessions
			startSession: { params: { activityId: number }; response: Session };
			stopSession: { params: { sessionId: number }; response: Session };
			getSessions: {
				params: { activityId?: number; limit?: number } | undefined;
				response: Session[];
			};
			deleteSession: { params: { id: number }; response: void };
			getRunningSession: { params: undefined; response: Session | null };
		};
	}>;
	webview: RPCSchema<{
		requests: Record<never, never>;
	}>;
}
