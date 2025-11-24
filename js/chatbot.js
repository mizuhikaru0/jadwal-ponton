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
        // --- KONFIGURASI KE SERVER LOKAL ---
        this.apiUrl = "/.netlify/functions/chat"; 
    }

    generateSystemPrompt() {
        // 1. Format Data Jadwal
        let jadwalText = "";
        Object.keys(scheduleData).forEach(route => {
            jadwalText += `- Rute ${formatRouteName(route)}: ${scheduleData[route].join(", ")} WIB\n`;
        });

        // 2. Format Data Tarif
        let tarifText = "";
        tariffData.forEach(t => {
            let hargaStr = t.price;
            const priceClean = t.price.replace(/\D/g, '');
            if (priceClean && !isNaN(priceClean) && t.price.toLowerCase() !== "tidak ada") {
                 hargaStr = "Rp " + new Intl.NumberFormat('id-ID').format(priceClean);
            }
            tarifText += `- ${t.description}: ${hargaStr}\n`;
        });

        // 3. Format Data Rute
        let ruteText = "";
        routeInfo.routes.forEach(r => {
            ruteText += `- ${r.name}: ${r.details[0]}\n`;
        });

        // 4. Format Data Kontak
        let kontakText = "";
        contacts.forEach(c => {
            kontakText += `- ${c.name}: ${c.display} (Nomor WA: ${c.number})\n`;
        });

        // 5. Format Data Peraturan Umum
        let rulesText = "";
        rulesData.forEach(rule => {
            rulesText += `- ${rule}\n`;
        });

        // 6. Format Data Kebijakan Tunggu
        let waitPolicyText = "";
        waitPolicyData.forEach(item => {
            waitPolicyText += `- ${item}\n`;
        });

        return `
        Kamu adalah "Asisten Virtual Ponton".
        Tugas utama: Menjawab pertanyaan pengguna seputar Jadwal, Tarif, Rute, Kontak, Peraturan, dan Kebijakan Tunggu.

        === ATURAN MENJAWAB ===
        1. Jawab dengan ramah, singkat, leluasa, gunakan Bahasa Indonesia.
        2. Gunakan data di bawah ini sebagai sumber kebenaran mutlak, tapi kamu bisa menjawab lebih fleksibel, selama tidak melenceng dari data.
        3. Jika ditanya hal di luar topik, tolak dengan sopan.
        4. Kenali waktu terkini saat menjawab ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}.

        === DATA JADWAL ===
        ${jadwalText}
        (PENTING: Khusus hari Jumat, jadwal jam 13:00 SELALU mundur menjadi 13:30 WIB).

        === DATA TARIF ===
        ${tarifText}

        === DATA RUTE ===
        ${ruteText}

        === KONTAK PETUGAS ===
        ${kontakText}

        === DATA PERATURAN UMUM ===
        ${rulesText}

        === KEBIJAKAN MINTA TUNGGU / PENUNDAAN JADWAL ===
        ${waitPolicyText}
        (Penting: Tegaskan soal batas 5 menit kecuali untuk kondisi darurat yang disebutkan di atas).
        `;
    }

    async getResponse(userMessage, chatHistory = []) {
        if (!userMessage.trim()) return "Silakan ketik pertanyaan Anda.";

        const systemInstruction = this.generateSystemPrompt();

        const contents = [
            {
                role: "user",
                parts: [{ text: systemInstruction }]
            },
            {
                role: "model",
                parts: [{ text: "Baik, saya mengerti. Saya siap membantu pengguna." }]
            }
        ];

        const recentHistory = chatHistory.slice(-10);
        recentHistory.forEach(msg => {
            const role = msg.type === "user" ? "user" : "model";
            if(msg.text && msg.text.trim()) {
                contents.push({
                    role: role,
                    parts: [{ text: msg.text }]
                });
            }
        });

        contents.push({
            role: "user",
            parts: [{ text: userMessage }]
        });

        const requestBody = { contents: contents };

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                let pesanError = "Terjadi kesalahan sistem.";
                if (response.status === 429) pesanError = "⚠️ Terlalu banyak permintaan.";
                else if (response.status === 500) pesanError = "⚠️ Server backend bermasalah.";
                throw new Error(pesanError);
            }

            const data = await response.json();

            if (data.candidates && 
                data.candidates.length > 0 && 
                data.candidates[0].content && 
                data.candidates[0].content.parts && 
                data.candidates[0].content.parts.length > 0) {
                return data.candidates[0].content.parts[0].text;
            } else {
                if (data.promptFeedback && data.promptFeedback.blockReason) {
                    return "Maaf, pertanyaan Anda terdeteksi melanggar kebijakan konten keamanan.";
                }
                return "Maaf, ada gangguan server, coba beberapa saat lagi atau bisa hubungi nomor petugas.";
            }

        } catch (error) {
            console.error("Error Fetch:", error);
            return "Maaf, tidak dapat terhubung ke server. Pastikan terminal 'node server.js' sedang berjalan."; 
        }
    }
}

export default Chatbot;