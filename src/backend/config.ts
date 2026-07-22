import fs from "fs";
import path from "path";
import YAML from "yaml";

export interface LLMConfig {
  provider: "gemini" | "ollama" | "openai";
  model: string;
  temperature: number;
  max_tokens: number;
}

export interface MemoryConfig {
  vector_search: boolean;
  embedding_model: string;
}

export interface GovernanceConfig {
  firekeeper_mode: string;
  human_agency_required: boolean;
}

export interface AppConfig {
  llm: LLMConfig;
  memory: MemoryConfig;
  governance: GovernanceConfig;
}

export const APP_NAME = "PCA Cognitive DNA Prototype";
export const VERSION = "0.2.0";
export const SPECIFICATION_VERSION = "PCA Specification v1.0 (Draft)";

const DEFAULT_CONFIG: AppConfig = {
  llm: {
    provider: "gemini",
    model: "gemini-3.5-flash",
    temperature: 0.7,
    max_tokens: 500,
  },
  memory: {
    vector_search: false,
    embedding_model: "all-MiniLM-L6-v2",
  },
  governance: {
    firekeeper_mode: "strict",
    human_agency_required: true,
  },
};

export function loadConfig(): AppConfig {
  const configPath = path.resolve(process.cwd(), "config.yaml");

  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const fileContent = fs.readFileSync(configPath, "utf8");
    const parsed = YAML.parse(fileContent) || {};
    
    const config = { ...DEFAULT_CONFIG };
    
    if (parsed.llm) {
      config.llm = {
        ...DEFAULT_CONFIG.llm,
        ...parsed.llm,
      };
    }
    
    if (parsed.memory) {
      config.memory = {
        ...DEFAULT_CONFIG.memory,
        ...parsed.memory,
      };
    }
    
    if (parsed.governance) {
      config.governance = {
        ...DEFAULT_CONFIG.governance,
        ...parsed.governance,
      };
    }
    
    return config;
  } catch (error) {
    console.warn(`Warning: Failed to load config.yaml (${error}). Using defaults.`);
    return DEFAULT_CONFIG;
  }
}

export const settings = loadConfig();
