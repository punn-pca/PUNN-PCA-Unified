export interface Message {
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
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
}

export const generateMarkdown = (session: ChatSession): string => {
  let md = `# รายงานวิเคราะห์การตัดสินใจเชิงลึก (PUNN Cognitive Architecture - PCA Report)\n\n`;
  md += `* **ชื่อหัวข้อสนทนา:** ${session.title}\n`;
  md += `* **วันเวลาที่ส่งออกรายงาน:** ${new Date().toLocaleString('th-TH')}\n`;
  md += `* **แกนประมวลผล:** PUNN PCA 12-Stage Hearth Core\n`;
  md += `========================================================================\n\n`;

  session.messages.forEach((msg, idx) => {
    const time = msg.timestamp;
    if (msg.role === 'user') {
      md += `## 👤 ข้อมูลเข้าจากผู้ใช้ (User Input) - [${time}]\n`;
      md += `> ${msg.content.replace(/\n/g, '\n> ')}\n\n`;
    } else {
      md += `## 🔥 คำตอบและกระบวนการคิดของระบบ (The Firekeeper) - [${time}]\n\n`;
      if (msg.pcaState) {
        md += `### 🧠 รายละเอียดขั้นตอนกระบวนการคิดเชิงลึก 12 ขั้นตอน (12-Stage Cognitive Process)\n\n`;
        md += `* **ระดับความมั่นใจในการสรุปผล (Confidence Level):** ${Math.round(msg.pcaState.confidence * 100)}%\n\n`;
        
        if (msg.pcaState.observations && msg.pcaState.observations.length > 0) {
          md += `#### 🧭 ขั้นที่ 1: การสังเกตการณ์ (Observation)\n`;
          msg.pcaState.observations.forEach(item => {
            md += `- ${item}\n`;
          });
          md += `\n`;
        }
        
        if (msg.pcaState.understanding) {
          md += `#### 📖 ขั้นที่ 2: การทำความเข้าใจบริบท (Understanding)\n`;
          md += `${msg.pcaState.understanding}\n\n`;
        }
        
        if (msg.pcaState.purpose) {
          md += `#### 💡 ขั้นที่ 3: การกำหนดเป้าหมายและเจตจำนงแฝง (Purpose)\n`;
          md += `${msg.pcaState.purpose}\n\n`;
        }
        
        const memoryStage = msg.pcaState.trace?.find(t => t.stage === 'memory');
        if (memoryStage && memoryStage.output?.memories) {
          md += `#### 📚 ขั้นที่ 4: การดึงข้อมูลอดีตและคลังความรู้สะสม (Memory Vault Retrieval)\n`;
          const memoriesList = memoryStage.output.memories;
          if (Array.isArray(memoriesList)) {
            memoriesList.forEach((m: any) => {
              md += `- [${m.layer || 'Memory Layer'}] ${m.content}\n`;
            });
          } else {
            md += `- ${memoriesList}\n`;
          }
          md += `\n`;
        }
        
        const modelStage = msg.pcaState.trace?.find(t => t.stage === 'mental_model');
        if (modelStage && modelStage.output?.model) {
          md += `#### 🧠 ขั้นที่ 5: แบบจำลองความคิดเพื่อกรองข้อมูลประมวลผล (Mental Model Configuration)\n`;
          md += `${modelStage.output.model}\n\n`;
        }
        
        const hypothesisStage = msg.pcaState.trace?.find(t => t.stage === 'hypothesis');
        if (hypothesisStage && hypothesisStage.output?.hypotheses) {
          md += `#### ⚙️ ขั้นที่ 6: การตั้งสมมติฐานและทางเลือกการดำเนินการ (Hypothesis Generation)\n`;
          const hyps = hypothesisStage.output.hypotheses;
          if (Array.isArray(hyps)) {
            hyps.forEach((h: any) => {
              const claim = typeof h === 'object' ? (h.claim || JSON.stringify(h)) : h;
              md += `- ${claim}\n`;
            });
          } else {
            const claim = typeof hyps === 'object' ? (hyps.claim || JSON.stringify(hyps)) : hyps;
            md += `${claim}\n`;
          }
          md += `\n`;
        }
        
        const evaluationStage = msg.pcaState.trace?.find(t => t.stage === 'evidence_evaluation');
        if (evaluationStage && evaluationStage.output?.evaluation) {
          md += `#### ⚖️ ขั้นที่ 7: การประเมินน้ำหนักหลักฐานและข้อเท็จจริง (Evidence Evaluation)\n`;
          md += `${evaluationStage.output.evaluation}\n\n`;
        }
        
        if (msg.pcaState.critique && msg.pcaState.critique.length > 0) {
          md += `#### ⚠️ ขั้นที่ 8: การวิพากษ์ความลำเอียงและการวิพากษ์ตนเอง (Critique Engine)\n`;
          msg.pcaState.critique.forEach(c => {
            md += `- ${c}\n`;
          });
          md += `\n`;
        }
        
        if (msg.pcaState.decision) {
          md += `#### ⚙️ ขั้นที่ 9: การรวมข้อยุติและการสรุปทางเลือกที่ดีที่สุด (Decision Integration)\n`;
          md += `${msg.pcaState.decision}\n\n`;
        }
        
        md += `#### ✨ ขั้นที่ 10: คำตอบและคำแนะนำความรู้ (Communication Response)\n`;
        md += `${msg.content}\n\n`;
        
        if (msg.pcaState.reflection && msg.pcaState.reflection.length > 0) {
          md += `#### ℹ️ ขั้นที่ 11: การสะท้อนคิดประเมินคุณค่าและความจริงใจ (Reflection)\n`;
          msg.pcaState.reflection.forEach(r => {
            md += `- ${r}\n`;
          });
          md += `\n`;
        }
        
        if (msg.pcaState.learning && msg.pcaState.learning.length > 0) {
          md += `#### ❓ ขั้นที่ 12: การถอดบทเรียนเพื่อบันทึกคลังปัญญาต่อ (Learning & Synthesizing)\n`;
          msg.pcaState.learning.forEach(l => {
            md += `- ${l}\n`;
          });
          md += `\n`;
        }
        
        if (msg.pcaState.agency_checks && msg.pcaState.agency_checks.length > 0) {
          md += `#### 🛡️ การรับประกันสิทธิ์และเจตจำนงของผู้เป็นมนุษย์ (Human Agency Assurance)\n`;
          msg.pcaState.agency_checks.forEach(check => {
            md += `- ${check}\n`;
          });
          md += `\n`;
        }
        
      } else {
        md += `### ✨ คำตอบทั่วไป (General Communication)\n\n`;
        md += `${msg.content}\n\n`;
      }
      md += `------------------------------------------------------------------------\n\n`;
    }
  });

  return md;
};

export const generateHTML = (session: ChatSession): string => {
  let html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานวิเคราะห์ระดับก้าวหน้า - PUNN PCA</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Prompt:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Prompt', 'Inter', sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    code, pre {
      font-family: 'JetBrains Mono', monospace;
    }
    
    /* Screen styling: Dark mode premium */
    body {
      background-color: #0b0c0d;
      color: #e2e8f0;
    }
    .print-card {
      background-color: #151618;
      border: 1px solid rgba(249, 115, 22, 0.1);
    }
    .print-text {
      color: #d1d5db;
    }
    .highlight-card {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .dashboard-subcard {
      background-color: #111213;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    /* Print styling: Light mode crisp, high-contrast, paper-optimized */
    @media print {
      body {
        background-color: #ffffff !important;
        color: #0f172a !important;
        padding: 0 !important;
        font-size: 12px;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
        break-inside: avoid;
        margin-top: 2rem;
      }
      .print-card {
        border: 1.5px solid #cbd5e1 !important;
        background-color: #f8fafc !important;
        box-shadow: none !important;
        color: #0f172a !important;
        border-radius: 12px !important;
        padding: 1.5rem !important;
        break-inside: avoid;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .print-text {
        color: #1e293b !important;
      }
      .highlight-card {
        background-color: #f0fdf4 !important;
        border: 2px solid #86efac !important;
        color: #14532d !important;
        border-radius: 10px !important;
        padding: 1.25rem !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .dashboard-subcard {
        background-color: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .text-orange-500, .text-orange-400 {
        color: #c2410c !important;
      }
      .text-emerald-500, .text-emerald-400 {
        color: #15803d !important;
      }
      .text-amber-500, .text-amber-400 {
        color: #b45309 !important;
      }
      .bg-orange-500\/5, .bg-orange-500\/10 {
        background-color: #fff7ed !important;
        border-color: #ffedd5 !important;
      }
    }
  </style>
</head>
<body class="min-h-screen py-10 px-4 md:px-8">
  <div class="max-w-4xl mx-auto space-y-8">
    
    <!-- Header Area -->
    <div class="border-b border-orange-500/20 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping no-print"></span>
          <span class="text-xs font-mono font-bold text-orange-500 tracking-wider">🔥 PUNN COGNITIVE ARCHITECTURE (PCA)</span>
        </div>
        <h1 class="text-2xl md:text-3xl font-extrabold text-white print:text-slate-900 tracking-tight">${session.title}</h1>
        <p class="text-xs text-gray-400 print:text-slate-500">สืบค้นจากเตาเพลิงปัญญาและประเมินผลผ่าน 12 ขั้นตอนเชิงลึก (PCA Hearth Core)</p>
      </div>
      <div class="text-right text-xs text-gray-400 print:text-slate-600 font-mono space-y-1.5 shrink-0">
        <div>วันที่ออกรายงาน: ${new Date().toLocaleString('th-TH')}</div>
        <div>แกนประมวลผล: PUNN PCA 12-Stage v1.0</div>
        <button onclick="window.print()" class="no-print mt-3 inline-flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-md shadow-orange-500/10">
          🖨️ พิมพ์รายงาน / บันทึกเป็น PDF
        </button>
      </div>
    </div>

    <!-- Timeline Content -->
    <div class="space-y-8">
  `;

  session.messages.forEach((msg, idx) => {
    const time = msg.timestamp;
    if (msg.role === 'user') {
      html += `
      <!-- User Input Card -->
      <div class="bg-[#111213] border border-gray-800 rounded-2xl p-6 print-card space-y-3 shadow-lg">
        <div class="flex items-center justify-between text-xs font-bold text-orange-400 border-b border-gray-800/80 print:border-slate-200 pb-2.5">
          <span class="flex items-center gap-2">👤 เจ้านายผู้เป็นมนุษย์ (User Input)</span>
          <span class="font-mono text-gray-500">${time}</span>
        </div>
        <div class="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed print-text">${msg.content}</div>
      </div>
      `;
    } else {
      html += `
      <!-- Firekeeper Response Card -->
      <div class="border border-orange-500/10 rounded-2xl p-6 print-card space-y-6 shadow-xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full blur-2xl pointer-events-none no-print"></div>
        
        <div class="flex items-center justify-between text-xs font-bold text-orange-500 border-b border-orange-500/10 print:border-slate-200 pb-3">
          <span class="flex items-center gap-2">🔥 ผู้พิทักษ์และดูแลเปลวเพลิงความคิด (The Firekeeper Response)</span>
          <span class="font-mono text-gray-400 print:text-slate-500">${time}</span>
        </div>

        ${msg.pcaState ? `
        <!-- ==================== EXECUTIVE SUMMARY DASHBOARD ==================== -->
        <div class="p-5 rounded-2xl border border-dashed border-orange-500/20 bg-orange-500/5 print:bg-[#f8fafc] print:border-slate-300 space-y-4">
          <div class="flex items-center justify-between border-b border-orange-500/10 print:border-slate-200 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-extrabold uppercase tracking-wider text-orange-500">บทสรุปผู้บริหารและการตัดสินใจเชิงยุทธศาสตร์ (Executive Briefing)</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full font-bold text-[9px] tracking-wide uppercase bg-orange-500/10 text-orange-600 print:bg-orange-100/60 print:text-orange-800">
              PCA Summary
            </span>
          </div>

          <!-- 1. Core Strategic Recommendation (🏆 Highlight Box) -->
          <div class="highlight-card p-4 rounded-xl">
            <div class="font-extrabold text-emerald-500 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-2">
              <span>🏆 ข้อสรุปทางยุทธศาสตร์และทางเลือกที่ดีที่สุด (Strategic Choice)</span>
            </div>
            <p class="text-xs leading-relaxed font-bold print-text">
              ${msg.pcaState.decision || "ระบบวิเคราะห์ข้อสรุปทางเลือกที่ดีที่สุดเรียบร้อยแล้ว"}
            </p>
          </div>

          <!-- 2. Bento Grid of Key Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- Confidence Meter -->
            <div class="dashboard-subcard p-4 rounded-xl space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-gray-400 print:text-slate-600">📊 ดัชนีความมั่นใจการวิเคราะห์ (Confidence):</span>
                <span class="text-orange-500 font-extrabold">${Math.round(msg.pcaState.confidence * 100)}%</span>
              </div>
              <div class="w-full bg-gray-800 print:bg-slate-200 h-2 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full" style="width: ${Math.round(msg.pcaState.confidence * 100)}%"></div>
              </div>
              <p class="text-[10px] text-gray-500 print:text-slate-500 italic leading-snug">
                ${msg.pcaState.confidence > 0.7 
                  ? "หลักฐานบริบทชัดเจนระดับสูง สอดคล้องตามกลระเบียบวิธีวิจัยและทฤษฎีตรรกศาสตร์สัจนิรันดร์"
                  : msg.pcaState.confidence > 0.4 
                  ? "มีเงื่อนไขและข้อแลกเปลี่ยน (Trade-offs) ซับซ้อน ต้องใช้วิจารณญาณประกอบการตัดสินใจ"
                  : "หัวข้อเกี่ยวข้องกับกรอบจริยธรรมที่ขัดแย้ง จำเป็นต้องชั่งน้ำหนักประเด็นเชิงคุณค่าอย่างระมัดระวัง"}
              </p>
            </div>

            <!-- Core Purpose & Context -->
            <div class="dashboard-subcard p-4 rounded-xl flex flex-col justify-between">
              <div>
                <span class="font-bold text-gray-400 print:text-slate-600 block text-xs mb-1">💡 เจตจำนงแฝงสูงสุด (Core Purpose):</span>
                <p class="text-[11px] font-bold text-gray-300 print:text-slate-800 leading-relaxed line-clamp-3">
                  ${msg.pcaState.purpose || "มุ่งวิเคราะห์ความถูกต้องและเสนอทางเลือกระดับก้าวหน้าที่คุ้มครองคุณค่าผู้ใช้งานสูงสุด"}
                </p>
              </div>
            </div>

          </div>

          <!-- Human Agency Guard -->
          <div class="text-[10px] font-semibold text-orange-600 print:text-orange-800 bg-orange-500/5 print:bg-orange-50/50 p-2.5 rounded-xl border border-orange-500/10 print:border-orange-200/60 leading-relaxed">
            🛡️ <strong>การปกป้องเจตจำนงเสรีและการควบคุมของผู้ใช้งาน (Human Agency Guard):</strong> รายงานนี้เป็นกรอบการใช้เหตุผลเพื่อสนับสนุนการตัดสินใจเท่านั้น อำนาจอธิปไตยและการตัดสินใจขั้นสุดท้ายอยู่ภายใต้การควบคุมของคุณอย่างสมบูรณ์
          </div>
        </div>
        ` : ''}

        <!-- ==================== MAIN DETAILED REPORT ==================== -->
        <div class="space-y-3">
          <div class="text-xs font-bold text-orange-500 border-b border-orange-500/10 pb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
            <span>📄 รายงานวิเคราะห์ฉบับเต็มอย่างเป็นระบบ (Full Analytical Report)</span>
          </div>
          <div class="text-sm text-gray-200 print:text-slate-800 whitespace-pre-wrap leading-relaxed bg-[#0f1011] print:bg-white border border-gray-800/60 print:border-none p-5 print:p-0 rounded-xl print-text">
            ${msg.content}
          </div>
        </div>

        <!-- ==================== 12-STAGE COGNITIVE DECODING DETAILS ==================== -->
        ${msg.pcaState ? `
        <div class="space-y-4 pt-4 border-t border-gray-800/80 print:border-slate-200 page-break">
          <div class="flex items-center justify-between bg-orange-500/5 print:bg-slate-100 p-3 rounded-xl border border-orange-500/10 print:border-slate-200">
            <span class="text-xs font-mono font-bold text-orange-500">🔍 โครงสร้างห่วงโซ่การคิดประมวลผล 12 ขั้นตอน (PUNN PCA 12-Stage Hearth Core)</span>
            <span class="text-[10px] font-mono text-gray-400 print:text-slate-500">โปร่งใสและวิพากษ์ตนเอง (Self-Critique Engine)</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            ${msg.pcaState.observations && msg.pcaState.observations.length > 0 ? `
            <div class="bg-[#111213] border border-gray-800/80 p-4 rounded-xl print-card space-y-2">
              <div class="font-bold text-amber-500 flex items-center gap-1.5">🧭 1. Observation (การสังเกตการณ์)</div>
              <ul class="list-disc pl-4 space-y-1 text-gray-300 print-text">
                ${msg.pcaState.observations.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            ${msg.pcaState.understanding ? `
            <div class="bg-[#111213] border border-gray-800/80 p-4 rounded-xl print-card space-y-2">
              <div class="font-bold text-cyan-400 flex items-center gap-1.5">📖 2. Understanding (ความเข้าใจบริบท)</div>
              <p class="text-gray-300 leading-relaxed print-text">${msg.pcaState.understanding}</p>
            </div>
            ` : ''}

            ${msg.pcaState.purpose ? `
            <div class="bg-[#111213] border border-gray-800/80 p-4 rounded-xl print-card space-y-2">
              <div class="font-bold text-purple-400 flex items-center gap-1.5">💡 3. Purpose (เจตจำนงแฝงสูงสุด)</div>
              <p class="text-gray-300 leading-relaxed print-text">${msg.pcaState.purpose}</p>
            </div>
            ` : ''}

            ${(() => {
              const memoryStage = msg.pcaState.trace?.find(t => t.stage === 'memory');
              if (memoryStage && memoryStage.output?.memories) {
                const memoriesList = memoryStage.output.memories;
                const items = Array.isArray(memoriesList) 
                  ? memoriesList.map((m: any) => `<li><span class="text-orange-400 font-semibold">[${m.layer || 'Memory'}]</span> ${m.content}</li>`).join('')
                  : `<li>${memoriesList}</li>`;
                return `
                <div class="bg-[#111213] border border-gray-800/80 p-4 rounded-xl print-card space-y-2">
                  <div class="font-bold text-amber-500 flex items-center gap-1.5">📚 4. Memory (ดึงคลังข้อมูลความจำ)</div>
                  <ul class="list-disc pl-4 space-y-1 text-gray-300 print-text">${items}</ul>
                </div>
                `;
              }
              return '';
            })()}

            ${(() => {
              const modelStage = msg.pcaState.trace?.find(t => t.stage === 'mental_model');
              if (modelStage && modelStage.output?.model) {
                return `
                <div class="bg-[#111213] border border-gray-800/80 p-4 rounded-xl print-card space-y-2">
                  <div class="font-bold text-teal-400 flex items-center gap-1.5">🧠 5. Mental Model (แบบจำลองความคิด)</div>
                  <p class="text-gray-300 leading-relaxed print-text">${modelStage.output.model}</p>
                </div>
                `;
              }
              return '';
            })()}

            ${(() => {
              const hypothesisStage = msg.pcaState.trace?.find(t => t.stage === 'hypothesis');
              if (hypothesisStage && hypothesisStage.output?.hypotheses) {
                const hyps = hypothesisStage.output.hypotheses;
                const items = Array.isArray(hyps)
                  ? hyps.map((h: any) => {
                      const claim = typeof h === 'object' ? (h.claim || JSON.stringify(h)) : h;
                      return `<li>${claim}</li>`;
                    }).join('')
                  : `<li>${typeof hyps === 'object' ? (hyps.claim || JSON.stringify(hyps)) : hyps}</li>`;
                return `
                <div class="bg-[#111213] border border-gray-800/80 p-4 rounded-xl print-card space-y-2">
                  <div class="font-bold text-orange-400 flex items-center gap-1.5">⚙️ 6. Hypothesis (สมมติฐานทางเลือก)</div>
                  <ul class="list-disc pl-4 space-y-1 text-gray-300 print-text">${items}</ul>
                </div>
                `;
              }
              return '';
            })()}

            ${(() => {
              const evalStage = msg.pcaState.trace?.find(t => t.stage === 'evidence_evaluation');
              if (evalStage && evalStage.output?.evaluation) {
                return `
                <div class="bg-[#111213] border border-gray-800/80 p-4 rounded-xl print-card space-y-2">
                  <div class="font-bold text-emerald-400 flex items-center gap-1.5">⚖️ 7. Evidence Evaluation (ประเมินหลักฐาน)</div>
                  <p class="text-gray-300 leading-relaxed print-text">${evalStage.output.evaluation}</p>
                </div>
                `;
              }
              return '';
            })()}

            ${msg.pcaState.critique && msg.pcaState.critique.length > 0 ? `
            <div class="bg-[#111213] border border-gray-800/80 p-4 rounded-xl print-card space-y-2">
              <div class="font-bold text-rose-400 flex items-center gap-1.5">⚠️ 8. Critique (การวิพากษ์ความเบี่ยงเบน)</div>
              <ul class="list-disc pl-4 space-y-1 text-gray-300 print-text">
                ${msg.pcaState.critique.map(c => `<li>${c}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            ${msg.pcaState.decision ? `
            <div class="bg-[#111213] border border-gray-800/80 p-4 rounded-xl print-card col-span-1 md:col-span-2 space-y-2">
              <div class="font-bold text-violet-400 flex items-center gap-1.5">⚙️ 9. Decision Integration (ข้อยุติและการตัดสินใจ)</div>
              <p class="text-gray-300 leading-relaxed print-text">${msg.pcaState.decision}</p>
            </div>
            ` : ''}

          </div>
        </div>
        ` : ''}

        <!-- Secondary Reflection & Learning Layers -->
        ${msg.pcaState && ((msg.pcaState.reflection && msg.pcaState.reflection.length > 0) || (msg.pcaState.learning && msg.pcaState.learning.length > 0)) ? `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-orange-500/10 print:border-slate-200 text-xs page-break">
          
          ${msg.pcaState.reflection && msg.pcaState.reflection.length > 0 ? `
          <div class="space-y-2">
            <div class="font-bold text-orange-400 flex items-center gap-1.5">ℹ️ 11. Reflection (การสะท้อนคิดประเมินคุณค่า)</div>
            <ul class="list-disc pl-4 space-y-1 text-gray-300 print-text">
              ${msg.pcaState.reflection.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          ${msg.pcaState.learning && msg.pcaState.learning.length > 0 ? `
          <div class="space-y-2">
            <div class="font-bold text-lime-400 flex items-center gap-1.5">❓ 12. Learning (การถอดบทเรียนเพื่อบันทึกคลังปัญญา)</div>
            <ul class="list-disc pl-4 space-y-1 text-gray-300 print-text">
              ${msg.pcaState.learning.map(l => `<li>${l}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

        </div>
        ` : ''}

        <!-- Human Agency Guard Final checks -->
        ${msg.pcaState && msg.pcaState.agency_checks && msg.pcaState.agency_checks.length > 0 ? `
        <div class="mt-4 bg-orange-500/5 print:bg-slate-50 border border-orange-500/15 print:border-slate-200 p-4 rounded-xl text-xs space-y-2 page-break">
          <div class="font-bold text-orange-500 flex items-center gap-1.5">🛡️ Human Agency Assurance (ผู้พิทักษ์เจตจำนงและการพึ่งพาตนเอง)</div>
          <ul class="list-disc pl-4 space-y-1 text-gray-300 print-text">
            ${msg.pcaState.agency_checks.map(check => `<li>${check}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

      </div>
      `;
    }
  });

  html += `
    </div>

    <!-- Footer Area -->
    <div class="border-t border-gray-800/80 print:border-slate-300 pt-6 text-center text-xs text-gray-500 print:text-slate-500 space-y-2 no-print">
      <div>จัดทำรายงานโดยระบบปัญญาประดิษฐ์เสมือนระดับก้าวหน้า PUNN PCA</div>
      <div class="text-[10px] font-mono tracking-wider opacity-65">CONFIDENTIAL EXECUTIVE REPORT • SECURE WORKSPACE</div>
    </div>

  </div>
</body>
</html>
  `;
  return html;
};

export const generateSingleMessageHTML = (sessionTitle: string, message: Message, userPromptMessage?: Message): string => {
  const mockSession: ChatSession = {
    id: "single-msg-session",
    title: sessionTitle,
    created_at: new Date().toISOString(),
    messages: []
  };
  if (userPromptMessage) {
    mockSession.messages.push(userPromptMessage);
  }
  mockSession.messages.push(message);

  return generateHTML(mockSession);
};

export const generateSingleMessageMarkdown = (sessionTitle: string, message: Message, userPromptMessage?: Message): string => {
  const mockSession: ChatSession = {
    id: "single-msg-session",
    title: sessionTitle,
    created_at: new Date().toISOString(),
    messages: []
  };
  if (userPromptMessage) {
    mockSession.messages.push(userPromptMessage);
  }
  mockSession.messages.push(message);

  return generateMarkdown(mockSession);
};

