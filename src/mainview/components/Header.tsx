type View = "tracker" | "history" | "options";

interface HeaderProps {
	activeView: View;
	onNavigate: (view: View) => void;
	runningActivityName?: string;
}

const NAV: { id: View; label: string; icon: string }[] = [
	{ id: "tracker", label: "Tracker", icon: "⏱" },
	{ id: "history", label: "History", icon: "📋" },
	{ id: "options", label: "Settings", icon: "⚙️" },
];

export default function Header({
	activeView,
	onNavigate,
	runningActivityName,
}: HeaderProps) {
	return (
		<header className="flex items-center justify-between px-6 py-3 bg-gray-900/80 backdrop-blur border-b border-white/10">
			<div className="flex items-center gap-3">
				<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-lg shadow-lg">
					⏳
				</div>
				<div>
					<h1 className="text-white font-bold text-lg leading-none">Time Tracker</h1>
					{runningActivityName ? (
						<p className="text-emerald-400 text-xs flex items-center gap-1 mt-0.5">
							<span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
							Tracking: {runningActivityName}
						</p>
					) : (
						<p className="text-gray-500 text-xs mt-0.5">Not tracking</p>
					)}
				</div>
			</div>

			<nav className="flex items-center gap-1 bg-gray-800/60 p-1 rounded-xl border border-white/10">
				{NAV.map((item) => (
					<button
						key={item.id}
						id={`nav-${item.id}`}
						onClick={() => onNavigate(item.id)}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
							activeView === item.id
								? "bg-violet-600 text-white shadow-md shadow-violet-500/30"
								: "text-gray-400 hover:text-white hover:bg-white/10"
						}`}
					>
						<span>{item.icon}</span>
						{item.label}
					</button>
				))}
			</nav>
		</header>
	);
}
