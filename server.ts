import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Orchestrator } from "./src/backend/orchestrator";
import { settings, VERSION } from "./src/backend/config";
import { MemoryEngine } from "./src/backend/memory";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Shared persistent Memory Engine to accumulate learned insights across sessions
  const sharedMemory = new MemoryEngine();

  // Support JSON request bodies
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: VERSION });
  });

  app.post("/api/analyze", async (req, res) => {
    const { question, llm_provider, llm_model, tone, deepReasoning } = req.body;

    if (!question || !question.trim()) {
      res.status(400).json({ error: "Question cannot be empty." });
      return;
    }

    try {
      // Initialize an orchestrator with the shared persistent memory
      const orchestrator = new Orchestrator({
        memory: sharedMemory,
        provider: llm_provider || settings.llm.provider,
        model: llm_model || settings.llm.model,
        temperature: settings.llm.temperature,
        tone: tone || "Formal Architect",
        deepReasoning: !!deepReasoning,
      });

      const state = await orchestrator.think(question);

      res.json({
        question: state.user_input,
        response: state.response,
        trace: state.trace,
        notes: state.notes,
        observations: state.observations,
        understanding: state.understanding,
        purpose: state.purpose,
        decision: state.decision,
        confidence: state.confidence,
        critique: state.critique,
        reflection: state.reflection,
        learning: state.learning,
        agency_checks: state.agency_checks,
        reasoning_graph: state.reasoning_graph,
        strategy_selection: state.strategy_selection,
        memory_traces: state.memory_traces,
      });
    } catch (error: any) {
      console.error("Analysis failed:", error);
      res.status(500).json({ error: error?.message || "An internal error occurred." });
    }
  });

  // Memory management endpoints
  app.get("/api/memory", (req, res) => {
    res.json(sharedMemory.getAllItems());
  });

  app.post("/api/memory", (req, res) => {
    const { content, layer, source } = req.body;
    if (!content) {
      res.status(400).json({ error: "Content is required." });
      return;
    }
    sharedMemory.remember({
      content,
      layer: layer || "project",
      source: source || "user_manual",
      confidence: 1.0,
      created_at: new Date().toISOString(),
    });
    res.json({ success: true, items: sharedMemory.getAllItems() });
  });

  app.delete("/api/memory", (req, res) => {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: "Content is required to delete memory." });
      return;
    }
    const success = sharedMemory.deleteItem(content);
    res.json({ success, items: sharedMemory.getAllItems() });
  });

  app.post("/api/memory/clear", (req, res) => {
    sharedMemory.clearMemory();
    res.json({ success: true, items: [] });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files serving loaded.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
