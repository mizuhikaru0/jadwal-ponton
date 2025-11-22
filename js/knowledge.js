// js/knowledge.js

export const intents = [
    {
      id: "sapaan",
      keywords: ["halo", "hai", "pagi", "siang", "sore", "malam", "assalamualaikum", "permisi", "tes", "hallo"],
      responses: [
        "Halo! Ada yang bisa saya bantu mengenai jadwal, tarif, atau rute penyebrangan?",
        "Halo, selamat datang di layanan informasi Penyebrangan Ponton. Mau tanya apa nih?",
        "Waalaikumsalam. Ada yang bisa dibantu?"
      ]
    },
    {
      id: "identitas",
      keywords: ["siapa", "kamu", "bot", "robot", "nama"],
      responses: [
        "Saya adalah Asisten Virtual Ponton. Saya bisa bantu cek jadwal, tarif, dan info rute.",
        "Panggil saja saya Chatbot Ponton. Saya di sini untuk membantu informasi penyebrangan Anda."
      ]
    },
    {
      id: "tarif",
      keywords: ["tarif", "harga", "bayar", "ongkos", "biaya", "duit", "berapa", "bawa", "motor", "orang", "bonceng", "tiket", "motor sendiri", "boncengan",], 
      responses: [] 
    },
    {
      id: "jadwal",
      keywords: ["jadwal", "jam", "kapan", "berangkat", "jalan", "waktu", "pukul", "pagi", "sore", "besok", "hari", "minggu", "jumat", "sekarang", "selanjutnya", "berikutnya"], 
      responses: []
    },
    {
      id: "rute",
      keywords: ["rute", "arah", "tujuan", "kemana", "dari", "ke", "lokasi", "tempat", "jalur", "mana", "dermaga", "penyebrangan"], 
      responses: []
    },
    {
      id: "kontak",
      keywords: ["kontak", "hubungi", "nomor", "telepon", "wa", "whatsapp", "supir", "petugas", "nahkoda", "abk", "telpon", "call", "hubung", "hubungkan"], 
      responses: []
    },
    {
      id: "wait_request", 
      keywords: ["tunggu", "telat", "minta tunggu", "terlambat", "request", "mohon tunggu", "delay", "tahan", "mau", "tidak", "ya", "lanjut", "1", "2", "satu", "dua", "urgent", "keberatan"], 
      responses: [] 
    },
    {
      id: "terimakasih",
      keywords: ["makasih", "trims", "thank", "suwun", "oke", "ok", "sip", "mantap", "baik"],
      responses: [
        "Sama-sama! Hati-hati di jalan ya.",
        "Oke, siap! Semoga selamat sampai tujuan.",
        "Terima kasih kembali. Kalau butuh info lagi, tanya saja ya!"
      ]
    },
    {
      id: "perpisahan",
      keywords: ["dadah", "bye", "duluan", "pergi", "tutup"],
      responses: [
        "Sampai jumpa!",
        "Hati-hati di jalan!"
      ]
    },
    {
      id: "konteks_muara",
      keywords: ["muara", "dari mana", "asal", "berangkat dari", "titik awal", "starting point", "keberangkatan"],
      responses: [
        "Muara adalah titik awal penyebrangan kami. Ini merupakan dermaga di WM yang menjadi lokasi keberangkatan menuju Dermaga Tanah Merah.",
        "Muara adalah pelabuhan/dermaga asal dari mana kapal ponton berangkat. Lokasi ini berada di WM sebelum menuju Tanah Merah."
      ]
    }
  ];
  
  // Fallback jika tidak mengerti
  export const fallbackResponses = [
    "Maaf, saya kurang paham. Bisa diulangi pertanyaannya?",
    "Saya masih belajar nih. Coba tanya soal 'jadwal', 'tarif', atau 'rute' ya.",
    "Waduh, maksudnya gimana tuh? Coba tanya yang lebih simpel seperti 'jadwal jam berapa' atau 'harga tiket'."
  ];