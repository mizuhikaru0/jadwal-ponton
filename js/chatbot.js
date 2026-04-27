// js/chatbot.js

import { tariffData } from "./tarif.js";
import { routeInfo } from "./rute.js";
import { scheduleData, formatRouteName } from "./schedule.js";

// Data Kontak
const contacts = [
    { name: "Riko (Nahkoda)", display: "0822 5286 9605" },
    { name: "Ihsan Maulana (ABK)", display: "0822 1106 1254" }
];

// Peraturan
const rulesData = [
    "Penumpang boleh naik ke atas ruang nahkoda dengan aturan berlaku.",
    "Dilarang merokok di ruangan nahkoda.",
    "Wajib mengikuti instruksi petugas.",
    "Barang basah harus di bagian depan.",
    "Pembayaran hanya tunai di loket."
];

// Kebijakan tunggu
const waitPolicyData = [
    "Bisa minta tunggu lewat petugas.",
    "Maksimal 5 menit.",
    "Darurat: kecelakaan, sakit, melahirkan, meninggal.",
    "Harus konfirmasi petugas."
];

class Chatbot {
    constructor() {
        this.apiUrl = "https://api.koboillm.com/v1/chat/completions";
        this.apiKey = "sk-EwcgeiLbTf_H95dGqdR4Xw";
    }

    // =========================
    // ⏱️ WAKTU REAL-TIME
    // =========================
    getCurrentTime() {
        return new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getNextDeparture(scheduleList) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (let time of scheduleList) {
            const [h, m] = time.split(":").map(Number);
            const scheduleMinutes = h * 60 + m;

            if (scheduleMinutes > currentMinutes) {
                return time;
            }
        }

        return null;
    }

    // =========================
    // 🔍 DETEKSI INTENT
    // =========================
    detectIntent(message) {
        const msg = message.toLowerCase();

        if (msg.match(/sekarang|hari ini|berikutnya|masih sempat/)) return "jadwal_realtime";
        if (msg.match(/jadwal|berangkat|jam/)) return "jadwal";
        if (msg.match(/tarif|harga|biaya|bayar/)) return "tarif";
        if (msg.includes("rute")) return "rute";
        if (msg.match(/kontak|telepon|wa/)) return "kontak";
        if (msg.includes("aturan")) return "aturan";
        if (msg.includes("tunggu")) return "tunggu";

        return "umum";
    }

    // =========================
    // 📦 CONTEXT DINAMIS
    // =========================
    buildContext(intent) {
        let text = "";
        const now = this.getCurrentTime();

        // REAL-TIME ONLY
        if (intent === "jadwal_realtime") {
            text += `Waktu sekarang: ${now}\n\n`;

            Object.keys(scheduleData).forEach(route => {
                const next = this.getNextDeparture(scheduleData[route]);

                if (next) {
                    text += `- ${formatRouteName(route)}: berikutnya jam ${next}\n`;
                } else {
                    text += `- ${formatRouteName(route)}: sudah tidak ada jadwal lagi hari ini\n`;
                }
            });

            return text;
        }

        // JADWAL NORMAL
        if (intent === "jadwal" || intent === "umum") {
            Object.keys(scheduleData).forEach(route => {
                const next = this.getNextDeparture(scheduleData[route]);

                text += `- ${formatRouteName(route)}:
  Jadwal: ${scheduleData[route].join(", ")} WIB
  Berikutnya: ${next || "Selesai hari ini"}
`;
            });

            text += `\nWaktu sekarang: ${now}\n`;
        }

        // TARIF
        if (intent === "tarif" || intent === "umum") {
            tariffData.forEach(t => {
                text += `- ${t.description}: ${t.price}\n`;
            });
        }

        // RUTE
        if (intent === "rute" || intent === "umum") {
            routeInfo.routes.forEach(r => {
                text += `- ${r.name}: ${r.details[0]}\n`;
            });
        }

        // KONTAK
        if (intent === "kontak" || intent === "umum") {
            contacts.forEach(c => {
                text += `- ${c.name}: ${c.display}\n`;
            });
        }

        // ATURAN
        if (intent === "aturan" || intent === "umum") {
            text += rulesData.map(r => `- ${r}`).join("\n") + "\n";
        }

        // TUNGGU
        if (intent === "tunggu" || intent === "umum") {
            text += waitPolicyData.map(w => `- ${w}`).join("\n") + "\n";
        }

        return text;
    }

    // =========================
    // 🧠 PROMPT (RINGKAS & NATURAL)
    // =========================
    generateSystemPrompt() {
        return `
Kamu asisten ponton.

Gaya:
- Santai, natural, seperti ngobrol
- Bisa bercanda ringan kalau cocok
- Tidak kaku

Aturan:
- Jawab hanya dari data yang diberikan
- Jangan mengarang
- Kalau tidak tahu, bilang jujur
- Di luar topik: tolak santai

Cara jawab:
- Fokus ke pertanyaan user
- Gunakan info waktu jika ada
- Singkat, jelas
- Boleh 1 emoji
`;
    }

    // =========================
    // 🤖 RESPONSE
    // =========================
    async getResponse(userMessage, chatHistory = []) {
        if (!userMessage.trim()) return "Tulis dulu pertanyaannya ya 😊";

        const intent = this.detectIntent(userMessage);
        const contextData = this.buildContext(intent);
        const systemPrompt = this.generateSystemPrompt();

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "system", content: `DATA:\n${contextData}` }
        ];

        // history dibatasi (hemat token)
        chatHistory.slice(-4).forEach(msg => {
            if (msg.text?.trim()) {
                messages.push({
                    role: msg.type === "user" ? "user" : "assistant",
                    content: msg.text
                });
            }
        });

        messages.push({
            role: "user",
            content: userMessage
        });

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "gemini/gemini-2.0-flash-lite",
                    messages,
                    temperature: 0.9,
                    presence_penalty: 0.6,
                    frequency_penalty: 0.3
                })
            });

            if (!response.ok) {
                if (response.status === 401) return "API key bermasalah.";
                if (response.status === 429) return "Lagi ramai, coba lagi ya 😄";
                if (response.status === 500) return "Server lagi error.";
                return "Gagal ambil respon.";
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "AI lagi diem 😅";

        } catch (error) {
            console.error(error);
            return "Koneksi ke AI gagal.";
        }
    }
}

export default Chatbot;