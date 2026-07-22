import { CognitiveStage } from "./cognitive_dna";

export interface TraceEntry {
  stage: string;
  timestamp: string;
  output: Record<string, any>;
}

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

export class CognitiveState {
  user_input: string;
  language: string = "en";
  purpose: string = "";
  response: string = "";
  notes: string[] = [];
  observations: string[] = [];
  understanding: string = "";
  constraints: string[] = [];
  memories: any[] = [];
  mental_models: string[] = [];
  hypotheses: Array<Record<string, any>> = [];
  decision: string = "";
  confidence: number = 0.0;
  uncertainty: string[] = [];
  critique: string[] = [];
  reflection: string[] = [];
  learning: string[] = [];
  agency_checks: string[] = [];
  trace: TraceEntry[] = [];

  // PCA Cognitive Orchestration Layer Data Structures
  reasoning_graph?: ReasoningGraphData;
  strategy_selection?: StrategySelectionData;
  memory_traces?: MemoryTraceData[];

  constructor(userInput: string) {
    this.user_input = userInput;
  }

  record(stage: CognitiveStage, output: Record<string, any>): void {
    this.trace.append?.({
      stage: stage,
      timestamp: new Date().toISOString(),
      output,
    }) || this.trace.push({
      stage: stage,
      timestamp: new Date().toISOString(),
      output,
    });
  }
}

