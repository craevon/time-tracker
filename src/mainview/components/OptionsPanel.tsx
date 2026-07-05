import { useEffect, useState } from "react";
import { rpc } from "../lib/rpc";
import type { Activity } from "../lib/rpc";
import TileForm from "./TileForm";

interface OptionsPanelProps {
	onActivitiesChanged: () => void;
}

export default function OptionsPanel({ onActivitiesChanged }: OptionsPanelProps) {
	const [activities, setActivities] = useState<Activity[]>([]);
	const [showForm, setShowForm] = useState<"new" | number | null>(null);
	const [loading, setLoading] = useState(true);

	const load = async () => {
		setLoading(true);
		const data = await rpc.request("getActivities");
		setActivities(data);
		setLoading(false);
	};

	useEffect(() => {
		load();
	}, []);

	const handleCreate = async (data: { name: string; color: string; icon: string }) => {
		await rpc.request("createActivity", data);
		await load();
		onActivitiesChanged();
		setShowForm(null);
	};

	const handleUpdate = async (
		id: number,
		data: { name: string; color: string; icon: string },
	) => {
		await rpc.request("updateActivity", { id, ...data });
		await load();
		onActivitiesChanged();
		setShowForm(null);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Delete this activity and all its sessions?")) return;
		await rpc.request("deleteActivity", { id });
		await load();
		onActivitiesChanged();
	};

	const handleMoveUp = async (idx: number) => {
		if (idx === 0) return;
		const newOrder = [...activities];
		[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
		setActivities(newOrder);
		await rpc.request("reorderActivities", { ids: newOrder.map((a) => a.id) });
		onActivitiesChanged();
	};

	const handleMoveDown = async (idx: number) => {
		if (idx === activities.length - 1) return;
		const newOrder = [...activities];
		[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
		setActivities(newOrder);
		await rpc.request("reorderActivities", { ids: newOrder.map((a) => a.id) });
		onActivitiesChanged();
	};

	return (
		<div className="flex flex-col flex-1 overflow-hidden">
			{/* Toolbar */}
			<div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-gray-900/50">
				<h2 className="text-sm font-semibold text-gray-300">Manage Activities</h2>
				<button
					id="add-activity-btn"
					onClick={() => setShowForm("new")}
					className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-violet-500/20"
				>
					+ Add Activity
				</button>
			</div>

			<div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
				{/* New form */}
				{showForm === "new" && (
					<TileForm
						onSave={handleCreate}
						onCancel={() => setShowForm(null)}
					/>
				)}

				{loading ? (
					<div className="flex items-center justify-center h-40">
						<div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
					</div>
				) : activities.length === 0 && showForm !== "new" ? (
					<div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
						<div className="text-4xl opacity-30">⚙️</div>
						<p className="text-gray-500 text-sm">No activities yet. Click "+ Add Activity" to get started.</p>
					</div>
				) : (
					activities.map((activity, idx) => (
						<div key={activity.id} className="group">
							{showForm === activity.id ? (
								<TileForm
									initial={activity}
									onSave={(data) => handleUpdate(activity.id, data)}
									onCancel={() => setShowForm(null)}
								/>
							) : (
								<div className="flex items-center gap-3 bg-gray-800/60 border border-white/5 rounded-xl px-4 py-3 hover:bg-gray-800/90 transition-all">
									{/* Reorder arrows */}
									<div className="flex flex-col gap-0.5">
										<button
											onClick={() => handleMoveUp(idx)}
											disabled={idx === 0}
											className="text-gray-600 hover:text-gray-300 disabled:opacity-20 text-xs leading-none p-0.5 transition-colors"
											title="Move up"
										>
											▲
										</button>
										<button
											onClick={() => handleMoveDown(idx)}
											disabled={idx === activities.length - 1}
											className="text-gray-600 hover:text-gray-300 disabled:opacity-20 text-xs leading-none p-0.5 transition-colors"
											title="Move down"
										>
											▼
										</button>
									</div>

									{/* Icon */}
									<div
										className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
										style={{
											background: `${activity.color}25`,
											border: `1px solid ${activity.color}40`,
										}}
									>
										{activity.icon}
									</div>

									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-white">{activity.name}</p>
										<p className="text-xs text-gray-600">
											Added {new Date(activity.created_at + "Z").toLocaleDateString()}
										</p>
									</div>

									{/* Color dot */}
									<div
										className="w-3 h-3 rounded-full flex-shrink-0"
										style={{ background: activity.color }}
									/>

									<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
										<button
											id={`edit-activity-${activity.id}`}
											onClick={() => setShowForm(activity.id)}
											className="text-xs text-gray-400 hover:text-violet-400 px-2 py-1 rounded-lg hover:bg-violet-500/10 transition-all"
										>
											Edit
										</button>
										<button
											id={`delete-activity-${activity.id}`}
											onClick={() => handleDelete(activity.id)}
											className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
										>
											Delete
										</button>
									</div>
								</div>
							)}
						</div>
					))
				)}
			</div>
		</div>
	);
}
