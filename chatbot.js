import knowledge from "./knowledge.js";

class Chatbot {
  constructor() {
    this.intents = knowledge; // Mengambil basis pengetahuan dari knowledge.js
    this.context = {}; // Menyimpan konteks percakapan
    this.learningData = {}; // Menyimpan data pembelajaran yang sudah diterapkan
    this.pendingFeedback = {}; // Menyimpan umpan balik yang perlu direview sebelum diterapkan
    // Daftar stop words yang diperluas
    this.stopWords = ["yang", "untuk", "dan", "di", "ke", "dari", "ini", "itu", "pada", "saja", "ada", "dengan", "sebagai", "atau"];
  }

  // === Manajemen Konteks ===
  updateContext(intent, message, extra = {}) {
    // Menyimpan konteks dengan informasi tambahan bila diperlukan
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
      // Penambahan analisis untuk skenario kondisional
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
    // Pemecahan pesan menjadi array kata, dengan pengecualian kata-kata stop dan kata pendek.
    // Di sini, implementasi stemming dapat ditambahkan untuk normalisasi kata.
    return message.split(" ").filter((word) => word.length > 3 && !this.stopWords.includes(word));
  }

  // === Pembelajaran Umpan Balik dengan Proses Review ===
  learnFromFeedback(feedback) {
    if (!this.context.lastMessage) {
      return "Maaf, saya tidak memiliki konteks untuk belajar dari umpan balik Anda.";
    }
    // Simpan umpan balik dalam pendingFeedback untuk direview terlebih dahulu
    this.pendingFeedback[this.context.lastMessage] = feedback;
    // Contoh: Setelah proses review, admin dapat memindahkan feedback ke learningData dan memperbarui intents.
    this.resetContext();
    return "Terima kasih, umpan balik Anda telah disimpan untuk tinjauan dan akan dipertimbangkan untuk pembaruan respons.";
  }

  // === Pemrosesan Intent dengan Keyword Matching ===
  processIntents(message) {
    // Pertama, cek pola regex yang ada pada masing-masing intent
    for (const intent of this.intents) {
      if (intent.pattern.test(message)) {
        this.updateContext(intent.intent, message);
        if (intent.intent === "perpisahan") this.resetContext();
        const randomIndex = Math.floor(Math.random() * intent.responses.length);
        return intent.responses[randomIndex];
      }
    }

    // Jika tidak ada pola yang cocok, gunakan keyword matching
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

  // === Penanganan Jadwal Spesifik dengan Peningkatan ===
  handleSpecificSchedule(message) {
    if (this.context.lastIntent === "jadwal_spesifik") {
      // Tambahan respon untuk pertanyaan "kalau jam penyebrangan sore?" tanpa rute spesifik
      if (
        message.includes("sore") &&
        (message.includes("penyebrangan") || message.includes("jam")) &&
        !message.includes("tanah merah") &&
        !message.includes("muara") &&
        !message.includes("wm")
      ) {
        return "Untuk jadwal penyebrangan sore, silakan tentukan rute yang Anda maksud, misalnya 'dari tanah merah ke wm' atau 'dari muara ke tanah merah'.";
      }

      // Tambahan kondisi untuk jadwal penyebrangan sore dari Tanah Merah ke WM
      if (message.includes("sore") && message.includes("tanah merah") && message.includes("wm")) {
        return "Jadwal penyebrangan sore dari Tanah Merah ke Muara: 14.00, 16.00, dan 17.30 WIB.";
      }

      // Menggunakan dictionary untuk pencocokan rute
      const routes = {
        "muara tanah merah": "Jadwal dari Muara ke Tanah Merah: 08.00, 10.00, 13.00, 15.00, 17.00 WIB. Khusus Jumat, ada tambahan jam 13.30 WIB.",
        "tanah merah muara": "Jadwal dari Tanah Merah ke Muara: 09.00, 11.00, 14.00, 16.00, 17.30 WIB."
      };

      for (const [route, schedule] of Object.entries(routes)) {
        if (route.split(" ").every((loc) => message.includes(loc))) {
          return schedule;
        }
      }

      // Tambahan: pengecekan khusus untuk hari Jumat
      if (message.includes("jumat")) {
        return "Pada hari Jumat, ada jadwal tambahan dari Muara ke Tanah Merah pada jam 13.30 WIB.";
      }
    }
    return null;
  }

  // === Main Response Handler ===
  getResponse(rawMessage) {
    const message = rawMessage.trim().toLowerCase();

    // Handler untuk pesan singkat "p"
    if (message === "p") {
      return "Iya ada apa?";
    }

    // Handler untuk umpan balik pembelajaran
    if (message.startsWith("belajar:")) {
      const feedback = message.slice("belajar:".length).trim();
      return this.learnFromFeedback(feedback);
    }

    if (this.learningData[message]) {
      return this.learningData[message];
    }

    // Penanganan follow-up
    if (this.context.lastIntent && this.isFollowUp(message)) {
      const followUpResponse = this.handleFollowUp();
      if (followUpResponse) return followUpResponse;
    }

    // Proses intents dari basis pengetahuan
    const intentResponse = this.processIntents(message);
    if (intentResponse) {
      // Jika intent adalah jadwal spesifik, lakukan pengecekan lebih lanjut
      const specificScheduleResponse = this.handleSpecificSchedule(message);
      if (specificScheduleResponse) return specificScheduleResponse;
      return intentResponse;
    }

    // Analisis pesan kompleks
    const complexResponse = this.analyzeComplexMessage(message);
    if (complexResponse) return complexResponse;

    // Pesan default bila tidak ada kecocokan
    return "Maaf, saya tidak mengerti maksud Anda. Jika Anda memiliki jawaban yang tepat, ketik 'belajar: [jawaban yang benar]' agar saya bisa belajar.";
  }
}

export default Chatbot;
