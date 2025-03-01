import knowledge from "./knowledge.js";

class Chatbot {
  constructor() {
    this.intents = knowledge; // Basis pengetahuan
    this.context = {}; // Menyimpan konteks percakapan
    this.learningData = {}; // Menyimpan data pembelajaran yang sudah diterapkan
    this.pendingFeedback = {}; // Menyimpan umpan balik untuk direview
    this.stopWords = ["yang", "untuk", "dan", "di", "ke", "dari", "ini", "itu", "pada", "saja", "ada", "dengan", "sebagai", "atau"];

    // Mode pelatihan interaktif
    this.learningModeActive = false;
    this.learningStage = null;
    this.learningInfo = {}; // { intent, question, response }

    // Mode koneksi ke petugas (untuk pertanyaan yang belum ada di database)
    this.connectionModeActive = false;
    this.connectionStage = null;

    // Properti untuk menyimpan pesan pengguna yang tidak dikenali
    this.lastUserQuestion = "";
  }

  // === Fungsi Pembantu: Memformat Respon Teks ===
  formatResponse(response) {
    if (typeof response !== "string") return response;
    // Ganti newline menjadi <br>
    let formatted = response.replace(/\n/g, "<br>");
    // Ganti **teks** menjadi bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Ganti _teks_ menjadi italic
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");
    // Ganti __teks__ menjadi underline
    formatted = formatted.replace(/__(.*?)__/g, "<u>$1</u>");
    // Tambahkan: Ganti ~~teks~~ menjadi line-through
    formatted = formatted.replace(/~~(.*?)~~/g, "<del>$1</del>");
    return formatted;
  }
  

  // === Manajemen Konteks ===
  updateContext(intent, message, extra = {}) {
    this.context = {
      ...this.context,
      lastIntent: intent,
      lastMessage: message,
      ...extra
    };
  }

  resetContext() {
    this.context = {};
  }

  // === Penanganan Follow-Up ===
  isFollowUp(message) {
    const followUpIndicators = ["itu", "tersebut", "yang tadi", "lanjut", "selanjutnya"];
    return followUpIndicators.some((indicator) => message.includes(indicator));
  }

  handleFollowUp() {
    switch (this.context.lastIntent) {
      case "jadwal_umum":
      case "jadwal_spesifik":
        return "Apakah Anda membutuhkan jadwal untuk rute lain atau informasi lebih lanjut tentang jadwal tersebut?";
      default:
        return null;
    }
  }

  // === Analisis Pesan ===
  analyzeComplexMessage(message) {
    return null;
  }

  // === Ekstraksi Keyword dengan optimasi ===
  extractKeywords(message) {
    return message.split(" ").filter((word) => word.length > 3 && !this.stopWords.includes(word));
  }

  // === Fungsi Pembantu: Parsing Regex dari string --- 
  _parseRegex(regexString) {
    if (regexString.startsWith("/") && regexString.lastIndexOf("/") > 0) {
      const lastSlash = regexString.lastIndexOf("/");
      const pattern = regexString.substring(1, lastSlash);
      const flags = regexString.substring(lastSlash + 1);
      return new RegExp(pattern, flags);
    }
    return new RegExp(regexString, "i");
  }

  // === Fungsi untuk Menghasilkan Pattern Otomatis dari Teks Pertanyaan --- 
  generatePatternFromText(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const patternStr = words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(".*");
    return new RegExp(patternStr, "i");
  }

  // === Pembelajaran Umpan Balik dengan Generator & Download (Diperbarui) ===
  learnFromFeedback(feedback, targetIntent, targetQuestion, targetPattern, targetResponses) {
    let intentObj = null;
    if (targetIntent) {
      intentObj = this.intents.find((i) => i.intent === targetIntent);
      if (!intentObj) {
        // Buat intent baru dengan properti default
        intentObj = {
          intent: targetIntent,
          pattern: targetPattern ? this._parseRegex(targetPattern)
                   : (targetQuestion ? this.generatePatternFromText(targetQuestion) : new RegExp(targetIntent, "i")),
          keywords: targetIntent.split("_"),
          responses: targetResponses ? targetResponses : []
        };
        this.intents.push(intentObj);
      } else {
        // Jika intent sudah ada, update pattern jika diberikan atau gunakan pertanyaan untuk membuat pattern otomatis
        if (targetPattern) {
          intentObj.pattern = this._parseRegex(targetPattern);
        } else if (targetQuestion) {
          intentObj.pattern = this.generatePatternFromText(targetQuestion);
        }
        if (targetResponses) {
          intentObj.responses = intentObj.responses.concat(targetResponses);
        } else if (feedback) {
          intentObj.responses.push(feedback);
        }
      }
    } else if (this.context.lastIntent) {
      intentObj = this.intents.find((i) => i.intent === this.context.lastIntent);
      if (intentObj) {
        intentObj.responses.push(feedback);
      }
    } else {
      this.pendingFeedback[this.context.lastMessage] = feedback;
      return "Feedback disimpan dalam pending karena konteks tidak jelas.";
    }
    this.downloadKnowledgeFile();
    this.resetContext();
    return "Baik, informasi telah diterima, dan akan ditambahkan.";
  }

  // === Fungsi Generator untuk Menghasilkan Kode knowledge.js --- 
  generateKnowledgeCode() {
    let code = "const intents = [\n";
    this.intents.forEach((intent) => {
      code += "  {\n";
      code += `    intent: "${intent.intent}",\n`;
      code += `    pattern: ${intent.pattern.toString()},\n`;
      if (intent.keywords) {
        code += `    keywords: ${JSON.stringify(intent.keywords)},\n`;
      }
      code += `    responses: ${JSON.stringify(intent.responses, null, 2)}\n`;
      code += "  },\n";
    });
    code += "];\n\nexport default intents;\n";
    return code;
  }

  downloadKnowledgeFile() {
    const code = this.generateKnowledgeCode();
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "knowledge.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // === Pemrosesan Intent dengan Keyword Matching --- 
  processIntents(message) {
    for (const intent of this.intents) {
      if (intent.pattern.test(message)) {
        this.updateContext(intent.intent, message);
        if (intent.intent === "perpisahan") this.resetContext();
        const randomIndex = Math.floor(Math.random() * intent.responses.length);
        return intent.responses[randomIndex];
      }
    }
    const messageKeywords = this.extractKeywords(message);
    for (const intent of this.intents) {
      if (intent.keywords && intent.keywords.some(keyword => messageKeywords.includes(keyword))) {
        this.updateContext(intent.intent, message);
        const randomIndex = Math.floor(Math.random() * intent.responses.length);
        return intent.responses[randomIndex];
      }
    }
    return null;
  }

  // === Penanganan Jadwal Spesifik dengan Peningkatan --- 
  handleSpecificSchedule() {
    return null;
  }

  // === Main Response Handler --- 
  getResponse(rawMessage) {
    const message = rawMessage.trim();

    // --- Mode Koneksi ke Petugas ---
    if (this.connectionModeActive) {
      if (this.connectionStage === "awaiting_confirmation") {
        if (message.toLowerCase() === "ya") {
          this.connectionStage = "awaiting_petugas_choice";
          return this.formatResponse("Silakan pilih petugas:\n1. **Riko (Nahkoda Ponton)**\n2. **Ihsan Maulana (ABK Ponton)**");
        } else if (message.toLowerCase() === "tidak") {
          this.connectionModeActive = false;
          this.connectionStage = null;
          return this.formatResponse("Baik, sesi ditutup.");
        } else {
          return this.formatResponse("Mohon jawab dengan **Ya** atau **Tidak**.");
        }
      } else if (this.connectionStage === "awaiting_petugas_choice") {
        // Gunakan lastUserQuestion sebagai prefill pesan WhatsApp
        const prefill = encodeURIComponent(this.lastUserQuestion);
        if (message === "1") {
          window.location.href = "https://wa.me/6282252869605?text=" + prefill;
          this.connectionModeActive = false;
          this.connectionStage = null;
          return this.formatResponse("Mengalihkan ke WhatsApp **Riko (Nahkoda Ponton)**...");
        } else if (message === "2") {
          window.location.href = "https://wa.me/6282211061254?text=" + prefill;
          this.connectionModeActive = false;
          this.connectionStage = null;
          return this.formatResponse("Mengalihkan ke WhatsApp **Ihsan Maulana (ABK Ponton)**...");
        } else {
          return this.formatResponse("Mohon pilih **1** atau **2**.");
        }
      }
    }

    // --- Mode Pelatihan Interaktif ---
    if (this.learningModeActive) {
      if (this.learningStage === "awaiting_intent") {
        this.learningInfo.intent = message;
        this.learningStage = "awaiting_question";
        return this.formatResponse("Oke, intent diterima, kemudian masukkan pertanyaan.");
      } else if (this.learningStage === "awaiting_question") {
        this.learningInfo.question = message;
        this.learningStage = "awaiting_response";
        return this.formatResponse("Oke, masukkan respon.");
      } else if (this.learningStage === "awaiting_response") {
        this.learningInfo.response = message;
        const result = this.learnFromFeedback(
          "", 
          this.learningInfo.intent, 
          this.learningInfo.question, 
          null, 
          [this.learningInfo.response]
        );
        this.learningModeActive = false;
        this.learningStage = null;
        this.learningInfo = {};
        return this.formatResponse(result);
      }
    }

    if (message.toLowerCase() === "belajar 44726") {
      this.learningModeActive = true;
      this.learningStage = "awaiting_intent";
      this.learningInfo = {};
      return this.formatResponse("Baik, silahkan masukkan intent.");
    }

    if (message.toLowerCase() === "p") {
      return this.formatResponse("Iya ada apa?");
    }

    if (this.learningData[message]) {
      return this.formatResponse(this.learningData[message]);
    }

    if (this.context.lastIntent && this.isFollowUp(message.toLowerCase())) {
      const followUpResponse = this.handleFollowUp();
      if (followUpResponse) return this.formatResponse(followUpResponse);
    }

    const intentResponse = this.processIntents(message.toLowerCase());
    if (intentResponse) {
      const specificScheduleResponse = this.handleSpecificSchedule(message.toLowerCase());
      if (specificScheduleResponse) return this.formatResponse(specificScheduleResponse);
      return this.formatResponse(intentResponse);
    }

    const complexResponse = this.analyzeComplexMessage(message.toLowerCase());
    if (complexResponse) return this.formatResponse(complexResponse);

    // --- Jika tidak ada kecocokan di database knowledge ---
    this.lastUserQuestion = message;
    this.connectionModeActive = true;
    this.connectionStage = "awaiting_confirmation";
    return this.formatResponse("Maaf, saya masih dalam tahap belajar.\nApakah Anda mau dihubungkan ke petugas terkait? (Ya/Tidak)");
  }
}

export default Chatbot;
