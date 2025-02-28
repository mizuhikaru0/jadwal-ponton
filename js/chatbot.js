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
    if (/\b(bagaimana|kenapa|mengapa|apakah)\b/.test(message) && message.split(" ").length > 10) {
      return "Pertanyaan yang kompleks ya, bisa dijelaskan lebih spesifik lagi?";
    }
    if (/\b(jika|kalau)\b/.test(message)) {
      if (/bagaimana.*(jika|kalau)/.test(message)) {
        return "Sepertinya Anda bertanya tentang skenario atau kondisi. Bisa dijelaskan lebih spesifik?";
      }
      return "Kondisional terdengar menarik, bisa berikan konteks lebih lanjut?";
    }
    if (/\b(gue|lo|bro|sis)\b/.test(message)) {
      return "Sepertinya Anda menggunakan bahasa gaul. Bisa dijelaskan maksudnya agar saya lebih memahami?";
    }
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
  // Parameter: (feedback, targetIntent, targetQuestion, targetPattern, targetResponses)
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
  handleSpecificSchedule(message) {
    if (this.context.lastIntent === "jadwal_spesifik") {
      if (
        message.includes("sore") &&
        (message.includes("penyebrangan") || message.includes("jam")) &&
        !message.includes("tanah merah") &&
        !message.includes("muara") &&
        !message.includes("wm")
      ) {
        return "Untuk jadwal penyebrangan sore, silakan tentukan rute yang Anda maksud, misalnya 'dari tanah merah ke wm' atau 'dari muara ke tanah merah'.";
      }
      if (message.includes("sore") && message.includes("tanah merah") && message.includes("wm")) {
        return "Jadwal penyebrangan sore dari Tanah Merah ke Muara: 14.00, 16.00, dan 17.30 WIB.";
      }
      const routes = {
        "muara tanah merah": "Jadwal dari Muara ke Tanah Merah: 08.00, 10.00, 13.00, 15.00, 17.00 WIB. Khusus Jumat, ada tambahan jam 13.30 WIB.",
        "tanah merah muara": "Jadwal dari Tanah Merah ke Muara: 09.00, 11.00, 14.00, 16.00, 17.30 WIB."
      };
      for (const [route, schedule] of Object.entries(routes)) {
        if (route.split(" ").every((loc) => message.includes(loc))) {
          return schedule;
        }
      }
      if (message.includes("jumat")) {
        return "Pada hari Jumat, ada jadwal tambahan dari Muara ke Tanah Merah pada jam 13.30 WIB.";
      }
    }
    return null;
  }

  // === Main Response Handler ---
  getResponse(rawMessage) {
    const message = rawMessage.trim();

    // --- Mode Koneksi ke Petugas (jika tidak ada kecocokan di knowledge) ---
    if (this.connectionModeActive) {
      if (this.connectionStage === "awaiting_confirmation") {
        if (message.toLowerCase() === "ya") {
          this.connectionStage = "awaiting_petugas_choice";
          return "Silakan pilih petugas: 1. Riko (Nahkoda Ponton) atau 2. Ihsan Maulana (ABK Ponton)";
        } else if (message.toLowerCase() === "tidak") {
          this.connectionModeActive = false;
          this.connectionStage = null;
          return "Baik, sesi ditutup.";
        } else {
          return "Mohon jawab dengan 'Ya' atau 'Tidak'.";
        }
      } else if (this.connectionStage === "awaiting_petugas_choice") {
        // Gunakan lastUserQuestion sebagai prefill pesan WhatsApp
        const prefill = encodeURIComponent("Pertanyaan saya: " + this.lastUserQuestion);
        if (message === "1") {
          window.location.href = "https://wa.me/6282252869605?text=" + prefill;
          this.connectionModeActive = false;
          this.connectionStage = null;
          return "Mengalihkan ke WhatsApp Riko (Nahkoda Ponton)...";
        } else if (message === "2") {
          window.location.href = "https://wa.me/6282211061254?text=" + prefill;
          this.connectionModeActive = false;
          this.connectionStage = null;
          return "Mengalihkan ke WhatsApp Ihsan Maulana (ABK Ponton)...";
        } else {
          return "Mohon pilih 1 atau 2.";
        }
      }
    }

    // --- Mode Pelatihan Interaktif ---
    if (this.learningModeActive) {
      if (this.learningStage === "awaiting_intent") {
        this.learningInfo.intent = message;
        this.learningStage = "awaiting_question";
        return "Oke, intent diterima, kemudian masukkan pertanyaan.";
      } else if (this.learningStage === "awaiting_question") {
        this.learningInfo.question = message;
        this.learningStage = "awaiting_response";
        return "Oke, masukkan respon.";
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
        return result;
      }
    }

    // --- Aktifkan Mode Pelatihan Interaktif ---
    if (message.toLowerCase() === "belajar 44726") {
      this.learningModeActive = true;
      this.learningStage = "awaiting_intent";
      this.learningInfo = {};
      return "Baik, silahkan masukkan intent.";
    }

    // --- Proses Pesan Biasa ---
    if (message.toLowerCase() === "p") {
      return "Iya ada apa?";
    }

    if (this.learningData[message]) {
      return this.learningData[message];
    }

    if (this.context.lastIntent && this.isFollowUp(message.toLowerCase())) {
      const followUpResponse = this.handleFollowUp();
      if (followUpResponse) return followUpResponse;
    }

    const intentResponse = this.processIntents(message.toLowerCase());
    if (intentResponse) {
      const specificScheduleResponse = this.handleSpecificSchedule(message.toLowerCase());
      if (specificScheduleResponse) return specificScheduleResponse;
      return intentResponse;
    }

    const complexResponse = this.analyzeComplexMessage(message.toLowerCase());
    if (complexResponse) return complexResponse;

    // --- Jika tidak ada kecocokan di database knowledge ---
    this.lastUserQuestion = message; // Simpan pesan asli pengguna
    this.connectionModeActive = true;
    this.connectionStage = "awaiting_confirmation";
    return "Maaf, saya masih dalam tahap belajar. Apakah Anda mau dihubungkan ke petugas terkait? (Ya/Tidak)";
  }
}

export default Chatbot;
