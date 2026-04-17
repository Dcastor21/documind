import { Brain, Home, Search, Sparkles, Folder, Plus, Settings } from "lucide-react";
import { FOLDERS } from "@/config/documents";
import type { View } from "@/types/documents";

interface Props {
  view: View;
  onViewChange: (view: View) => void;
  activeFolder: string;
  onFolderSelect: (folder: string) => void;
  analyzedCount: number;
  onUpload: () => void;
}

const NAV_ITEMS: { icon: React.ElementType; label: string; id: View }[] = [
  { icon: Home,     label: "Library",  id: "library"  },
  { icon: Search,   label: "Search",   id: "search"   },
  { icon: Sparkles, label: "Insights", id: "insights" },
];

export function Sidebar({
  view,
  onViewChange,
  activeFolder,
  onFolderSelect,
  analyzedCount,
  onUpload,
}: Props) {
  return (
    <aside className="w-56 bg-slate-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-teal-500 rounded-lg flex items-center justify-center">
            <Brain size={14} className="text-white" />
          </div>
          <span
            className="text-white font-semibold text-sm tracking-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            DocuMind
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              view === item.id
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <item.icon size={15} />
            {item.label}
          </button>
        ))}

        <div className="pt-4 pb-1 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Folders
          </p>
        </div>

        {FOLDERS.slice(1).map((f) => (
          <button
            key={f}
            onClick={() => onFolderSelect(f)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              activeFolder === f && view === "library"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Folder size={14} />
            {f}
          </button>
        ))}
      </nav>

      {/* Upload + user footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-3">
        <button
          onClick={onUpload}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          <Plus size={14} /> Upload Document
        </button>
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-300 text-xs font-medium truncate">My Workspace</p>
            <p className="text-slate-500 text-[10px]">{analyzedCount} docs analyzed</p>
          </div>
          <Settings size={13} className="text-slate-600 shrink-0" />
        </div>
      </div>
    </aside>
  );
}