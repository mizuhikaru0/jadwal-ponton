// js/chatbot.js

import { intents, fallbackResponses } from "./knowledge.js";
import { tariffData } from "./tarif.js";
import { routeInfo } from "./rute.js";
import { scheduleData, adjustTimeIfFriday, getNextDeparture, formatRouteName } from "./schedule.js";


const contacts = [
    { name: "Riko (Nahkoda)", number: "6282252869605", display: "0822 5286 9605" },
    { name: "Ihsan Maulana (ABK)", number: "6282211061254", display: "0822 1106 1254" }
];

class Chatbot {
    constructor() {
        this.intents = intents;
        this.fallbackResponses = fallbackResponses;
        this.routeAliases = {
            "tanahmerah": "Tanah Merah",
            "tanah-merah": "Tanah Merah",
            "tanah merah": "Tanah Merah",
            "merah": "Tanah Merah",
            "muara": "Muara",
            "wm": "Muara"
        };
    }

    cleanText(text) {
        return text.toLowerCase().replace(/[?!.,;:]/g, "").trim();
    }

    /**
     * Sistem Skor Sederhana untuk menentukan Intent
     */
    analyzeIntent(message) {
        const cleanedMessage = this.cleanText(message);
        const words = cleanedMessage.split(/\s+/);
        
        let bestIntent = null;
        let maxScore = 0;

        this.intents.forEach(intent => {
            let score = 0;
            intent.keywords.forEach(keyword => {
                // Skor +2 jika kata persis sama
                if (words.includes(keyword)) score += 2;
                // Skor +1 jika mengandung kata (partial match)
                else if (cleanedMessage.includes(keyword)) score += 1;
            });

            if (score > maxScore) {
                maxScore = score;
                bestIntent = intent;
            }
        });

        // Ambang batas skor (threshold) agar tidak asal jawab
        return maxScore >= 1 ? bestIntent : null;
    }

    /**
     * Generator Respon Dinamis
     */
    getResponse(rawMessage) {
        const message = rawMessage || "";
        if (!message.trim()) return "Silakan ketik sesuatu...";

        const intent = this.analyzeIntent(message);

        // 1. Jika Intent tidak ditemukan
        if (!intent) {
            return this.getRandom(this.fallbackResponses);
        }

        // 2. Handler Khusus berdasarkan ID Intent
        switch (intent.id) {
            case "tarif":
                return this.generateTariffResponse(message);
            case "jadwal":
                return this.generateScheduleResponse(message);
            case "rute":
                return this.generateRouteResponse(message);
            case "wait_request": 
                return this.generateWaitRequestResponse(message);
            case "kontak":
                return this.generateContactResponse();
            case "sapaan":
            case "identitas":
            case "terimakasih":
            case "perpisahan":
                return this.getRandom(intent.responses);
            default:
                return this.getRandom(this.fallbackResponses);
        }
    }

    /**
     * Menjawab pertanyaan kontak
     */
    generateContactResponse() {
        let response = "📞 **Kontak Petugas Ponton:**\n";
        contacts.forEach((c, index) => {
            response += `${index + 1}. **${c.name}**: ${c.display}\n`;
        });
        response += "\nSilakan hubungi salah satu jika ada keperluan mendesak. Pilih dengan ketik **1** atau **2**.";
        return response;
    }
    
    /**
     * Menjawab pertanyaan tarif dengan data dari tarif.js
     */
    generateTariffResponse(message) {
        const lowerMsg = this.cleanText(message);
        let response = "📋 **Info Tarif Penyebrangan:**\n";
        
        let specificFound = false;
        
        if (lowerMsg.includes("motor")) {
            const motorRates = tariffData.filter(t => t.description.toLowerCase().includes("motor"));
            if (motorRates.length > 0) {
                response = "🏍️ **Tarif Motor:**\n";
                motorRates.forEach(item => {
                    response += `- ${item.description}: **Rp ${item.price}**\n`;
                });
                specificFound = true;
            }
        } 
        
        if (lowerMsg.includes("orang") || lowerMsg.includes("sendiri")) {
            const personRate = tariffData.find(t => t.description.toLowerCase().includes("orang"));
            if (personRate) {
                response += `🚶 ${personRate.description}: **Rp ${personRate.price}**\n`;
                specificFound = true;
            }
        }

        if (!specificFound) {
            tariffData.forEach(item => {
                if (item.price) {
                    response += `- ${item.description}: **Rp ${item.price}**\n`;
                } else {
                    response += `ℹ️ _${item.description}_\n`;
                }
            });
        }

        return response;
    }

    /**
     * Menjawab pertanyaan rute dengan data dari rute.js
     */
    generateRouteResponse(message) {
        let response = "🗺️ **Info Rute:**\n\n";
        routeInfo.routes.forEach(r => {
            response += `📍 **${r.name}**\n`;
            response += `   _${r.details[0]}_\n\n`; 
        });
        return response;
    }

    /**
     * Menjawab pertanyaan jadwal dengan data dari schedule.js
     */
    generateScheduleResponse(message) {
        const cleanMsg = this.cleanText(message);
        
        let selectedRouteKey = null;
        let selectedRouteLabel = "";

        for (const [alias, label] of Object.entries(this.routeAliases)) {
            if (cleanMsg.includes(alias)) {
                const realKey = Object.keys(scheduleData).find(k => 
                    k.toLowerCase().includes(label.toLowerCase().replace(/\s/g, '')) || 
                    this.routeAliases[k.split('-')[0].toLowerCase()] === label
                );
                
                if (realKey) {
                    selectedRouteKey = realKey;
                    selectedRouteLabel = label;
                    break;
                }
            }
        }

        const timeMatch = cleanMsg.match(/(\d{1,2})([.:]\d{2})?/);
        if (timeMatch) {
            const hourQuery = parseInt(timeMatch[1]);
            let foundTimes = [];
            
            Object.keys(scheduleData).forEach(route => {
                scheduleData[route].forEach(time => {
                    const adjusted = adjustTimeIfFriday(time);
                    const hourSchedule = parseInt(adjusted.split(':')[0]);
                    if (hourSchedule === hourQuery) {
                        foundTimes.push(`- ${adjusted} WIB (Rute ${formatRouteName(route)})`);
                    }
                });
            });

            if (foundTimes.length > 0) {
                return `✅ Ya, ada keberangkatan sekitar jam ${hourQuery}:\n${foundTimes.join("\n")}\n_Cek **Jadwal** di menu utama untuk rincian._`;
            } else {
                return `❌ Tidak ada keberangkatan tepat di jam ${hourQuery} (atau sudah lewat). Silakan cek *Keberangkatan Berikutnya* atau *Jadwal Lengkap*.`;
            }
        }
        
        if (cleanMsg.includes("selanjutnya") || cleanMsg.includes("berikutnya") || cleanMsg.includes("sekarang")) {
            const { nextTime, nextRoute } = getNextDeparture();
            if (nextTime) {
                const nextTimeStr = nextTime.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', hour12: false });
                const routeName = formatRouteName(nextRoute);
                return `🚤 **Keberangkatan Berikutnya:**\nUntuk rute **${routeName}** pada pukul **${nextTimeStr} WIB**.`;
            }
        }

        if (selectedRouteKey) {
            const times = scheduleData[selectedRouteKey].map(t => adjustTimeIfFriday(t)).join(", ");
            return `🕒 **Jadwal ${formatRouteName(selectedRouteKey)}:**\n${times} WIB\n\n_Catatan: Jumat jam 13:00 WIB mundur ke 13:30 WIB._`;
        } else {
            let response = "🕒 **Jadwal Keberangkatan Lengkap:**\n";
            Object.keys(scheduleData).forEach(key => {
                const routeName = formatRouteName(key);
                const times = scheduleData[key].map(t => adjustTimeIfFriday(t)).join(", ");
                response += `\n⚓ **${routeName}**\n   ${times} WIB`;
            });
            response += "\n\n_Catatan: Jumat jam 13:00 WIB mundur ke 13:30 WIB._";
            return response;
        }
    }

    /**
     * Menjawab pertanyaan minta tunggu (wait request)
     */
    generateWaitRequestResponse(message) {
        const cleanMsg = this.cleanText(message);
        const defaultWaitMessage = "Pak, minta tunggu ya?";
        const waMessage = encodeURIComponent(defaultWaitMessage);

        // 1. User memilih kontak (1 atau 2) -> Trigger AUTOWA
        if (cleanMsg.includes("1") || cleanMsg.includes("satu") || cleanMsg.includes("pilih 1")) {
            const contact = contacts[0];
            const waUrl = `https://wa.me/${contact.number}?text=${waMessage}`;
            const linkText = "Hubungi Petugas Sekarang";
            return `Anda memilih **${contact.name}**.\n\nSistem akan otomatis membuka WhatsApp dalam beberapa detik. Jika tidak berhasil, silakan klik tautan ini:\n[${linkText}](${waUrl})\n[AUTOWA:${waUrl}]`;
        }
        
        if (cleanMsg.includes("2") || cleanMsg.includes("dua") || cleanMsg.includes("pilih 2")) {
            const contact = contacts[1];
            const waUrl = `https://wa.me/${contact.number}?text=${waMessage}`;
            const linkText = "Hubungi Petugas Sekarang";
            return `Anda memilih **${contact.name}**.\n\nSistem akan otomatis membuka WhatsApp dalam beberapa detik. Jika tidak berhasil, silakan klik tautan ini:\n[${linkText}](${waUrl})\n[AUTOWA:${waUrl}]`;
        }
        
        // 2. User konfirmasi 'MAU' / 'LANJUT' 
        if (cleanMsg.includes("mau") || cleanMsg.includes("lanjut") || cleanMsg.includes("ya") || cleanMsg.includes("setuju")) {
            let response = "Baik, silakan pilih salah satu petugas yang ingin Anda hubungi untuk konfirmasi tunggu 5 menit:\n\n";
            response += `1. **${contacts[0].name}** (${contacts[0].display})\n`;
            response += `2. **${contacts[1].name}** (${contacts[1].display})\n\n`;
            response += "Ketik **1** atau **2** untuk memilih.";
            return response;
        }

        // 3. User mengatakan 'TIDAK' / 'KEBERATAN' (Prompt untuk cek urgen)
        if (cleanMsg.includes("tidak") || cleanMsg.includes("keberatan") || cleanMsg.includes("enggak") || cleanMsg.includes("tdk") || cleanMsg.includes("nggak")) {
            return `Baik. Apakah kondisi Anda **sangat urgen** (misalnya ada keluarga meninggal/sakit parah) yang membuat Anda butuh ditunggu lebih lama dari 5 menit?
            
            Ketik **'URGENT'** jika ya, atau **'TIDAK URGEN'** jika tidak.`;
        }
        
        // 4. User konfirmasi 'URGENT' 
        if (cleanMsg.includes("urgent") || cleanMsg.includes("sangat urgen") || cleanMsg.includes("penting")) {
            let response = "Baik, karena kondisi urgen, kami akan meminta petugas memberikan toleransi waktu lebih panjang. Segera hubungi salah satu petugas di bawah ini:\n\n";
            response += `1. **${contacts[0].name}** (${contacts[0].display})\n`;
            response += `2. **${contacts[1].name}** (${contacts[1].display})\n\n`;
            response += "Ketik **1** atau **2** untuk memilih.";
            return response;
        }
        
        // 5. User konfirmasi 'TIDAK URGEN'
        if (cleanMsg.includes("tidak urgen") || cleanMsg.includes("tdk urgent")) {
            return "Terima kasih atas kejujuran Anda. Mohon dipercepat atau bersiap menunggu jadwal penyebrangan berikutnya jika sudah terlewat, demi ketertiban bersama.";
        }

        // 6. Respon 'wait_request' Awal (Default)
        let response = "🙏 **Permintaan Tunggu (Wait Request):**\n\n";
        response += "Kami dapat memintakan penyebrangan untuk menunggu Anda, namun **maksimal hanya 5 menit** saja. Ini untuk menjaga agar jadwal yang lain tidak ikut terganggu.\n\n";
        response += "Apakah Anda **MAU** kami teruskan permintaan tunggu 5 menit ini ke petugas?\n\n";
        response += "Ketik **'MAU'** untuk melanjutkan, atau **'TIDAK'** jika Anda keberatan dengan batas 5 menit.";
        return response;
    }

    // Utility Helper
    getRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

export default Chatbot;