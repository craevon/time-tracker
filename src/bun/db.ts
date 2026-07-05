import { Database } from "bun:sqlite";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";

// Persist database in user app data or next to the executable
const DATA_DIR = join(process.env.APPDATA ?? process.env.HOME ?? ".", "TimeTracker");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = join(DATA_DIR, "timetracker.db");
console.log("[DB] Database path:", DB_PATH);

export const db = new Database(DB_PATH, { create: true });

// Enable WAL mode for better performance
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

// ---- Schema ----
db.run(`
  CREATE TABLE IF NOT EXISTS activities (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    color      TEXT    NOT NULL DEFAULT '#6366f1',
    icon       TEXT    NOT NULL DEFAULT '⏱',
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    started_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    ended_at    TEXT,
    notes       TEXT    NOT NULL DEFAULT ''
  )
`);

// ---- Types ----
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

// ---- Activity Queries ----

export function getActivities(): Activity[] {
	return db
		.query<Activity, []>("SELECT * FROM activities ORDER BY position ASC, id ASC")
		.all();
}

export function createActivity(name: string, color: string, icon: string): Activity {
	const maxPos = db
		.query<{ pos: number }, []>("SELECT COALESCE(MAX(position), -1) as pos FROM activities")
		.get();
	const position = (maxPos?.pos ?? -1) + 1;

	const result = db
		.query<Activity, [string, string, string, number]>(
			"INSERT INTO activities (name, color, icon, position) VALUES (?, ?, ?, ?) RETURNING *",
		)
		.get(name, color, icon, position);

	if (!result) throw new Error("Failed to create activity");
	return result;
}

export function updateActivity(
	id: number,
	name: string,
	color: string,
	icon: string,
	position?: number,
): Activity {
	const result =
		position !== undefined
			? db
					.query<Activity, [string, string, string, number, number]>(
						"UPDATE activities SET name=?, color=?, icon=?, position=? WHERE id=? RETURNING *",
					)
					.get(name, color, icon, position, id)
			: db
					.query<Activity, [string, string, string, number]>(
						"UPDATE activities SET name=?, color=?, icon=? WHERE id=? RETURNING *",
					)
					.get(name, color, icon, id);

	if (!result) throw new Error(`Activity ${id} not found`);
	return result;
}

export function deleteActivity(id: number): void {
	db.run("DELETE FROM activities WHERE id = ?", [id]);
}

export function reorderActivities(ids: number[]): void {
	const update = db.prepare("UPDATE activities SET position=? WHERE id=?");
	const reorder = db.transaction((orderedIds: number[]) => {
		orderedIds.forEach((id, idx) => update.run(idx, id));
	});
	reorder(ids);
}

// ---- Session Queries ----

export function getRunningSession(): Session | null {
	return db
		.query<Session, []>(
			`SELECT s.*, a.name as activity_name, a.color as activity_color, a.icon as activity_icon,
             NULL as duration_seconds
      FROM sessions s
      JOIN activities a ON a.id = s.activity_id
      WHERE s.ended_at IS NULL
      ORDER BY s.started_at DESC
      LIMIT 1`,
		)
		.get() ?? null;
}

export function startSession(activityId: number): Session {
	// Stop any currently running session first
	db.run(
		"UPDATE sessions SET ended_at = datetime('now') WHERE ended_at IS NULL",
	);

	const result = db
		.query<Session, [number]>(
			`INSERT INTO sessions (activity_id) VALUES (?) RETURNING *`,
		)
		.get(activityId);

	if (!result) throw new Error("Failed to start session");

	// Return with joined activity data
	const session = db
		.query<Session, [number]>(
			`SELECT s.*, a.name as activity_name, a.color as activity_color, a.icon as activity_icon,
             NULL as duration_seconds
      FROM sessions s
      JOIN activities a ON a.id = s.activity_id
      WHERE s.id = ?`,
		)
		.get(result.id);

	if (!session) throw new Error("Failed to retrieve started session");
	return session;
}

export function stopSession(sessionId: number): Session {
	db.run(
		"UPDATE sessions SET ended_at = datetime('now') WHERE id = ? AND ended_at IS NULL",
		[sessionId],
	);

	const session = db
		.query<Session, [number]>(
			`SELECT s.*, a.name as activity_name, a.color as activity_color, a.icon as activity_icon,
             CAST((julianday(s.ended_at) - julianday(s.started_at)) * 86400 AS INTEGER) as duration_seconds
      FROM sessions s
      JOIN activities a ON a.id = s.activity_id
      WHERE s.id = ?`,
		)
		.get(sessionId);

	if (!session) throw new Error(`Session ${sessionId} not found`);
	return session;
}

export function getSessions(activityId?: number, limit = 100): Session[] {
	if (activityId !== undefined) {
		return db
			.query<Session, [number, number]>(
				`SELECT s.*, a.name as activity_name, a.color as activity_color, a.icon as activity_icon,
               CASE WHEN s.ended_at IS NOT NULL
                 THEN CAST((julianday(s.ended_at) - julianday(s.started_at)) * 86400 AS INTEGER)
                 ELSE NULL END as duration_seconds
        FROM sessions s
        JOIN activities a ON a.id = s.activity_id
        WHERE s.activity_id = ?
        ORDER BY s.started_at DESC
        LIMIT ?`,
			)
			.all(activityId, limit);
	}

	return db
		.query<Session, [number]>(
			`SELECT s.*, a.name as activity_name, a.color as activity_color, a.icon as activity_icon,
             CASE WHEN s.ended_at IS NOT NULL
               THEN CAST((julianday(s.ended_at) - julianday(s.started_at)) * 86400 AS INTEGER)
               ELSE NULL END as duration_seconds
      FROM sessions s
      JOIN activities a ON a.id = s.activity_id
      ORDER BY s.started_at DESC
      LIMIT ?`,
		)
		.all(limit);
}

export function deleteSession(id: number): void {
	db.run("DELETE FROM sessions WHERE id = ?", [id]);
}
