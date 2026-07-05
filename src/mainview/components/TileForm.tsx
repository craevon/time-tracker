import { useEffect, useState } from "react";
import type { Activity } from "../lib/rpc";

const ICON_OPTIONS = [
	"⏱", "💻", "📖", "✍️", "🎨", "🔧", "📞", "🤝", "🧠", "🏃",
	"🍕", "☕", "🎯", "📊", "🔬", "🎵", "💡", "🚀", "🌐", "🎮",
];

const COLOR_OPTIONS = [
	"#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
	"#f97316", "#eab308", "#22c55e", "#14b8a6",
	"#3b82f6", "#06b6d4", "#84cc16", "#a855f7",
];

interface TileFormProps {
	initial?: Partial<Activity>;
	onSave: (data: { name: string; color: string; icon: string }) => Promise<void>;
	onCancel: () => void;
}

export default function TileForm({ initial, onSave, onCancel }: TileFormProps) {
	const [name, setName] = useState(initial?.name ?? "");
	const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0]);
	const [icon, setIcon] = useState(initial?.icon ?? ICON_OPTIONS[0]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setError("Name is required");
			return;
		}
		setSaving(true);
		setError("");
		try {
			await onSave({ name: name.trim(), color, icon });
		} catch (err) {
			setError(String(err));
		} finally {
			setSaving(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="bg-gray-800/90 border border-white/10 rounded-2xl p-5 space-y-4"
		>
			<h3 className="text-base font-semibold text-white">
				{initial?.id ? "Edit Activity" : "New Activity"}
			</h3>

			{/* Preview */}
			<div className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/50 border border-white/5">
				<div
					className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
					style={{ background: `${color}25`, border: `1px solid ${color}55` }}
				>
					{icon}
				</div>
				<span className="text-white text-sm font-medium">{name || "Activity name"}</span>
			</div>

			{/* Name */}
			<div>
				<label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
				<input
					id="tile-form-name"
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. Deep Work"
					maxLength={50}
					className="w-full bg-gray-900/70 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
				/>
				{error && <p className="text-red-400 text-xs mt-1">{error}</p>}
			</div>

			{/* Icon picker */}
			<div>
				<label className="block text-xs font-medium text-gray-400 mb-2">Icon</label>
				<div className="grid grid-cols-10 gap-1.5">
					{ICON_OPTIONS.map((ic) => (
						<button
							key={ic}
							type="button"
							onClick={() => setIcon(ic)}
							className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
								icon === ic
									? "ring-2 ring-violet-500 bg-violet-500/20"
									: "hover:bg-white/10"
							}`}
						>
							{ic}
						</button>
					))}
				</div>
			</div>

			{/* Color picker */}
			<div>
				<label className="block text-xs font-medium text-gray-400 mb-2">Color</label>
				<div className="flex flex-wrap gap-2">
					{COLOR_OPTIONS.map((c) => (
						<button
							key={c}
							type="button"
							onClick={() => setColor(c)}
							className={`w-7 h-7 rounded-lg transition-all ${
								color === c ? "scale-125 ring-2 ring-white/50" : "hover:scale-110"
							}`}
							style={{ background: c }}
						/>
					))}
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-2 pt-1">
				<button
					type="submit"
					disabled={saving}
					id="tile-form-save"
					className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-all"
				>
					{saving ? "Saving…" : "Save"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-all"
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
