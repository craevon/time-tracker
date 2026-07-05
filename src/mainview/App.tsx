import { useEffect, useState, useCallback } from "react";
import { rpc } from "./lib/rpc";
import type { Activity, Session } from "./lib/rpc";
import Header from "./components/Header";
import TileGrid from "./components/TileGrid";
import HistoryPanel from "./components/HistoryPanel";
import OptionsPanel from "./components/OptionsPanel";

type View = "tracker" | "history" | "options";

export default function App() {
	const [view, setView] = useState<View>("tracker");
	const [activities, setActivities] = useState<Activity[]>([]);
	const [runningSession, setRunningSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	// Load activities and running session
	const loadData = useCallback(async () => {
		const [acts, running] = await Promise.all([
			rpc.request("getActivities"),
			rpc.request("getRunningSession"),
		]);
		setActivities(acts);
		setRunningSession(running);
		setLoading(false);
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleStart = async (activity: Activity) => {
		try {
			const session = await rpc.request("startSession", {
				activityId: activity.id,
			});
			setRunningSession(session);
		} catch (err) {
			console.error("Failed to start session:", err);
		}
	};

	const handleStop = async (session: Session) => {
		try {
			await rpc.request("stopSession", { sessionId: session.id });
			setRunningSession(null);
		} catch (err) {
			console.error("Failed to stop session:", err);
		}
	};

	const handleActivitiesChanged = useCallback(() => {
		loadData();
	}, [loadData]);

	return (
		<div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
			{/* Subtle background radial gradient */}
			<div
				className="pointer-events-none fixed inset-0 opacity-30"
				style={{
					background:
						"radial-gradient(ellipse 80% 60% at 50% -20%, #6366f140 0%, transparent 70%)",
				}}
			/>

			<Header
				activeView={view}
				onNavigate={setView}
				runningActivityName={runningSession?.activity_name}
			/>

			<main className="flex flex-col flex-1 overflow-hidden relative">
				{loading ? (
					<div className="flex items-center justify-center flex-1">
						<div className="flex flex-col items-center gap-3">
							<div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
							<p className="text-gray-500 text-sm">Loading…</p>
						</div>
					</div>
				) : (
					<>
						{/* Tracker view */}
						<div className={`flex flex-col flex-1 overflow-hidden transition-all duration-200 ${view === "tracker" ? "block" : "hidden"}`}>
							{runningSession && (
								<div
									className="mx-6 mt-4 px-4 py-3 rounded-xl border flex items-center gap-3"
									style={{
										background: `${runningSession.activity_color}15`,
										borderColor: `${runningSession.activity_color}40`,
									}}
								>
									<span className="text-lg">{runningSession.activity_icon}</span>
									<div className="flex-1">
										<p className="text-sm font-semibold text-white">
											Tracking: {runningSession.activity_name}
										</p>
										<p className="text-xs text-gray-400">
											Started {new Date(runningSession.started_at + "Z").toLocaleTimeString(undefined, { timeStyle: "short" })}
										</p>
									</div>
									<button
										id="stop-current-session"
										onClick={() => handleStop(runningSession)}
										className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs font-semibold transition-all"
									>
										Stop ■
									</button>
								</div>
							)}

							<TileGrid
								activities={activities}
								runningSession={runningSession}
								onStart={handleStart}
								onStop={handleStop}
							/>
						</div>

						{/* History view */}
						<div className={`flex flex-col flex-1 overflow-hidden ${view === "history" ? "block" : "hidden"}`}>
							<HistoryPanel />
						</div>

						{/* Options view */}
						<div className={`flex flex-col flex-1 overflow-hidden ${view === "options" ? "block" : "hidden"}`}>
							<OptionsPanel onActivitiesChanged={handleActivitiesChanged} />
						</div>
					</>
				)}
			</main>
		</div>
	);
}
