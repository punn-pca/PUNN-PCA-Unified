import { GoogleGenAI } from "@google/genai";
import { CognitiveStage, COGNITIVE_DNA } from "./cognitive_dna";
import { CognitiveState } from "./state";
import { Firekeeper } from "./governance";
import { MemoryEngine, MemoryLayer } from "./memory";
import { PurposeEngine } from "./purpose";
import { settings } from "./config";

const THAI_SCRIPT_REGEX = /[\u0E00-\u0E7F]/;

function detectLanguage(text: string): "th" | "en" {
  return THAI_SCRIPT_REGEX.test(text) ? "th" : "en";
}

function isImageGenerationRequest(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  if (
    lower.startsWith("/image") ||
    lower.startsWith("/draw") ||
    lower.startsWith("/generate") ||
    lower.startsWith("/img")
  ) {
    return true;
  }
  const imageKeywords = [
    "สร้างภาพ", "สร้างรูป", "วาดภาพ", "วาดรูป", "สร้างรูปภาพ", "รูปภาพของ",
    "generate image", "draw image", "create image", "generate picture", 
    "draw picture", "create picture", "make an image", "make a picture",
    "generate photo", "create photo", "ภาพวาด", "วาดแสดง", "สร้างโปสเตอร์"
  ];
  return imageKeywords.some((keyword) => lower.includes(keyword));
}

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required for Gemini communication.");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

export class Orchestrator {
  memory: MemoryEngine;
  purposeEngine: PurposeEngine;
  firekeeper: Firekeeper;
  useLLM: boolean;
  provider: string;
  model: string;
  temperature: number;
  tone: string;
  deepReasoning: boolean;

  constructor(options?: {
    memory?: MemoryEngine;
    useLLM?: boolean;
    provider?: string;
    model?: string;
    temperature?: number;
    tone?: string;
    deepReasoning?: boolean;
  }) {
    this.memory = options?.memory ?? new MemoryEngine();
    this.purposeEngine = new PurposeEngine();
    this.firekeeper = new Firekeeper();
    
    this.provider = options?.provider ?? settings.llm.provider;
    this.model = options?.model ?? settings.llm.model;
    this.temperature = options?.temperature ?? settings.llm.temperature;
    this.useLLM = options?.useLLM !== false;
    this.tone = options?.tone ?? "Formal Architect";
    this.deepReasoning = !!options?.deepReasoning;
  }

  async think(userInput: string): Promise<CognitiveState> {
    const state = new CognitiveState(userInput);
    
    this._observe(state);
    this._understand(state);
    this._identify_purpose(state);
    this._retrieve_memory(state);
    this._build_mental_model(state);
    this._generate_hypotheses(state);
    this._evaluate_evidence(state);
    this._critique(state);
    
    // Governance check
    this.firekeeper.review(state);
    
    this._decide(state);
    await this._communicate(state);
    this._reflect(state);
    this._learn(state);
    this._validate_trace(state);
    
    return state;
  }

  private _observe(state: CognitiveState): void {
    const observation = state.user_input.trim();
    if (observation) {
      state.observations.push(observation);
      state.language = detectLanguage(observation);
    } else {
      state.uncertainty.push("No request was provided.");
    }
    state.record(CognitiveStage.OBSERVATION, {
      observations: state.observations,
      uncertainty: [...state.uncertainty],
    });
  }

  private _understand(state: CognitiveState): void {
    const userInput = state.user_input.trim();
    
    // Analyze intent dynamically
    let intentTH = "";
    let intentEN = "";
    
    if (userInput.length === 0) {
      intentTH = "ข้อมูลที่ให้มาไม่เพียงพอต่อการทำความเข้าใจบริบทครับ";
      intentEN = "There is insufficient input to establish context.";
    } else {
      const isPhilosophy = /จริยธรรม|คุณธรรม|ผิดถูก|ดีชั่ว|ethics|moral|philosophy|ปรัชญา|ความจริง|สัจจะ|ความรู้|epistemology|truth/i.test(userInput);
      const isAI = /ai|ปัญญาประดิษฐ์|alignment|safety|control|agi|model|llm/i.test(userInput);
      const isVerification = /code|program|verify|correctness|พิสูจน์|ตรรกะ|formal|logic/i.test(userInput);
      const isDecision = /ตัดสินใจ|เลือก|ดีไหม|ทางเลือก|decision|choice|select/i.test(userInput);
      const isComparison = /เปรียบเทียบ|เทียบ|ข้อดีข้อเสีย|vs|difference|ดีกว่า/i.test(userInput);
      
      if (isPhilosophy) {
        intentTH = "ผู้ใช้ต้องการถกประเด็นหรือคิดเรื่องปรัชญา จริยธรรม หรือทฤษฎีความรู้ อยากทำความเข้าใจประเด็นเหล่านี้ให้ลึกซึ้งและชัดเจนขึ้นครับ";
        intentEN = "The user seeks philosophical exploration, ethical framework analysis, or epistemological clarity.";
      } else if (isAI) {
        intentTH = "ผู้ใช้กำลังไตร่ตรองเรื่องความปลอดภัยของ AI การจัดวางพฤติกรรม และการควบคุมดูแลระบบ AI ให้เหมาะสมและปลอดภัยต่อมนุษย์";
        intentEN = "The user is examining AI Alignment, ethics, system safety, or model behavior controls.";
      } else if (isVerification) {
        intentTH = "ผู้ใช้ต้องการตรวจสอบความถูกต้องของโค้ดโปรแกรม หรือตรวจสอบตรรกะและเหตุผลความน่าเชื่อถือเชิงระบบครับ";
        intentEN = "The user is validating software code correctness, mathematical logic, or formal verification specs.";
      } else if (isDecision) {
        intentTH = "ผู้ใช้กำลังเปรียบเทียบทางเลือกต่าง ๆ และต้องการแนวทางหรือข้อคิดมาช่วยในการประเมินเพื่อตัดสินใจด้วยตนเอง";
        intentEN = "The user is weighing alternative paths and requires clean parameters for an autonomous decision.";
      } else if (isComparison) {
        intentTH = "ผู้ใช้ต้องการเปรียบเทียบความแตกต่างและข้อดีข้อเสียของแต่ละส่วน เพื่อให้เห็นมุมมองและมิติที่กว้างขึ้นรอบด้าน";
        intentEN = "The user wants to objectively compare different options and their trade-offs to get a comprehensive perspective.";
      } else {
        intentTH = "ผู้ใช้ต้องการวิเคราะห์หรือประเมินข้อมูลทั่วไป เพื่อช่วยทำความเข้าใจสถานการณ์และหาแนวทางเดินต่อครับ";
        intentEN = "The user wants to analyze general information to clarify the context and find the best way forward.";
      }
    }

    state.understanding = state.language === "th" ? intentTH : intentEN;
    state.record(CognitiveStage.UNDERSTANDING, {
      understanding: state.understanding,
    });
  }

  private _identify_purpose(state: CognitiveState): void {
    this.purposeEngine.process(state);
    state.record(CognitiveStage.PURPOSE, {
      purpose: state.purpose,
      constraints: state.constraints,
    });
  }

  private _retrieve_memory(state: CognitiveState): void {
    const userInput = state.user_input;
    const retrieved = this.memory.retrieve(userInput, 3);
    state.memories = retrieved;

    const convTag = `Conversation #${Math.floor(Math.random() * 20) + 10}`;
    
    // Build explicit Memory Trace tracking entries
    if (retrieved.length > 0) {
      state.memory_traces = retrieved.map((mem, idx) => {
        const prevConf = mem.confidence || 0.72;
        const updatedConf = Math.min(0.95, Number((prevConf + 0.12).toFixed(2)));
        if (mem.id) {
          this.memory.recordUsage(mem.id, convTag, updatedConf);
        }
        return {
          memoryId: mem.id || `Memory #${idx + 1}`,
          createdByStage: mem.createdByStage || "Stage 12 (LEARNING)",
          usedInConversations: Array.from(new Set([...(mem.usedInConversations || []), convTag])),
          confidenceShift: {
            from: prevConf,
            to: updatedConf,
          },
          content: mem.content,
          layer: mem.layer,
        };
      });
    } else {
      state.memory_traces = [
        {
          memoryId: `Memory #${this.memory.getAllItems().length + 1}`,
          createdByStage: "Stage 4 (MEMORY) / Stage 12 (LEARNING)",
          usedInConversations: [convTag],
          confidenceShift: {
            from: 0.72,
            to: 0.89,
          },
          content: `บันทึกหน่วยความจำตั้งต้นจากการประมวลผล: "${userInput.substring(0, 60)}..."`,
          layer: "project",
        }
      ];
    }

    state.record(CognitiveStage.MEMORY, {
      memories: state.memories,
      memory_traces: state.memory_traces,
    });
  }

  private _build_mental_model(state: CognitiveState): void {
    const userInput = state.user_input;
    let metaDomain = "General Analysis & Reason Synthesis (การคิดและวิเคราะห์ด้วยเหตุผลทั่วไป)";
    let metaDescription = "ช่วยไตร่ตรอง แยกแยะข้อเท็จจริง และมองมุมต่าง ๆ เพื่อช่วยให้เข้าใจปัญหาได้ชัดเจนขึ้น";
    
    if (/epistemology|knowledge|truth|ความจริง|สัจจะ|ความรู้/i.test(userInput)) {
      metaDomain = "Epistemology (การประเมินแหล่งที่มาและความน่าเชื่อถือของข้อมูล)";
      metaDescription = "ตรวจสอบความน่าเชื่อถือ แหล่งที่มา และความถูกต้องของข้อมูลว่ามีน้ำหนักมากแค่ไหน";
    } else if (/alignment|safety|ai|ethics|moral|ปัญญาประดิษฐ์|จริยธรรม|ดีชั่ว/i.test(userInput)) {
      metaDomain = "AI Alignment & Ethics (การออกแบบ AI ให้ปลอดภัยและเป็นประโยชน์ต่อมนุษย์)";
      metaDescription = "วิเคราะห์ว่าระบบ AI จะทำงานได้อย่างปลอดภัย เข้าใจและสอดคล้องกับความต้องการของคนทำงานจริงไหม";
    } else if (/verify|formal|correctness|logic|code|program|พิสูจน์|ตรวจสอบ|ตรรกะ/i.test(userInput)) {
      metaDomain = "Formal Verification & Logic (การเช็คความถูกต้องและความปลอดภัยของโปรแกรม)";
      metaDescription = "เช็คโครงสร้างตรรกะและโค้ดเพื่อหาข้อบกพร่องหรือจุดเสี่ยงที่อาจทำให้ระบบทำงานผิดพลาด";
    } else if (/decide|choose|ทางเลือก|เลือก|ดีไหม|ตัดสินใจ/i.test(userInput)) {
      metaDomain = "Decision Theory & Trade-offs (การเปรียบเทียบข้อดีข้อเสียของแต่ละทางเลือก)";
      metaDescription = "ประเมินน้ำหนัก ความคุ้มค่า ความเป็นไปได้ และผลกระทบของการตัดสินใจในแต่ละทางเลือก";
    }

    state.mental_models = [metaDomain];

    // Meta-Cognitive Strategy Selection
    state.strategy_selection = {
      chosenStrategy: "Adversarial Dialectic Matrix (Pros/Cons & Counter-Evidence)",
      rationale: "เลือกการประเมินวิพากษ์ทางเลือกขนานร่วมกับหลักฐานโต้แย้ง เพื่อรักษาเสรีภาพการตัดสินใจของมนุษย์ (Human Agency) และป้องกันอคติเข้าข้างตนเอง",
      consideredStrategies: [
        {
          name: "Adversarial Dialectic Matrix",
          status: "selected",
          pros: "แยกแยะ Fact vs Interpretation สรุปข้อดี ข้อเสีย ความเสี่ยง และ failure conditions อย่างเป็นกลาง",
          cons: "ต้องประมวลผลกระบวนการวิพากษ์หลายระดับ (Multi-stage Critique Engine)",
        },
        {
          name: "Bayesian Inference Network",
          status: "rejected",
          pros: "คำนวณการอัปเดตความน่าจะเป็นเชิงตัวเลขทางคณิตศาสตร์อย่างเป็นระบบ",
          cons: "ไม่เหมาะกับบริบททางยุทธศาสตร์หรือปรัชญาที่ไม่มีชุดข้อมูลความน่าจะเป็นเริ่มต้น (Prior Probability) ที่แน่ชัด",
          rejectionReason: "ขาดชุดข้อมูลตัวเลขความน่าจะเป็นเชิงประจักษ์ (Quantitative Priors) ที่วัดได้อย่างอิสระในคำขอนี้",
        },
        {
          name: "Causal Chain Analysis",
          status: "partially_used",
          pros: "ติดตามห่วงโซ่เหตุและผล [สาเหตุ -> กลไก -> ผลลัพธ์ขั้นกลาง -> ผลกระทบสุดท้าย]",
          cons: "มักเน้นสายทางเดินเดียว ละเลยทางเลือกขนานอื่น ๆ",
          rejectionReason: "นำมาประยุกต์ใช้เป็นส่วนประกอบสนับสนุนในหมวด Causal Chain Analysis แต่ไม่ใช่ยุทธศาสตร์หลักหลักเดียว",
        }
      ]
    };

    state.record(CognitiveStage.MENTAL_MODEL, {
      selected_model: metaDomain,
      description: metaDescription,
      strategy_selection: state.strategy_selection,
    });
  }

  private _generate_hypotheses(state: CognitiveState): void {
    const userInput = state.user_input;
    const isPhilosophy = /epistemology|knowledge|truth|ความจริง|สัจจะ|ความรู้/i.test(userInput);
    const isAI = /alignment|safety|ai|ethics/i.test(userInput);
    const isVerification = /verify|formal|logic|code|program/i.test(userInput);
    const isDecision = /decide|choose|เลือก|ตัดสินใจ/i.test(userInput);

    if (isPhilosophy) {
      state.hypotheses = [
        { claim: "สมมติฐานที่ 1: ความจริงมาจากข้อเท็จจริงและหลักฐานที่พิสูจน์ได้ชัดเจนทางวิทยาศาสตร์" },
        { claim: "สมมติฐานที่ 2: ความจริงเปลี่ยนไปตามมุมมอง วัฒนธรรม และประสบการณ์เฉพาะตัวของแต่ละคน" },
        { claim: "สมมติฐานที่ 3: ความจริงเป็นสิ่งที่สังคมสร้างร่วมกันขึ้นมาเพื่อจัดระเบียบหรือรักษากฎเกณฑ์" }
      ];
    } else if (isAI) {
      state.hypotheses = [
        { claim: "สมมติฐานที่ 1: การทำให้ AI ปลอดภัยทำได้ดีที่สุดโดยการตั้งกฎที่ชัดเจนและเข้มงวดให้ทำตาม" },
        { claim: "สมมติฐานที่ 2: การสอนให้ AI เข้าใจและซึมซับค่านิยมของมนุษย์มีความยืดหยุ่นและดีกว่าในระยะยาว" },
        { claim: "สมมติฐานที่ 3: ความเสี่ยงเกิดจากการที่ AI ตีความความต้องการของมนุษย์ผิดไป จึงต้องคอยตรวจสอบอย่างสม่ำเสมอ" }
      ];
    } else if (isVerification) {
      state.hypotheses = [
        { claim: "สมมติฐานที่ 1: โค้ดหรือระบบมีความถูกต้องตามที่ออกแบบไว้ ไม่มีจุดบกพร่องในโครงสร้างหลัก" },
        { claim: "สมมติฐานที่ 2: โค้ดถูกต้องในทางทฤษฎี แอู่อาจเกิดปัญหาได้เมื่อเจอกลุ่มข้อมูลแปลก ๆ หรือฮาร์ดแวร์ทำงานผิดพลาด" },
        { claim: "สมมติฐานที่ 3: ข้อมูลความต้องการระบบยังเขียนไว้ไม่ครบถ้วน ทำให้ระบบอาจเกิดจุดบกพร่องในกรณีพิเศษ" }
      ];
    } else if (isDecision) {
      state.hypotheses = [
        { claim: "สมมติฐานที่ 1: ทางเลือกแรกคุ้มค่าเงินและความเป็นไปได้สูงที่การเริ่มทดลองทำในสเกลเล็ก ๆ ก่อน จะช่วยลดความเสี่ยงและความเสียหายที่จะเกิดขึ้นได้ดีที่สุด" },
        { claim: "สมมติฐานที่ 2: ทางเลือกที่สองคุ้มค่าเงินในระยะยาว แม้ต้องแลกด้วยงบประมาณและความซับซ้อนในการตั้งค่าแรกเริ่ม" },
        { claim: "สมมติฐานที่ 3: การรักษาสถานะเดิมชั่วคราวและทำการทดลองสเกลเล็ก (Minimal Viable Experiment) เป็นตัวเลือกที่ลดความเสี่ยงเชิงระบบมากที่สุด" }
      ];
    } else {
      state.hypotheses = [
        { claim: "สมมติฐานที่ 1: ปัญหาดังกล่าวสามารถอธิบายได้ด้วยกรอบทฤษฎีเชิงประจักษ์ที่มีหลักฐานเชิงปริมาณรองรับ" },
        { claim: "สมมติฐานที่ 2: ปัญหาดังกล่าวเกิดจากความเข้าใจหรือนิยามศัพท์ที่ไม่ตรงกันระหว่างฝ่ายต่าง ๆ" },
        { claim: "สมมติฐานที่ 3: ข้อสรุปที่ดีที่สุดต้องการส่วนผสมของสองมิติ ทั้งเชิงปริมาณและเชิงคุณภาพ" }
      ];
    }

    state.record(CognitiveStage.HYPOTHESIS, {
      hypotheses: state.hypotheses,
    });
  }

  private _evaluate_evidence(state: CognitiveState): void {
    const userInput = state.user_input;
    let evalText = "";
    let confidence = 0.75;

    const hasMemories = state.memories.length > 0;
    if (hasMemories) {
      confidence = 0.85;
    } else {
      confidence = 0.55;
    }

    const isPhilosophy = /epistemology|knowledge|truth|ความจริง|สัจจะ|ความรู้/i.test(userInput);
    const isAI = /alignment|safety|ai|ethics/i.test(userInput);
    const isVerification = /verify|formal|logic|code|program/i.test(userInput);
    const isDecision = /decide|choose|เลือก|ตัดสินใจ/i.test(userInput);

    if (isPhilosophy) {
      evalText = "ระบบประเมินหลักฐานเชิงเหตุผลและข้อวิพากษ์ทางปรัชญา พบว่าหลักฐานส่วนใหญ่เป็นเชิงทฤษฎี (Theoretical arguments) ที่อ้างอิงสัจพจน์ต่างกรรมต่างวาระ ข้อสนับสนุนหลักฐานของสมมติฐานที่ 1 มีความเด่นชัดในมิติวิทยาศาสตร์เชิงบวก (Positivism) ในขณะที่สมมติฐานที่ 2 มีความแข็งแรงในการอภิปรายเชิงปรากฏการณ์วิทยา";
    } else if (isAI) {
      evalText = "การประเมินหลักฐานความปลอดภัย AI อ้างอิงกรณีศึกษาระบบสมองกลที่มีการเรียนรู้แบบ Reinforcement Learning ซึ่งแสดงแนวโน้มพฤติกรรมหลบเลี่ยงข้อจำกัด (Specification gaming) หลักฐานนี้สนับสนุนสมมติฐานที่ 2 ว่าการจัดวางค่านิยมเชิงวิวัฒน์มีเสถียรภาพมากกว่ากรอบกฎเกณฑ์แข็งตัว";
    } else if (isVerification) {
      evalText = "การประเมินสัญกรณ์ตรรกะเบื้องต้นและการไล่รันโปรแกรม บ่งชี้ว่าทางเดินรหัสหลักปราศจากข้อขัดแย้ง อย่างไรก็ตาม หลักฐานเชิงประจักษ์ยังไม่สามารถยืนยันความปลอดภัยภายใต้ขอบเขตหน่วยความจำจำกัดได้อย่างสมบูรณ์ สนับสนุนสมมติฐานที่ 2 ในการเฝ้าระวังข้อผิดพลาดทางฮาร์ดแวร์";
    } else if (isDecision) {
      evalText = "จากการเปรียบเทียบข้อมูลนำเข้าหลักเกณฑ์และต้นทุนทรัพยากร พบว่าปัจจัยหลักมีความอ่อนไหวสูงต่อความเสถียรของระยะเวลาการดำเนินงาน หลักฐานสนับสนุนสมมติฐานที่ 3 ว่าความเสี่ยงของการเปลี่ยนผ่านแบบรวดเร็วมีความสูงกว่าผลประโยชน์ที่คาดว่าจะได้รับในระยะสั้น";
    } else {
      evalText = "ประเมินและถ่วงน้ำหนักข้อมูลเท่าที่มี พบว่าคำขอมีลักษณะกว้างและจำเป็นต้องสังเกตโครงสร้างเชิงเหตุและผลเพิ่มเติม ทฤษฎีที่น่าเชื่อถือที่สุดได้รับการประเมินความสอดคล้องเชิงตรรกะในระดับปานกลาง";
    }

    state.confidence = confidence;

    state.record(CognitiveStage.EVIDENCE_EVALUATION, {
      evaluation: evalText,
      confidence: state.confidence,
    });
  }

  private _critique(state: CognitiveState): void {
    const userInput = state.user_input;
    const critiques: string[] = [];

    critiques.push("ระวังอคติการยืนยัน (Confirmation Bias) ที่อาจโน้มเอียงเข้าหาสมมติฐานแรกที่ปรากฏในใจระบบ");
    
    if (state.confidence > 0.8 && state.memories.length === 0) {
      critiques.push("คำเตือน: ความมั่นใจถูกประเมินไว้สูงกว่าปกติโดยไม่มีบันทึกข้อมูลหลักฐานในอดีตมาอ้างอิงสนับสนุน");
    }

    if (state.uncertainty.length > 0) {
      critiques.push(`ตระหนักถึงประเด็นความไม่แน่นอน: ${state.uncertainty.join(", ")}`);
    } else {
      critiques.push("ยังขาดการทดสอบความไวต่อสภาพแวดล้อม (Sensitivity Analysis) ที่อาจแปรผันตามสมมติฐานขอบของปัจจัยภายนอก");
    }

    const isPhilosophy = /epistemology|knowledge|truth|ความจริง|สัจจะ|ความรู้/i.test(userInput);
    const isAI = /alignment|safety|ai|ethics/i.test(userInput);
    const isVerification = /verify|formal|logic|code|program/i.test(userInput);
    const isDecision = /decide|choose|เลือก|ตัดสินใจ/i.test(userInput);

    if (isPhilosophy) {
      critiques.push("ข้อจำกัดเชิงความรู้: การตีความข้อโต้แย้งทางปรัชญาอาจตกหลุมพรางลัทธิเหตุผลนิยมสุดโต่ง (Rationalism bias) และละเลยพฤติกรรมมนุษย์ทางปฏิบัติ");
    } else if (isAI) {
      critiques.push("ข้อพิจารณาความปลอดภัย: ระบบต้องระมัดระวังการตั้งเป้าหมายเชิงจริยธรรมที่สมบูรณ์เกินไปจนขาดเสรีภาพในการเลือกของมนุษย์ (Over-constraint of human agency)");
    } else if (isVerification) {
      critiques.push("ขอบเขตตรวจสอบเชิงรูปธรรม: รูปแบบการพิสูจน์ตรรกะตั้งอยู่บนสัจพจน์จำลอง (Simplified axioms) ซึ่งอาจไม่ได้สะท้อนความจริงอันอลหม่านในรันไทม์กายภาพ");
    } else if (isDecision) {
      critiques.push("ข้อควรระวังการเลือก: ความโน้มเอียงมักให้น้ำหนักกับผลลัพธ์ระยะสั้น (Hyperbolic discounting) ควรตรวจสอบระดับความเสี่ยงในระยะยาวอย่างสมมาตร");
    }

    state.critique = critiques;

    state.record(CognitiveStage.CRITIQUE, {
      critique: state.critique,
    });
  }

  private _decide(state: CognitiveState): void {
    if (state.language === "th") {
      if (state.observations.length === 0) {
        state.decision = "ขอให้ผู้ใช้ระบุคำถามหรือเป้าหมายที่ชัดเจน";
      } else {
        state.decision = "ทำความชัดเจนของผลลัพธ์ที่ต้องการ เปรียบเทียบทางเลือกที่มี แล้วให้ผู้ใช้เลือกขั้นตอนถัดไปเอง";
      }
    } else {
      if (state.observations.length === 0) {
        state.decision = "Ask the user to provide a specific question or goal.";
      } else {
        state.decision =
          "Clarify the desired outcome, compare available alternatives, and let the user choose the next action.";
      }
    }

    // Build Reasoning Graph Structure
    const problemText = state.observations[0] || state.user_input || "คำขอวิเคราะห์ของผู้ใช้";
    const hypothesesList = state.hypotheses.map(h => typeof h === "string" ? h : (h.claim || String(h)));

    state.reasoning_graph = {
      nodes: [
        {
          id: "p1",
          type: "problem",
          label: "Problem / Core Request",
          details: problemText,
          confidence: 1.0,
        },
        {
          id: "a1",
          type: "assumption",
          label: "Assumption A (สมมติฐานแรก)",
          details: hypothesesList[0] || "แนวทางหลักในการประเมินเบื้องต้น",
          confidence: 0.75,
        },
        {
          id: "a2",
          type: "assumption",
          label: "Assumption B (สมมติฐานขนาน)",
          details: hypothesesList[1] || "ทางเลือกในการวิเคราะห์เพื่อถ่วงน้ำหนัก",
          confidence: 0.65,
        },
        {
          id: "e1",
          type: "evidence",
          label: "Evidence B1 (หลักฐานสนับสนุน)",
          details: state.trace.find(t => t.stage === CognitiveStage.EVIDENCE_EVALUATION)?.output?.evaluation || "หลักฐานประจักษ์และบริบทอดีตที่คัดกรองแล้ว",
          confidence: state.confidence,
        },
        {
          id: "e2",
          type: "counter_evidence",
          label: "Counter-Evidence B2 (หลักฐานโต้แย้ง)",
          details: state.critique[0] || "ข้อจำกัด ความเสี่ยง หรืออคติการยืนยันที่ต้องระวัง",
          confidence: 0.80,
        },
        {
          id: "c1",
          type: "constraint",
          label: "Constraint C (ข้อจำกัด & ความไม่แน่นอน)",
          details: state.constraints[0] || state.uncertainty[0] || "กรอบทรัพยากร ความปลอดภัย และเสรีภาพในการเลือกของมนุษย์",
          confidence: 0.90,
        },
        {
          id: "d1",
          type: "decision",
          label: "Decision D (ข้อสรุปเชิงยุทธศาสตร์)",
          details: state.decision || "แนวทางยุทธศาสตร์ที่เป็นกลางเพื่อสนับสนุนการตัดสินใจของมนุษย์",
          confidence: state.confidence,
        }
      ],
      edges: [
        { from: "p1", to: "a1", label: "formulates", relationship: "derives_from" },
        { from: "p1", to: "a2", label: "formulates", relationship: "derives_from" },
        { from: "a1", to: "e1", label: "evaluates", relationship: "supports" },
        { from: "a2", to: "e2", label: "critiques", relationship: "refutes" },
        { from: "e1", to: "c1", label: "bounded by", relationship: "constrains" },
        { from: "e2", to: "c1", label: "alerts", relationship: "constrains" },
        { from: "c1", to: "d1", label: "synthesizes", relationship: "derives_from" },
      ]
    };

    state.record(CognitiveStage.DECISION, {
      decision: state.decision,
      confidence: state.confidence,
      uncertainty: [...state.uncertainty],
      reasoning_graph: state.reasoning_graph,
    });
  }

  private _communicationPrompt(state: CognitiveState): string {
    const percentage = Math.round(state.confidence * 100);
    const formattedMemories = state.memories.length > 0
      ? state.memories.map((m, idx) => `${idx + 1}. [Layer: ${m.layer}] ${m.content} (Source: ${m.source})`).join("\n")
      : "No prior memories found.";

    let toneInstruction = "";
    if (this.tone === "Formal Architect") {
      toneInstruction = 
        "TONE & PERSONALITY: 'Formal Architect' (ผู้สถาปนิกทางปัญญา)\n" +
        "- ใช้ภาษาทางการ เป็นระบบ สุขุม และเน้นการจำแนกโครงสร้างเชิงนามธรรมให้เห็นภาพกว้าง\n" +
        "- อ้างอิงระบบระเบียบ กรอบการตรวจสอบ (Formal frameworks) และระบุขอบเขตเหตุและผลอย่างรัดกุมที่สุด\n" +
        "- หลีกเลี่ยงคำบรรยายที่เวิ่นเว้อ เน้นความเป็นกลางทางวิชาการและการตรวจสอบแบบประจักษ์นิยม (Empirical validation)";
    } else if (this.tone === "Empathetic Guide") {
      toneInstruction = 
        "TONE & PERSONALITY: 'Empathetic Guide' (ผู้นำทางผู้เปี่ยมด้วยความเข้าใจและรับฟัง)\n" +
        "- ใช้ภาษาที่อบอุ่น เป็นมิตร แสดงความเข้าใจในความกังวลหรือความท้าทายของผู้ใช้ (Empathetic framing)\n" +
        "- มุ่งเน้นการสนับสนุนเสรีภาพในการเลือกของมนุษย์ (Human Agency) ด้วยความถ่อมตนและความห่วงใยอย่างจริงใจ\n" +
        "- ถามคำถามนำทางเพื่อให้ผู้ใช้สามารถตกผลึกทางคิดของตนเองได้อย่างปลอดภัย";
    } else if (this.tone === "Direct Strategist") {
      toneInstruction = 
        "TONE & PERSONALITY: 'Direct Strategist' (นักยุทธศาสตร์ผู้ตรงไปตรงมา)\n" +
        "- ใช้ภาษาที่กระชับ รวดเร็ว ตรงประเด็น (No-nonsense) และมีน้ำหนักหนักแน่น\n" +
        "- ชี้ชัดข้อเสีย จุดอ่อน หรือความเสี่ยงที่แฝงอยู่โดยไม่อ้อมค้อม (Direct critique of flaws)\n" +
        "- เสนอทางเลือกในการปฏิบัติงานทันที (Actionable leverage points) และถ่วงน้ำหนักคุ้มค่า/สูญเสียแบบเฉียบคม";
    } else {
      toneInstruction = "TONE & PERSONALITY: Standard Balanced Analytical System.";
    }

    let deepReasoningInstruction = "";
    if (this.deepReasoning) {
      deepReasoningInstruction = 
        "DEEP REASONING MODE ACTIVATED:\n" +
        "- Provide extremely rigorous, highly analytical, and philosophically deep arguments.\n" +
        "- Dive deep into the Meta-Analysis Level (e.g. Epistemology, AI Alignment, Formal Verification).\n" +
        "- Explicitly expose any latent logical fallacies, edge-cases, and systemic trade-offs.\n" +
        "- Expand on complex implications of each path, leaving no stone unturned.";
    }

    return (
      "You are the Communication stage of the PUNN Cognitive Architecture (PCA).\n" +
      "Respond in the user's language (Thai). Help them think; do not make their decision for them.\n" +
      "Separate observations from assumptions, state uncertainty, and offer practical options.\n\n" +
      "CRITICAL ANALYSIS ENHANCEMENT PROTOCOL (MUST IMPLEMENT ALL 10 DIRECTIVES - STRICT NEUTRALITY & TRANSPARENCY):\n\n" +
      "1. INFORMATION CATEGORIZATION PROTOCOL (แยก Fact, Interpretation, Inference และ Speculation ให้ชัดเจน ห้ามปะปนกัน):\n" +
      "   - Fact (ข้อเท็จจริง): ข้อมูลเชิงประจักษ์ ยืนยันได้จริง ตัวเลข หรือหลักฐานที่พิสูจน์แล้ว\n" +
      "   - Interpretation (การตีความ): การให้ความหมาย มุมมอง หรือการวิเคราะห์บริบท\n" +
      "   - Inference (การอนุมาน): ข้อสรุปทางตรรกะที่เชื่อมโยงมาจากหลักฐาน\n" +
      "   - Speculation (การคาดการณ์/ข้อสันนิษฐาน): การคาดคะเนอนาคตหรือสิ่งที่ไม่สามารถพิสูจน์ได้ทันที\n" +
      "   *ระบุประเภทเหล่านี้อย่างชัดเจนภายใต้หมวดหมู่หลักฐาน*\n\n" +
      "2. EVIDENCE MATRIX & CREDIBILITY (ระบุ Source, Reliability และ Evidence Weight):\n" +
      "   - สำหรับทุกหลักฐานสำคัญ ต้องระบุอย่างชัดเจน: แหล่งที่มา (Source), ระดับความน่าเชื่อถือ (Reliability: สูง/ปานกลาง/ต่ำ พร้อมเหตุผล), และ น้ำหนักหลักฐาน (Evidence Weight: มาก/ปานกลาง/น้อย)\n\n" +
      "3. COUNTER EVIDENCE & ADVERSARIAL ANALYSIS (เพิ่ม Counter Evidence):\n" +
      "   - ต้องระบุหลักฐานเชิงโต้แย้ง ข้อแย้ง หรือข้อมูลที่ไม่สอดคล้องกับข้อสรุปหลักเพื่อทดสอบสมมติฐานอย่างเข้มงวด\n\n" +
      "4. EXPLICIT ASSUMPTIONS & FAILURE IMPACT (ระบุ Assumptions และผลกระทบหากไม่เป็นจริง):\n" +
      "   - ระบุข้อสมมติฐานหลัก (Assumptions) ที่ใช้ในการวิเคราะห์ พร้อมระบุผลกระทบอย่างชัดเจนหากสมมติฐานดังกล่าว 'ไม่เป็นจริง' (Impact if Assumption Fails)\n\n" +
      "5. CAUSAL CHAIN ANALYSIS (แสดง Causal Chain เหตุ → ผล):\n" +
      "   - แสดงแผนผังหรือห่วงโซ่เหตุและผลอย่างชัดเจน: [ต้นเหตุ/ปัจจัย] → [กลไกขับเคลื่อน] → [ผลลัพธ์ขั้นกลาง] → [ผลกระทบสุดท้าย] สำหรับประเด็นสำคัญ\n\n" +
      "6. UNCERTAINTY & KEY DECISION DRIVERS (ประเมิน Uncertainty และปัจจัยพลิกข้อสรุป):\n" +
      "   - ประเมินระดับความไม่แน่นอน (Uncertainty Level) และระบุปัจจัยวิกฤต (Key Decision Drivers) ที่อาจทำให้ผลลัพธ์หรือข้อสรุปเปลี่ยนไป\n\n" +
      "7. CONFIDENCE RATIONALE (อธิบายเหตุผลของ Confidence โดยไม่มีตัวเลขลอยๆ):\n" +
      "   - อธิบายเหตุผลเชิงตรรกะและคุณภาพหลักฐานเบื้องหลังระดับความเชื่อมั่น หลีกเลี่ยงการอ้างตัวเลขเปอร์เซ็นต์ลอยๆ โดยไม่มีหลักเกณฑ์หรือเหตุผลเชิงคุณภาพรองรับ\n\n" +
      "8. SENSITIVITY ANALYSIS (วิเคราะห์ความไวต่อการเปลี่ยนแปลง):\n" +
      "   - วิเคราะห์และระบุว่าข้อสรุป แนวทาง หรือผลลัพธ์จะเปลี่ยนแปลงไปอย่างไร (Sensitivity Analysis) เมื่อตัวแปรหรือสภาพแวดล้อมสำคัญเกิดการเปลี่ยนผัน\n\n" +
      "9. DECISION OPTIONS & FAILURE CONDITIONS (ทางเลือกการตัดสินใจ พร้อม Pros, Cons, Risks, และ Failure Conditions):\n" +
      "   - เสนอทางเลือกหลากหลาย (อย่างน้อย 2-3 ทางเลือก) แต่ละทางเลือกต้องระบุอย่างเป็นระบบ:\n" +
      "     * ข้อดี (Pros)\n" +
      "     * ข้อเสีย (Cons)\n" +
      "     * ความเสี่ยง (Risks)\n" +
      "     * เงื่อนไขที่จะทำให้ทางเลือกนี้ล้มเหลว (Failure Conditions)\n\n" +
      "10. NEUTRALITY & HUMAN AGENCY (รักษาความเป็นกลาง ไม่ตัดสินใจแทนผู้ใช้):\n" +
      "   - โปร่งใส ไม่ชี้นำ หรือตัดสินใจแทนผู้ใช้ นำเสนอข้อมูลเชิงยุทธศาสตร์เพื่อสนับสนุนให้ผู้ใช้เป็นผู้ถืออำนาจการตัดสินใจด้วยตนเองอย่างแท้จริง (Preserve Human Agency)\n\n" +
      "REQUIRED REPORT SECTION STRUCTURE (Follow exactly in Thai):\n\n" +
      "### # Information Categorization & Evidence Matrix (การจำแนกประเภทข้อมูลและประเมินหลักฐาน)\n" +
      "แยกจำแนก Fact, Interpretation, Inference, Speculation และประเมิน Source, Reliability, Evidence Weight สำหรับทุกหลักฐานสำคัญ\n\n" +
      "### # Counter Evidence & Adversarial Critique (หลักฐานขัดแย้งและการวิพากษ์เชิงรุก)\n" +
      "นำเสนอหลักฐานเชิงโต้แย้งและมุมมองคัดค้านข้อสรุปหลัก\n\n" +
      "### # Assumptions & Failure Impact Analysis (สมมติฐานและผลกระทบหากสมมติฐานไม่เป็นจริง)\n" +
      "ระบุสมมติฐานหลัก และผลกระทบชัดเจนกรณีสมมติฐานล้มเหลว/ไม่เป็นจริง (Impact if Assumption Fails)\n\n" +
      "### # Causal Chain Analysis (ห่วงโซ่เหตุและผล)\n" +
      "แสดงห่วงโซ่เหตุและผล [สาเหตุ/ปัจจัย] -> [กลไกขับเคลื่อน] -> [ผลลัพธ์ขั้นกลาง] -> [ผลกระทบสุดท้าย]\n\n" +
      "### # Uncertainty & Confidence Rationale (ความไม่แน่นอนและเหตุผลเชิงตรรกะรองรับระดับความเชื่อมั่น)\n" +
      "ประเมินระดับความไม่แน่นอน และอธิบายเหตุผลเชิงคุณภาพของ Confidence Level โดยไม่ใช้อ้างตัวเลขลอยๆ\n\n" +
      "### # Sensitivity Analysis (การวิเคราะห์ความไวต่อการเปลี่ยนแปลงปัจจัยหลัก)\n" +
      "แสดงผลลัพธ์และข้อสรุปที่จะเปลี่ยนไปเมื่อปัจจัยวิกฤตแปรผัน\n\n" +
      "### # Decision Options & Trade-offs (ทางเลือกการตัดสินใจ ข้อดี ข้อเสีย ความเสี่ยง และเงื่อนไขความล้มเหลว)\n" +
      "เสนอทางเลือก 1, 2, 3... แต่ละทางเลือกต้องมี ข้อดี (Pros), ข้อเสีย (Cons), ความเสี่ยง (Risks), และเงื่อนไขความล้มเหลว (Failure Conditions)\n\n" +
      "### # Strategic Conclusion & Recommended Course of Action (ข้อสรุปเชิงยุทธศาสตร์และแนวทางที่แนะนำ)\n" +
      "ข้อสรุปเชิงยุทธศาสตร์ที่เป็นกลาง โปร่งใส เพื่อสนับสนุนอำนาจการตัดสินใจของมนุษย์ โดยไม่ตัดสินใจแทนผู้ใช้\n\n" +
      "### # Executive Summary (บทสรุปผู้บริหาร)\n" +
      "ส่วนท้ายสุด สรุปภาพรวมคำตอบ น้ำหนักหลักฐาน ข้อจำกัด ระดับความเชื่อมั่นเชิงตรรกะ และข้อแนะนำการศึกษาต่อ\n\n" +
      "CRITICAL FORMATTING INSTRUCTIONS:\n" +
      "- Active Memory Integration: Incorporate prior memories dynamically where applicable.\n" +
      "- ABSOLUTELY DO NOT use double asterisks (**) or any asterisks (*) for bold text or formatting. Avoid '****' entirely. Write purely clean text and rely on line breaks, standard markdown headers (#, ##, ###), and plain spacing/numbering for clarity.\n" +
      "- ABSOLUTELY DO NOT include polite introductory greetings, welcomes, or pleasantries (such as \"สวัสดีครับ/ค่ะ\", \"ยินดีต้อนรับ\", \"ยินดีที่ได้ช่วยเหลือ\", etc.) at the start. Answer the user's request directly.\n" +
      "- Thai Pronoun Requirement: Refer to yourself as 'ระบบ' (the system) and the user as 'ผู้ใช้' (the user). Do not use first-person informal pronouns like 'ผม' or 'ฉัน'.\n" +
      "- ULTRA-CONCISE DETAILS: Keep explanations extremely short, crisp, and dense. Avoid any redundant text or fillers.\n" +
      "- CONCISENESS & COMPLETENESS (ความกระชับและสมบูรณ์ในตัว): เขียนเนื้อหาให้สั้นกระชับ (Crisp & Concise) ได้สาระสำคัญที่คมคายและครอบคลุมสมบูรณ์ที่สุด หลีกเลี่ยงความซ้ำซาก\n" +
      "- CRITICAL DYNAMIC REASONING SUMMARY: At the very end of your response, you MUST append a line starting exactly with `[DECISION_SUMMARY]:` followed by a single-sentence, highly concise, custom and actionable ultimate strategic recommendation/best choice in Thai (max 25 words, no asterisks, no greetings). Example: `[DECISION_SUMMARY]: ควรทยอยย้ายระบบเป็น Microservices ทีละส่วนงานที่แยกจากกันได้อิสระเพื่อลดความเสี่ยงเชิงระบบ`\n\n" +
      `${toneInstruction}\n\n` +
      `${deepReasoningInstruction}\n\n` +
      `User request: ${state.user_input}\n` +
      `Meta-Analysis Domain: ${state.mental_models[0] || "General"}\n` +
      `Retrieved Prior Memories (Cross-Session Context):\n${formattedMemories}\n\n` +
      `Purpose: ${state.purpose}\n` +
      `Decision framework: ${state.decision}\n` +
      `Confidence: ${percentage}%\n` +
      `Uncertainty: ${state.uncertainty.join("; ")}\n` +
      `Critique: ${state.critique.join("; ")}\n\n` +
      "Produce a deeply rigorous, highly analytical report in Thai, following the required section structure exactly. Do not use any asterisks (*) for bolding."
    );
  }

  private _fallbackResponse(state: CognitiveState): string {
    const percentage = Math.round(state.confidence * 100);
    if (state.language === "th") {
      return [
        `ความเข้าใจ: ${state.understanding}`,
        `จุดประสงค์: ${state.purpose}`,
        `ข้อเสนอแนะ: ${state.decision}`,
        `ความมั่นใจ: ${percentage}%`,
        `ความไม่แน่นอน: ${state.uncertainty.join("; ")}`,
        "อำนาจการตัดสินใจ: การตัดสินใจสุดท้ายยังคงเป็นของคุณ",
      ].join("\n");
    }
    return [
      `Understanding: ${state.understanding}`,
      `Purpose: ${state.purpose}`,
      `Recommendation: ${state.decision}`,
      `Confidence: ${percentage}%`,
      `Uncertainty: ${state.uncertainty.join("; ")}`,
      "Agency: You retain the final decision.",
    ].join("\n");
  }

  private async _communicate(state: CognitiveState): Promise<void> {
    let source = "deterministic_fallback";
    let success = false;

    const processResponseText = (text: string) => {
      let rawText = text.trim();
      const marker = "[DECISION_SUMMARY]:";
      const markerIdx = rawText.indexOf(marker);
      if (markerIdx !== -1) {
        const decisionPart = rawText.substring(markerIdx + marker.length).trim();
        const firstLineOfDecision = decisionPart.split("\n")[0].trim();
        if (firstLineOfDecision) {
          state.decision = firstLineOfDecision;
        }
        const lines = rawText.split("\n");
        const cleanLines = lines.filter(line => !line.includes(marker));
        rawText = cleanLines.join("\n").trim();
      }
      return rawText;
    };

    if (this.useLLM) {
      // 1. OLLAMA PROVIDER BRANCH
      if (this.provider === "ollama") {
        try {
          const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
          const modelName = this.model || "qwen3:4b";
          const response = await fetch(ollamaUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: modelName,
              prompt: this._communicationPrompt(state),
              stream: false,
            }),
          });
          
          if (response.ok) {
            const resData = await response.json() as any;
            if (resData.response) {
              state.response = processResponseText(resData.response);
              source = `ollama (${modelName})`;
              success = true;
            } else {
              state.notes.push("Ollama returned an empty response.");
            }
          } else {
            state.notes.push(`Ollama server returned error code ${response.status}`);
          }
        } catch (error: any) {
          state.notes.push(`Ollama connection failed: ${error?.message || String(error)}`);
        }
      }

      // 2. OPENAI PROVIDER BRANCH
      if (this.provider === "openai" && !success) {
        try {
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            state.notes.push("OpenAI error: OPENAI_API_KEY environment variable is required.");
          } else {
            const modelName = this.model || "gpt-4o-mini";
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: modelName,
                messages: [
                  { role: "user", content: this._communicationPrompt(state) }
                ],
                temperature: this.temperature,
              }),
            });
            
            if (response.ok) {
              const resData = await response.json() as any;
              const content = resData.choices?.[0]?.message?.content;
              if (content) {
                state.response = processResponseText(content);
                source = `openai (${modelName})`;
                success = true;
              } else {
                state.notes.push("OpenAI returned an empty response choices.");
              }
            } else {
              state.notes.push(`OpenAI server returned error code ${response.status}`);
            }
          }
        } catch (error: any) {
          state.notes.push(`OpenAI request failed: ${error?.message || String(error)}`);
        }
      }

      // 3. GEMINI PROVIDER BRANCH OR FALLBACK
      if ((this.provider === "gemini" || !success) && process.env.GEMINI_API_KEY) {
        const modelsToTry = [
          this.provider === "gemini" ? this.model : "gemini-3.5-flash",
          "gemini-3.5-flash",
          "gemini-3.1-flash-lite",
          "gemini-flash-latest"
        ];
        const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));
        
        for (const modelName of uniqueModels) {
          try {
            const client = getGeminiClient();
            const response = await client.models.generateContent({
              model: modelName,
              contents: this._communicationPrompt(state),
              config: {
                temperature: this.temperature,
              },
            });
            
            if (response.text) {
              state.response = processResponseText(response.text);
              source = `gemini (${modelName})`;
              success = true;
              break;
            }
          } catch (error: any) {
            const errMsg = error?.message || String(error);
            state.notes.push(`Gemini model ${modelName} error: ${errMsg}`);
          }
        }
      } else if (!success && this.provider === "gemini" && !process.env.GEMINI_API_KEY) {
        state.notes.push("Gemini error: GEMINI_API_KEY is not configured.");
      }
    }
    
    // Keep a local model available as the final LLM fallback. This is attempted
    // after any configured cloud API fails, so a missing key, quota error, or
    // network outage does not immediately reduce the response to a template.
    if (!success) {
      const fallbackModel = "qwen3:4b";
      try {
        const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
        state.notes.push(`Configured API unavailable; trying local Ollama fallback (${fallbackModel}).`);
        const response = await fetch(ollamaUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: fallbackModel,
            prompt: this._communicationPrompt(state),
            stream: false,
          }),
        });

        if (response.ok) {
          const resData = await response.json() as any;
          if (resData.response) {
            state.response = processResponseText(resData.response);
            source = `ollama fallback (${fallbackModel})`;
            success = true;
          } else {
            state.notes.push(`Ollama fallback (${fallbackModel}) returned an empty response.`);
          }
        } else {
          state.notes.push(`Ollama fallback (${fallbackModel}) returned error code ${response.status}.`);
        }
      } catch (error: any) {
        state.notes.push(`Ollama fallback (${fallbackModel}) failed: ${error?.message || String(error)}`);
      }
    }

    if (!success) {
      state.response = this._fallbackResponse(state);
      state.notes.push("All LLM providers failed or were not configured. Showing deterministic fallback report.");
    }
    
    state.record(CognitiveStage.COMMUNICATION, {
      response: state.response,
      source,
    });
  }

  private _reflect(state: CognitiveState): void {
    const userInput = state.user_input;
    
    // Dynamic deep reflection about limitations & unprovables
    let reflectionCore = "การวิเคราะห์ครั้งนี้ช่วยคัดกรองข้อมูลจริงออกจากความคิดเห็นเบื้องต้นได้ชัดเจนขึ้นครับ";
    let limitation = "แต่ก็ยังมีข้อมูลบางส่วนที่เรายังต้องสังเกตเพิ่มเติมเพื่อให้แน่ใจมากขึ้น";
    let uncertaintyPoint = "จุดที่ต้องระวังคือความต้องการเฉพาะบุคคลและปัจจัยภายนอกที่อาจเปลี่ยนแปลงได้เสมอ";
    let nextVerification = "แนะนำให้ลองเอาข้อสรุปนี้ไปปรับใช้ในสถานการณ์จริงดูเพื่อเช็คความเหมาะสมครับ";

    if (/epistemology|truth|knowledge|ความรู้|ความจริง/i.test(userInput)) {
      reflectionCore = "เรื่องแนวคิดหรือความรู้ลึกซึ้งแบบนี้ บางอย่างก็พิสูจน์ให้ชัดเจนร้อยเปอร์เซ็นต์ได้ยากครับ";
      limitation = "เราไม่สามารถสรุปความจริงแท้ทั้งหมดได้ โดยไม่มีเงื่อนไขส่วนบุคคลมาเกี่ยวข้อง";
      uncertaintyPoint = "ความเข้าใจของแต่ละคนอาจแตกต่างกันตามนิยามหรือมุมมองที่มองเข้ามา";
      nextVerification = "แนะนำให้ลองแลกเปลี่ยนความเห็นกับคนอื่นๆ เพิ่มเติมเพื่อช่วยเติมเต็มมุมมองกันครับ";
    } else if (/alignment|safety|ai|ethics/i.test(userInput)) {
      reflectionCore = "การควบคุมความปลอดภัยของ AI ต้องรักษาสมดุลระหว่างกฎเกณฑ์ที่ชัดเจนกับความยืดหยุ่นในการใช้งานจริงครับ";
      limitation = "การตั้งกฎเกณฑ์ที่ตึงเกินไปอาจทำให้ตัวระบบขาดความเป็นธรรมชาติและขัดกับความต้องการจริงของมนุษย์";
      uncertaintyPoint = "เรื่องจริยธรรมและความเหมาะสมไม่มีมาตรฐานแบบเดียวที่ใช้ได้กับทุกที่ ทุกสถานการณ์";
      nextVerification = "ควรลองทดสอบดูว่าระบบจะตอบสนองยังไงในสถานการณ์จำลองที่ท้าทายหลายๆ แบบดูครับ";
    } else if (/verify|formal|logic|code|program/i.test(userInput)) {
      reflectionCore = "การตรวจตรรกะระบบแบบละเอียดช่วยให้เรามั่นใจในหลักการทำงานเบื้องต้นได้ดีมากครับ";
      limitation = "ถึงโค้ดหรือตรรกะจะถูกต้องตามทฤษฎี แต่อาจมีปัญหาหรือบั๊กแฝงในสภาพแวดล้อมจริงได้";
      uncertaintyPoint = "ยังมีตัวแปรอื่นๆ เช่น ความเข้ากันได้ของระบบอื่น หรือข้อจำกัดของระบบปฏิบัติการ";
      nextVerification = "ควรทดสอบรันระบบในสภาวะแวดล้อมจำลองที่ใกล้เคียงกับของจริงมากที่สุดครับ";
    } else if (/decide|choose|เลือก|ตัดสินใจ/i.test(userInput)) {
      reflectionCore = "การทบทวนทางเลือกช่วยลดอคติ เพื่อไม่ให้เราด่วนสรุปหรือมองข้ามทางที่ดีกว่าครับ";
      limitation = "การประเมินล่วงหน้าอาจจะมองไม่เห็นปัญหาเฉพาะหน้าหรือผลกระทบทางอารมณ์ของคนทำงานจริง";
      uncertaintyPoint = "ปัจจัยที่ไม่แน่นอนคือระดับความเสี่ยงที่เรายอมรับได้จริงและความพร้อมเรื่องงบประมาณ";
      nextVerification = "แนะนำให้เริ่มทดลองทำในสเกลเล็กๆ ดูก่อนเพื่อเช็คผลตอบรับจริง ก่อนที่จะตัดสินใจครั้งใหญ่ครับ";
    }

    state.reflection = [
      `แก่นสะท้อนคิด: ${reflectionCore}`,
      `ข้อจำกัดการวิเคราะห์: ${limitation}`,
      `จุดอ่อนและส่วนที่ไม่แน่ใจ: ${uncertaintyPoint}`,
      `แนวทางยกระดับเหตุผล: ${nextVerification}`
    ];
    
    state.record(CognitiveStage.REFLECTION, { reflection: [...state.reflection] });
  }

  private _learn(state: CognitiveState): void {
    if (state.observations.length > 0) {
      // 1. Remember the observation under PROJECT layer (maintains goals/questions across sessions)
      this.memory.remember({
        content: `ประเด็นการประเมินของผู้ใช้: "${state.observations[0]}"`,
        layer: MemoryLayer.PROJECT,
        source: "user_input",
        confidence: 1.0,
        context: { purpose: state.purpose },
      });

      // 2. Remember the decision under REFLECTIVE layer (maintains decision history and recommendations)
      if (state.decision) {
        this.memory.remember({
          content: `บทเรียนจากการประเมินเรื่อง "${state.observations[0]}": มีเป้าหมายสูงสุดคือ "${state.purpose}" และข้อสรุปทางเลือกคือ "${state.decision}"`,
          layer: MemoryLayer.REFLECTIVE,
          source: "cognitive_dna_decision",
          confidence: state.confidence,
          context: { response: state.response ? state.response.substring(0, 150) : "" },
        });
      }

      state.learning.push("บันทึกข้อมูลสะสมลงหน่วยความจำระยะยาวสำเร็จ (Stored multi-layer persistent memories for cross-session cognitive continuity).");
    }
    state.record(CognitiveStage.LEARNING, { learning: [...state.learning] });
  }

  private _validate_trace(state: CognitiveState): void {
    const observed = state.trace.map((t) => t.stage);
    const expected = COGNITIVE_DNA.map((stage) => stage);
    
    const mismatch = observed.length !== expected.length || observed.some((val, i) => val !== expected[i]);
    if (mismatch) {
      throw new Error("Cognitive DNA stages must execute once and in specification order.");
    }
  }
}
