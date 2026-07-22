# PUNN PCA Unified

This is the consolidated React/Vite project produced from the three supplied archives.

## Active implementation

`punn-pca.zip` is the active application baseline. It contains the broadest integrated feature set: multi-session chat, persistent cognitive memory, exports, configurable assistant behavior, a 12-stage trace, and the cognitive-orchestration view.

## Duplicate resolution

- `PUNN-PCA-Cognitive-System.zip` is an earlier, overlapping version of the same app. Its duplicate application, server, configuration, and specification files were not copied over the newer baseline.
- `punn-cognitive-architecture (1).zip` overlaps on the Vite application and PCA domain. Its standalone legacy engine is retained at `src/legacy/cognitive-dna-v1/engine.ts` for reference; the active app uses the newer `src/backend/` architecture.
- Generated folders (`node_modules`, `dist`) and embedded Git metadata are intentionally excluded, keeping the ZIP portable and avoiding stale dependencies/history.

## Unified purple UI

The shared Tailwind blue and orange palette is remapped in `src/index.css` to PUNN purple shades. Existing screens, controls, status indicators, and hover states therefore use one consistent purple language without changing component behavior.

## Run locally

1. Copy `.env.example` to `.env` and supply any required provider key.
2. Install dependencies with `npm install`.
3. Start development with `npm run dev`.