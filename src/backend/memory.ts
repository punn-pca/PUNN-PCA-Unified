import * as fs from "fs";
import * as path from "path";

export enum MemoryLayer {
  WORKING = "working",
  SESSION = "session",
  PROJECT = "project",
  SEMANTIC = "semantic",
  PROCEDURAL = "procedural",
  REFLECTIVE = "reflective",
}

export interface MemoryItem {
  id?: string;
  content: string;
  layer: MemoryLayer;
  source: string;
  confidence: number;
  confidenceHistory?: number[];
  createdByStage?: string;
  usedInConversations?: string[];
  context: Record<string, string>;
  created_at: string;
}

const MEMORY_FILE_PATH = path.join(process.cwd(), "memory_store.json");

export class MemoryEngine {
  private _items: MemoryItem[] = [];

  constructor() {
    this.loadMemory();
  }

  private loadMemory() {
    try {
      if (fs.existsSync(MEMORY_FILE_PATH)) {
        const data = fs.readFileSync(MEMORY_FILE_PATH, "utf-8");
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this._items = parsed.map((item, idx) => ({
            ...item,
            id: item.id || `Memory #${idx + 1}`,
            confidenceHistory: item.confidenceHistory || [item.confidence || 0.72],
            createdByStage: item.createdByStage || "LEARNING",
            usedInConversations: item.usedInConversations || [],
          }));
          console.log(`[MemoryEngine] Loaded ${this._items.length} memory items from disk.`);
        }
      }
    } catch (error) {
      console.error("[MemoryEngine] Failed to load memory from disk:", error);
    }
  }

  private saveMemory() {
    try {
      fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(this._items, null, 2), "utf-8");
    } catch (error) {
      console.error("[MemoryEngine] Failed to save memory to disk:", error);
    }
  }

  remember(item: Partial<MemoryItem> & { content: string; layer: MemoryLayer; source: string }): MemoryItem {
    const nextNum = this._items.length + 1;
    const initialConf = item.confidence ?? 0.72;
    const fullItem: MemoryItem = {
      id: item.id || `Memory #${nextNum}`,
      content: item.content,
      layer: item.layer,
      source: item.source,
      confidence: initialConf,
      confidenceHistory: item.confidenceHistory || [initialConf],
      createdByStage: item.createdByStage || "LEARNING",
      usedInConversations: item.usedInConversations || [],
      context: item.context ?? {},
      created_at: item.created_at ?? new Date().toISOString(),
    };
    this._items.push(fullItem);
    this.saveMemory();
    return fullItem;
  }

  recordUsage(memoryId: string, conversationTag: string, newConfidence?: number): void {
    const item = this._items.find((m) => m.id === memoryId || m.content === memoryId);
    if (item) {
      if (!item.usedInConversations) item.usedInConversations = [];
      if (!item.usedInConversations.includes(conversationTag)) {
        item.usedInConversations.push(conversationTag);
      }
      if (newConfidence !== undefined) {
        if (!item.confidenceHistory) item.confidenceHistory = [item.confidence];
        item.confidenceHistory.push(newConfidence);
        item.confidence = newConfidence;
      }
      this.saveMemory();
    }
  }

  getAllItems(): MemoryItem[] {
    return this._items;
  }

  deleteItem(content: string): boolean {
    const initialLen = this._items.length;
    this._items = this._items.filter(item => item.content !== content);
    if (this._items.length !== initialLen) {
      this.saveMemory();
      return true;
    }
    return false;
  }

  clearMemory(): void {
    this._items = [];
    this.saveMemory();
  }

  retrieve(query: string, limit: number = 5): MemoryItem[] {
    const queryLower = query.trim().toLowerCase();
    if (!queryLower) {
      return [];
    }

    // Support both English alphanumeric and Thai character ranges
    const termRegex = /[a-zA-Z0-9'\u0E00-\u0E7F]+/g;
    const queryTerms = new Set<string>();
    let match;
    while ((match = termRegex.exec(queryLower)) !== null) {
      queryTerms.add(match[0]);
    }

    const ranked: Array<{ score: number; item: MemoryItem }> = [];

    for (const item of this._items) {
      const itemLower = item.content.toLowerCase();
      let score = 0;

      // 1. Term-based intersection score
      if (queryTerms.size > 0) {
        const itemTerms = new Set<string>();
        termRegex.lastIndex = 0; // reset regex
        while ((match = termRegex.exec(itemLower)) !== null) {
          itemTerms.add(match[0]);
        }

        let intersectionSize = 0;
        for (const t of queryTerms) {
          if (itemTerms.has(t) || itemLower.includes(t)) {
            intersectionSize++;
          }
        }
        score += intersectionSize * item.confidence;
      }

      // 2. Direct phrase containment bonus
      if (itemLower.includes(queryLower)) {
        score += 2.0 * item.confidence;
      }

      if (score > 0) {
        ranked.push({ score, item });
      }
    }

    // Sort descending by score, then by recency (newest first)
    ranked.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.01) {
        return b.score - a.score;
      }
      return new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime();
    });

    return ranked.slice(0, limit).map((entry) => entry.item);
  }
}
