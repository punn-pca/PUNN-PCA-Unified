import React, { useState } from "react";
import {
  GitFork,
  Database,
  BrainCircuit,
  ArrowRight,
  CheckCircle,
  XCircle,
  HelpCircle,
  Layers,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Info,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";

export interface GraphNode {
  id: string;
  type: "problem" | "assumption" | "evidence" | "counter_evidence" | "constraint" | "decision";
  label: string;
  details?: string;
  confidence?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  relationship?: "supports" | "refutes" | "constrains" | "derives_from";
}

export interface ReasoningGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface StrategyOption {
  name: string;
  status: "selected" | "rejected" | "partially_used";
  pros: string;
  cons: string;
  rejectionReason?: string;
}

export interface StrategySelectionData {
  chosenStrategy: string;
  rationale: string;
  consideredStrategies: StrategyOption[];
}

export interface MemoryTraceData {
  memoryId: string;
  createdByStage: string;
  usedInConversations: string[];
  confidenceShift: {
    from: number;
    to: number;
  };
  content: string;
  layer?: string;
}

interface CognitiveOrchestrationViewProps {
  reasoningGraph?: ReasoningGraphData;
  strategySelection?: StrategySelectionData;
  memoryTraces?: MemoryTraceData[];
  isDarkMode?: boolean;
}

export const CognitiveOrchestrationView: React.FC<CognitiveOrchestrationViewProps> = ({
  reasoningGraph,
  strategySelection,
  memoryTraces,
  isDarkMode = true,
}) => {
  const [activeTab, setActiveTab] = useState<"graph" | "memory" | "strategy">("graph");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const getNodeColor = (type: GraphNode["type"]) => {
    switch (type) {
      case "problem":
        return isDarkMode
          ? "border-blue-500/50 bg-blue-500/10 text-blue-300 shadow-blue-500/10"
          : "border-blue-400 bg-blue-50 text-blue-900 shadow-blue-100";
      case "assumption":
        return isDarkMode
          ? "border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-amber-500/10"
          : "border-amber-400 bg-amber-50 text-amber-900 shadow-amber-100";
      case "evidence":
        return isDarkMode
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-emerald-500/10"
          : "border-emerald-400 bg-emerald-50 text-emerald-900 shadow-emerald-100";
      case "counter_evidence":
        return isDarkMode
          ? "border-rose-500/50 bg-rose-500/10 text-rose-300 shadow-rose-500/10"
          : "border-rose-400 bg-rose-50 text-rose-900 shadow-rose-100";
      case "constraint":
        return isDarkMode
          ? "border-purple-500/50 bg-purple-500/10 text-purple-300 shadow-purple-500/10"
          : "border-purple-400 bg-purple-50 text-purple-900 shadow-purple-100";
      case "decision":
        return isDarkMode
          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-indigo-500/10"
          : "border-indigo-400 bg-indigo-50 text-indigo-900 shadow-indigo-100";
      default:
        return isDarkMode
          ? "border-gray-700 bg-gray-800 text-gray-200"
          : "border-gray-200 bg-white text-gray-800";
    }
  };

  const getNodeBadge = (type: GraphNode["type"]) => {
    switch (type) {
      case "problem": return "Problem";
      case "assumption": return "Assumption";
      case "evidence": return "Evidence";
      case "counter_evidence": return "Counter-Evidence";
      case "constraint": return "Constraint";
      case "decision": return "Decision";
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all my-4 shadow-lg ${
        isDarkMode
          ? "border-blue-900/40 bg-[#181a1d] text-gray-200 shadow-black/40"
          : "border-blue-200/80 bg-white text-gray-800 shadow-blue-50/50"
      }`}
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-700/30 dark:border-gray-700/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight">
                PCA Cognitive Orchestration Layer
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Active Graph & Trace Engine
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              โครงสร้างกราฟตรรกะ รอยเท้าหน่วยความจำ และเหตุผลการเลือกกลยุทธ์ของ PCA
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-[#25282c] border border-gray-200 dark:border-gray-700/50 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("graph")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === "graph"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Reasoning Graph</span>
          </button>

          <button
            onClick={() => setActiveTab("memory")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === "memory"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Memory Trace</span>
          </button>

          <button
            onClick={() => setActiveTab("strategy")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === "strategy"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Strategy Selection</span>
          </button>
        </div>
      </div>

      {/* TAB 1: REASONING GRAPH */}
      {activeTab === "graph" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              โครงสร้างแผนผังตรรกะ (Problem ── Assumptions ── Evidence ── Constraint ── Decision)
            </span>
            <span className="text-[11px] opacity-75">คลิกที่ Node เพื่อดูรายละเอียดลึก</span>
          </div>

          {reasoningGraph && reasoningGraph.nodes ? (
            <div className="relative overflow-x-auto p-4 rounded-xl bg-gray-50 dark:bg-[#121316] border border-gray-200 dark:border-gray-800">
              {/* Visual Node Flow Matrix */}
              <div className="min-w-[640px] space-y-4">
                {/* Level 1: Problem */}
                <div className="flex justify-center">
                  {reasoningGraph.nodes
                    .filter((n) => n.type === "problem")
                    .map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`w-full max-w-md p-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.01] shadow-md ${getNodeColor(
                          node.type
                        )}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                            {getNodeBadge(node.type)}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">ID: {node.id}</span>
                        </div>
                        <h4 className="text-sm font-semibold mb-1">{node.label}</h4>
                        <p className="text-xs opacity-90 line-clamp-2">{node.details}</p>
                      </div>
                    ))}
                </div>

                {/* Arrow Connector Down */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-amber-500/80"></div>
                </div>

                {/* Level 2: Assumptions */}
                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {reasoningGraph.nodes
                    .filter((n) => n.type === "assumption")
                    .map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${getNodeColor(
                          node.type
                        )}`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                            {getNodeBadge(node.type)}
                          </span>
                          <span className="text-[10px] font-mono opacity-75">
                            Conf: {Math.round((node.confidence || 0.7) * 100)}%
                          </span>
                        </div>
                        <h5 className="text-xs font-semibold mb-1">{node.label}</h5>
                        <p className="text-[11px] opacity-80 line-clamp-2">{node.details}</p>
                      </div>
                    ))}
                </div>

                {/* Arrow Connector Down */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500 to-emerald-500"></div>
                </div>

                {/* Level 3: Evidence & Counter Evidence */}
                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {reasoningGraph.nodes
                    .filter((n) => n.type === "evidence" || n.type === "counter_evidence")
                    .map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${getNodeColor(
                          node.type
                        )}`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${
                              node.type === "evidence"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {getNodeBadge(node.type)}
                          </span>
                          <span className="text-[10px] font-mono opacity-75">
                            Weight: {Math.round((node.confidence || 0.8) * 100)}%
                          </span>
                        </div>
                        <h5 className="text-xs font-semibold mb-1">{node.label}</h5>
                        <p className="text-[11px] opacity-80 line-clamp-2">{node.details}</p>
                      </div>
                    ))}
                </div>

                {/* Arrow Connector Down */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-purple-500"></div>
                </div>

                {/* Level 4: Constraint */}
                <div className="flex justify-center">
                  {reasoningGraph.nodes
                    .filter((n) => n.type === "constraint")
                    .map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`w-full max-w-md p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] shadow-sm ${getNodeColor(
                          node.type
                        )}`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                            {getNodeBadge(node.type)}
                          </span>
                          <span className="text-[10px] font-mono opacity-75">Constraint Bound</span>
                        </div>
                        <h5 className="text-xs font-semibold mb-1">{node.label}</h5>
                        <p className="text-[11px] opacity-80 line-clamp-2">{node.details}</p>
                      </div>
                    ))}
                </div>

                {/* Arrow Connector Down */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500 to-indigo-500"></div>
                </div>

                {/* Level 5: Decision Node */}
                <div className="flex justify-center">
                  {reasoningGraph.nodes
                    .filter((n) => n.type === "decision")
                    .map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`w-full max-w-lg p-3.5 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.01] shadow-lg ${getNodeColor(
                          node.type
                        )}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 border border-indigo-500/30">
                            {getNodeBadge(node.type)}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            Strategic Synthesis
                          </span>
                        </div>
                        <h4 className="text-sm font-bold mb-1">{node.label}</h4>
                        <p className="text-xs opacity-90">{node.details}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              ไม่มีข้อมูล Reasoning Graph สำหรับคำตอบนี้
            </div>
          )}

          {/* Detailed Node Inspector Modal */}
          {selectedNode && (
            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 text-xs space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  รายละเอียด Node Inspector: [{selectedNode.label}]
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-white px-2 py-0.5 rounded bg-gray-800/60"
                >
                  ปิด
                </button>
              </div>
              <p className="text-gray-300 leading-relaxed">{selectedNode.details}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEMORY TRACE */}
      {activeTab === "memory" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span className="font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              การติดตามรอยเท้าหน่วยความจำ (Memory Trace & Lifecycle Index)
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">Persistent Sync Active</span>
          </div>

          {memoryTraces && memoryTraces.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5">
              {memoryTraces.map((trace, idx) => {
                const confDiff = trace.confidenceShift
                  ? Number((trace.confidenceShift.to - trace.confidenceShift.from).toFixed(2))
                  : 0;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      isDarkMode
                        ? "bg-[#1f2226] border-gray-700/60 hover:border-blue-500/40"
                        : "bg-gray-50 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          {trace.memoryId}
                        </span>
                        <span className="text-xs text-gray-400">
                          Created by: <strong className="text-gray-200">{trace.createdByStage}</strong>
                        </span>
                      </div>

                      {/* Confidence Evolution */}
                      {trace.confidenceShift && (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                          <TrendingUp className="w-3 h-3" />
                          <span>
                            Confidence: {trace.confidenceShift.from} →{" "}
                            <strong className="text-emerald-300 font-bold">
                              {trace.confidenceShift.to}
                            </strong>
                          </span>
                          {confDiff > 0 && (
                            <span className="text-[10px] text-emerald-400">
                              (+{confDiff})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-300 font-sans mb-2 leading-relaxed">
                      "{trace.content}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 pt-2 border-t border-gray-700/30">
                      <div className="flex items-center gap-1">
                        <span>Used in Conversations:</span>
                        <div className="flex flex-wrap gap-1">
                          {trace.usedInConversations.map((c, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-mono"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      {trace.layer && (
                        <span className="uppercase text-[10px] font-semibold text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/10">
                          Layer: {trace.layer}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              ไม่มีข้อมูล Memory Trace
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STRATEGY SELECTION */}
      {activeTab === "strategy" && (
        <div className="space-y-3.5">
          {strategySelection ? (
            <>
              {/* Chosen Strategy Box */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ยุทธศาสตร์การคิดที่ระบบเลือกใช้ (Selected Cognitive Strategy)
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    Primary Engine
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {strategySelection.chosenStrategy}
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  <strong>เหตุผลในการเลือก (Rationale):</strong> {strategySelection.rationale}
                </p>
              </div>

              {/* Comparison Matrix of Considered vs Rejected Strategies */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                  กลยุทธ์อื่นที่ถูกนำมาประเมินเปรียบเทียบ (Considered Alternatives)
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {strategySelection.consideredStrategies.map((strat, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        strat.status === "selected"
                          ? "border-emerald-500/30 bg-emerald-950/10"
                          : strat.status === "rejected"
                          ? "border-rose-500/20 bg-rose-950/10"
                          : "border-amber-500/20 bg-amber-950/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-200">{strat.name}</span>
                        {strat.status === "selected" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            Selected
                          </span>
                        )}
                        {strat.status === "rejected" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">
                            Rejected
                          </span>
                        )}
                        {strat.status === "partially_used" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                            Partially Used
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-300 space-y-1">
                        <div>
                          <strong className="text-emerald-400">Pros:</strong> {strat.pros}
                        </div>
                        <div>
                          <strong className="text-rose-400">Cons:</strong> {strat.cons}
                        </div>
                        {strat.rejectionReason && (
                          <div className="pt-1 border-t border-gray-700/30 text-rose-300/90 text-[10.5px]">
                            <strong>ทำไมถึงไม่เลือก (Rejection Reason):</strong> {strat.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              ไม่มีข้อมูล Strategy Selection
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CognitiveOrchestrationView;
