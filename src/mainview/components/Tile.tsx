import { useEffect, useRef, useState } from "react";
import type { Activity, Session } from "../lib/rpc";

interface TileProps {
	activity: Activity;
	runningSession: Session | null;
	onStart: (activity: Activity) => void;
	onStop: (session: Session) => void;
}

function formatElapsed(startedAt: string): string {
	const elapsed = Math.floor(
		(Date.now() - new Date(startedAt + "Z").getTime()) / 1000,
	);
	const h = Math.floor(elapsed / 3600);
	const m = Math.floor((elapsed % 3600) / 60);
	const s = elapsed % 60;
	if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
	if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
	return `${s}s`;
}

export default function Tile({ activity, runningSession, onStart, onStop }: TileProps) {
	const isRunning =
		runningSession?.activity_id === activity.id;
	const [elapsed, setElapsed] = useState("");
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (isRunning && runningSession) {
			setElapsed(formatElapsed(runningSession.started_at));
			intervalRef.current = setInterval(() => {
				setElapsed(formatElapsed(runningSession.started_at));
			}, 1000);
		} else {
			setElapsed("");
			if (intervalRef.current) clearInterval(intervalRef.current);
		}
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [isRunning, runningSession]);

	const handleClick = () => {
		if (isRunning && runningSession) {
			onStop(runningSession);
		} else {
			onStart(activity);
		}
	};

	// Derive a lighter bg color from the hex color for gradient
	const color = activity.color;

	return (
		<button
			id={`tile-${activity.id}`}
			onClick={handleClick}
			className={`
				relative group flex flex-col items-center justify-center gap-2
				rounded-2xl p-5 min-h-[130px] text-center w-full
				transition-all duration-300 border cursor-pointer select-none
				${isRunning
					? "border-2 scale-[1.02] shadow-xl"
					: "border-white/10 hover:border-white/25 hover:scale-[1.01] hover:shadow-lg bg-gray-800/70"
				}
			`}
			style={
				isRunning
					? {
							background: `linear-gradient(135deg, ${color}33 0%, ${color}66 100%)`,
							borderColor: color,
							boxShadow: `0 0 24px ${color}55`,
					  }
					: undefined
			}
		>
			{/* Pulse ring when running */}
			{isRunning && (
				<span
					className="absolute inset-0 rounded-2xl animate-ping opacity-20"
					style={{ background: color }}
				/>
			)}

			<div
				className="text-3xl w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-110"
				style={{ background: `${color}30`, border: `1px solid ${color}55` }}
			>
				{activity.icon}
			</div>

			<span className="text-sm font-semibold text-white leading-tight line-clamp-2">
				{activity.name}
			</span>

			{isRunning ? (
				<div className="flex flex-col items-center gap-0.5">
					<span className="text-xs font-mono font-bold" style={{ color }}>
						{elapsed}
					</span>
					<span className="text-xs text-red-400 font-medium">Stop ■</span>
				</div>
			) : (
				<span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
					Tap to start ▶
				</span>
			)}
		</button>
	);
}
