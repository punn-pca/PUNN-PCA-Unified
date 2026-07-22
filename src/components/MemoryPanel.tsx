import { useState } from "react";
import { 
  Brain, 
  Trash2, 
  Plus, 
  Search, 
  Clock, 
  Sliders, 
  X,
  PlusCircle,
  HelpCircle
} from "lucide-react";

interface MemoryItem {
  content: string;
  layer: string;
  source: string;
  confidence: number;
  context?: Record<string, string>;
  created_at: string;
}

interface MemoryPanelProps {
  isDarkMode: boolean;
  memories: MemoryItem[];
  onClose: () => void;
  onAddMemory: (content: string, layer: string) => Promise<void>;
  onDeleteMemory: (content: string) => Promise<void>;
  onClearAllMemories: () => void;
}

const LAYER_METADATA: Record<string, { label: string; color: string; desc: string }> = {
  working: {
    label: "Working",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    desc: "ความจำชั่วคราวระหว่างการคิดวิเคราะห์ในเซสชันปัจจุบัน",
  },
  session: {
    label: "Session",
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    desc: "ข้อมูลและบริบทของบทสนทนาปัจจุบัน",
  },
  project: {
    label: "Project Goals",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    desc: "เป้าหมาย ระยะยาว และขอบเขตโปรเจกต์ที่ผู้ใช้ต้องการวิเคราะห์",
  },
  semantic: {
    label: "User Preferences",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    desc: "ความชอบ ค่านิยม และเป้าหมายชีวิตคงที่ของผู้ใช้ (Human Model)",
  },
  procedural: {
    label: "Procedural",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    desc: "วิธีการ กระบวนการคิด หรือเงื่อนไขในการช่วยตัดสินใจ",
  },
  reflective: {
    label: "Reflective Decisions",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    desc: "บทเรียนและการตัดสินใจในอดีตที่ระบบสรุปและเรียนรู้ร่วมกัน",
  },
};

export default function MemoryPanel({
  isDarkMode,
  memories,
  onClose,
  onAddMemory,
  onDeleteMemory,
  onClearAllMemories,
}: MemoryPanelProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedLayerFilter, setSelectedLayerFilter] = useState<string>("all");
  const [newContent, setNewContent] = useState("");
  const [newLayer, setNewLayer] = useState("semantic");
  const [isAdding, setIsAdding] = useState(false);
  const [hoveredLayerDesc, setHoveredLayerDesc] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    await onAddMemory(newContent, newLayer);
    setNewContent("");
    setIsAdding(false);
  };

  const filteredMemories = memories.filter((item) => {
    const matchesSearch = item.content.toLowerCase().includes(searchText.toLowerCase());
    const matchesLayer = selectedLayerFilter === "all" || item.layer === selectedLayerFilter;
    return matchesSearch && matchesLayer;
  });

  return (
    <aside className={`absolute lg:relative top-0 bottom-0 right-0 z-40 w-full max-w-full sm:w-96 border-l flex flex-col h-full transition-all duration-300 shrink-0 ${
      isDarkMode ? "bg-[#131314] border-[#2d2f31] text-gray-200" : "bg-white border-gray-200 text-gray-800"
    }`}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between shrink-0 border-gray-200 dark:border-[#2d2f31]">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-500 animate-pulse" />
          <div>
            <h3 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              คลังความจำสะสม (Cognitive Memory)
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">PUNN PERSISTENT LAYER</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDarkMode ? "hover:bg-[#2d2f31] text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
          }`}
          title="ปิดหน้าต่างความจำ"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Toggle add memory form button */}
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold rounded-xl transition-all border border-dashed cursor-pointer ${
              isDarkMode 
                ? "border-[#2d2f31] hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-400" 
                : "border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-blue-600"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>ป้อนเป้าหมาย/พฤติกรรมผู้ใช้ใหม่ (Add Custom Model)</span>
          </button>
        ) : (
          <form onSubmit={handleSubmit} className={`p-4 rounded-xl border space-y-3.5 animate-fadeIn ${
            isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>จำข้อมูลใหม่ (Human Model Characteristic)</span>
              </span>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="text-[10px] text-gray-400 hover:text-gray-200"
              >
                ยกเลิก
              </button>
            </div>

            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="เช่น 'เป้าหมายระยะยาวของฉันคือการซื้อคอนโดหลังแรก' หรือ 'ฉันเป็นคนให้ความสำคัญกับความปลอดภัยทางการเงินสูงมาก'"
              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[60px] ${
                isDarkMode ? "bg-[#131314] border-[#2d2f31] text-white" : "bg-white border-gray-300"
              }`}
              required
            />

            <div className="flex items-center gap-2.5">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">ประเภทชั้นความจำ</label>
                <select
                  value={newLayer}
                  onChange={(e) => setNewLayer(e.target.value)}
                  className={`w-full border rounded-lg p-1.5 text-xs focus:outline-none ${
                    isDarkMode ? "bg-[#131314] border-[#2d2f31] text-white" : "bg-white border-gray-300"
                  }`}
                >
                  <option value="semantic">User Preference (ความชอบค่านิยม)</option>
                  <option value="project">Project Goals (ขอบเขตเป้าหมาย)</option>
                  <option value="reflective">Reflective Decisions (ประวัติข้อคิด)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!newContent.trim()}
                className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer self-end ${
                  !newContent.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                บันทึกความจำ
              </button>
            </div>
          </form>
        )}

        {/* Search & Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ค้นหาข้อมูลหรือความจำสะสม..."
              className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                isDarkMode 
                  ? "bg-[#1e1f20] border-[#2d2f31] text-white placeholder-gray-500" 
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
              }`}
            />
          </div>

          {/* Quick filter tabs */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedLayerFilter("all")}
              className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                selectedLayerFilter === "all"
                  ? "bg-blue-600 text-white border-blue-600"
                  : isDarkMode
                    ? "bg-[#1e1f20] border-[#2d2f31] hover:bg-[#252728]"
                    : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              ทั้งหมด ({memories.length})
            </button>
            {Object.keys(LAYER_METADATA).map((layerKey) => {
              const count = memories.filter((m) => m.layer === layerKey).length;
              if (count === 0 && layerKey !== "semantic" && layerKey !== "project") return null;
              
              const meta = LAYER_METADATA[layerKey];
              const isSelected = selectedLayerFilter === layerKey;

              return (
                <button
                  key={layerKey}
                  onClick={() => setSelectedLayerFilter(layerKey)}
                  onMouseEnter={() => setHoveredLayerDesc(meta.desc)}
                  onMouseLeave={() => setHoveredLayerDesc(null)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : isDarkMode
                        ? "bg-[#1e1f20] border-[#2d2f31] hover:bg-[#252728]"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span>{meta.label}</span>
                  <span className={`px-1 rounded-sm text-[8px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-gray-500/10 text-gray-400"
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Layer Explanations Alert */}
          {hoveredLayerDesc && (
            <div className={`p-2 rounded-lg text-[9px] animate-fadeIn leading-relaxed border ${
              isDarkMode ? "bg-[#1e1f20] border-blue-500/20 text-blue-300" : "bg-blue-50 border-blue-100 text-blue-800"
            }`}>
              💡 {hoveredLayerDesc}
            </div>
          )}
        </div>

        {/* Memory Items List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <span>รายการความจำที่ตรงเงื่อนไข ({filteredMemories.length})</span>
            <span className="text-[9px] text-blue-500 font-mono">SPEC 16 COMPLIANT</span>
          </div>

          {filteredMemories.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center space-y-2 ${
              isDarkMode ? "bg-[#1e1f20]/30 border-[#2d2f31]/60" : "bg-gray-50/60 border-gray-100"
            }`}>
              <Sliders className="w-8 h-8 text-gray-400 mx-auto opacity-40" />
              <p className="text-xs text-gray-400">ไม่พบข้อมูลความจำใด ๆ ในเซคชั่นนี้</p>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                ลองเริ่มบทสนทนาวิเคราะห์เรื่องต่าง ๆ เพื่อให้ระบบจดจำบริบทของคุณข้ามเซสชัน หรือเพิ่มความจำด้วยตนเองด้านบน
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMemories.map((item, idx) => {
                const meta = LAYER_METADATA[item.layer] || { label: item.layer, color: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
                const thaiDate = new Date(item.created_at).toLocaleDateString("th-TH", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <div
                    key={idx}
                    className={`p-3.5 border rounded-xl space-y-2 transition-all hover:scale-[1.005] group ${
                      isDarkMode ? "bg-[#1e1f20] border-[#2d2f31] hover:border-blue-500/20" : "bg-white border-gray-200 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${meta.color}`}>
                        {meta.label}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-gray-400 flex items-center gap-1 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          {thaiDate}
                        </span>

                        <button
                          onClick={() => onDeleteMemory(item.content)}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-gray-400 hover:text-rose-500 rounded transition-all cursor-pointer"
                          title="ลืมข้อมูลนี้ (Responsible Forgetting)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                      {item.content}
                    </p>

                    <div className="pt-1 flex items-center gap-2 justify-between">
                      <span className="text-[9px] text-gray-400 font-mono">
                        Source: <span className="font-semibold text-gray-400 dark:text-gray-300">{item.source}</span>
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-gray-500 font-mono">Confidence</span>
                        <div className="w-10 bg-gray-200 dark:bg-[#2d2f31] h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full" 
                            style={{ width: `${item.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Persistent Footer with Clear Action */}
      {memories.length > 0 && (
        <div className={`p-4 border-t shrink-0 flex items-center justify-between ${
          isDarkMode ? "bg-[#131314]/80 border-[#2d2f31]" : "bg-gray-50 border-gray-200"
        }`}>
          <div className="text-[10px] text-gray-400 leading-tight">
            <span>ความจำสะสมรวม: <strong>{memories.length} รายการ</strong></span>
          </div>

          <button
            onClick={onClearAllMemories}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isDarkMode 
                ? "bg-transparent border-[#2d2f31] hover:bg-rose-500/10 text-rose-400 hover:border-rose-500/20" 
                : "bg-white border-rose-100 hover:bg-rose-50 text-rose-600"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ล้างความจำทั้งหมด</span>
          </button>
        </div>
      )}
    </aside>
  );
}
