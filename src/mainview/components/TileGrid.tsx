import type { Activity, Session } from "../lib/rpc";
import Tile from "./Tile";

interface TileGridProps {
	activities: Activity[];
	runningSession: Session | null;
	onStart: (activity: Activity) => void;
	onStop: (session: Session) => void;
}

export default function TileGrid({
	activities,
	runningSession,
	onStart,
	onStop,
}: TileGridProps) {
	if (activities.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-8">
				<div className="text-6xl opacity-30">⏱</div>
				<h2 className="text-xl font-semibold text-gray-400">No activities yet</h2>
				<p className="text-gray-500 text-sm max-w-xs">
					Go to <strong className="text-violet-400">Settings</strong> to add your first activity, then come back here to start tracking.
				</p>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto p-6">
			<div
				className="grid gap-4"
				style={{
					gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
				}}
			>
				{activities.map((activity) => (
					<Tile
						key={activity.id}
						activity={activity}
						runningSession={runningSession}
						onStart={onStart}
						onStop={onStop}
					/>
				))}
			</div>
		</div>
	);
}
