require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Pastikan sudah install node-fetch@2

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Mengizinkan akses dari semua origin
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    try {
        const userPayload = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        // 1. Cek apakah API Key ada
        if (!apiKey) {
            console.error("Error: GEMINI_API_KEY tidak ditemukan di .env");
            return res.status(500).json({ error: "Konfigurasi server (API Key) belum lengkap." });
        }

        const modelName = "gemini-flash-latest"; // Update nama model yang lebih stabil
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        // 2. Request ke Google
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userPayload)
        });

        const data = await response.json();

        // 3. Cek jika Google memberikan error
        if (!response.ok) {
            console.error("Gemini API Error:", JSON.stringify(data, null, 2));
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (error) {
        console.error("Server Crash/Network Error:", error);
        // Pastikan response JSON tetap dikirim agar frontend tidak hang
        res.status(500).json({ error: "Gagal terhubung ke AI (Masalah Server)" });
    }
});

app.listen(PORT, '0.0.0.0', () => { // '0.0.0.0' agar bisa diakses dari IP lain (HP/Laptop)
    console.log(`Server siap! Berjalan di port ${PORT}`);
});