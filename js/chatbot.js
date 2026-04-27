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
        // 🔥 GANTI DENGAN URL REPLIT KAMU
        this.apiUrl = "https://37ac42c7-77f8-4d5b-8010-7026765f2cc6-00-3k2wies6ph91m.riker.replit.dev/api/chat";
    }

    // ⏱️ Waktu
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

    // 🔍 Intent
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

    // 📦 Context
    buildContext(intent) {
        let text = "";
        const now = this.getCurrentTime();

        if (intent === "jadwal_realtime") {
            text += `Waktu sekarang: ${now}\n\n`;

            Object.keys(scheduleData).forEach(route => {
                const next = this.getNextDeparture(scheduleData[route]);
                text += `- ${formatRouteName(route)}: ${next || "Selesai hari ini"}\n`;
            });

            return text;
        }

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

    // 🧠 Prompt
    generateSystemPrompt() {
        return `
Kamu asisten ponton.

Gaya:
- Santai, natural, seperti ngobrol
- Boleh sedikit bercanda
- Tidak kaku

Aturan:
- Jawab hanya dari data
- Jangan mengarang
- Kalau tidak tahu, bilang jujur
- Di luar topik: tolak santai

Jawaban:
- Singkat, jelas
- Fokus ke pertanyaan
- Maks 1 emoji
`;
    }

    // 🤖 Response
    async getResponse(userMessage, chatHistory = []) {
        if (!userMessage.trim()) return "Tulis dulu pertanyaannya ya 😊";

        const intent = this.detectIntent(userMessage);
        const contextData = this.buildContext(intent);
        const systemPrompt = this.generateSystemPrompt();

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "system", content: `DATA:\n${contextData}` }
        ];

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
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gemini/gemini-2.0-flash-lite",
                    messages: messages,
                    temperature: 0.9
                })
            });

            if (!response.ok) {
                return "Server lagi sibuk, coba lagi ya 😄";
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "AI lagi diem 😅";

        } catch (error) {
            console.error(error);
            return "Koneksi ke server gagal.";
        }
    }
}

export default Chatbot;