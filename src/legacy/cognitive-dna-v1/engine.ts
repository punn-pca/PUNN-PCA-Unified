import { GoogleGenAI } from "@google/genai";

// Invariant Cognitive DNA stage definitions
export enum CognitiveStage {
  OBSERVATION = "observation",
  UNDERSTANDING = "understanding",
  PURPOSE = "purpose",
  MEMORY = "memory",
  MENTAL_MODEL = "mental_model",
  HYPOTHESIS = "hypothesis",
  EVIDENCE_EVALUATION = "evidence_evaluation",
  CRITIQUE = "critique",
  DECISION = "decision",
  COMMUNICATION = "communication",
  REFLECTION = "reflection",
  LEARNING = "learning",
}

export const COGNITIVE_DNA = [
  CognitiveStage.OBSERVATION,
  CognitiveStage.UNDERSTANDING,
  CognitiveStage.PURPOSE,
  CognitiveStage.MEMORY,
  CognitiveStage.MENTAL_MODEL,
  CognitiveStage.HYPOTHESIS,
  CognitiveStage.EVIDENCE_EVALUATION,
  CognitiveStage.CRITIQUE,
  CognitiveStage.DECISION,
  CognitiveStage.COMMUNICATION,
  CognitiveStage.REFLECTION,
  CognitiveStage.LEARNING,
];

// Multi-layer memory types
export enum MemoryLayer {
  WORKING = "working",
  SESSION = "session",
  PROJECT = "project",
  SEMANTIC = "semantic",
  PROCEDURAL = "procedural",
  REFLECTIVE = "reflective",
}

export interface MemoryItem {
  content: string;
  layer: MemoryLayer;
  source: string;
  confidence: number;
  context: Record<string, string>;
  created_at: string;
}

// In-memory Lexical Memory Engine
export class MemoryEngine {
  private items: MemoryItem[] = [];

  remember(item: MemoryItem): void {
    this.items.push(item);
  }

  retrieve(query: string, limit: number = 5): MemoryItem[] {
    const terms = new Set((query.toLowerCase().match(/[a-zA-Z0-9']+/g) || []));
    if (terms.size === 0) return [];

    const ranked: { score: number; item: MemoryItem }[] = [];

    for (const item of this.items) {
      const itemTerms = new Set((item.content.toLowerCase().match(/[a-zA-Z0-9']+/g) || []));
      let intersectionCount = 0;
      for (const t of terms) {
        if (itemTerms.has(t)) {
          intersectionCount++;
        }
      }
      const score = intersectionCount * item.confidence;
      if (score > 0) {
        ranked.push({ score, item });
      }
    }

    ranked.sort((a, b) => b.score - a.score);
    return ranked.slice(0, limit).map((pair) => pair.item);
  }

  getAll(): MemoryItem[] {
    return this.items;
  }
}

// Purpose Identification Stage
const DEFAULT_CONSTRAINTS = [
  "Do not replace human judgment.",
  "State uncertainty explicitly.",
  "Prefer evidence over assumption.",
];

export class PurposeEngine {
  process(state: CognitiveState): CognitiveState {
    const request = state.userInput.trim();
    if (state.language === "th") {
      if (request) {
        state.purpose = `ช่วยให้ผู้ใช้เข้าใจและตัดสินใจได้เอง (human-owned decision) เกี่ยวกับ: ${request}`;
      } else {
        state.purpose = "ขอให้ผู้ใช้ระบุคำถามก่อนที่จะสร้างคำตอบ";
      }
    } else {
      if (request) {
        state.purpose = `Help the user understand and make an informed, human-owned decision about: ${request}`;
      } else {
        state.purpose = "Ask the user for a question before generating a response.";
      }
    }

    state.constraints = [...DEFAULT_CONSTRAINTS];
    return state;
  }
}

// Constitutional supervision for the PCA prototype
const COERCIVE_PHRASES = [
  "you must",
  "you have to",
  "you need to",
  "the only option",
  "there is no other way",
];
const UNSUPPORTED_CONFIDENCE_THRESHOLD = 0.6;

export class Firekeeper {
  review(state: CognitiveState): void {
    state.agencyChecks.push("Human decision authority is retained; this is a recommendation.");
    state.agencyChecks.push("Alternatives and remaining uncertainty are communicated.");

    if (state.uncertainty.length === 0) {
      state.uncertainty.push("No external evidence has been independently verified.");
    }

    if (state.hypotheses.length === 0) {
      state.critique.push("No alternatives were generated; do not treat this as a final decision.");
    }

    const decisionText = state.decision.toLowerCase();
    if (COERCIVE_PHRASES.some((phrase) => decisionText.includes(phrase))) {
      state.critique.push(
        "Decision language asserts the choice rather than framing it as a recommendation; human agency may be undermined."
      );
      state.agencyChecks.push("Coercive phrasing detected in decision text; flagged for review.");
    }

    if (state.confidence > UNSUPPORTED_CONFIDENCE_THRESHOLD && state.memories.length === 0) {
      state.critique.push(
        `Confidence (${(state.confidence * 100).toFixed(0)}%) exceeds what unsupported evidence justifies; no corroborating memory was retrieved.`
      );
      state.agencyChecks.push("Confidence claim exceeds supporting evidence; flagged for review.");
    }
  }
}

// Inspectable state shared by every cognitive stage
export interface CognitiveState {
  userInput: string;
  language: string;
  purpose: string;
  response: string;
  notes: string[];
  observations: string[];
  understanding: string;
  constraints: string[];
  memories: any[];
  mentalModels: string[];
  hypotheses: any[];
  decision: string;
  confidence: number;
  uncertainty: string[];
  critique: string[];
  reflection: string[];
  learning: string[];
  agencyChecks: string[];
  depthMode?: string;
  trace: { stage: string; timestamp: string; output: any }[];
}

export function createCognitiveState(userInput: string, depthMode?: string): CognitiveState {
  return {
    userInput,
    language: "en",
    purpose: "",
    response: "",
    notes: [],
    observations: [],
    understanding: "",
    constraints: [],
    memories: [],
    mentalModels: [],
    hypotheses: [],
    decision: "",
    confidence: 0,
    uncertainty: [],
    critique: [],
    reflection: [],
    learning: [],
    agencyChecks: [],
    depthMode,
    trace: [],
  };
}

export function recordStateStage(state: CognitiveState, stage: CognitiveStage, output: any): void {
  state.trace.push({
    stage: stage,
    timestamp: new Date().toISOString(),
    output: JSON.parse(JSON.stringify(output)), // clone to prevent subsequent mutation references
  });
}

// Language detection
const THAI_SCRIPT_REGEX = /[\u0E00-\u0E7F]/;
function detectLanguage(text: string): string {
  return THAI_SCRIPT_REGEX.test(text) ? "th" : "en";
}

// Orchestrator coordinates the invariant Cognitive DNA sequence
export class Orchestrator {
  public memory: MemoryEngine;
  private purposeEngine: PurposeEngine;
  private firekeeper: Firekeeper;
  private ai: GoogleGenAI | null = null;
  private model: string;
  private temperature: number;

  constructor(
    memory?: MemoryEngine,
    model: string = "gemini-3.5-flash",
    temperature: number = 0.7
  ) {
    this.memory = memory || new MemoryEngine();
    this.purposeEngine = new PurposeEngine();
    this.firekeeper = new Firekeeper();
    this.model = model;
    this.temperature = temperature;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } else {
      console.warn("GEMINI_API_KEY is not defined. Fallback to deterministic mode.");
    }
  }

  async think(userInput: string, depthMode?: string): Promise<CognitiveState> {
    const state = createCognitiveState(userInput, depthMode);

    this.observe(state);
    this.understand(state);
    this.identifyPurpose(state);
    this.retrieveMemory(state);
    this.buildMentalModel(state);
    this.generateHypotheses(state);
    this.evaluateEvidence(state);
    this.critique(state);
    this.firekeeper.review(state);
    this.decide(state);
    await this.communicate(state);
    this.reflect(state);
    this.learn(state);
    this.validateTrace(state);

    return state;
  }

  private observe(state: CognitiveState): void {
    const observation = state.userInput.trim();
    if (observation) {
      state.observations.push(observation);
      state.language = detectLanguage(observation);
    } else {
      state.uncertainty.push("No request was provided.");
    }
    recordStateStage(state, CognitiveStage.OBSERVATION, {
      observations: state.observations,
      uncertainty: [...state.uncertainty],
    });
  }

  private understand(state: CognitiveState): void {
    if (state.language === "th") {
      state.understanding = "ผู้ใช้ต้องการความช่วยเหลือในการพิจารณาคำขอก่อนตัดสินใจลงมือทำ";
      if (state.observations.length === 0) {
        state.understanding = "ข้อมูลที่ให้มาไม่เพียงพอต่อการทำความเข้าใจบริบท";
      }
    } else {
      state.understanding = "The user is seeking support to examine a request before acting.";
      if (state.observations.length === 0) {
        state.understanding = "There is insufficient input to establish context.";
      }
    }
    recordStateStage(state, CognitiveStage.UNDERSTANDING, {
      understanding: state.understanding,
    });
  }

  private identifyPurpose(state: CognitiveState): void {
    this.purposeEngine.process(state);
    recordStateStage(state, CognitiveStage.PURPOSE, {
      purpose: state.purpose,
      constraints: state.constraints,
    });
  }

  private retrieveMemory(state: CognitiveState): void {
    const retrieved = this.memory.retrieve(state.userInput);
    state.memories = retrieved.map((item) => ({
      content: item.content,
      layer: item.layer,
      source: item.source,
      confidence: item.confidence,
      context: item.context,
      created_at: item.created_at,
    }));

    if (state.observations.length > 0) {
      this.memory.remember({
        content: state.observations[0],
        layer: MemoryLayer.WORKING,
        source: "user_input",
        confidence: 1.0,
        context: {},
        created_at: new Date().toISOString(),
      });
    }
    recordStateStage(state, CognitiveStage.MEMORY, {
      retrieved: state.memories,
    });
  }

  private buildMentalModel(state: CognitiveState): void {
    state.mentalModels = [
      "A good response distinguishes observed input, alternatives, evidence, and a user-owned choice.",
    ];
    recordStateStage(state, CognitiveStage.MENTAL_MODEL, {
      models: state.mentalModels,
    });
  }

  private generateHypotheses(state: CognitiveState): void {
    if (state.observations.length > 0) {
      state.hypotheses = [
        {
          claim: "Clarifying the desired outcome will improve the next action.",
          status: "candidate",
        },
        {
          claim: "Relevant prior context may change the recommended action.",
          status: "candidate",
        },
      ];
    }
    recordStateStage(state, CognitiveStage.HYPOTHESIS, {
      hypotheses: state.hypotheses,
    });
  }

  private evaluateEvidence(state: CognitiveState): void {
    const baseline = state.observations.length > 0 ? 0.3 : 0.0;
    let memoryComponent = 0.0;
    if (state.memories.length > 0) {
      const sumConfidence = state.memories.reduce((acc, m) => acc + m.confidence, 0);
      memoryComponent = (sumConfidence / state.memories.length) * 0.5;
    }
    state.confidence = Math.min(0.8, baseline + memoryComponent);

    for (const h of state.hypotheses) {
      h.confidence = Number(state.confidence.toFixed(2));
    }

    if (state.memories.length === 0) {
      state.uncertainty.push("No relevant prior memory was available.");
    }

    recordStateStage(state, CognitiveStage.EVIDENCE_EVALUATION, {
      confidence: state.confidence,
      ranked_hypotheses: state.hypotheses,
      uncertainty: [...state.uncertainty],
    });
  }

  private critique(state: CognitiveState): void {
    state.critique.push("The input alone is not independent evidence; verify important claims before acting.");
    const words = state.userInput.match(/[a-zA-Z0-9']+/g) || [];
    if (words.length < 4) {
      state.critique.push("The request is brief; ask for context before making a high-impact choice.");
    }
    recordStateStage(state, CognitiveStage.CRITIQUE, {
      critique: [...state.critique],
    });
  }

  private decide(state: CognitiveState): void {
    if (state.language === "th") {
      if (state.observations.length === 0) {
        state.decision = "ขอให้ผู้ใช้ระบุคำถามหรือเป้าหมายที่ชัดเจน";
      } else {
        state.decision = "ทำความชัดเจนของผลลัพธ์ที่ต้องการ เปรียบเทียบทางเลือกอย่างรอบคอบเป็นกลาง";
      }
    } else {
      if (state.observations.length === 0) {
        state.decision = "Ask the user to provide a clear question or goal.";
      } else {
        state.decision = "Clarify the desired outcome and weigh options impartially before acting.";
      }
    }
    recordStateStage(state, CognitiveStage.DECISION, {
      decision: state.decision,
      uncertainty: [...state.uncertainty],
    });
  }

  private getCommunicationPrompt(state: CognitiveState): string {
    const isThai = state.language === "th";
    const depth = state.depthMode || "analytical";
    
    let depthInstruction = "";
    if (isThai) {
      if (depth === "quick") {
        depthInstruction = `\n[กฎความลึกคิดระดับ: Quick Answer (คำตอบรวบรัด 3-5 บรรทัด)]
- ในส่วน "Summary" ให้เขียนตอบตรงประเด็นและสั้นกระชับที่สุดเพียง 3-5 บรรทัดเท่านั้น
- ในส่วนประกอบหรือมิติอื่นๆ ทั้งหมด ให้ย่นย่อและเขียนสั้นที่สุดเท่าที่เป็นไปได้ (หัวข้อละประมาณ 1 ประโยคสั้นๆ เพื่อให้สแกนอ่านเร็วผ่านอุปกรณ์เคลื่อนที่) ห้ามลากยาว`;
      } else if (depth === "research") {
        depthInstruction = `\n[กฎความลึกคิดระดับ: Research (บทวิเคราะห์เชิงวิชาการ/งานวิจัย)]
- ในการตอบ ให้ยกระดับความลึกของการเปรียบเทียบ โดยอ้างอิงถึงทฤษฎี งานวิจัย แหล่งการศึกษา คีย์เวิร์ด และสมมติฐานเชิงปรัชญา/วิทยาศาสตร์ที่มีการโต้เถียงกันอย่างมีหลักการ
- ในส่วน "Summary" ให้วิเคราะห์เจตนาและตอบเชิงวิชาการอย่างลุ่มลึกสง่างาม พร้อมเชื่อมโยงสาขาความรู้สำคัญที่มีน้ำหนักประจักษ์ชัด`;
      } else if (depth === "dialogue") {
        depthInstruction = `\n[กฎความลึกคิดระดับ: Dialogue (คู่คิดชวนสนทนา)]
- ปรับน้ำเสียงและคำกล่าวให้เป็นมิตร มี Empathy สูง อบอุ่น เสมือนเพื่อนคู่คิดหรือโค้ชที่ร่วมใคร่ครวญ
- เน้นให้คำวิจารณ์ คัดกรอง และ possible next steps อยู่ในเชิงชวนคิด ชวนร่วมตั้งคำถามนำเสนอแนะที่อบอุ่นนุ่มนวลอย่างเป็นกลาง`;
      } else {
        depthInstruction = `\n[กฎความลึกคิดระดับ: Analytical (โครงสร้างวิเคราะห์มาตรฐาน)]
- รักษาสมดุลเชิงตรรกะและการแจกแจงโครงสร้าง 11 มิติอย่างเป็นระบบ ครบถ้วน คมชัด และเป็นกลางสูงสุดตามปกติ`;
      }
    } else {
      if (depth === "quick") {
        depthInstruction = `\n[Current Depth Mode: Quick Answer (3-5 Lines)]
- In the "Summary" section, provide a highly direct, clear answer in exactly 3-5 lines.
- For all other cognitive dimensions, keep the explanations brief and concise (ideally 1 short sentence per section) to allow rapid scannability.`;
      } else if (depth === "research") {
        depthInstruction = `\n[Current Depth Mode: Research (Academic/Scientific Rigor)]
- Infuse advanced academic theories, scientific hypotheses, notable disputes, and conceptual frameworks into the response.
- In the "Summary" and other sections, connect the query directly to notable scientific/philosophical fields and research lines to expand the intellectual depth of the system.`;
      } else if (depth === "dialogue") {
        depthInstruction = `\n[Current Depth Mode: Dialogue (Conversational/Empathetic Partner)]
- Adopt a warm, supportive, and active-listening tone. Speak as a trusted co-thinker.
- Frame the possible next steps, critique points, and closing parameters as thoughtful prompts for joint exploration rather than dry assertions.`;
      } else {
        depthInstruction = `\n[Current Depth Mode: Analytical (Standard Balanced Structural Mode)]
- Deliver a highly logical, multi-dimensional, structured analysis across all 11 cognitive sections in a rigorous and balanced format.`;
      }
    }
    
    if (isThai) {
      return `คุณคือ "PUNN PCA" (PUNN Cognitive Architecture) ขั้นตอนการสื่อสาร (Communication Stage)
โปรดเรียบเรียงและสังเคราะห์โครงสร้างการจัดระเบียบความคิดเชิงปัญญาให้ออกมาเป็นกลาง คมชัด และสุภาพที่สุด โดยทำหน้าที่เป็น Executive Summary Layer ห้ามมีคำพูดเกริ่นนำหรือคำพูดทักทายเด็ดขาด (เช่น "ยินดีต้อนรับ...", "ผมพร้อมแล้ว...") เริ่มต้นด้วย 11 ส่วนประกอบตามหัวข้อด้านล่างนี้ทันที ห้ามสลับลำดับ ห้ามยุบ รวม หรือข้ามหัวข้อโดยเด็ดขาด:

Summary
────────────
- ประเมินเจตนาหรือ Intent ของผู้ใช้ก่อนเริ่มเขียน:
  * Fact (ข้อเท็จจริง) -> ตอบข้อเท็จจริงหรือตัวเลขที่ถูกต้อง คมชัด และกระชับที่สุดก่อนเป็นอันดับแรกทันที
  * Definition (นิยาม) -> ตอบนิยามแนวคิดที่ถามถึงในหลากหลายมิติ (เช่น ทางชีววิทยา: กลไกสมอง/ฮอร์โมน, ทางจิตวิทยา: ความผูกพัน/ความไว้วางใจ, ทางปรัชญา: การเห็นคุณค่า/ความปรารถนาดี, ทางประสบการณ์: ความหมายส่วนบุคคล) ทันทีอย่างสง่างาม
  * How-to (ขั้นตอนปฏิบัติ) -> อธิบายขั้นตอนปฏิบัติเป็นระบบรัดกุมทันที
  * Decision (วิเคราะห์ทางเลือก) -> สรุปกรอบหัวใจพิจารณาและข้อมูลเปรียบเทียบภาพกว้างทันที
  * Reflection (ชวนคิดวิเคราะห์) -> อธิบายแง่มุมสะท้อนคิดเพื่อเปิดมุมมองใหม่ๆ ทันที
  * Emotional Support (สนับสนุนความรู้สึก) -> แสดงการรับฟัง สุภาพ และ Empathy อย่างสงบเป็นกลางทันที
- [ข้อกำหนดสำคัญ - ความกระชับรัดกุมสูงสุด] เรียบเรียงให้เป็น "Executive Summary" ที่กระชับสูงสุดเพื่อให้อ่านจบภายใน 20-30 วินาที:
  * ย่อหน้าแรก: ตอบสนองคำตอบ/คำอธิบายนิยามตามเจตนาผู้ใช้ตรงประเด็นทันที (ความยาวสูงสุด 2-3 บรรทัด)
  * ย่อหน้าที่สอง: สรุปเชิงปัญญาประเมินสถานะข้อมูลและหลักฐานในปัจจุบันอย่างเป็นกลาง (ความยาวเพียง 1-2 บรรทัด)
${depthInstruction}

Observation
- ระบุข้อเท็จจริงเชิงวัตถุที่ตรงตัวที่สุดเป็นบรรทัดเดียวสั้นๆ โดยห้ามใส่ความรู้สึก คาดเดา หรือตีความบริบทนอกเหนือจากที่ให้มาเด็ดขาด (เช่น "ผู้ใช้ถามว่า '[คำถามสั้นๆ ของผู้ใช้]'")

Evidence
- สิ่งที่ทราบแน่ชัด (Known): ข้อเท็จจริง ข้อมูลเชิงประจักษ์ หรือเจตจำนงที่ผู้ใช้ระบุมาจริงในอินพุต
- สิ่งที่ยังไม่ทราบ / บริบทที่ขาด (Unknown): ช่องว่างของข้อมูล คำถามที่ยังไม่มีคำตอบ หรือบริบทส่วนบุคคลของผู้ใช้ที่ยังขาดอยู่สำหรับการประเมินอย่างลึกซึ้ง

Supporting Assumptions (สมมติฐานสนับสนุน)
- แสดงสมมติฐานเชิงระบบที่สนับสนุนทิศทางความคิดของผู้ใช้ (สูงสุด 1-2 ข้อสั้นๆ)
- [ข้อกำหนดสำคัญ] หากไม่มีสมมติฐานสนับสนุนที่เกิดจากบริบทเฉพาะตัวของผู้ใช้จริง (เช่น เป็นเพียงคำถามทั่วไป/เชิงปรัชญา) ให้เขียนระบุตรงตัวว่า "ไม่มีสมมติฐานเพิ่มเติมที่สามารถสรุปได้จากข้อมูลปัจจุบัน" เพื่อรักษาความซื่อสัตย์ต่อข้อมูลและเฟรมเวิร์ก

Alternative Assumptions (สมมติฐานทางเลือก)
- แสดงสมมติฐานเชิงขนานหรือทิศทางตรงกันข้าม เพื่อให้เห็นภาพสะท้อนในหลายมิติแบบเท่าเทียม (สูงสุด 1-2 ข้อสั้นๆ)

Key Contradiction
- ระบุจุดขัดแย้งเชิงตรรกะที่สำคัญที่สุดระหว่างสมมติฐานหรือสัญญาณข้อมูลที่ได้รับ เพื่อชี้แจงว่าทำไมจึงยังไม่ควรด่วนสรุปในทันที (เน้นที่ความขัดแย้งเชิงตรรกะของแนวคิด ไม่ใช่การเปรียบเทียบข้อดีข้อเสียธรรมดา)

Missing Information
- แสดงรายการตัวแปรหรือตัวชี้วัดสำคัญระดับ Top 2-3 อย่างเท่านั้น เรียงลำดับตามความสำคัญที่มีผลต่อการตัดสินใจสูงสุด ซึ่งหากได้มาจะเปลี่ยนทิศทางของการสรุปผลได้อย่างชัดเจน

Possible Next Steps
- เสนอทางเลือกหรือแนวทางดำเนินการต่อจากนี้อย่างเป็นกลาง โดยเสนอเป็นตัวเลือกอิสระเพื่อให้มนุษย์เป็นผู้เลือกเอง ห้ามเรียงความสำคัญเป็นลำดับ Priority 1, 2 หรือสั่งให้ทำอะไรก่อนหลังเด็ดขาด

Risk of Acting & Risk of Waiting
- Risk of Acting: ผลเสียหรือความเสี่ยงที่อาจเกิดขึ้นจากการตัดสินใจหรือดำเนินการทันทีในสภาวะที่มีความไม่แน่นอนสูง ให้ปรับระดับความรุนแรงให้เหมาะสมตามบริบท (หากเป็นคำถามเชิงปรัชญา/วิชาการทั่วไป ให้ใช้ระดับความเสี่ยงเบาๆ เช่น "ความเสี่ยงในการยึดติดกับนิยามเดียว" ห้ามใช้คำขู่รุนแรงเกินจริง)
- Risk of Waiting: ผลเสียหรือความเสี่ยงจากการคงสภาพเดิม หรือการประวิงเวลาออกไป

Confidence
- ระบุระดับความมั่นใจในเชิงคุณภาพเท่านั้น: ต่ำ (Low) / ปานกลาง (Medium) / สูง (High)
- ให้เขียนตามแบบโครงสร้าง: "ระดับความมั่นใจ: [ระดับคุณภาพ]" และตามด้วยคำชี้แจง 1 ข้อระบุชัดเจนว่าเหตุใดคุณภาพข้อมูลปัจจุบันจึงส่งผลต่อความมั่นใจระดับนี้ (ห้ามคิดคำนวณหรือใช้ตัวเลขเปอร์เซ็นต์เด็ดขาด)

ส่วนปิดท้ายตามเจตนาผู้ใช้ (Dynamic Ending Section)
- โปรดเลือกรูปแบบวิธีปิดท้ายที่เหมาะสมที่สุดกับเจตนา (Intent) และเป้าหมายของผู้ใช้ (เลือก 1 จาก 4 รูปแบบต่อไปนี้ และระบุชื่อหัวข้อตามที่ระบุไว้):
  1. หากตอบข้อสงสัยได้เสร็จสิ้นแล้วและไม่ต้องสอบถามเพิ่ม -> ให้ใช้หัวข้อ "Closing Note" และเขียนข้อความสรุปประเด็นพิจารณาเพื่อปิดท้ายกระบวนการอย่างงดงามเป็นกลาง
  2. หากเป็นเรื่องชวนวิเคราะห์หรือคิดต่อยอด -> ให้ใช้หัวข้อ "Question" และเขียน "คำถามปลายเปิดที่เป็นกลางที่สุด 1 คำถาม" เพื่อเว้นพื้นที่คิดประเมินให้ผู้ใช้โดยไม่มีความชี้นำ
  3. หากเป็นหัวข้อเชิงวิชาการ/สารสนเทศที่เหมาะสมแก่การค้นคว้าเพิ่ม -> ให้ใช้หัวข้อ "Resources" และระบุแหล่งข้อมูล คีย์เวิร์ด หรือหัวข้อสำคัญสำหรับการไปศึกษาต่อ
  4. หากเป็นเรื่องที่ต้องตัดสินใจในทางปฏิบัติ -> ให้ใช้หัวข้อ "Decision Framework" เพื่อสรุปคำถามคัดกรองส่วนตัวสั้นๆ เพื่อให้ผู้ใช้ประเมินทางเลือกสุดท้ายด้วยตนเอง

คำถามของผู้ใช้: ${state.userInput}
บริบทและเป้าหมายเชิงปัญญา: ${state.purpose}
สมมติฐานเริ่มต้น: ${state.hypotheses.map(h => h.claim).join("; ")}
ข้อมูลที่ไม่แน่นอน: ${state.uncertainty.join("; ")}
การวิพากษ์ตนเอง (Critique) เบื้องต้น: ${state.critique.join("; ")}

จงตอบกลับด้วยภาษาไทยที่เป็นทางการ สุภาพ คมคาย และรักษาโครงสร้างทั้ง 11 ส่วนนี้ให้ครบถ้วนอย่างสมบูรณ์แบบที่สุด`;
    } else {
      return `You are "PUNN PCA" (PUNN Cognitive Architecture), operating in the Communication Stage.
Your goal is to serve as an unbiased Executive Summary Layer. Keep the response extremely sharp, professional, and readable.
Do NOT output any conversational preambles, greetings, or filler text (no "Welcome to...", "I am ready...", etc.). Start directly with the 11-part structured sections below in this exact order. Do not skip, merge, or reorder any section:

Summary
────────────
- Analyze the user's primary Intent before formulating the response:
  * Fact -> Provide a direct, factual answer immediately in a concise and clear manner in the first paragraph.
  * Definition -> Define or explain the core concept/phenomenon from multiple rich dimensions (e.g., if asked about love, explain it biologically, psychologically, philosophically, and experientially) in the first paragraph.
  * How-to -> Explain the systemic procedures or actionable steps clearly in the first paragraph.
  * Decision -> Outline the core choices and high-level structural options in the first paragraph.
  * Reflection -> Expand the problem framing and reflect on the conceptual dimensions in the first paragraph.
  * Emotional Support -> Respond with deep empathy, active listening, and calm neutrality in the first paragraph.
- [CRITICAL - MAXIMUM CONCISENESS] Structure the Summary as a true "Executive Summary" designed to be read within 20-30 seconds:
  * First paragraph: Provide a direct, high-value answer corresponding to the detected Intent (max 2-3 lines).
  * Second paragraph: Provide a highly concise, unbiased status overview of the cognitive evaluation and hypothesis validation (max 1-2 lines).
${depthInstruction}

Observation
- List ONLY raw objective facts derived from the user input (no subjective interpretation, assumptions, or judgments). Keep it extremely short, on a single line (e.g., 'The user asks "[user's query]"').

Evidence
- Known: Facts or data points explicitly confirmed or provided by the user in the input.
- Unknown: Key data gaps, unanswered questions, or missing personal/business context that are absent from the query but vital for deep analysis.

Supporting Assumptions
- List 1-2 key assumptions supporting the user's primary claim or direction.
- [CRITICAL] If no specific user or client assumptions can be logically inferred from the query (e.g., for general, academic, or philosophical queries), state exactly: "No additional assumptions can be inferred from the current data" to maintain the integrity of the framework.

Alternative Assumptions
- List 1-2 alternative systemic hypotheses to maintain a balanced, multi-dimensional view.

Key Contradiction
- Point out the single most important logical contradiction or conflict of hypotheses. Focus on conceptual conflict rather than a generic pros-and-cons trade-off.

Missing Information
- List only the top 2-3 most critical missing metrics or qualitative variables that would actively sway or flip the decision, ordered by impact.

Possible Next Steps
- Offer unbiased, non-prescriptive pathways for moving forward. Do NOT order them by priority (no Priority 1, 2) or tell the user what they "must" do first. Keep them as independent options to preserve human agency.

Risk of Acting & Risk of Waiting
- Risk of Acting: Potential downsides or risks of executing immediately with high uncertainty. Adjust the risk intensity appropriately to match the context. For philosophical, academic, or general queries that do not involve immediate critical actions, use a gentle, appropriate tone (e.g., "The risk of sticking to a single rigid definition" instead of extreme or dramatic warnings like "Making a critical life error" or "Failing relationships" which have no supporting context).
- Risk of Waiting: Potential costs or downsides of maintaining the status quo or waiting indefinitely.

Confidence
- State confidence strictly in qualitative terms: Low, Medium, or High.
- Format: "Confidence Level: [Low/Medium/High]" followed by a brief reason linked directly to the quality of available data (no percentages).

Dynamic Ending Section
- Choose the most natural concluding mode based on the user's context (select 1 out of 4 modes and use the corresponding heading):
  1. "Closing Note" -> If the query is fully answered and further questioning is unnecessary, conclude with a brief, validating summary of choice parameters.
  2. "Question" -> For deep or reflective topics, formulate exactly ONE natural, powerful, open-ended question to foster human reflection.
  3. "Resources" -> For research or technical topics, suggest advanced search terms, keywords, or learning vectors for further study.
  4. "Decision Framework" -> For practical action-oriented topics, outline a framing guide to help the human make the final choice.

User request: ${state.userInput}
Context & Purpose: ${state.purpose}
Initial hypotheses: ${state.hypotheses.map(h => h.claim).join("; ")}
Initial uncertainty: ${state.uncertainty.join("; ")}
Critique points: ${state.critique.join("; ")}

Write your response in professional, precise, and objective English, maintaining this 11-part structure with absolute rigor.`;
    }
  }

  private getFallbackResponse(state: CognitiveState): string {
    if (state.language === "th") {
      return `Summary
────────────
ยังไม่สามารถสรุปเชิงตัดสินได้ว่าแนวคิดหรือแนวทางการทำงานที่นำเสนอจะช่วยเพิ่มประสิทธิภาพได้จริง เนื่องจากข้อมูลเชิงปริมาณประกอบการเปรียบเทียบในปัจจุบันยังมีอยู่อย่างจำกัด

Observation
• มีการนำเสนอข้อมูลเพื่อเปรียบเทียบทางเลือกในการปรับปรุงประสิทธิภาพและรูปแบบการทำงาน

Evidence
• สิ่งที่ระบุชัดเจน (Proven/Provided): ความต้องการปรับแต่งรูปแบบการจัดกิจกรรมหรือรูปแบบการปฏิบัติงานให้ดียิ่งขึ้น
• สิ่งที่ยังไม่มีหลักฐาน (Unproven/Missing): ข้อมูลสถิติเชิงปริมาณผลลัพธ์การทำงานและระดับความพึงพอใจจริงของผู้มีส่วนเกี่ยวข้อง

Supporting Assumptions
• การเปลี่ยนผ่านสู่รูปแบบกิจกรรมหรือสถานที่ใหม่จะเพิ่มโอกาสในการสื่อสารและการทำงานร่วมกัน
• รูปแบบกิจกรรมเดิมมีคอขวดที่สามารถแก้ไขได้ด้วยการปรับเปลี่ยนโครงสร้างภายนอก

Alternative Assumptions
• ปัญหาประสิทธิภาพการทำงานอาจเกิดจากกระบวนการสื่อสารหรือเป้าหมายที่คลาดเคลื่อน ไม่ใช่เรื่องสถานที่หรือรูปแบบกิจกรรม
• ผู้ปฏิบัติงานบางส่วนอาจได้ผลงานที่ดีกว่าในสภาวะแวดล้อมปัจจุบันเนื่องจากสามารถจดจ่อกับงานเฉพาะหน้าได้ดีกว่า

Key Contradiction
• ความพยายามในการจัดสรรทรัพยากรเพื่อเพิ่มการทำงานร่วมกัน ↔ ความเสี่ยงในการสูญเสียสมาธิหรือสภาวะ Deep Work ของทีมงานที่ต้องการความเงียบสงบในการวิเคราะห์

Missing Information
• ปัญหาหรืออุปสรรคสำคัญที่เป็นคอขวดสูงสุดในการทำงานปัจจุบันคืออะไร
• เกณฑ์หรือตัวชี้วัดความสำเร็จ (KPI/OKRs) ที่ใช้วัดประสิทธิภาพการทำงานร่วมกันในปัจจุบัน

Possible Next Steps
- รวบรวมข้อมูลสถิติหรือจัดทำแบบสอบถามเชิงคุณภาพแบบไม่เปิดเผยตัวตนเพื่อระบุปัญหาหลักของทีม
- กำหนดเกณฑ์ตัวชี้วัดความสำเร็จและระยะเวลาในการทดลองปฏิบัติอย่างชัดเจนร่วมกัน
- จัดสัดส่วนการทดลองขนาดเล็กชั่วคราวเพื่อประเมินความพึงพอใจและสภาวะสมาธิในการทำงาน

Risk of Acting & Risk of Waiting
- Risk of Acting: สิ้นเปลืองงบประมาณ ทรัพยากร และลดสมาธิในการปฏิบัติงานของทีมหากเปลี่ยนผ่านโดยไม่มีเป้าหมายที่ชัดเจน
- Risk of Waiting: สูญเสียโอกาสในการยกระดับทีมเวิร์กและการทำงานร่วมกันหากคงสภาพเดิมท่ามกลางความอึดอัดใจที่ดำเนินอยู่

Confidence
ระดับความมั่นใจ: ต่ำ
• แหล่งข้อมูลอินพุตเริ่มต้นเป็นข้อมูลเชิงคุณภาพแบบสั้น และยังไม่ปรากฏประวัติสถิติประกอบการเปรียบเทียบอย่างมีนัยสำคัญ

Question
มีข้อมูลเชิงลึกหรือหลักฐานสนับสนุนใดที่ทำให้คุณเริ่มพิจารณาการเปลี่ยนแปลงรูปแบบในขณะนี้ เช่น ข้อร้องเรียนของทีมงาน หรือความล่าช้าในผลงาน?`;
    }
    return `Summary
────────────
It is currently unverified whether the proposed operational or architectural change will yield the intended performance improvements, as empirical data and quantitative metrics are currently limited.

Observation
• An evaluation process comparing operational structures or design methodologies has been initiated.

Evidence
• Proven/Provided: A stated desire to refine activity coordination or overall project workflow.
• Unproven/Missing: Quantitative baseline indicators regarding current output velocity or stakeholder satisfaction.

Supporting Assumptions
• Transitioning to a new physical workspace or meeting structure directly facilitates continuous collaboration.
• The current environment introduces barriers to communication that cannot be resolved through process optimization alone.

Alternative Assumptions
• Bottlenecks may stem from alignment issues or toolchains rather than structural configuration.
• Individual contributors may deliver higher-quality outputs under isolated, uninterrupted focus conditions.

Key Contradiction
• Seeking to optimize real-time collaboration ↔ Guaranteeing the continuous, deep focus periods required for heavy analytical or creative tasks.

Missing Information
• What is the specific, primary operational bottleneck encountered in current processes?
• What metrics or KPIs are currently employed to measure team output and overall satisfaction?

Possible Next Steps
- Conduct a lightweight anonymous survey to capture team experiences and isolate key frustrations.
- Establish clear, quantitative success metrics and baseline parameters before initiating changes.
- Design a localized, time-bound experiment to evaluate proposed modifications with minimal operational overhead.

Risk of Acting & Risk of Waiting
- Risk of Acting: Introducing unnecessary cognitive load, financial overhead, and disruption to deep focus routines without verifying the root cause.
- Risk of Waiting: Prolonging potential team frustration and missing opportunities to eliminate communication bottlenecks in a timely manner.

Confidence
Confidence Level: Low
• The initial prompt contains only high-level qualitative concerns, requiring adjacent baseline telemetry to validate the systemic assumptions.

Question
What core motivations or evidence, such as team feedback or delivery bottlenecks, prompted you to consider this structural change?`;
  }

  private async communicate(state: CognitiveState): Promise<void> {
    let source = "deterministic_fallback";
    if (this.ai) {
      try {
        const prompt = this.getCommunicationPrompt(state);
        const response = await this.ai.models.generateContent({
          model: this.model,
          contents: prompt,
          config: {
            temperature: this.temperature,
          },
        });
        if (response.text) {
          state.response = response.text.trim();
          source = "gemini";
        }
      } catch (exc: any) {
        state.notes.push(`Gemini API error: ${exc.message || exc}`);
      }
    }

    if (!state.response) {
      state.response = this.getFallbackResponse(state);
    }

    recordStateStage(state, CognitiveStage.COMMUNICATION, {
      response: state.response,
      source,
    });
  }

  private reflect(state: CognitiveState): void {
    state.reflection.push(
      "The cycle preserved observations separately from hypotheses and communicated uncertainty."
    );
    recordStateStage(state, CognitiveStage.REFLECTION, {
      reflection: [...state.reflection],
    });
  }

  private learn(state: CognitiveState): void {
    if (state.observations.length > 0) {
      const item: MemoryItem = {
        content: state.observations[0],
        layer: MemoryLayer.REFLECTIVE,
        source: "cognitive_dna_cycle",
        confidence: state.confidence,
        context: { purpose: state.purpose },
        created_at: new Date().toISOString(),
      };
      this.memory.remember(item);
      state.learning.push("Stored a traceable reflective memory for future relevance-based retrieval.");
    }
    recordStateStage(state, CognitiveStage.LEARNING, {
      learning: [...state.learning],
    });
  }

  private validateTrace(state: CognitiveState): void {
    const observed = state.trace.map((entry) => entry.stage);
    const expected = COGNITIVE_DNA.map((stage) => stage as string);

    const isMatch =
      observed.length === expected.length &&
      observed.every((val, index) => val === expected[index]);

    if (!isMatch) {
      throw new Error("Cognitive DNA stages must execute once and in specification order.");
    }
  }
}
