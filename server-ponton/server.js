// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Kita pakai ini lagi

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    try {
        const userPayload = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        const modelName = "gemini-flash-latest"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userPayload)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        res.json(data);

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server siap! Berjalan di http://localhost:${PORT}`);
});