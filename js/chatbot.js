// js/chatbot.js

import { tariffData } from "./tarif.js";
import { routeInfo } from "./rute.js";
import { scheduleData, formatRouteName } from "./schedule.js";

// Data Kontak
const contacts = [
    { name: "Riko (Nahkoda)", number: "6282252869605", display: "0822 5286 9605" },
    { name: "Ihsan Maulana (ABK)", number: "6282211061254", display: "0822 1106 1254" }
];

class Chatbot {
    constructor() {
        // --- KONFIGURASI ---
        // Pastikan API Key Anda ditaruh di sini tanpa spasi tambahan
        this.apiKey = "AIzaSyDCFtx1qVccW6_BwvRW04DOdcLqmTIR7Vg"; 
        
        // Gunakan nama model yang lebih standar (flash biasanya paling cepat & stabil)
        this.modelName = "gemini-flash-latest"; 

        const cleanKey = this.apiKey.trim();

        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
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

        return `
        Kamu adalah "Asisten Virtual Ponton".
        Jawablah pertanyaan berdasarkan data berikut:
        
        === DATA JADWAL ===
        ${jadwalText}
        (Jumat: Jadwal 13:00 mundur ke 13:30 WIB).

        === DATA TARIF ===
        ${tarifText}

        === DATA RUTE ===
        ${ruteText}

        === KONTAK ===
        ${kontakText}

        Aturan: Jawab sopan, singkat, bahasa Indonesia. Jangan mengarang data.
        `;
    }

    async getResponse(userMessage) {
        if (!userMessage.trim()) return "Silakan ketik pertanyaan Anda.";

        // Cek sederhana apakah API Key masih default
        if (this.apiKey === "MASUKKAN_API_KEY_ANDA_DISINI" || this.apiKey.length < 10) {
            return "⚠️ Error: API Key belum dipasang di file js/chatbot.js";
        }

        const systemInstruction = this.generateSystemPrompt();

        const requestBody = {
            contents: [{
                role: "user",
                parts: [{ text: systemInstruction + "\n\nUser: " + userMessage + "\nAsisten:" }]
            }]
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            // --- BAGIAN DEBUGGING ERROR ---
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                console.error("⚠️ Detail Error dari Google:", errorBody);
                
                let pesanError = "Terjadi kesalahan sistem.";
                
                if (response.status === 400) {
                    pesanError = "⚠️ Error 400: Format request ditolak (INVALID_ARGUMENT).";
                } else if (response.status === 403) {
                    pesanError = "⚠️ Error 403: API Key salah atau tidak valid.";
                } else if (response.status === 429) {
                    pesanError = "⚠️ Error 429: Kuota API habis (Too Many Requests).";
                } else if (response.status === 500) {
                    pesanError = "⚠️ Error 500: Server Google sedang bermasalah.";
                } else {
                    pesanError = `⚠️ Error HTTP: ${response.status}`;
                }

                // Kembalikan pesan error spesifik ini ke chatbox agar user melihatnya
                throw new Error(pesanError);
            }

            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text;
            } else {
                return "Maaf, AI tidak memberikan jawaban (Respon kosong).";
            }

        } catch (error) {
            console.error("Error Fetch:", error);
            // Tampilkan error asli ke pengguna
            return `${error.message}`;
        }
    }
}

export default Chatbot;