import { useEffect, useState } from "react";
import { rpc } from "../lib/rpc";
import type { Session } from "../lib/rpc";

function formatDuration(seconds: number | null): string {
	if (seconds === null) return "—";
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
	if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
	return `${s}s`;
}

function formatDate(iso: string): string {
	return new Date(iso + "Z").toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function groupByDate(sessions: Session[]): [string, Session[]][] {
	const groups: Record<string, Session[]> = {};
	for (const s of sessions) {
		const day = new Date(s.started_at + "Z").toLocaleDateString(undefined, {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		if (!groups[day]) groups[day] = [];
		groups[day].push(s);
	}
	return Object.entries(groups);
}

export default function HistoryPanel() {
	const [sessions, setSessions] = useState<Session[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<"all" | "today" | "week">("all");

	const loadSessions = async () => {
		setLoading(true);
		const data = await rpc.request("getSessions", { limit: 200 });
		setSessions(data);
		setLoading(false);
	};

	useEffect(() => {
		loadSessions();
	}, []);

	const filteredSessions = sessions.filter((s) => {
		if (filter === "all") return true;
		const started = new Date(s.started_at + "Z");
		const now = new Date();
		if (filter === "today") {
			return started.toDateString() === now.toDateString();
		}
		if (filter === "week") {
			const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
			return started >= weekAgo;
		}
		return true;
	});

	const grouped = groupByDate(filteredSessions);

	// Compute total tracked time
	const totalSeconds = filteredSessions.reduce(
		(sum, s) => sum + (s.duration_seconds ?? 0),
		0,
	);

	const handleDelete = async (id: number) => {
		await rpc.request("deleteSession", { id });
		setSessions((prev) => prev.filter((s) => s.id !== id));
	};

	return (
		<div className="flex flex-col flex-1 overflow-hidden">
			{/* Toolbar */}
			<div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-gray-900/50">
				<div className="flex items-center gap-2">
					{(["all", "today", "week"] as const).map((f) => (
						<button
							key={f}
							id={`history-filter-${f}`}
							onClick={() => setFilter(f)}
							className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
								filter === f
									? "bg-violet-600 text-white"
									: "text-gray-400 hover:text-white hover:bg-white/10"
							}`}
						>
							{f.charAt(0).toUpperCase() + f.slice(1)}
						</button>
					))}
				</div>

				<div className="flex items-center gap-4">
					<span className="text-xs text-gray-500">
						Total: <span className="text-violet-300 font-mono font-medium">{formatDuration(totalSeconds)}</span>
					</span>
					<button
						onClick={loadSessions}
						className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
					>
						↻ Refresh
					</button>
				</div>
			</div>

			{/* Session list */}
			<div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
				{loading ? (
					<div className="flex items-center justify-center h-40">
						<div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
					</div>
				) : grouped.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
						<div className="text-4xl opacity-30">📋</div>
						<p className="text-gray-500 text-sm">No sessions recorded yet</p>
					</div>
				) : (
					grouped.map(([day, daySessions]) => (
						<div key={day}>
							<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
								{day}
							</h3>
							<div className="space-y-2">
								{daySessions.map((session) => (
									<div
										key={session.id}
										id={`session-${session.id}`}
										className="group flex items-center gap-3 bg-gray-800/60 hover:bg-gray-800/90 border border-white/5 rounded-xl px-4 py-3 transition-all"
									>
										<div
											className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
											style={{ background: `${session.activity_color}25`, border: `1px solid ${session.activity_color}40` }}
										>
											{session.activity_icon}
										</div>

										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-white truncate">
												{session.activity_name}
											</p>
											<p className="text-xs text-gray-500">
												{formatDate(session.started_at)}
												{session.ended_at ? ` – ${new Date(session.ended_at + "Z").toLocaleTimeString(undefined, { timeStyle: "short" })}` : " (running)"}
											</p>
										</div>

										<div className="text-right flex-shrink-0">
											{session.ended_at ? (
												<span className="font-mono text-sm font-semibold text-violet-300">
													{formatDuration(session.duration_seconds)}
												</span>
											) : (
												<span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
													<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
													Running
												</span>
											)}
										</div>

										<button
											onClick={() => handleDelete(session.id)}
											className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all ml-1 p-1 rounded"
											title="Delete session"
										>
											✕
										</button>
									</div>
								))}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
