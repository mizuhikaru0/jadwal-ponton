const intents = [
  {
    intent: "salam",
    pattern: /^(hai|halo|hello|selamat (pagi|siang|sore|malam))$/i,
    keywords: ["hai", "halo", "hello", "selamat"],
    responses: [
      "Hai, juga!",
      "Halo! Ada yang bisa saya bantu?",
      "Hello! Selamat datang!"
    ]
  },
  {
    intent: "nama",
    pattern: /(nama kamu siapa|siapa namamu|siapa nama kamu|siapa kamu|siapa kamu\??)/i,
    keywords: ["nama", "siapa"],
    responses: [
      "Saya adalah Chatbot AI untuk Penyebrangan CV Sejahtera.",
      "Panggil saya Chatbot, senang bertemu dengan Anda!"
    ]
  },
  {
    intent: "perpisahan",
    pattern: /(selamat tinggal|dadah|bye|sampai jumpa)/i,
    keywords: ["dadah", "bye", "selamat tinggal", "jumpa"],
    responses: [
      "Sampai jumpa!",
      "Selamat tinggal! Semoga harimu menyenangkan.",
      "Dadah, sampai jumpa lagi!"
    ]
  },
  {
    intent: "sapaan_bang",
    pattern: /^(bang|abang|bro|kak)$/i,
    keywords: ["bang", "abang", "bro", "kak"],
    responses: [
      "Eh, ada apa nih, bang?",
      "Siap, bang! Mau tanya apa?",
      "Bang, ada yang bisa gue bantu?"
    ]
  },
  {
    intent: "jadwal_umum",
    pattern: /(jadwal penyebrangan|waktu keberangkatan|jadwal keberangkatan)/i,
    keywords: ["jadwal", "penyebrangan", "keberangkatan"],
    responses: [
      "Berikut adalah jadwal penyeberangan:\nMuara → Tanah Merah: 08:00, 10:00, 13:00, 15:00, 17:00.\nTanah Merah → Muara: 09:00, 11:00, 14:00, 16:00, 17:30."
    ]
  },
  {
    intent: "jadwal_spesifik",
    pattern: /(jadwal (pada|untuk) (hari|jam|rute) (.*)|jam berapa (ke|dari) (.*)|ada jadwal (.*))/i,
    keywords: ["jadwal", "spesifik", "jam", "hari", "rute"],
    responses: [
      "Silakan tentukan rute atau hari yang Anda maksud, seperti 'jadwal dari Muara ke Tanah Merah' atau 'jadwal pada hari Jumat'."
    ]
  },
  {
    intent: "lokasi_terminal",
    pattern: /(lokasi terminal|terminal di mana|alamat terminal)/i,
    keywords: ["lokasi", "terminal", "alamat"],
    responses: [
      "Lokasi Penyeberangan:\n- Muara: Lokasi pemberangkatan pertama yang berada di muara kanal desa Bumi Pratama Mandira.\n- Tanah Merah: Dermaga tujuan yang terletak di luar desa."
    ]
  },
  {
    intent: "kontak_personil",
    pattern: /(kontak|hubungi|nomor telepon)/i,
    keywords: ["kontak", "hubungi", "nomor"],
    responses: [
      "Kontak Personil:\n- Nahkoda: Riko (0822 5286 9605)\n- ABK: Maulana (0821 7603 5125)"
    ]
  }
];

export default intents;
