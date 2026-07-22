import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Send, 
  Sparkles, 
  Cpu, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  Shield, 
  HelpCircle, 
  BookOpen, 
  Layers, 
  Lightbulb, 
  Compass, 
  FileText, 
  Settings2,
  ChevronRight,
  Info,
  Clock,
  ExternalLink,
  ShieldAlert,
  Menu,
  X,
  Sun,
  Moon,
  Brain,
  Database,
  Flame,
  Download,
  Volume2,
  VolumeX,
  Target,
  CheckSquare,
  Check,
  TrendingUp,
  Copy,
  Image as ImageIcon
} from "lucide-react";
import { 
  analyze, 
  getMemories, 
  addMemory, 
  deleteMemory, 
  clearAllMemories 
} from "./services/api";
import MemoryPanel from "./components/MemoryPanel";
import CognitiveOrchestrationView from "./components/CognitiveOrchestrationView";
import type {
  ReasoningGraphData,
  StrategySelectionData,
  MemoryTraceData
} from "./components/CognitiveOrchestrationView";
import { generateMarkdown, generateHTML, generateSingleMessageMarkdown } from "./utils/export";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  pcaState?: {
    notes: string[];
    observations: string[];
    understanding: string;
    purpose: string;
    decision: string;
    confidence: number;
    critique: string[];
    reflection: string[];
    learning: string[];
    agency_checks: string[];
    trace: Array<{ stage: string; timestamp: string; output: Record<string, any> }>;
    reasoning_graph?: ReasoningGraphData;
    strategy_selection?: StrategySelectionData;
    memory_traces?: MemoryTraceData[];
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
}

const STAGE_TRANSLATIONS: Record<string, { th: string; en: string; color: string; icon: any }> = {
  observation: { th: "1. การสังเกตการณ์", en: "Observation", color: "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20", icon: Compass },
  understanding: { th: "2. การทำความเข้าใจบริบท", en: "Understanding", color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20 dark:text-cyan-400 dark:bg-cyan-400/10 dark:border-cyan-400/20", icon: BookOpen },
  purpose: { th: "3. การกำหนดเป้าหมาย", en: "Purpose", color: "text-purple-500 bg-purple-500/10 border-purple-500/20 dark:text-purple-400 dark:bg-purple-400/10 dark:border-purple-400/20", icon: Lightbulb },
  memory: { th: "4. การดึงข้อมูลอดีต", en: "Memory", color: "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20", icon: Layers },
  mental_model: { th: "5. แบบจำลองความคิด", en: "Mental Model", color: "text-teal-500 bg-teal-500/10 border-teal-500/20 dark:text-teal-400 dark:bg-teal-400/10 dark:border-teal-400/20", icon: FileText },
  hypothesis: { th: "6. การตั้งสมมติฐานทางเลือก", en: "Hypothesis", color: "text-orange-500 bg-orange-500/10 border-orange-500/20 dark:text-orange-400 dark:bg-orange-400/10 dark:border-orange-400/20", icon: Cpu },
  evidence_evaluation: { th: "7. การประเมินหลักฐาน", en: "Evidence Evaluation", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20", icon: CheckCircle2 },
  critique: { th: "8. การวิพากษ์ความเอนเอียง", en: "Critique", color: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-400 dark:bg-rose-400/10 dark:border-rose-400/20", icon: AlertTriangle },
  decision: { th: "9. ข้อสรุปเชิงยุทธศาสตร์และแนวทางที่แนะนำ", en: "Strategic Conclusion & Recommended Course of Action", color: "text-violet-500 bg-violet-500/10 border-violet-500/20 dark:text-violet-400 dark:bg-violet-400/10 dark:border-violet-400/20", icon: Settings2 },
  communication: { th: "10. การสร้างคำตอบให้มนุษย์", en: "Communication", color: "text-pink-500 bg-pink-500/10 border-pink-500/20 dark:text-pink-400 dark:bg-pink-400/10 dark:border-pink-400/20", icon: Sparkles },
  reflection: { th: "11. การสะท้อนคิด", en: "Reflection", color: "text-orange-500 bg-orange-500/10 border-orange-500/20 dark:text-orange-400 dark:bg-orange-400/10 dark:border-orange-400/20", icon: Info },
  learning: { th: "12. การเรียนรู้บันทึกความจำ", en: "Learning", color: "text-lime-500 bg-lime-500/10 border-lime-500/20 dark:text-lime-400 dark:bg-lime-400/10 dark:border-lime-400/20", icon: HelpCircle },
};

const SUGGESTIONS = [
  {
    title: "วิเคราะห์การลงทุน",
    desc: "ฉันควรลงทุนซื้อหุ้นเทคโนโลยี AI ตอนนี้ดีไหม?",
    prompt: "ฉันควรลงทุนซื้อหุ้นเทคโนโลยี AI ตอนนี้หรือควรจะชะลอไว้ก่อน? กรุณาวิเคราะห์ตามกรอบแนวคิด PCA",
    icon: Compass,
  },
  {
    title: "ย้ายระบบสถาปัตยกรรม",
    desc: "ควรย้ายจาก Monolith ไปเป็น Microservices หรือไม่?",
    prompt: "บริษัทของฉันมีระบบ Monolith ขนาดใหญ่ที่เริ่มโหลดช้า เราควรย้ายโครงสร้างเป็น Microservices หรือไม่? ช่วยวิเคราะห์ข้อดีข้อเสียและการตัดสินใจให้ด้วยครับ",
    icon: Layers,
  },
  {
    title: "ประเมิน EV",
    desc: "ซื้อรถยนต์ไฟฟ้า (EV) ตอนนี้หรือควรรอก่อน?",
    prompt: "ช่วยวิเคราะห์การตัดสินใจซื้อรถยนต์ไฟฟ้า (EV) ในปีนี้เพื่อใช้เดินทางในกรุงเทพฯ ว่าคุ้มค่าและพร้อมแล้วหรือยัง หรือควรรอเทคโนโลยีแบตเตอรี่แบบใหม่ดี?",
    icon: Lightbulb,
  },
  {
    title: "ทีมเสนอทำงาน 4 วัน",
    desc: "ประเมินผลกระทบกรณีทีมขอปรับสัปดาห์ทำงาน",
    prompt: "ฝ่ายวิศวกรซอฟต์แวร์เสนอขอเปลี่ยนมาทำงานสัปดาห์ละ 4 วัน (4-day work week) โดยทำงานวันละ 10 ชั่วโมง ฉันควรตัดสินใจอนุมัติข้อเสนอนี้ดีไหม?",
    icon: Cpu,
  },
  {
    title: "ความรู้สึกของปัญญาประดิษฐ์",
    desc: "ควรพัฒนา AI ให้รับรู้ความรู้สึกตนเองหรือไม่?",
    prompt: "ในอนาคต เราควรตั้งเป้าพัฒนาปัญญาประดิษฐ์ให้มีจิตสำนึกหรือความรู้สึกตนเอง (Sentient AI) หรือไม่? ช่วยวิเคราะห์ผลกระทบเชิงจริยธรรมและกรอบการจัดตำแหน่งความปลอดภัย (AI Alignment)",
    icon: Brain,
  },
  {
    title: "ปริญญาโท vs ทำงานจริง",
    desc: "เรียนต่อ ป.โท CS หรือทำงานหาประสบการณ์เลย?",
    prompt: "หลังจากจบปริญญาตรี ผมควรเลือกเรียนต่อปริญญาโทด้าน Computer Science ทันที หรือควรออกไปทำงานหาประสบการณ์ในอุตสาหกรรมซอฟต์แวร์จริงก่อนสัก 2-3 ปีดี?",
    icon: BookOpen,
  },
  {
    title: "เริ่มต้นทำ Startup",
    desc: "เริ่มทำ Startup ของตัวเองตอนนี้หรือทำงานประจำ?",
    prompt: "ผมมีความคิดทำธุรกิจซอฟต์แวร์ของตัวเอง ควรลาออกมาเริ่มทำสตาร์ทอัพเต็มตัวตอนนี้เลย หรือควรทำงานประจำเพื่อเก็บเงินและสร้างเครือข่ายให้มั่นคงก่อนสัก 2 ปีดี?",
    icon: Database,
  },
  {
    title: "ย้าย SQL ไป NoSQL",
    desc: "ฐานข้อมูลธนาคารหลักควรเปลี่ยนเป็น NoSQL ไหม?",
    prompt: "การย้ายระบบฐานข้อมูลหลักของธนาคารจาก Relational SQL ไปเป็น Distributed NoSQL เพื่อรองรับปริมาณการทำงานที่เพิ่มขึ้น คุ้มค่าความเสี่ยงเชิงระบบ (Systemic Risk) และตรรกะความถูกต้องของการทำธุรกรรมหรือไม่?",
    icon: Layers,
  },
  {
    title: "สัญญาอนุญาตซอฟต์แวร์",
    desc: "ควรปล่อยโปรเจกต์เป็น MIT Open Source หรือไม่?",
    prompt: "ผมกำลังสร้างเครื่องมือพัฒนาระบบตัวใหม่ ควรเปิดซอร์สโค้ดเป็น Open Source (สัญญาอนุญาตแบบ MIT) เพื่อเร่งการเติบโตของผู้ใช้ หรือควรทำเป็น Proprietary เชิงพาณิชย์ตั้งแต่แรกดี?",
    icon: Lightbulb,
  },
  {
    title: "ความปลอดภัยระดับวิกฤต",
    desc: "ระบบการบินควรใช้ภาษาพิสูจน์ได้รัดกุมดีกว่าไหม?",
    prompt: "ระบบควบคุมการบินอัตโนมัติควรถูกเขียนขึ้นด้วยภาษาที่รองรับการพิสูจน์ความถูกต้องของตรรกะแบบเป็นทางการ (เช่น Rust หรือ Ada) แทนการใช้ C++ หรือไม่? ช่วยประเมินด้วย Formal Verification และทฤษฎีความน่าเชื่อถือ",
    icon: Cpu,
  },
  {
    title: "AI จัดคะแนนจริยธรรม",
    desc: "การใช้ AI ประเมินจริยธรรมผู้รับบริการเสี่ยงยังไง?",
    prompt: "การใช้ปัญญาประดิษฐ์ประเมินความประพฤติและค่านิยมของผู้ป่วย (AI Moral Scoring) เพื่อนำไปจัดลำดับความสำคัญในการเข้ารับการรักษามีข้อบกพร่องเชิงตรรกะและจริยธรรมในระบบอย่างไร?",
    icon: Info,
  },
  {
    title: "สัจจะและความจริงแท้",
    desc: "มนุษย์จะอ้างความจริงแท้ไร้ข้อสงสัยได้อย่างไร?",
    prompt: "ตามแนวคิดทฤษฎีความรู้ (Epistemology) มนุษย์เราสามารถอ้างสิทธิ์ในการเข้าถึงความจริงแท้ที่ปฏิเสธไม่ได้ (Undeniable Truth) ได้อย่างไร หรือทุกความรู้เป็นเพียงความน่าจะเป็นที่รอการหักล้าง?",
    icon: Compass,
  }
];

function getRandomSuggestions(arr: typeof SUGGESTIONS, count: number) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Custom high-fidelity, beautifully formatted Markdown parser for tidy, professional rendering
function parseMarkdownToJsx(text: string, isDarkMode: boolean, onSelectOption?: (option: string) => void) {
  if (!text) return null;

  // Strip any raw double asterisks or multiple asterisks entirely to satisfy "ไม่มี ****"
  const cleanedText = text.replace(/\*\*+/g, "");

  const lines = cleanedText.split("\n");
  const parsedElements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = "";

  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const renderTextWithFormatting = (txt: string) => {
    const parts: React.ReactNode[] = [];
    let currentIdx = 0;
    
    // Pattern for inline code (`code`) or bold (*)
    const regex = /(`)(.*?)\1/g;
    let match;
    
    while ((match = regex.exec(txt)) !== null) {
      const matchIdx = match.index;
      const delimiter = match[1];
      const matchText = match[2];
      
      if (matchIdx > currentIdx) {
        parts.push(txt.substring(currentIdx, matchIdx));
      }
      
      if (delimiter === "`") {
        parts.push(
          <code key={matchIdx} className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${isDarkMode ? "bg-[#2d2f31] text-[#f2af5d]" : "bg-gray-100 text-[#b95503]"}`}>
            {matchText}
          </code>
        );
      }
      
      currentIdx = regex.lastIndex;
    }
    
    if (currentIdx < txt.length) {
      parts.push(txt.substring(currentIdx));
    }
    
    return parts.length > 0 ? <>{parts}</> : txt;
  };

  const flushTable = (key: string | number) => {
    if (inTable && tableHeaders.length > 0) {
      parsedElements.push(
        <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2d2f31] shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2d2f31] text-xs">
            <thead className={`${isDarkMode ? "bg-[#1e1f22] text-gray-200" : "bg-gray-50 text-gray-700"} font-bold`}>
              <tr>
                {tableHeaders.map((hdr, hIdx) => (
                  <th key={hIdx} className="px-3 py-2 text-left font-semibold border-b border-gray-200 dark:border-[#2d2f31]">
                    {renderTextWithFormatting(hdr)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 dark:divide-[#2d2f31] ${isDarkMode ? "bg-[#131314] text-gray-300" : "bg-white text-gray-800"}`}>
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className={isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 border-b border-gray-100 dark:border-[#1e1f22] max-w-xs break-words">
                      {renderTextWithFormatting(cell || "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }
  };

  const flushList = (key: string | number) => {
    if (listItems.length === 0) return;
    if (listType === "ul") {
      parsedElements.push(
        <ul key={`ul-${key}`} className="list-none pl-1 my-3 space-y-2">
          {listItems.map((item, idx) => {
            const cleaned = item.replace(/^[\s\d.-]+/, "").trim();
            return (
              <li 
                key={idx} 
                onClick={onSelectOption ? () => onSelectOption(cleaned) : undefined}
                className={`group flex items-start gap-2.5 text-sm leading-relaxed rounded-xl transition-all ${
                  onSelectOption 
                    ? "cursor-pointer hover:bg-orange-500/5 dark:hover:bg-orange-500/10 p-1.5 -mx-1.5" 
                    : ""
                } ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-2 group-hover:scale-125 transition-transform"></span>
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>{renderTextWithFormatting(item)}</span>
                  {onSelectOption && (
                    <span className="opacity-0 group-hover:opacity-100 transition-all shrink-0 flex items-center gap-1 text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-bold">
                      กดเลือกดำเนินการต่อ <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      );
    } else if (listType === "ol") {
      parsedElements.push(
        <ol key={`ol-${key}`} className="list-none pl-1 my-3 space-y-2">
          {listItems.map((item, idx) => {
            const cleaned = item.replace(/^[\s\d.-]+/, "").trim();
            return (
              <li 
                key={idx} 
                onClick={onSelectOption ? () => onSelectOption(cleaned) : undefined}
                className={`group flex items-start gap-2 text-sm leading-relaxed rounded-xl transition-all ${
                  onSelectOption 
                    ? "cursor-pointer hover:bg-orange-500/5 dark:hover:bg-orange-500/10 p-1.5 -mx-1.5" 
                    : ""
                } ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
              >
                <span className="font-mono text-xs font-bold text-orange-500 shrink-0 mt-1 mr-1 group-hover:scale-110 transition-transform">{idx + 1}.</span>
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>{renderTextWithFormatting(item)}</span>
                  {onSelectOption && (
                    <span className="opacity-0 group-hover:opacity-100 transition-all shrink-0 flex items-center gap-1 text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-bold">
                      กดเลือกดำเนินการต่อ <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      );
    }
    listItems = [];
    listType = null;
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code block
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        parsedElements.push(
          <div key={`code-${i}`} className={`my-4 rounded-xl border overflow-hidden ${isDarkMode ? "bg-[#1c1d1f] border-[#2d2f31]" : "bg-gray-50 border-gray-200"}`}>
            <div className={`px-4 py-2 text-xs font-mono flex justify-between items-center ${isDarkMode ? "bg-[#141517] text-gray-400 border-[#2d2f31]" : "bg-gray-100 text-gray-500 border-gray-200"} border-b`}>
              <span>{codeLang || "code"}</span>
              <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Copy Block</span>
            </div>
            <pre className={`p-4 overflow-x-auto text-xs font-mono leading-relaxed ${isDarkMode ? "text-gray-300 bg-[#1c1d1f]" : "text-gray-800 bg-gray-50"}`}>
              <code>{codeLines.join("\n")}</code>
            </pre>
          </div>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.replace("```", "").trim();
        flushList(i);
        flushTable(i);
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Handle Markdown Tables
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushList(i);
      const parts = line.split("|").map(p => p.trim()).filter((p, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // Check if it is a separator row like |---|---|
      const isSeparator = parts.every(p => /^[:-]+$/.test(p) && p.length > 0);
      
      if (isSeparator) {
        continue;
      }
      
      if (!inTable) {
        inTable = true;
        tableHeaders = parts;
        tableRows = [];
      } else {
        tableRows.push(parts);
      }
      continue;
    } else {
      flushTable(i);
    }

    // Handle Headings
    if (line.startsWith("### ")) {
      flushList(i);
      const headingText = line.substring(4);
      parsedElements.push(
        <h4 key={`h3-${i}`} className={`text-sm font-bold mt-5 mb-2.5 flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          {renderTextWithFormatting(headingText)}
        </h4>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList(i);
      const headingText = line.substring(3);
      parsedElements.push(
        <h3 key={`h2-${i}`} className={`text-base font-bold mt-6 mb-3 pb-1 border-b ${isDarkMode ? "text-white border-[#2d2f31]/60" : "text-gray-900 border-gray-200/80"}`}>
          {renderTextWithFormatting(headingText)}
        </h3>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushList(i);
      const headingText = line.substring(2);
      parsedElements.push(
        <h2 key={`h1-${i}`} className={`text-lg font-extrabold mt-6 mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          {renderTextWithFormatting(headingText)}
        </h2>
      );
      continue;
    }

    // Handle Blockquote
    if (line.startsWith("> ")) {
      flushList(i);
      const quoteText = line.substring(2);
      parsedElements.push(
        <blockquote key={`quote-${i}`} className={`pl-4 border-l-4 my-4 italic text-sm ${isDarkMode ? "border-orange-500 text-gray-300" : "border-orange-600 text-gray-600"}`}>
          {renderTextWithFormatting(quoteText)}
        </blockquote>
      );
      continue;
    }

    // Handle Unordered Lists
    const ulMatch = line.match(/^[\s]*[-*+]\s+(.*)/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        flushList(i);
        inList = true;
        listType = "ul";
      }
      listItems.push(ulMatch[1]);
      continue;
    }

    // Handle Ordered Lists
    const olMatch = line.match(/^[\s]*\d+\.\s+(.*)/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        flushList(i);
        inList = true;
        listType = "ol";
      }
      listItems.push(olMatch[1]);
      continue;
    }

    // Handle Empty Line (Paragraph Break)
    if (line.trim() === "") {
      flushList(i);
      continue;
    }

    // Regular Indented List continuations
    if (inList) {
      if (line.startsWith("  ") || line.startsWith("\t")) {
        listItems[listItems.length - 1] += "\n" + line.trim();
        continue;
      } else {
        flushList(i);
      }
    }

    // Default Paragraph line
    parsedElements.push(
      <p key={`p-${i}`} className={`text-sm leading-relaxed mb-3 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
        {renderTextWithFormatting(line)}
      </p>
    );
  }

  flushList("end");
  flushTable("end");

  return <div className="space-y-1.5">{parsedElements}</div>;
}

// Extract clean proposed paths and action items from assistant responses for easy clickable chips
function extractProposedOptions(text: string): string[] {
  if (!text) return [];
  const lines = text.split("\n");
  const options: string[] = [];
  
  // Look for lines that represent distinct alternatives or suggestions
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Match bullet lists, dashes, ordered numbered lists
    const match = trimmed.match(/^(?:\d+\.|\*|-|\+)\s+(.+)$/);
    if (match) {
      let optionText = match[1].trim();
      // Remove any trailing/leading markdown bold formatting or clean symbols
      optionText = optionText.replace(/\*\*+/g, "").trim();
      // Strip common prefixes like "ทางเลือกที่ X:" or "ตัวเลือกที่ X:"
      optionText = optionText.replace(/^(?:ทางเลือกที่|ตัวเลือกที่|ข้อเสนอแนะที่|แนวทางที่)\s*\d+\s*[:.-]\s*/, "");
      
      if (optionText && optionText.length > 4 && optionText.length < 120) {
        options.push(optionText);
      }
    }
  }
  
  // Deduplicate and return at most 4 items
  return Array.from(new Set(options)).slice(0, 4);
}

function App() {
  // Load and state management for theme toggler
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("pca_theme");
      if (savedTheme) {
        return savedTheme === "dark";
      }
    }
    return true; // Default is Dark mode
  });

  // Save theme selection to localStorage and apply document class tags
  useEffect(() => {
    localStorage.setItem("pca_theme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      document.body.style.backgroundColor = "#131314";
      document.body.style.color = "#e3e3e3";
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#f0f4f9";
      document.body.style.color = "#1f1f1f";
    }
  }, [isDarkMode]);

  // Collapsible sidebar for responsive screens
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pca_chat_sessions");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.error("Failed to parse sessions", e);
        }
      }
    }
    return [
      {
        id: "default-session",
        title: "การตัดสินใจใหม่ (New Decision Analysis)",
        messages: [],
        created_at: new Date().toISOString(),
      },
    ];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedActive = localStorage.getItem("pca_current_session_id");
      if (savedActive) {
        return savedActive;
      }
      const saved = localStorage.getItem("pca_chat_sessions");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            return parsed[0].id;
          }
        } catch (e) {}
      }
    }
    return "default-session";
  });

  const [input, setInput] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [thinkingStep, setThinkingStep] = useState<string>("");
  const [expandedTraceMsgId, setExpandedTraceMsgId] = useState<string | null>(null);
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [expandedAnalysisMsgIds, setExpandedAnalysisMsgIds] = useState<Record<string, boolean>>({});
  const [expandedReportMsgIds, setExpandedReportMsgIds] = useState<Record<string, boolean>>({});
  const [expandedTraceGroups, setExpandedTraceGroups] = useState<Record<string, boolean>>({});
  const [cognitiveChecks, setCognitiveChecks] = useState<Record<string, boolean>>({});
  
  // Settings overrides
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [llmProvider, setLlmProvider] = useState<string>("ollama");
  const [llmModel, setLlmModel] = useState<string>("qwen3:4b");
  const [tone, setTone] = useState<string>("Empathetic Guide");
  const [deepReasoning, setDeepReasoning] = useState<boolean>(false);

  // Custom confirmation modal states (replaces window.confirm for iframe & touch compatibility)
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const [isClearingSession, setIsClearingSession] = useState<boolean>(false);
  const [isClearingMemories, setIsClearingMemories] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Memory management states
  const [memories, setMemories] = useState<any[]>([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState<boolean>(false);

  // Suggestion states
  const [currentSuggestions, setCurrentSuggestions] = useState<typeof SUGGESTIONS>(() => getRandomSuggestions(SUGGESTIONS, 4));
  const [isShuffling, setIsShuffling] = useState<boolean>(false);

  const handleShuffleSuggestions = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setCurrentSuggestions(getRandomSuggestions(SUGGESTIONS, 4));
      setIsShuffling(false);
    }, 400); // 400ms delay for a beautiful smooth rotation/flicker effect
  };

  // TTS (Text-to-Speech) states
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }).catch(err => {
      console.error("Failed to copy message:", err);
    });
  };

  const handleToggleSpeech = (msgId: string, content: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Clean markdown and formatting from text for better TTS
    const cleanText = content
      .replace(/<[^>]*>/g, "") // Strip any inline HTML tags if any
      .replace(/\*\*+/g, "") // Strip any asterisks
      .replace(/[#*`_~|]/g, "") // Strip other markdown symbols
      .replace(/[-+•\d]\./g, "") // Clean lists markers
      .replace(/\[layer:[^\]]*\]/gi, "") // Clean internal tags
      .replace(/\(source:[^\)]*\)/gi, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Find a Thai voice if available
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang.includes("th"));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }
    utterance.lang = "th-TH";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch memories from server
  const fetchMemories = async () => {
    try {
      const data = await getMemories();
      setMemories(data);
    } catch (error) {
      console.error("Failed to load memories:", error);
    }
  };

  const handleAddMemory = async (content: string, layer: string) => {
    try {
      const data = await addMemory(content, layer, "user_manual");
      setMemories(data.items || []);
    } catch (error) {
      console.error("Failed to add memory:", error);
    }
  };

  const handleDeleteMemory = async (content: string) => {
    try {
      const data = await deleteMemory(content);
      setMemories(data.items || []);
    } catch (error) {
      console.error("Failed to delete memory:", error);
    }
  };

  const handleClearAllMemories = async () => {
    try {
      await clearAllMemories();
      setMemories([]);
      setIsClearingMemories(false);
    } catch (error) {
      console.error("Failed to clear memories:", error);
    }
  };

  // Load memories on mount
  useEffect(() => {
    fetchMemories();
  }, []);

  // Save sessions to localStorage when updated
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("pca_chat_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // Save current session ID to localStorage when updated
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem("pca_current_session_id", currentSessionId);
    }
  }, [currentSessionId]);

  // Scroll to bottom when messages, loading, or thinkingStep changes
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };

    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [sessions, currentSessionId, loading, thinkingStep]);

  // Auto-resize textarea when input text changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0] || {
    id: "default-session",
    title: "การตัดสินใจใหม่ (New Decision Analysis)",
    messages: [],
    created_at: new Date().toISOString(),
  };

  const getSessionStatus = () => {
    if (!currentSession || !currentSession.messages || currentSession.messages.length === 0) {
      return "online";
    }
    
    const assistantMessages = currentSession.messages.filter(m => m.role === "assistant");
    if (assistantMessages.length === 0) {
      return "online";
    }
    
    const lastMsg = assistantMessages[assistantMessages.length - 1];
    if (!lastMsg.pcaState?.notes) {
      return "online";
    }
    
    const hasQuotaErr = lastMsg.pcaState.notes.some(note => 
      note.toLowerCase().includes("quota") || 
      note.toLowerCase().includes("429") || 
      note.toLowerCase().includes("exhausted") || 
      note.toLowerCase().includes("limit")
    );
    
    if (hasQuotaErr) {
      return "offline_reasoning";
    }

    const hasGeneralErr = lastMsg.pcaState.notes.some(note => 
      note.toLowerCase().includes("error") || 
      note.toLowerCase().includes("fail")
    );
    
    if (hasGeneralErr) {
      return "limited_mode";
    }
    
    return "online";
  };

  const renderStatusBadge = (showTextOnMobile = false) => {
    const status = getSessionStatus();
    switch (status) {
      case "online":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <span className="text-xs">🟢</span>
            <span className={showTextOnMobile ? "" : "hidden xs:inline"}>Online AI</span>
          </span>
        );
      case "offline_reasoning":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <span className="text-xs">🟡</span>
            <span className={showTextOnMobile ? "" : "hidden xs:inline"}>Offline Reasoning</span>
          </span>
        );
      case "limited_mode":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-500">
            <span className="text-xs">🔴</span>
            <span className={showTextOnMobile ? "" : "hidden xs:inline"}>Limited Mode</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(7),
      title: "วิเคราะห์การตัดสินใจใหม่",
      messages: [],
      created_at: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMobileSidebarOpen(false); // Close sidebar on mobile after initiating
  };

  const deleteSessionImmediately = (id: string) => {
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length === 0) {
      const defaultSession: ChatSession = {
        id: "default-session",
        title: "การตัดสินใจใหม่ (New Decision Analysis)",
        messages: [],
        created_at: new Date().toISOString(),
      };
      setSessions([defaultSession]);
      setCurrentSessionId(defaultSession.id);
    } else {
      setSessions(filtered);
      if (currentSessionId === id) {
        const index = sessions.findIndex((s) => s.id === id);
        const nextActiveIndex = index === 0 ? 1 : index - 1;
        const nextSession = filtered[nextActiveIndex] || filtered[0];
        setCurrentSessionId(nextSession.id);
      }
    }
  };

  const handleDeleteAllEmptySessions = () => {
    const nonEmpty = sessions.filter((s) => s.messages.length > 0);
    if (nonEmpty.length === 0) {
      const defaultSession: ChatSession = {
        id: "default-session",
        title: "การตัดสินใจใหม่ (New Decision Analysis)",
        messages: [],
        created_at: new Date().toISOString(),
      };
      setSessions([defaultSession]);
      setCurrentSessionId(defaultSession.id);
    } else {
      setSessions(nonEmpty);
      const isCurrentEmpty = !nonEmpty.some((s) => s.id === currentSessionId);
      if (isCurrentEmpty) {
        setCurrentSessionId(nonEmpty[0].id);
      }
    }
  };

  const handleDeleteSession = (id: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      if ('preventDefault' in e) {
        e.preventDefault();
      }
    }
    const session = sessions.find((s) => s.id === id);
    if (session) {
      if (session.messages.length === 0) {
        deleteSessionImmediately(id);
      } else {
        setSessionToDelete(session);
      }
    }
  };

  const confirmDeleteSession = () => {
    if (!sessionToDelete) return;
    deleteSessionImmediately(sessionToDelete.id);
    setSessionToDelete(null);
  };

  // Direct clear messages of active session on touch screen
  const handleClearCurrentSession = () => {
    setIsClearingSession(true);
  };

  const confirmClearSession = () => {
    const updated = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          title: "บทสนทนาที่ว่างเปล่า",
          messages: []
        };
      }
      return s;
    });
    setSessions(updated);
    setIsClearingSession(false);
  };

  const handleDownloadMarkdown = () => {
    try {
      const markdownContent = generateMarkdown(currentSession);
      const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = currentSession.title.trim().replace(/[^a-zA-Z0-9ก-๙\s-_]/g, "").replace(/\s+/g, "_");
      link.href = url;
      link.setAttribute("download", `PCA_Analysis_${safeTitle || "report"}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch (error) {
      console.error("Failed to export Markdown:", error);
    }
  };

  const handleDownloadHTML = () => {
    try {
      const htmlContent = generateHTML(currentSession);
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = currentSession.title.trim().replace(/[^a-zA-Z0-9ก-๙\s-_]/g, "").replace(/\s+/g, "_");
      link.href = url;
      link.setAttribute("download", `PCA_Analysis_${safeTitle || "report"}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch (error) {
      console.error("Failed to export HTML:", error);
    }
  };

  const handleExportMessageMarkdown = (message: Message) => {
    try {
      // Find the user's prompt that precedes this assistant message
      const sessionIdx = sessions.findIndex((s) => s.id === currentSessionId);
      let userPrompt: Message | undefined;
      
      if (sessionIdx !== -1) {
        const messages = sessions[sessionIdx].messages;
        const msgIdx = messages.findIndex((m) => m.id === message.id);
        if (msgIdx > 0 && messages[msgIdx - 1].role === "user") {
          userPrompt = messages[msgIdx - 1];
        }
      }

      const mdContent = generateSingleMessageMarkdown(currentSession.title, message, userPrompt);
      const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = currentSession.title.trim().replace(/[^a-zA-Z0-9ก-๙\s-_]/g, "").replace(/\s+/g, "_");
      link.href = url;
      link.setAttribute("download", `PCA_Response_${safeTitle || "message"}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export single message to Markdown:", error);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setInputText(prompt);
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || inputText;
    if (!textToSend.trim() || loading) return;

    // Create user message
    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update current session title if it's the first message
    let updatedSessions = [...sessions];
    const sessionIdx = updatedSessions.findIndex((s) => s.id === currentSessionId);
    
    if (sessionIdx !== -1) {
      const isFirstMsg = updatedSessions[sessionIdx].messages.length === 0;
      const title = isFirstMsg 
        ? textToSend.length > 25 ? textToSend.substring(0, 25) + "..." : textToSend
        : updatedSessions[sessionIdx].title;

      updatedSessions[sessionIdx] = {
        ...updatedSessions[sessionIdx],
        title,
        messages: [...updatedSessions[sessionIdx].messages, userMessage],
      };
      setSessions(updatedSessions);
    }

    setInputText("");
    setLoading(true);

    // Simulate thinking steps
    const steps = [
      "1. Observation (สังเกตการณ์ข้อมูลนำเข้า...)",
      "2. Understanding (ทำความเข้าใจเป้าหมาย...)",
      "3. Purpose (กำหนดขอบเขตและข้อบังคับ...)",
      "4. Memory (ดึงข้อมูลความรู้เชิงบริบท...)",
      "5. Mental Model (ออกแบบโครงสร้างคิด...)",
      "6. Hypothesis (พิจารณาทางเลือกตัดสินใจ...)",
      "7. Evidence Evaluation (ประเมินน้ำหนักหลักฐาน...)",
      "8. Critique (วิเคราะห์ความไม่สมบูรณ์และจุดอ่อน...)",
      "9. Decision (สรุปผลและจัดสรรคำแนะนำ...)",
      "10. Communication (ประมวลผลข้อเขียนภาษาไทย...)",
    ];

    let currentStepIdx = 0;
    setThinkingStep(steps[0]);
    const stepInterval = setInterval(() => {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++;
        setThinkingStep(steps[currentStepIdx]);
      }
    }, 1200);

    try {
      const data = await analyze(textToSend, llmProvider, llmModel, tone, deepReasoning);
      
      clearInterval(stepInterval);
      setThinkingStep("11. Reflection & 12. Learning (จดจำประสบการณ์ลงหน่วยความจำของระบบ...)");

      setTimeout(() => {
        const assistantMsg: Message = {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pcaState: {
            notes: data.notes || [],
            observations: data.observations || [],
            understanding: data.understanding || "",
            purpose: data.purpose || "",
            decision: data.decision || "",
            confidence: data.confidence ?? 0.0,
            critique: data.critique || [],
            reflection: data.reflection || [],
            learning: data.learning || [],
            agency_checks: data.agency_checks || [],
            trace: data.trace || [],
          },
        };

        const finalSessions = [...updatedSessions];
        const finalSessionIdx = finalSessions.findIndex((s) => s.id === currentSessionId);
        if (finalSessionIdx !== -1) {
          finalSessions[finalSessionIdx] = {
            ...finalSessions[finalSessionIdx],
            messages: [...finalSessions[finalSessionIdx].messages, assistantMsg],
          };
          setSessions(finalSessions);
          // Keep trace of the newest assistant message collapsed/hidden by default
          setExpandedTraceMsgId(null);
        }
        setLoading(false);
        setThinkingStep("");
        fetchMemories(); // Refresh the client memory bank after the model completes learning
      }, 800);

    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      
      const errMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: `ขออภัยด้วยครับ เกิดข้อผิดพลาดในขั้นตอนวิเคราะห์ของระบบ: ${err.message || "ไม่สามารถเชื่อมต่อ API ได้"}. กรุณาลองใหม่อีกครั้งครับ`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalSessions = [...updatedSessions];
      const finalSessionIdx = finalSessions.findIndex((s) => s.id === currentSessionId);
      if (finalSessionIdx !== -1) {
        finalSessions[finalSessionIdx] = {
          ...finalSessions[finalSessionIdx],
          messages: [...finalSessions[finalSessionIdx].messages, errMsg],
        };
        setSessions(finalSessions);
      }
      setLoading(false);
      setThinkingStep("");
    }
  };

  const toggleStage = (stageName: string) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageName]: !prev[stageName],
    }));
  };

  return (
    <div className={`flex h-screen h-[100dvh] w-full max-w-full font-sans antialiased overflow-hidden transition-colors duration-200 ${isDarkMode ? "bg-[#131314] text-[#e3e3e3]" : "bg-[#f0f4f9] text-[#1f1f1f]"}`}>
      
      {/* MOBILE BACKDROP LAYER */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden absolute inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-[2px]"
        />
      )}

      {/* SIDEBAR - Persistent on desktop, responsive drawer overlay on mobile/tablet */}
      <aside className={`fixed lg:relative top-0 bottom-0 left-0 w-72 shrink-0 flex flex-col h-full z-50 transition-transform duration-300 border-r ${
        isDarkMode 
          ? "bg-[#1e1f20] border-[#2d2f31] text-gray-200" 
          : "bg-[#ffffff] border-[#e3e3e3] text-[#1f1f1f]"
        } ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo / Brand Header */}
        <div className={`p-4 flex items-center justify-between border-b ${isDarkMode ? "border-[#2d2f31]" : "border-[#e3e3e3]"}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 rounded-xl shadow-md shadow-orange-500/10 animate-pulse">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">PUNN PCA</h1>
              <p className={`text-xs font-mono font-bold uppercase tracking-wider ${isDarkMode ? "text-orange-400/80" : "text-orange-600"}`}>Cognitive System</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? "text-gray-400 hover:text-white hover:bg-[#2d2f31]" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              title="ตั้งค่า LLM"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className={`p-2 rounded-full lg:hidden transition-colors ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Initiator Touch Area - New Chat Button */}
        <div className="p-3 space-y-2">
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-full transition-all border shadow-sm cursor-pointer ${
              isDarkMode 
                ? "bg-gradient-to-r from-orange-600/10 to-rose-600/10 hover:from-orange-600/20 hover:to-rose-600/20 text-orange-400 border-orange-500/20 hover:border-orange-500/40" 
                : "bg-orange-50/70 hover:bg-orange-100/80 text-orange-700 border-orange-200/80 hover:border-orange-300 shadow-orange-100/20"
            }`}
          >
            <Plus className="w-4 h-4 text-orange-500 shrink-0" />
            <span>เริ่มวิเคราะห์เรื่องใหม่ (New)</span>
          </button>
        </div>


        {/* Chat History List (Recents) */}
        <div className="flex-1 overflow-y-auto px-2.5 space-y-1">
          {(() => {
            const emptySessionsCount = sessions.filter((s) => s.messages.length === 0).length;
            return (
              <div className="flex items-center justify-between px-3 py-2 shrink-0">
                <span className={`text-sm font-bold tracking-wider uppercase ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  ประวัติการวิเคราะห์ล่าสุด
                </span>
                {emptySessionsCount > 0 && (
                  <button
                    onClick={handleDeleteAllEmptySessions}
                    className="text-xs font-bold text-rose-500 hover:text-rose-400 hover:underline transition-all cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-rose-500/10"
                    title="ลบห้องแชทที่ว่างเปล่าทั้งหมดทันที"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>ลบแชทเปล่า ({emptySessionsCount})</span>
                  </button>
                )}
              </div>
            );
          })()}
          
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {sessions.map((session) => {
                const isActive = session.id === currentSessionId;
                const isEmpty = session.messages.length === 0;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, margin: 0, padding: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    onClick={() => {
                      setCurrentSessionId(session.id);
                      setMobileSidebarOpen(false); // Auto-close drawer on tap
                    }}
                    className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all text-xs md:text-sm border ${
                      isActive 
                        ? isDarkMode 
                          ? "bg-gradient-to-r from-[#211b18] to-[#2d1f18] border-orange-500/25 text-orange-200/90 font-medium shadow-md shadow-orange-950/15" 
                          : "bg-gradient-to-r from-orange-50/70 to-amber-50/70 border-orange-500/15 text-orange-950 font-semibold shadow-sm"
                        : isDarkMode 
                          ? "text-gray-300 hover:bg-[#252728] border-transparent hover:border-[#2d2f31]/60" 
                          : "text-gray-700 hover:bg-gray-100/80 border-transparent hover:border-gray-200/50"
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {/* Active vertical glow indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-gradient-to-b from-orange-500 to-amber-500" />
                    )}

                    <div className="flex items-center gap-2.5 overflow-hidden mr-1 pl-1">
                      <MessageSquare className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive ? "text-orange-500 scale-110" : "text-gray-400 group-hover:scale-105"
                      }`} />
                      <div className="truncate flex flex-col">
                        <span className="truncate">{session.title}</span>
                        {isEmpty && (
                          <span className="text-xs text-gray-400 font-mono font-normal">แชทเปล่า (Empty)</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Touch-Friendly Action: Trash button with intuitive click behavior */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id, e);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      className={`p-2.5 rounded-lg transition-all relative z-10 ${
                        isActive 
                          ? "text-rose-500 hover:bg-rose-500/10 hover:text-rose-400" 
                          : "text-gray-400 hover:text-rose-500 hover:bg-gray-200 dark:hover:bg-[#3c4043]"
                      } lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 opacity-100 shrink-0 cursor-pointer`}
                      title={isEmpty ? "ลบแชทเปล่าทันที" : "ลบแชทวิเคราะห์นี้"}
                      style={{ minWidth: "36px", minHeight: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 bg-[#171819] border-t space-y-3 ${isDarkMode ? "bg-[#171819] border-[#2d2f31]" : "bg-[#f8f9fa] border-[#e3e3e3]"}`}>
          <div className="flex items-center justify-between text-xs">
            <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>สถานะระบบ:</span>
            {renderStatusBadge(true)}
          </div>
          
          <div className={`p-2.5 rounded-xl text-xs font-mono flex items-center justify-between ${isDarkMode ? "bg-[#212325] text-gray-300" : "bg-gray-100 text-gray-700"}`}>
            <span>Engine Core:</span>
            <span className="font-semibold text-orange-500">12-Stage DNA</span>
          </div>

          <div className={`p-2.5 rounded-xl text-xs font-mono flex items-center justify-between ${isDarkMode ? "bg-[#212325] text-gray-300" : "bg-gray-100 text-gray-700"}`}>
            <span>Workspace:</span>
            <span className="font-semibold text-orange-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>PUNN PCA BACKEND</span>
            </span>
          </div>

          <a 
            href="https://github.com/punn-pca/punn-cognitive-architecture" 
            target="_blank" 
            referrerPolicy="no-referrer"
            className="flex items-center justify-between p-1.5 text-xs text-orange-500 hover:text-orange-600 hover:underline transition-all"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-row h-full relative overflow-hidden">
        
        {/* Main Chat Column */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Navigation Header */}
        <header className={`h-14 border-b px-4 md:px-6 flex items-center justify-between shrink-0 transition-colors ${
          isDarkMode ? "bg-[#131314] border-[#2d2f31]" : "bg-[#ffffff] border-[#e3e3e3]"
        }`}>
          <div className="flex items-center gap-2.5">
            {/* Hamburger mobile/tablet menu button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className={`p-2 rounded-full lg:hidden transition-colors ${isDarkMode ? "hover:bg-[#2d2f31] text-white" : "hover:bg-gray-100 text-[#1f1f1f]"}`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className={`text-xs font-bold tracking-wide lg:hidden bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent`}>
              PUNN PCA
            </span>
            <span className="text-gray-300 dark:text-gray-700 hidden lg:inline">|</span>
            <div className="hidden sm:inline-flex">
              {renderStatusBadge(false)}
            </div>
            <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">|</span>
            <div className="text-xs text-gray-500 dark:text-gray-600 hidden sm:flex items-center gap-1">
              <span>Model:</span>
              <strong className="text-orange-500 font-mono capitalize">{llmProvider}</strong>
              <span>({llmModel})</span>
            </div>
          </div>

          {/* Core Navigation Controls */}
          <div className="flex items-center gap-2.5">
            {/* Cognitive Memory Vault Toggler */}
            <button
              onClick={() => setShowMemoryPanel(!showMemoryPanel)}

              className={`p-2 rounded-full transition-colors relative cursor-pointer ${
                showMemoryPanel
                  ? "text-orange-500 bg-orange-500/10"
                  : isDarkMode
                    ? "text-gray-400 hover:text-white hover:bg-[#2d2f31]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              title="คลังความจำสะสม (Cognitive Memory Vault)"
            >
              <Brain className="w-4.5 h-4.5" />
              {memories.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>
              )}
            </button>

            {/* Light / Dark Mode Toggler */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${isDarkMode ? "text-amber-400 hover:bg-[#2d2f31]" : "text-orange-600 hover:bg-gray-100"}`}
              title={isDarkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* PCA LLM Settings Toggler */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                showSettings
                  ? "text-blue-500 bg-blue-500/10"
                  : isDarkMode
                  ? "text-gray-400 hover:text-white hover:bg-[#2d2f31]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              title="ตั้งค่าสเปกการประมวลผลโมเดล (LLM Config)"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>

            {/* Clear Chat Screen action explicitly optimized for tactile/touch interfaces */}
            {currentSession.messages.length > 0 && (
              <button
                onClick={handleClearCurrentSession}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  isDarkMode 
                    ? "bg-[#2d2f31]/50 border-[#2d2f31] hover:bg-[#2d2f31] text-rose-400" 
                    : "bg-rose-50/60 border-rose-100 hover:bg-rose-50 text-rose-600"
                }`}
                title="ล้างแชทปัจจุบัน"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ล้างแชท</span>
              </button>
            )}

            {/* Download/Export Current Session */}
            {currentSession.messages.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    isDarkMode 
                      ? "bg-[#2d2f31]/50 border-[#2d2f31] hover:bg-[#2d2f31] text-orange-400" 
                      : "bg-orange-50/60 border-orange-100 hover:bg-orange-50 text-orange-600"
                  }`}
                  title="ดาวน์โหลดบทวิเคราะห์"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ดาวน์โหลด</span>
                </button>
                
                {showExportMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowExportMenu(false)} 
                    />
                    <div className={`absolute right-0 mt-2 w-64 rounded-xl border p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                      isDarkMode 
                        ? "bg-[#1e1f20] border-[#2d2f31] text-gray-200" 
                        : "bg-white border-gray-150 text-gray-800"
                    }`}>
                      <div className="px-2.5 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800/20 mb-1">
                        เลือกรูปแบบการส่งออกรายงาน
                      </div>
                      <button
                        onClick={handleDownloadMarkdown}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg text-left transition-colors cursor-pointer ${
                          isDarkMode ? "hover:bg-[#2d2f31]" : "hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-orange-500 font-bold text-sm bg-orange-500/10 px-1.5 py-0.5 rounded font-mono">.MD</span>
                        <div className="flex flex-col text-left">
                          <span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>โครงสร้าง Markdown</span>
                          <span className="text-xs text-gray-400">เหมาะกับเก็บลง Obsidian/GitHub</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={handleDownloadHTML}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg text-left transition-colors cursor-pointer ${
                          isDarkMode ? "hover:bg-[#2d2f31]" : "hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-amber-500 font-bold text-sm bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">.HTML</span>
                        <div className="flex flex-col text-left">
                          <span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>เว็บพอร์ทัลส่งออก</span>
                          <span className="text-xs text-gray-400">รายงานเว็บแบบสมบูรณ์พร้อมเปิดดู</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="h-5 w-[1px] bg-gray-200 dark:bg-[#2d2f31]"></div>

            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white text-xs font-semibold rounded-full transition-all shadow-md shadow-orange-500/10 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">เริ่มวิเคราะห์ใหม่</span>
            </button>
          </div>
        </header>

        {/* Message Container / Workspace area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-10 py-6 space-y-6 w-full max-w-full">
          {currentSession.messages.length === 0 ? (
            /* Welcome Area & Suggestion Workspace with Staggered Premium Animation */
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-3xl mx-auto pt-4 md:pt-12 space-y-8 relative"
            >
              {/* Subtle ambient hearth glow background behind the welcome text */}
              <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-b from-orange-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-4 relative z-10 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-400 text-xs font-mono font-semibold uppercase tracking-wider animate-pulse">
                  <Flame className="w-3.5 h-3.5" />
                  <span>PUNN PCA Cognitive System</span>
                </div>
                
                <div className="space-y-3">
                  <motion.h2 
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent tracking-tight leading-tight"
                  >
                    ยินดีต้อนรับสู่ระบบวิเคราะห์ปัญญาประดิษฐ์ PUNN PCA
                  </motion.h2>
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className={`text-base md:text-xl font-medium leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    ระบบประเมินผลเชิงตรรกะและการวิเคราะห์ความสอดคล้องตามหลักการ 12 ลำดับขั้น (Cognitive DNA) เพื่อช่วยสนับสนุนแนวคิดและการเลือกตัดสินใจอย่างรอบด้านของคุณโดยสมบูรณ์
                  </motion.h3>
                </div>
              </div>

              {/* Suggestion Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pl-1">
                  <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDarkMode ? "text-orange-400/80" : "text-orange-600"}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span>เลือกหัวข้อหรือคำถามแนะนำเพื่อเริ่มต้นการวิเคราะห์</span>
                  </div>
                  
                  {/* Shuffle Button with interactive rotate effect */}
                  <button
                    onClick={handleShuffleSuggestions}
                    disabled={isShuffling}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 cursor-pointer transition-all ${
                      isDarkMode
                        ? "bg-[#1e1f20]/90 border-orange-500/10 text-orange-400 hover:bg-[#252627] hover:border-orange-500/20"
                        : "bg-orange-50/60 border-orange-200/50 text-orange-700 hover:bg-orange-100/60"
                    }`}
                  >
                    <motion.span
                      animate={isShuffling ? { rotate: 360 } : { rotate: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="inline-block"
                    >
                      🎲
                    </motion.span>
                    <span>สุ่มตัวอย่างใหม่ไปเรื่อยๆ</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {currentSuggestions.map((s, idx) => (
                      <motion.div
                        key={s.title}
                        onClick={() => handleSuggestionClick(s.prompt)}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                        whileHover={{ 
                          scale: 1.02, 
                          y: -3, 
                          boxShadow: isDarkMode 
                            ? "0 12px 30px -10px rgba(249, 115, 22, 0.2)" 
                            : "0 12px 30px -10px rgba(249, 115, 22, 0.1)"
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-5 border rounded-2xl cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden transition-colors group firekeeper-border ${
                          isDarkMode 
                            ? "bg-[#1e1f20] hover:bg-gradient-to-b hover:from-[#1e1f20] hover:to-[#221a16] border-[#2d2f31] hover:border-orange-50/20" 
                            : "bg-white hover:bg-gradient-to-b hover:from-white hover:to-orange-50/10 border-gray-200/85 hover:border-orange-500/15 shadow-sm"
                        }`}
                      >
                        {/* Interactive Corner Accent */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/5 via-rose-500/0 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500" />
                        
                        <div className="space-y-2 relative z-10">
                          <h4 className={`font-bold text-sm flex items-center gap-1.5 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}>
                            <Flame className="w-4 h-4 text-orange-500 group-hover:animate-pulse" />
                            <span>{s.title}</span>
                          </h4>
                          <p className={`text-xs line-clamp-2 leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{s.desc}</p>
                        </div>
                        
                        <div className="text-sm text-orange-500 font-bold flex items-center gap-0.5 self-end relative z-10 transition-transform group-hover:translate-x-1 duration-300">
                          <span>วิเคราะห์ประเด็นนี้</span> 
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Message Exchanges Pane */
            <div className="max-w-4xl mx-auto space-y-6">
              <AnimatePresence initial={false}>
                {currentSession.messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 380, damping: 26 }}
                      className="space-y-2"
                    >
                    {/* Header line for each bubble */}
                    <div className={`flex items-center gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                      
                      <div className={`text-sm font-mono ${isDarkMode ? "text-gray-500" : "text-gray-400"} flex items-center gap-2`}>
                        <span>{isUser ? "ผู้ใช้" : "PUNN PCA (ระบบ)"} • {message.timestamp}</span>
                        {isUser ? (
                          <button
                            onClick={() => handleCopyMessage(message.id, message.content)}
                            className={`p-1 px-2 rounded-full transition-all cursor-pointer flex items-center gap-1 text-xs font-sans font-semibold border ${
                              copiedMsgId === message.id
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "text-gray-500 hover:text-orange-500 hover:bg-orange-500/10 border-transparent hover:border-orange-500/10"
                            }`}
                            title="คัดลอกข้อความคำถามนี้"
                          >
                            {copiedMsgId === message.id ? (
                              <>
                                <Check className="w-3 h-3 shrink-0 text-emerald-500" />
                                <span>คัดลอกแล้ว</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 shrink-0 text-gray-400" />
                                <span>คัดลอก</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleSpeech(message.id, message.content)}
                              className={`p-1 px-2 rounded-full hover:bg-orange-500/10 hover:text-orange-400 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-sans font-semibold ${
                                speakingMsgId === message.id 
                                  ? "text-orange-500 bg-orange-500/5 ring-1 ring-orange-500/20" 
                                  : "text-gray-500 hover:text-orange-500"
                              }`}
                              title={speakingMsgId === message.id ? "หยุดฟังเสียงอ่าน" : "ฟังเสียงอ่านข้อความนี้"}
                            >
                              {speakingMsgId === message.id ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                  <span className="animate-pulse">หยุดฟัง</span>
                                  <span className="flex gap-0.5 items-end h-2.5 pb-0.5">
                                    <span className="w-0.5 bg-orange-500 animate-eqBar1 rounded-full" />
                                    <span className="w-0.5 bg-orange-500 animate-eqBar2 rounded-full" />
                                    <span className="w-0.5 bg-orange-500 animate-eqBar3 rounded-full" />
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>ฟังเสียง</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className={`p-1 px-2.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 text-xs font-sans font-semibold border ${
                                copiedMsgId === message.id
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : "text-gray-500 hover:text-orange-500 hover:bg-orange-500/10 border-transparent hover:border-orange-500/10"
                              }`}
                              title="คัดลอกคำตอบนี้"
                            >
                              {copiedMsgId === message.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                  <span>คัดลอกแล้ว</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 shrink-0 text-orange-500/90" />
                                  <span>คัดลอก</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleExportMessageMarkdown(message)}
                              className="p-1 px-2.5 rounded-full hover:bg-orange-500/10 hover:text-orange-400 text-gray-500 hover:text-orange-500 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-sans font-semibold border border-transparent hover:border-orange-500/10"
                              title="ส่งออกคำตอบนี้เป็นไฟล์ Markdown (.MD)"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0 text-orange-500/90" />
                              <span>ส่งออก .MD</span>
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Speech content body */}
                    <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full max-w-full`}>
                      <div
                        className={`w-full max-w-full md:max-w-3xl rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm overflow-x-hidden break-words chat-bubble-hearth ${
                          isUser
                            ? isDarkMode
                              ? "bg-[#2d2f31] text-white border border-[#3c4043] rounded-tr-none"
                              : "bg-[#e9eef6] text-[#1f1f1f] border border-[#d3dfef] rounded-tr-none"
                            : isDarkMode
                              ? "bg-[#1e1f20] text-gray-100 border border-[#2d2f31] rounded-tl-none fire-flicker-glow"
                              : "bg-[#ffffff] text-[#1f1f1f] border border-gray-200/80 rounded-tl-none fire-flicker-glow"
                        }`}
                      >
                        {/* Executive 7-Stage Cognitive Sequence (if PCA State is present) */}
                        {!isUser && message.pcaState ? (
                          <div className="space-y-4">
                            {/* Executive Decision Card (🏆 Prioritized at the Top) */}
                            <div className={`p-4.5 rounded-xl border transition-all ${
                              isDarkMode 
                                ? "bg-gradient-to-r from-emerald-950/20 to-teal-950/20 border-emerald-500/30 text-emerald-200" 
                                : "bg-gradient-to-r from-emerald-50/60 to-teal-50/50 border-emerald-200 text-emerald-950"
                            }`}>
                              <div className="font-extrabold text-emerald-600 dark:text-emerald-400 mb-2.5 flex items-center gap-2 text-xs uppercase tracking-wider">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
                                <span>🏆 ข้อสรุปทางยุทธศาสตร์และทางเลือกที่ดีที่สุด (Strategic Decision & Best Choice)</span>
                              </div>
                              <p className="text-xs leading-relaxed font-bold">
                                {message.pcaState.decision || "ระบบวิเคราะห์ข้อสรุปทางเลือกที่ดีที่สุดเรียบร้อยแล้ว"}
                              </p>
                              <div className={`mt-2.5 pt-2.5 border-t text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide opacity-90 ${
                                isDarkMode ? "border-emerald-500/10 text-emerald-400" : "border-emerald-200 text-emerald-700"
                              }`}>
                                🛡️ อำนาจอธิปไตยเจตจำนงมนุษย์ (Human Ownership Clause): การประเมินนี้ทำหน้าที่สนับสนุนการตัดสินใจเท่านั้น อำนาจอธิปไตยสุดท้ายเป็นของคุณอย่างสมบูรณ์
                              </div>
                            </div>

                            {/* Compact Executive Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {/* Confidence Meter */}
                              <div className={`p-4 rounded-xl border transition-all ${
                                isDarkMode ? "bg-[#161617]/95 border-[#2d2f31]/80" : "bg-white border-gray-150 shadow-sm"
                              }`}>
                                <p className="font-extrabold text-amber-500 dark:text-amber-400 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                                  <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />
                                  <span>📊 ดัชนีความมั่นใจการวิเคราะห์ (Confidence Rating)</span>
                                </p>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm font-bold">
                                    <span className="text-gray-500 dark:text-gray-400">ระดับความมั่นใจ:</span>
                                    <span className="text-orange-500">{Math.round(message.pcaState.confidence * 100)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-[#2d2f31] rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-1.5 rounded-full transition-all duration-500"
                                      style={{ width: `${Math.round(message.pcaState.confidence * 100)}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-400 leading-relaxed italic">
                                    {message.pcaState.confidence > 0.7 
                                      ? "หลักฐานประจักษ์บริบทชัดเจนระดับสูง สอดคล้องตามกลระเบียบวิธีวิจัย"
                                      : message.pcaState.confidence > 0.4 
                                      ? "มีเงื่อนไขและข้อแลกเปลี่ยน (Trade-offs) ซับซ้อน ต้องใช้วิจารณญาณร่วมตัดสินใจ"
                                      : "มีประเด็นจริยธรรมที่ขัดแย้งเชิงคุณค่าสูง ควรชั่งน้ำหนักประเด็นอย่างรอบคอบ"}
                                  </p>
                                </div>
                              </div>

                              {/* Core Purpose Summary */}
                              <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                                isDarkMode ? "bg-[#161617]/95 border-[#2d2f31]/80" : "bg-white border-gray-150 shadow-sm"
                              }`}>
                                <div>
                                  <p className="font-extrabold text-purple-500 dark:text-purple-400 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                                    <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                                    <span>💡 เจตจำนงแฝงสูงสุด (Core Purpose)</span>
                                  </p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
                                    {message.pcaState.purpose || "มุ่งรักษาความถูกต้องเชิงหลักการและคุ้มครองคุณค่าความปลอดภัยสูงสุด"}
                                  </p>
                                </div>
                                <div className="text-xs text-orange-500 font-bold uppercase mt-2 tracking-wider flex items-center gap-1">
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>PCA Executive Certified</span>
                                </div>
                              </div>
                            </div>

                            {/* Full Analytical Report (Collapsible, Collapsed by Default) */}
                            <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${
                              isDarkMode ? "bg-[#151516] border-[#2d2f31]" : "bg-gray-50/50 border-gray-200"
                            }`}>
                              <button
                                onClick={() => {
                                  setExpandedReportMsgIds(prev => ({
                                    ...prev,
                                    [message.id]: !prev[message.id]
                                  }));
                                }}
                                className={`w-full flex items-center justify-between p-4.5 text-xs font-bold transition-colors text-left cursor-pointer ${
                                  isDarkMode ? "hover:bg-[#1d1d1f]" : "hover:bg-gray-100/60"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                                  <div>
                                    <span className={isDarkMode ? "text-gray-200" : "text-gray-800"}>
                                      📄 รายงานการวิเคราะห์ระบบโดยละเอียด (Full Analytical Report)
                                    </span>
                                    <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal mt-1">
                                      คลิกเพื่อขยายดูรายงานผลการวิเคราะห์เปรียบเทียบเชิงวิพากษ์และญาณวิทยาฉบับเต็ม (ค่อยๆ แจกแจงรายละเอียด)
                                    </span>
                                  </div>
                                </div>
                                {expandedReportMsgIds[message.id] ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                )}
                              </button>

                              <AnimatePresence initial={false}>
                                {expandedReportMsgIds[message.id] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                  >
                                    <div className={`p-4.5 border-t space-y-3.5 text-sm leading-relaxed ${
                                      isDarkMode ? "border-[#2d2f31] bg-[#1a1b1c] text-gray-200" : "border-gray-200 bg-white text-gray-800"
                                    }`}>
                                      {parseMarkdownToJsx(message.content, isDarkMode, (option) => handleSend(option))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Collapsible Deep Reasoning Chain Explorer (PCA detailed internal steps) */}
                            <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${
                              isDarkMode ? "bg-[#151516] border-[#2d2f31]" : "bg-gray-50/50 border-gray-200"
                            }`}>
                              <button
                                onClick={() => {
                                  setExpandedAnalysisMsgIds(prev => ({
                                    ...prev,
                                    [message.id]: !prev[message.id]
                                  }));
                                }}
                                className={`w-full flex items-center justify-between p-4.5 text-xs font-bold transition-colors text-left ${
                                  isDarkMode ? "hover:bg-[#1d1d1f]" : "hover:bg-gray-100/60"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Settings className="w-4 h-4 text-orange-500 shrink-0 animate-spin-slow" />
                                  <div>
                                    <span className={isDarkMode ? "text-gray-200" : "text-gray-800"}>
                                      ⚙️ ตรวจสอบโครงสร้างห่วงโซ่ความคิดเชิงลึก (Inspect Deep Reasoning Pipeline - 5 Stages)
                                    </span>
                                    <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal mt-1">
                                      คลิกเพื่อขยายดูขั้นตอนการสังเกตการณ์ เกณฑ์เป้าหมาย แผนกลยุทธ์ และมาตรการตรวจอคติปัญญา
                                    </span>
                                  </div>
                                </div>
                                {expandedAnalysisMsgIds[message.id] ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                )}
                              </button>

                              <AnimatePresence initial={false}>
                                {expandedAnalysisMsgIds[message.id] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                  >
                                    <div className={`p-4 border-t space-y-4 text-xs ${
                                      isDarkMode ? "border-[#2d2f31] bg-[#1a1b1c]" : "border-gray-200 bg-white"
                                    }`}>
                                      {/* ① Problem Understanding */}
                                      <div className={`p-3.5 rounded-lg border ${
                                        isDarkMode ? "bg-[#111213] border-[#2d2f31]" : "bg-gray-50 border-gray-150"
                                      }`}>
                                        <p className="font-extrabold text-orange-500 dark:text-orange-400 mb-2 flex items-center gap-1.5 text-sm uppercase tracking-wider">
                                          <Compass className="w-3.5 h-3.5" />
                                          <span>🧭 ① ทำความเข้าใจโจทย์ (Problem Understanding)</span>
                                        </p>
                                        <div className="space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-gray-500 dark:text-gray-400">หมวดหมู่เป้าหมาย:</span>
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-xs tracking-wide uppercase ${
                                              isDarkMode ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-orange-50 text-orange-700 border border-orange-200"
                                            }`}>
                                              {message.content.toLowerCase().includes("ethics") || message.content.includes("จริยธรรม") || message.content.includes("คุณธรรม")
                                                ? "Ethical Analysis + Governance Review"
                                                : message.content.toLowerCase().includes("code") || message.content.includes("verify") || message.content.includes("ซอร์สโค้ด") || message.content.includes("รหัส")
                                                ? "Software Logic & Formal Verification"
                                                : message.content.toLowerCase().includes("epistemology") || message.content.includes("ความรู้") || message.content.includes("ความจริง")
                                                ? "Epistemological Exploration & Truth Seeking"
                                                : "Strategic Decision & Utility Evaluation"
                                              }
                                            </span>
                                          </div>
                                          <div>
                                            <span className="font-bold text-gray-500 dark:text-gray-400">ข้อสังเกตภายนอก (Observations):</span>
                                            <p className="mt-1 p-2 bg-gray-100/50 dark:bg-black/25 rounded border border-gray-150 dark:border-[#2d2f31] leading-relaxed italic">
                                              "{message.pcaState.observations?.[0] || message.pcaState.understanding || "ประเด็นที่วิเคราะห์ประเมิน"}"
                                            </p>
                                          </div>
                                          <div className="space-y-1">
                                            <span className="font-bold text-gray-500 dark:text-gray-400">ผลลัพธ์ที่คาดหวังในการวิเคราะห์ (Expected Deliverables):</span>
                                            <ul className="space-y-0.5 list-disc pl-4 text-gray-600 dark:text-gray-400">
                                              <li>แจกแจงข้อบกพร่อง โครงสร้างความเสี่ยง และอคติทั้งหมด</li>
                                              <li>วิเคราะห์ผลกระทบและความรับผิดชอบต่อส่วนรวมอย่างโปร่งใส</li>
                                              <li>เปรียบเทียบทางเลือกพร้อมแนวทางแก้ไขนวัตกรรมที่ดีที่สุด</li>
                                            </ul>
                                          </div>
                                        </div>
                                      </div>

                                      {/* ② Goal / Success Criteria */}
                                      <div className={`p-3.5 rounded-lg border ${
                                        isDarkMode ? "bg-[#111213] border-[#2d2f31]" : "bg-gray-50 border-gray-150"
                                      }`}>
                                        <p className="font-extrabold text-blue-500 dark:text-blue-400 mb-2 flex items-center gap-1.5 text-sm uppercase tracking-wider">
                                          <Target className="w-3.5 h-3.5" />
                                          <span>🎯 ② เป้าหมายและเกณฑ์ความสำเร็จ (Goal / Success Criteria)</span>
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                          {[
                                            { text: "มีข้อผิดพลาดเชิงตรรกะหรือช่องโหว่ความคิดหรือไม่" },
                                            { text: "ขัดต่อกรอบจริยธรรม ศีลธรรม หรือหลักความคุ้มค่าตรงใด" },
                                            { text: "มีความเสี่ยงอคติเอนเอียง (Bias) ที่ต้องคอยคัดค้านหรือไม่" },
                                            { text: "เสนอวิธีการแก้ไขเชิงยุทธศาสตร์ที่ทดแทนกันได้อย่างคุ้มค่าที่สุด" }
                                          ].map((goal, idx) => (
                                            <div key={idx} className="flex items-start gap-1.5 text-gray-600 dark:text-gray-300">
                                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                              <span>{goal.text}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* ③ Analysis Strategy */}
                                      <div className={`p-3.5 rounded-lg border ${
                                        isDarkMode ? "bg-[#111213] border-[#2d2f31]" : "bg-gray-50 border-gray-150"
                                      }`}>
                                        <p className="font-extrabold text-purple-500 dark:text-purple-400 mb-2 flex items-center gap-1.5 text-sm uppercase tracking-wider">
                                          <Brain className="w-3.5 h-3.5" />
                                          <span>🧠 ③ แผนกลยุทธ์การประมวลผลความคิด (Analysis Strategy)</span>
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                          <div>
                                            <span className="font-bold text-gray-500 dark:text-gray-400 block mb-1">กลวิธีคิด (Reasoning Steps):</span>
                                            <div className="space-y-1 text-gray-600 dark:text-gray-400">
                                              <div>• Critical logical modeling</div>
                                              <div>• Stakeholder & ethics review</div>
                                              <div>• Biases & vulnerabilities check</div>
                                            </div>
                                          </div>
                                          <div>
                                            <span className="font-bold text-gray-500 dark:text-gray-400 block mb-1">สารารูปนำเสนอ (Outputs):</span>
                                            <div className="space-y-1 text-gray-600 dark:text-gray-400">
                                              <div>• ข้อเด่นข้อจำกัด (Pros/Cons)</div>
                                              <div>• ดัชนีเปรียบเทียบ (Trade-offs Matrix)</div>
                                              <div>• ข้อยุติสุดท้ายเชิงนโยบาย</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* ④ Suggested Cognitive Checks */}
                                      <div className={`p-3.5 rounded-lg border ${
                                        isDarkMode ? "bg-[#111213] border-[#2d2f31]" : "bg-gray-50 border-gray-150"
                                      }`}>
                                        <p className="font-extrabold text-rose-500 dark:text-rose-400 mb-1.5 flex items-center gap-1.5 text-sm uppercase tracking-wider">
                                          <CheckSquare className="w-3.5 h-3.5" />
                                          <span>🛡️ ④ ดัชนีประเมินอคติและความเอนเอียง (Cognitive Bias Safeguards)</span>
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5 leading-relaxed">
                                          โปรดคลิกทำเครื่องหมายวิพากษ์ตนเองร่วมกันเพื่อตรวจสอบความโปร่งใสทางตรรกะ:
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {[
                                            { id: "fairness", label: "Fairness Bias & Discrimination", desc: "ป้องกันการเอนเอียงเลือกปฏิบัติเชิงกลุ่มหรืออคติส่วนบุคคล" },
                                            { id: "goodhart", label: "Goodhart's Law (เกณฑ์ชี้วัดล้มเหลว)", desc: "เตือนภัยเมื่อเป้าหมายดัชนีแข็งตัวจนล้มเหลวต่อคุณค่าแท้จริง" },
                                            { id: "automation", label: "Automation Bias (เชื่อระบบเกินวาด)", desc: "หลีกเลี่ยงการคล้อยตามระบบอย่างไร้เสรีภาพวิพากษ์ทบทวน" },
                                            { id: "neutrality", label: "Medical & Ethical Neutrality", desc: "คงความเที่ยงธรรมและปราศจากผลประโยชน์ทับซ้อนเชิงลึก" },
                                            { id: "humanrights", label: "Agency Sovereignty (อธิปไตยมนุษย์)", desc: "ปกป้องเจตจำนงอิสระและสิทธิ์ขาดควบคุมสุดท้ายของมนุษย์" },
                                            { id: "fallacies", label: "Logical Fallacies (ตรรกะวิบัติ)", desc: "ตรวจสอบข้อสมมติอันตรายที่ขาดเหตุผลและประจักษ์พยาน" }
                                          ].map((check) => {
                                            const checkKey = `${message.id}-${check.id}`;
                                            const isChecked = !!cognitiveChecks[checkKey];
                                            return (
                                              <div 
                                                key={check.id}
                                                onClick={() => setCognitiveChecks(prev => ({ ...prev, [checkKey]: !isChecked }))}
                                                className={`p-2 rounded border transition-all cursor-pointer select-none text-left flex flex-col justify-between ${
                                                  isChecked 
                                                    ? "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-250" 
                                                    : "bg-gray-100/30 dark:bg-black/15 border-gray-150 dark:border-[#2d2f31] hover:border-rose-500/15"
                                                }`}
                                              >
                                                <div className="flex items-start gap-1.5">
                                                  <div className={`mt-0.5 rounded border transition-all shrink-0 p-0.5 ${
                                                    isChecked ? "bg-rose-500 border-rose-600 text-white" : "border-gray-400 bg-white dark:bg-[#131314]"
                                                  }`}>
                                                    <Check className={`w-2.5 h-2.5 ${isChecked ? "opacity-100" : "opacity-0"}`} />
                                                  </div>
                                                  <span className="text-xs font-bold leading-tight">{check.label}</span>
                                                </div>
                                                {isChecked && (
                                                  <p className="text-xs mt-1 pl-4.5 text-gray-500 dark:text-gray-450 leading-normal">
                                                    💡 <span className="font-bold text-rose-500">เกณฑ์เสี่ยง:</span> {check.desc}
                                                  </p>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        ) : (
                          /* If normal message or user message or lacks pcaState */
                          <div className="space-y-3">
                            {isUser ? (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            ) : (
                              <div className="space-y-3">
                                {parseMarkdownToJsx(message.content, isDarkMode, (option) => handleSend(option))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quota Error / General API Error Alert */}
                        {!isUser && message.pcaState?.notes && (() => {
                          const hasQuotaErr = message.pcaState.notes.some(note => 
                            note.toLowerCase().includes("quota") || 
                            note.toLowerCase().includes("429") || 
                            note.toLowerCase().includes("exhausted") || 
                            note.toLowerCase().includes("limit")
                          );
                          const hasGeneralErr = !hasQuotaErr && message.pcaState.notes.some(note => 
                            note.toLowerCase().includes("error") || 
                            note.toLowerCase().includes("fail")
                          );

                          if (hasQuotaErr) {
                            return (
                              <div className={`mt-4 p-3 rounded-xl border flex gap-2.5 text-xs leading-relaxed animate-fadeIn ${
                                isDarkMode 
                                  ? "bg-amber-950/20 border-amber-900/40 text-amber-200/95" 
                                  : "bg-amber-50 border-amber-200 text-amber-900"
                              }`}>
                                <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <p className="font-bold text-base">AI ออนไลน์ไม่พร้อมใช้งานชั่วคราว ระบบกำลังใช้โหมดวิเคราะห์ออฟไลน์ ผลลัพธ์อาจมีข้อมูลล่าสุดไม่ครบถ้วน</p>
                                  <p className="opacity-90">
                                    ระบบวิเคราะห์ได้สลับมาทำงานด้วย **กลไกวิเคราะห์ฐานข้อมูลออฟไลน์สำรอง (Deterministic Fallback)** ให้โดยอัตโนมัติ เพื่อให้กระบวนการวิเคราะห์ดำเนินต่อไปได้อย่างราบรื่นและมีเสถียรภาพสูงสุด
                                  </p>
                                  <p className="text-sm font-medium opacity-80 mt-1 border-t border-amber-500/10 pt-1.5 italic">
                                    “คำตอบนี้สร้างจาก Reasoning Engine ภายใน ไม่ได้อ้างอิงข้อมูลล่าสุดจากอินเทอร์เน็ต”
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          if (hasGeneralErr) {
                            return (
                              <div className={`mt-4 p-3 rounded-xl border flex gap-2.5 text-xs leading-relaxed animate-fadeIn ${
                                isDarkMode 
                                  ? "bg-rose-950/20 border-rose-900/40 text-rose-200/95" 
                                  : "bg-rose-50 border-rose-200 text-rose-950"
                              }`}>
                                <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <p className="font-bold text-base">การติดต่อสื่อสารกับโครงข่ายคลาวด์พบข้อขัดข้องชั่วคราว</p>
                                  <p className="opacity-90">
                                    ระบบได้สลับการประมวลผลไปใช้กระบวนคิดดีเทอร์มินิสติกสำรองเรียบร้อยแล้ว คุณยังสามารถป้อนหัวข้อเพื่อประเมินต่อได้ตามปกติ
                                  </p>
                                  <p className="text-sm font-medium opacity-80 mt-1 border-t border-rose-500/10 pt-1.5 italic">
                                    “คำตอบนี้สร้างจาก Reasoning Engine ภายใน ไม่ได้อ้างอิงข้อมูลล่าสุดจากอินเทอร์เน็ต”
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          return null;
                        })()}

                        {/* Interactive Clickable Suggestions/Quick Actions */}
                        {!isUser && (
                          (() => {
                            const proposedOptions = extractProposedOptions(message.content);
                            if (proposedOptions.length === 0) return null;
                            return (
                              <div className={`mt-4 pt-3 border-t border-dashed space-y-2 ${isDarkMode ? "border-[#2d2f31]/80" : "border-gray-100"}`}>
                                <div className="text-sm font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>ทางเลือกดำเนินการต่อ (คลิกเลือกและส่งประมวลผลทันที):</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {proposedOptions.map((opt, optIdx) => (
                                    <button
                                      key={optIdx}
                                      onClick={() => handleSend(opt)}
                                      disabled={loading}
                                      className={`text-xs px-3 py-1.5 rounded-xl border text-left flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                                        isDarkMode 
                                          ? "bg-[#252627] hover:bg-[#2d2f31] border-[#3c4043] text-gray-200 hover:text-white hover:border-[#4d5156]" 
                                          : "bg-orange-50/40 hover:bg-orange-50/80 border-orange-100/80 text-orange-800 hover:text-orange-900"
                                      }`}
                                    >
                                      <span className="font-medium">{opt}</span>
                                      <ChevronRight className="w-3.5 h-3.5 opacity-65 shrink-0" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })()
                        )}

                        {/* Cognitive Orchestration Layer: Reasoning Graph, Memory Trace & Strategy Selection */}
                        {!isUser && message.pcaState && (
                          <CognitiveOrchestrationView
                            reasoningGraph={message.pcaState.reasoning_graph}
                            strategySelection={message.pcaState.strategy_selection}
                            memoryTraces={message.pcaState.memory_traces}
                            isDarkMode={isDarkMode}
                          />
                        )}

                        {/* Cognitive DNA Trace accordion panels with grouped categorization */}
                        {!isUser && message.pcaState && (
                          <div className={`mt-5 pt-3 border-t ${isDarkMode ? "border-[#2d2f31]" : "border-gray-100"}`}>
                            {expandedTraceMsgId !== message.id ? (
                              <div className="flex justify-start">
                                <button
                                  onClick={() => setExpandedTraceMsgId(message.id)}
                                  className={`flex items-center gap-1.5 py-1 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                    isDarkMode
                                      ? "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                      : "text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                  }`}
                                >
                                  <Cpu className="w-3.5 h-3.5 text-purple-500" />
                                  <span>ตรวจสอบขั้นตอนความคิดและผลประเมิน (PCA Trace)</span>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2 items-center justify-between">
                                  <div className="flex flex-wrap gap-2 items-center">
                                    <span className="flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold">
                                      <Clock className="w-3.5 h-3.5" />
                                      ความมั่นใจวิเคราะห์: {Math.round(message.pcaState.confidence * 100)}%
                                    </span>
                                    {(message.pcaState.agency_checks || []).length > 0 && (
                                      <span className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        ผ่านการประเมินอธิปไตยการตัดสินใจ
                                      </span>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => setExpandedTraceMsgId(null)}
                                    className={`flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                      isDarkMode
                                        ? "bg-[#2a2b2d] hover:bg-[#333537] border-[#3c4043] text-white"
                                        : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                                    }`}
                                  >
                                    <Cpu className="w-3.5 h-3.5 text-orange-500" />
                                    <span>ซ่อนขั้นตอนความคิด</span>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Categorized 12-Stage Cognitive Trace Modules */}
                                <div className={`p-3.5 rounded-xl border space-y-4 animate-fadeIn ${
                                  isDarkMode ? "bg-[#131314] border-[#2d2f31]" : "bg-gray-50 border-gray-200"
                                }`}>
                                  <div className={`text-xs font-bold uppercase tracking-wider pb-2 border-b flex items-center justify-between ${isDarkMode ? "text-gray-400 border-[#2d2f31]" : "text-gray-500 border-gray-200"}`}>
                                    <span className="flex items-center gap-1.5">
                                      <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                      <span>หมวดหมู่กระบวนการคิดวิเคราะห์ (Grouped PCA Trace Modules)</span>
                                    </span>
                                    <span className="text-xs text-orange-500 font-mono font-bold animate-pulse">PCA COMPLIANT</span>
                                  </div>

                                  <div className="space-y-3">
                                    {[
                                      {
                                        id: "context",
                                        title: "1. การรับรู้และกรอบบริบท (Perception & Context Base)",
                                        desc: "ขั้นตอนที่ 1-4: การรวบรวมข้อสังเกตภายนอก ความเข้าใจเชิงลึก วัตถุประสงค์ และการดึงความทรงจำในอดีต",
                                        iconComp: BookOpen,
                                        stages: ["observation", "understanding", "purpose", "memory"],
                                        color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
                                      },
                                      {
                                        id: "modeling",
                                        title: "2. กรอบจำลองความคิดและสมมติฐาน (Cognitive Modeling & Synthesis)",
                                        desc: "ขั้นตอนที่ 5-6: วางแบบจำลองคิดเชิงระบบ และสังเคราะห์สมมติฐานเปรียบเทียบทางเลือกการวิเคราะห์",
                                        iconComp: Brain,
                                        stages: ["mental_model", "hypothesis"],
                                        color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
                                      },
                                      {
                                        id: "critique",
                                        title: "3. การประเมินน้ำหนักหลักฐานและการวิพากษ์อคติ (Evidence Weighting & Critique)",
                                        desc: "ขั้นตอนที่ 7-8: คัดกรองค่าน้ำหนักหลักฐานเชิงประจักษ์ พร้อมวิเคราะห์ประเมินอคติความเบี่ยงเบนในระบบ",
                                        iconComp: ShieldAlert,
                                        stages: ["evidence_evaluation", "critique"],
                                        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
                                      },
                                      {
                                        id: "decision",
                                        title: "4. ข้อยุติและสะท้อนเรียนรู้เชิงระบบ (Strategic Decisions & Continuous Learning)",
                                        desc: "ขั้นตอนที่ 9-12: สรุปจุดลงตัวดีที่สุดเพื่อข้อยุติ เขียนสื่อสาร ตกผลึกย้อนสะท้อน และเก็บเกี่ยวเป็นทักษะใหม่",
                                        iconComp: Sparkles,
                                        stages: ["decision", "communication", "reflection", "learning"],
                                        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
                                      }
                                    ].map((group) => {
                                      const groupKey = `${message.id}-${group.id}`;
                                      const isGroupExpanded = !!expandedTraceGroups[groupKey];
                                      const GroupIcon = group.iconComp;

                                      // Filter trace steps belonging to this group
                                      const groupTraceSteps = (message.pcaState.trace || []).filter(step => 
                                        group.stages.includes(step.stage.toLowerCase())
                                      );

                                      return (
                                        <div 
                                          key={group.id} 
                                          className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                                            isDarkMode 
                                              ? isGroupExpanded 
                                                ? "bg-[#161617] border-[#3a3c3e]" 
                                                : "bg-[#1a1b1c] border-[#2d2f31]/80 hover:border-[#3a3c3e]" 
                                              : isGroupExpanded 
                                                ? "bg-white border-orange-200 shadow-sm" 
                                                : "bg-white border-gray-200 hover:border-gray-300"
                                          }`}
                                        >
                                          {/* Group Header Button */}
                                          <div 
                                            onClick={() => setExpandedTraceGroups(prev => ({ ...prev, [groupKey]: !isGroupExpanded }))}
                                            className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                                              isDarkMode ? "hover:bg-[#212224]" : "hover:bg-gray-50/50"
                                            }`}
                                          >
                                            <div className="flex items-center gap-3">
                                              <span className={`p-2 rounded-lg ${group.color} border shrink-0`}>
                                                <GroupIcon className="w-4 h-4" />
                                              </span>
                                              <div className="text-left">
                                                <h5 className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                                  {group.title}
                                                </h5>
                                                <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                  {group.desc}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold font-mono ${
                                                isDarkMode ? "bg-[#252627] text-gray-400" : "bg-gray-100 text-gray-600"
                                              }`}>
                                                {groupTraceSteps.length} ขั้นตอน
                                              </span>
                                              {isGroupExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                              ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                              )}
                                            </div>
                                          </div>

                                          {/* Group Sub-stages */}
                                          <AnimatePresence initial={false}>
                                            {isGroupExpanded && (
                                              <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                className={`border-t ${isDarkMode ? "border-[#2d2f31]/80" : "border-orange-100"}`}
                                              >
                                                <div className={`p-3 space-y-2 ${isDarkMode ? "bg-[#111112]" : "bg-orange-50/10"}`}>
                                                  {groupTraceSteps.length === 0 ? (
                                                    <p className="text-sm italic text-gray-400 p-2">ไม่มีรายงานขั้นตอนการวิเคราะห์ในหมวดหมู่นี้</p>
                                                  ) : (
                                                    groupTraceSteps.map((traceStep, stepIdx) => {
                                                      const stageKey = traceStep.stage.toLowerCase();
                                                      const meta = STAGE_TRANSLATIONS[stageKey] || { th: traceStep.stage, en: traceStep.stage, color: "text-gray-400 bg-gray-400/10 border-gray-400/20", icon: Cpu };
                                                      const isExpanded = !!expandedStages[`${message.id}-${traceStep.stage}`];
                                                      const StepIcon = meta.icon;

                                                      return (
                                                        <div key={stepIdx} className={`border rounded-lg overflow-hidden transition-colors ${
                                                          isDarkMode ? "bg-[#1a1b1c] border-[#2d2f31]/80" : "bg-white border-gray-200"
                                                        }`}>
                                                          <div 
                                                            onClick={() => toggleStage(`${message.id}-${traceStep.stage}`)}
                                                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                                                              isDarkMode ? "hover:bg-[#212224]" : "hover:bg-gray-50"
                                                            }`}
                                                          >
                                                            <div className="flex items-center gap-2.5">
                                                              <span className={`p-1 rounded ${meta.color} border`}>
                                                                <StepIcon className="w-3.5 h-3.5" />
                                                              </span>
                                                              <div className="text-xs">
                                                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{meta.th}</span>
                                                                <span className="text-gray-400 dark:text-gray-500 mx-1.5 text-xs">({meta.en})</span>
                                                              </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                              <span className="text-xs text-gray-400 font-mono">
                                                                {new Date(traceStep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                              </span>
                                                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                                                            </div>
                                                          </div>

                                                          <AnimatePresence initial={false}>
                                                            {isExpanded && (
                                                              <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                                                className="overflow-hidden"
                                                              >
                                                                <div className={`p-3 border-t text-xs space-y-2 font-mono ${isDarkMode ? "bg-[#131314] border-[#2d2f31] text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
                                                                  <div className="text-gray-500 font-semibold uppercase text-xs">ตัวแปรกระบวนการคิดประเมิน (Execution variables):</div>
                                                                  <pre className={`p-2.5 rounded-lg overflow-x-auto text-xs leading-relaxed max-h-56 ${
                                                                    isDarkMode ? "bg-[#1e1f20] text-orange-300/95" : "bg-white text-orange-900 border border-gray-200"
                                                                  }`}>
                                                                    {JSON.stringify(traceStep.output, null, 2)}
                                                                  </pre>
                                                                </div>
                                                              </motion.div>
                                                            )}
                                                          </AnimatePresence>
                                                        </div>
                                                      );
                                                    })
                                                  )}
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Firekeeper checks section */}
                                  {(message.pcaState.agency_checks || []).length > 0 && (
                                    <div className={`p-3.5 border rounded-xl space-y-2.5 ${
                                      isDarkMode 
                                        ? "bg-orange-950/15 border-orange-500/20" 
                                        : "bg-orange-50/50 border-orange-200"
                                    }`}>
                                      <div className="text-xs font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1.5">
                                        <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                                        <span>ตัวประเมินความสมบูรณ์และเสรีการตัดสินใจ (Firekeeper Audit)</span>
                                      </div>
                                      <ul className="list-none pl-1 space-y-1.5 text-xs text-orange-950/90 dark:text-orange-200/90">
                                        {(message.pcaState.agency_checks || []).map((chk, cIdx) => (
                                          <li key={cIdx} className="flex items-start gap-2">
                                            <span className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 shrink-0"></span>
                                            <span>{chk}</span>
                                          </li>
                                        ))}
                                      </ul>
                                      {(message.pcaState.critique || []).length > 0 && (
                                        <div className={`pt-2.5 border-t ${isDarkMode ? "border-orange-500/10" : "border-orange-100"}`}>
                                          <div className="text-xs font-bold text-rose-500 flex items-center gap-1 mb-1.5">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            การวิเคราะห์อคติและความเอนเอียง (Critique and Bias Report)
                                          </div>
                                          <ul className="list-none pl-1 space-y-1 text-xs text-rose-900 dark:text-rose-200/80">
                                            {(message.pcaState.critique || []).map((crit, crIdx) => (
                                              <li key={crIdx} className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0"></span>
                                                <span>{crit}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Advanced visual loading states with simulated steps */}
              {loading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-orange-500 font-bold animate-pulse flex items-center gap-1.5">
                      <span>ระบบวิเคราะห์ปัญญาประดิษฐ์ PUNN PCA กำลังประมวลผลขั้นตอนความคิด...</span>
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className={`border rounded-2xl rounded-tl-none px-5 py-4 text-sm w-full max-w-3xl space-y-3.5 shadow-md ${
                      isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-[#ffffff] border-gray-200/80"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                        </span>
                        <div className={`text-xs font-mono font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          ขั้นตอนกระบวนการคิดปัจจุบัน: <span className="text-orange-500 font-bold">{thinkingStep}</span>
                        </div>
                      </div>

                      {/* Animated shimmer placeholder lines */}
                      <div className="space-y-3">
                        <div className="h-4 w-full shimmer rounded-md"></div>
                        <div className="h-4 w-[92%] shimmer rounded-md"></div>
                        <div className="h-4 w-[76%] shimmer rounded-md"></div>
                      </div>

                      {/* Loading bounce circles */}
                      <div className="flex gap-1 pt-1 items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-orange-500 bounce-dot"></span>
                        <span className="w-2 h-2 rounded-full bg-amber-500 bounce-dot"></span>
                        <span className="w-2 h-2 rounded-full bg-rose-500 bounce-dot"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* BOTTOM FIXED CHAT INPUT PANEL */}
        <footer className={`p-4 md:p-6 border-t ${
          isDarkMode ? "bg-[#131314] border-[#2d2f31]" : "bg-[#ffffff] border-[#e3e3e3]"
        }`}>
          <div className="max-w-3xl mx-auto space-y-2.5">
            


            {/* Main Interactive Box */}
            <div className={`relative flex items-center border rounded-3xl p-1.5 transition-all shadow-md focus-within:ring-2 focus-within:ring-blue-500/30 ${
              isDarkMode 
                ? "bg-[#1e1f20] border-[#2d2f31] focus-within:border-[#3c4043]" 
                : "bg-[#e9eef6] border-[#dfe6f1] focus-within:border-[#cbd5e1] focus-within:bg-white"
            }`}>
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="พิมพ์ข้อคำถามหรือประเด็นประเมินที่นี่..."
                className={`flex-1 max-h-48 min-h-[44px] py-2.5 px-4 bg-transparent text-sm focus:outline-none resize-none overflow-y-auto leading-normal ${
                  isDarkMode ? "text-gray-100 placeholder-orange-500/35" : "text-gray-900 placeholder-orange-600/35"
                }`}
                style={{ height: "auto" }}
                disabled={loading}
              />

              <div className="flex items-center gap-1 px-2 shrink-0">
                {/* Submit Send Button */}
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={loading || !inputText.trim()}
                  className={`p-3 rounded-full flex items-center justify-center transition-all ${
                    inputText.trim() && !loading
                      ? "bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-md shadow-orange-500/20 scale-105 cursor-pointer"
                      : "bg-gray-300 dark:bg-[#2a2b2d] text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  }`}
                  title="ส่งประมวลผลวิเคราะห์"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tactical Hint Message */}
            <div className={`flex flex-wrap items-center justify-between gap-1 text-sm px-3 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse shrink-0" />
                <span>ระบบวิเคราะห์ปัญญาประดิษฐ์ PUNN PCA ช่วยประเมินผลและสนับสนุนการคิด การตัดสินใจสุดท้ายขึ้นอยู่กับผู้ใช้เสมอ</span>
              </div>
              <span className="hidden xs:inline">กด Enter เพื่อส่ง, Shift+Enter เพื่อขึ้นบรรทัดใหม่</span>
            </div>
          </div>
        </footer>

        {/* LLM CONFIGURATION MODAL / SIDE OVERLAY */}
        {showSettings && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className={`border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl animate-scaleUp ${
              isDarkMode ? "bg-[#1e1f20] border-[#2d2f31] text-gray-200" : "bg-white border-gray-200 text-gray-800"
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#2d2f31]">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  <h3 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>ตั้งค่าสเปกการประมวลผล (PCA LLM Config)</h3>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "hover:bg-[#2d2f31] text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"}`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>ตัวให้บริการโมเดลหลังบ้าน (MODEL PROVIDER)</label>
                  <select
                    value={llmProvider}
                    onChange={(e) => {
                      setLlmProvider(e.target.value);
                      if (e.target.value === "ollama") {
                        setLlmModel("qwen3:4b");
                      } else if (e.target.value === "openai") {
                        setLlmModel("gpt-4o-mini");
                      } else {
                        setLlmModel("gemini-3.5-flash");
                      }
                    }}
                    className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                      isDarkMode 
                        ? "bg-[#131314] border-[#2d2f31] text-white" 
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="gemini">Google Gemini SDK</option>
                    <option value="openai">OpenAI Compatible API</option>
                    <option value="ollama">Ollama Local Integration</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>ชื่อโมเดลระบุเจาะจง (Model Identifier Name)</label>
                  <input
                    type="text"
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    className={`w-full border rounded-lg p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                      isDarkMode 
                        ? "bg-[#131314] border-[#2d2f31] text-white" 
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="ระบุชื่อโมเดล..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>น้ำเสียงและบุคลิกในการวิเคราะห์ (Tone & Personality)</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                      isDarkMode 
                        ? "bg-[#131314] border-[#2d2f31] text-white" 
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="Empathetic Guide">เพื่อนคู่คิด (Friendly & Casual - เข้าใจง่าย เป็นกันเอง)</option>
                    <option value="Formal Architect">สถาปนิกโครงสร้าง (Formal Architect - เป็นทางการ มีระเบียบ)</option>
                    <option value="Direct Strategist">นักยุทธศาสตร์ (Direct Strategist - ตรงไปตรงมา กระชับ)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-[#2d2f31]">
                  <div className="space-y-0.5">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>การคิดเชิงวิเคราะห์ขั้นสูง (Deep Reasoning)</label>
                    <p className="text-xs text-gray-400">กระตุ้นความลึกทางปัญญาและอภิปรายกรอบแนวคิดแบบลงลึกขึ้น</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={deepReasoning}
                    onChange={(e) => setDeepReasoning(e.target.checked)}
                    className="w-4.5 h-4.5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                  isDarkMode ? "bg-[#131314]/50 border-[#2d2f31] text-gray-400" : "bg-gray-50 border-gray-100 text-gray-600"
                }`}>
                  💡 <strong>ความปลอดภัย:</strong> คีย์รับรองของโมเดลถูกบันทึกและจำกัดการเข้าถึงอย่างรัดกุมที่ระบบโฮสต์หลัก (Server-Side) ข้อมูลการกำหนดค่านี้จะถูกประยุกต์ใช้ในการเรียกวิเคราะห์อย่างสมบูรณ์แบบ
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-[#2d2f31] flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  บันทึกโครงสร้าง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM CONFIRMATION MODAL - DELETE CHAT */}
        {sessionToDelete && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className={`border rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl ${
              isDarkMode ? "bg-[#1e1f20] border-[#2d2f31] text-gray-200" : "bg-white border-gray-200 text-gray-800"
            }`}>
              <div className="flex items-center gap-3 text-rose-500">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  ยืนยันการลบประวัติแชท?
                </h3>
              </div>
              
              <p className={`text-xs leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการวิเคราะห์แชทเรื่อง <strong className={isDarkMode ? "text-white" : "text-gray-900"}>"{sessionToDelete.title}"</strong>? การกระทำนี้ไม่สามารถย้อนคืนได้
              </p>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  onClick={() => setSessionToDelete(null)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${
                    isDarkMode 
                      ? "bg-transparent border-[#2d2f31] hover:bg-[#2d2f31] text-gray-300" 
                      : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmDeleteSession}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  ยืนยันลบข้อมูล
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM CONFIRMATION MODAL - CLEAR CHAT */}
        {isClearingSession && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className={`border rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl ${
              isDarkMode ? "bg-[#1e1f20] border-[#2d2f31] text-gray-200" : "bg-white border-gray-200 text-gray-800"
            }`}>
              <div className="flex items-center gap-3 text-rose-500">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  ยืนยันล้างข้อความแชท?
                </h3>
              </div>
              
              <p className={`text-xs leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                คุณแน่ใจหรือไม่ว่าต้องการล้างข้อความและประวัติทั้งหมดในห้องวิเคราะห์นี้?
              </p>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  onClick={() => setIsClearingSession(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${
                    isDarkMode 
                      ? "bg-transparent border-[#2d2f31] hover:bg-[#2d2f31] text-gray-300" 
                      : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmClearSession}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  ยืนยันล้างแชท
                </button>
              </div>
            </div>
          </div>
        )}

        </div> {/* Close Main Chat Column */}

        {/* MOBILE/TABLET MEMORY BACKDROP LAYER */}
        {showMemoryPanel && (
          <div 
            onClick={() => setShowMemoryPanel(false)}
            className="lg:hidden absolute inset-0 bg-black/60 z-30 transition-opacity backdrop-blur-[2px]"
          />
        )}

        {/* Sliding Memory Panel on the Right */}
        {showMemoryPanel && (
          <MemoryPanel
            isDarkMode={isDarkMode}
            memories={memories}
            onClose={() => setShowMemoryPanel(false)}
            onAddMemory={handleAddMemory}
            onDeleteMemory={handleDeleteMemory}
            onClearAllMemories={() => setIsClearingMemories(true)}
          />
        )}

        {/* CUSTOM CONFIRMATION MODAL - CLEAR MEMORIES */}
        {isClearingMemories && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className={`border rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl ${
              isDarkMode ? "bg-[#1e1f20] border-[#2d2f31] text-gray-200" : "bg-white border-gray-200 text-gray-800"
            }`}>
              <div className="flex items-center gap-3 text-rose-500">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  ยืนยันล้างหน่วยความจำทั้งหมด?
                </h3>
              </div>
              
              <p className={`text-xs leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                คุณแน่ใจหรือไม่ว่าต้องการลบหน่วยความจำสะสม รวมถึงประวัติ ความชอบ และบทเรียนทั้งหมดในระบบ? การกระทำนี้ไม่สามารถย้อนคืนได้
              </p>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  onClick={() => setIsClearingMemories(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${
                    isDarkMode 
                      ? "bg-transparent border-[#2d2f31] hover:bg-[#2d2f31] text-gray-300" 
                      : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleClearAllMemories}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  ยืนยันล้างหน่วยความจำ
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}


export default App;
