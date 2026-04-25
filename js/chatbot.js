// js/chatbot.js

import { tariffData } from "./tarif.js";
import { routeInfo } from "./rute.js";
import { scheduleData, formatRouteName } from "./schedule.js";

// Data Kontak
const contacts = [
    { name: "Riko (Nahkoda)", number: "6282252869605", display: "0822 5286 9605" },
    { name: "Ihsan Maulana (ABK)", number: "6282211061254", display: "0822 1106 1254" }
];

// Data Peraturan Umum
const rulesData = [
    "Penumpang boleh naik ke atas ruang sopir atau nahkoda tapi dengan aturan yang berlaku.",
    "Dilarang merokok di ruangan nahkoda.",
    "Penumpang wajib mengikuti instruksi dari Nahkoda dan ABK.",
    "Barang bawaan basah seperti udang, ikan yang masih meneteskan air, kendaraan motornya harus diparkir di bagian paling depan kapal ponton.",
    "Pembayaran tarif hanya dilayani secara tunai di loket."
];

const waitPolicyData = [
    "Penumpang dapat meminta pelonggaran jadwal (minta tunggu) dengan menghubungi petugas.",
    "Toleransi waktu tunggu standar adalah MAKSIMAL 5 menit (Tidak boleh lebih).",
    "PENGECUALIAN KHUSUS (Sangat Urgent): Jika ada keluarga meninggal, kecelakaan, melahirkan, atau sakit parah.",
    "Untuk kondisi urgent di atas, toleransi waktu bisa lebih dari 5 menit, TETAPI wajib berunding/konfirmasi dulu dengan petugas."
];

class Chatbot {
    constructor() {
        this.apiUrl = "https://api.koboillm.com/v1/chat/completions";
        this.apiKey = "sk-xo2lRBHFgnnvY9PhkeIftg";
    }

    generateSystemPrompt() {
        let jadwalText = "";
        Object.keys(scheduleData).forEach(route => {
            jadwalText += `- Rute ${formatRouteName(route)}: ${scheduleData[route].join(", ")} WIB\n`;
        });

        let tarifText = "";
        tariffData.forEach(t => {
            let hargaStr = t.price;
            const priceClean = t.price.replace(/\D/g, '');
            if (priceClean && !isNaN(priceClean) && t.price.toLowerCase() !== "tidak ada") {
                hargaStr = "Rp " + new Intl.NumberFormat('id-ID').format(priceClean);
            }
            tarifText += `- ${t.description}: ${hargaStr}\n`;
        });

        let ruteText = "";
        routeInfo.routes.forEach(r => {
            ruteText += `- ${r.name}: ${r.details[0]}\n`;
        });

        let kontakText = "";
        contacts.forEach(c => {
            kontakText += `- ${c.name}: ${c.display} (WA: ${c.number})\n`;
        });

        let rulesText = "";
        rulesData.forEach(rule => {
            rulesText += `- ${rule}\n`;
        });

        let waitPolicyText = "";
        waitPolicyData.forEach(item => {
            waitPolicyText += `- ${item}\n`;
        });

        return `
Kamu adalah "Asisten Virtual Ponton".

Tugas utama:
Menjawab pertanyaan seputar Jadwal, Tarif, Rute, Kontak, Peraturan, dan Kebijakan Tunggu.

ATURAN:
- Jawab singkat, jelas, ramah
- Gunakan Bahasa Indonesia
- Jangan mengarang di luar data
- Tolak jika di luar topik

Waktu saat ini:
${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

=== JADWAL ===
${jadwalText}
(Penting: Jumat jam 13:00 jadi 13:30)

=== TARIF ===
${tarifText}

=== RUTE ===
${ruteText}

=== KONTAK ===
${kontakText}

=== PERATURAN ===
${rulesText}

=== KEBIJAKAN TUNGGU ===
${waitPolicyText}
(Batas normal 5 menit kecuali darurat)
`;
    }

    async getResponse(userMessage, chatHistory = []) {
        if (!userMessage.trim()) return "Silakan ketik pertanyaan.";

        const systemPrompt = this.generateSystemPrompt();

        const messages = [];

        // System
        messages.push({
            role: "system",
            content: systemPrompt
        });

        // History (maks 4)
        chatHistory.slice(-4).forEach(msg => {
            if (msg.text && msg.text.trim()) {
                messages.push({
                    role: msg.type === "user" ? "user" : "assistant",
                    content: msg.text
                });
            }
        });

        // User input
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
                    model: "gpt-4.1-mini", // ganti kalau perlu
                    messages: messages,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                if (response.status === 401) return "⚠️ API Key tidak valid.";
                if (response.status === 429) return "⚠️ Terlalu banyak request.";
                if (response.status === 500) return "⚠️ Server Kobo error.";
                return "⚠️ Gagal request ke server.";
            }

            const data = await response.json();

            const reply = data.choices?.[0]?.message?.content;

            return reply || "Tidak ada respon dari AI.";

        } catch (error) {
            console.error(error);
            return "Gagal koneksi ke AI (kemungkinan CORS).";
        }
    }
}

export default Chatbot;