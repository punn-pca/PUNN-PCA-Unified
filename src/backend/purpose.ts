import { CognitiveState } from "./state";

const DEFAULT_CONSTRAINTS = [
  "Do not replace human judgment.",
  "State uncertainty explicitly.",
  "Prefer evidence over assumption.",
];

export class PurposeEngine {
  process(state: CognitiveState): CognitiveState {
    const request = state.user_input.trim();
    
    // Determine query type
    const isPhilosophy = /จริยธรรม|คุณธรรม|ผิดถูก|ดีชั่ว|ethics|moral|philosophy|ปรัชญา|ความจริง|สัจจะ|ความรู้|epistemology|truth/i.test(request);
    const isAI = /ai|ปัญญาประดิษฐ์|alignment|safety|control|agi|model|llm/i.test(request);
    const isVerification = /code|program|verify|correctness|พิสูจน์|ตรรกะ|formal|logic/i.test(request);
    const isDecision = /ตัดสินใจ|เลือก|ดีไหม|ทางเลือก|decision|choice|select/i.test(request);
    const isComparison = /เปรียบเทียบ|เทียบ|ข้อดีข้อเสีย|vs|difference|ดีกว่า/i.test(request);

    if (state.language === "th") {
      if (!request) {
        state.purpose = "ขอให้ผู้ใช้ระบุคำถามก่อนที่จะสร้างคำตอบ";
      } else if (isComparison) {
        state.purpose = `เปรียบเทียบโครงสร้างและข้อแตกต่างอย่างเป็นกลางเพื่อให้เห็นแง่มุมรอบด้านเกี่ยวกับ: ${request}`;
      } else if (isPhilosophy || isAI) {
        state.purpose = `อธิบายหลักการ ทฤษฎี หรือแนวคิดเชิงลึกเพื่อให้ผู้ใช้เข้าใจแก่นแท้อย่างถ่องแท้เกี่ยวกับ: ${request}`;
      } else if (isVerification) {
        state.purpose = `แยกแยะองค์ประกอบ ประเมินข้อเท็จจริง และความสมเหตุสมผลเพื่อรับประกันความน่าเชื่อถือเชิงระบบเกี่ยวกับ: ${request}`;
      } else if (isDecision) {
        state.purpose = `ช่วยจัดเรียงหลักคิด ถ่วงน้ำหนักผลกระทบ และสนับสนุนการตัดสินใจด้วยตัวคุณเองเกี่ยวกับ: ${request}`;
      } else {
        state.purpose = `ช่วยวิเคราะห์ ตรวจสอบข้อมูล และเสนอทางเลือกให้คุณตัดสินใจได้อย่างรอบคอบเกี่ยวกับ: ${request}`;
      }
    } else {
      if (!request) {
        state.purpose = "Ask the user for a question before generating a response.";
      } else if (isComparison) {
        state.purpose = `Objectively compare structures and trade-offs to show multi-dimensional aspects of: ${request}`;
      } else if (isPhilosophy || isAI) {
        state.purpose = `Explain principles, theories, or deep concepts to foster profound understanding of: ${request}`;
      } else if (isVerification) {
        state.purpose = `Analyze components, evaluate facts, and verify correctness to ensure systemic reliability of: ${request}`;
      } else if (isDecision) {
        state.purpose = `Organize thoughts, weigh impacts, and support autonomous, human-owned decisions about: ${request}`;
      } else {
        state.purpose = `Analyze, verify data, and present alternatives for your careful decisions about: ${request}`;
      }
    }

    state.constraints = [...DEFAULT_CONSTRAINTS];
    return state;
  }
}
