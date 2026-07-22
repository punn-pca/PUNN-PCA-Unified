const API_BASE = "/api";

export async function analyze(question: string, llm_provider?: string, llm_model?: string, tone?: string, deepReasoning?: boolean) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      llm_provider,
      llm_model,
      tone,
      deepReasoning,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "API request failed");
  }

  return response.json();
}

export async function getMemories() {
  const response = await fetch(`${API_BASE}/memory`);
  if (!response.ok) {
    throw new Error("Failed to fetch memories");
  }
  return response.json();
}

export async function addMemory(content: string, layer: string, source: string) {
  const response = await fetch(`${API_BASE}/memory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content, layer, source }),
  });
  if (!response.ok) {
    throw new Error("Failed to add memory");
  }
  return response.json();
}

export async function deleteMemory(content: string) {
  const response = await fetch(`${API_BASE}/memory`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error("Failed to delete memory");
  }
  return response.json();
}

export async function clearAllMemories() {
  const response = await fetch(`${API_BASE}/memory/clear`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to clear memories");
  }
  return response.json();
}
