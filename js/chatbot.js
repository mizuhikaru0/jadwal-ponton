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
        this.apiKey = "sk-xo2lRBHFgnnvY9PhkeIftg";
    }

    // 🔍 DETEKSI INTENT
    detectIntent(message) {
        const msg = message.toLowerCase();

        if (msg.includes("jadwal")) return "jadwal";
        if (msg.includes("tarif") || msg.includes("harga")) return "tarif";
        if (msg.includes("rute")) return "rute";
        if (msg.includes("kontak") || msg.includes("telepon")) return "kontak";
        if (msg.includes("aturan")) return "aturan";
        if (msg.includes("tunggu")) return "tunggu";

        return "umum";
    }

    // 📦 CONTEXT DINAMIS
    buildContext(intent) {
        let text = "";

        if (intent === "jadwal" || intent === "umum") {
            Object.keys(scheduleData).forEach(route => {
                text += `- ${formatRouteName(route)}: ${scheduleData[route].join(", ")} WIB\n`;
            });
            text += "Catatan: Jumat 13:00 jadi 13:30\n";
        }

        if (intent === "tarif" || intent === "umum") {
            tariffData.forEach(t => {
                text += `- ${t.description}: ${t.price}\n`;
            });
        }

        if (intent === "rute" || intent === "umum") {
            routeInfo.routes.forEach(r => {
                text += `- ${r.name}: ${r.details[0]}\n`;
            });
        }

        if (intent === "kontak" || intent === "umum") {
            contacts.forEach(c => {
                text += `- ${c.name}: ${c.display}\n`;
            });
        }

        if (intent === "aturan" || intent === "umum") {
            text += rulesData.map(r => `- ${r}`).join("\n") + "\n";
        }

        if (intent === "tunggu" || intent === "umum") {
            text += waitPolicyData.map(w => `- ${w}`).join("\n") + "\n";
        }

        return text;
    }

    // 🧠 PROMPT RINGKAS (HEMAT TOKEN)
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
- Jika tidak ada data, bilang jujur
- Topik di luar: tolak dengan santai

Jawaban:
- Langsung ke inti
- Gaya ngobrol
- Boleh 1 emoji ringan
`;
    }

    async getResponse(userMessage, chatHistory = []) {
        if (!userMessage.trim()) return "Tulis dulu pertanyaannya ya 😊";

        const intent = this.detectIntent(userMessage);
        const contextData = this.buildContext(intent);
        const systemPrompt = this.generateSystemPrompt();

        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "system",
                content: `DATA:\n${contextData}`
            }
        ];

        // history maksimal 4 biar hemat
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
                    model: "gpt-4.1-mini",
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