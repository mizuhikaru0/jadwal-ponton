const intents = [
  {
    intent: "nama",
    pattern: /(nama kamu siapa|siapa namamu|siapa nama kamu|siapa kamu|siapa kamu\??)/i,
    keywords: ["nama","siapa"],
    responses: [
  "Saya adalah Chatbot AI untuk Penyebrangan CV Sejahtera.",
  "Panggil saya Chatbot, senang bertemu dengan Anda!"
]
  },
  {
    intent: "perpisahan",
    pattern: /(selamat tinggal|dadah|bye|sampai jumpa)/i,
    keywords: ["dadah","bye","selamat tinggal","jumpa"],
    responses: [
  "Sampai jumpa!",
  "Selamat tinggal! Semoga harimu menyenangkan.",
  "Dadah, sampai jumpa lagi!"
]
  },
  {
    intent: "jadwal_umum",
    pattern: /(jadwal penyebrangan|waktu keberangkatan|jadwal keberangkatan)/i,
    keywords: ["jadwal","penyebrangan","keberangkatan"],
    responses: [
  "<div style='white-space: pre-wrap;'>Berikut adalah jadwal penyebrangan:\n\nMuara → Tanah Merah:\n08:00, 10:00, 13:00, 15:00, 17:00\n\nTanah Merah → Muara:\n09:00, 11:00, 14:00, 16:00, 17:30\n</div>"
]
  },
  {
    intent: "jadwal_spesifik",
    pattern: /(jadwal (pada|untuk) (hari|jam|rute) (.*)|jam berapa (ke|dari) (.*)|ada jadwal (.*))/i,
    keywords: ["jadwal","spesifik","jam","hari","rute"],
    responses: [
  "Silakan tentukan rute atau hari yang Anda maksud, seperti 'jadwal dari Muara ke Tanah Merah' atau 'jadwal pada hari Jumat'."
]
  },
  {
    intent: "lokasi_terminal",
    pattern: /(lokasi terminal|terminal di mana|alamat terminal)/i,
    keywords: ["lokasi","terminal","alamat"],
    responses: [
  "Lokasi Penyeberangan:\n- Muara: Lokasi pemberangkatan pertama yang berada di muara kanal desa Bumi Pratama Mandira.\n- Tanah Merah: Dermaga tujuan yang terletak di luar desa."
]
  },
  {
    intent: "kontak_personil",
    pattern: /(kontak|hubungi|nomor telepon)/i,
    keywords: ["kontak","hubungi","nomor"],
    responses: [
  "Kontak Personil:\n- Nahkoda: Riko (0822 5286 9605)\n- ABK: Maulana (0821 7603 5125)"
]
  },
  {
    intent: "ponton_2424",
    pattern: /mau.*nanya.*besok.*ponton.*dari.*wm.*jam.*berapa.*ya/i,
    keywords: ["ponton","2424"],
    responses: [
  "jadwal penyebrangan besok dari wm dimulai dari jam 8 tepat, kemudian jam kedua jam 10"
]
  },
  {
    intent: "hari-lebaran",
    pattern: /Mas,.*lebaran.*besok.*ponton.*masih.*buka.*nggak\?/i,
    keywords: ["hari-lebaran"],
    responses: [
  "Ponton nggak pernah liburan kok"
]
  },
  {
    intent: "sapaan",
    pattern: /halo/i,
    keywords: ["sapaan"],
    responses: [
  "Iya, halo, ada yang bisa saya bantu?",
  "Iya haloo, ada yang bisa saya bantu?"
]
  },
  {
    intent: "puasa",
    pattern: /hari.*puasa.*libur\?/i,
    keywords: ["puasa"],
    responses: [
  "enggaklah",
  "Enggak kok"
]
  },
  {
    intent: "ponton-pagi",
    pattern: /ponton.*pagi.*mulai.*jam.*berapa.*ya/i,
    keywords: ["ponton-pagi"],
    responses: [
  "Ini dari arah mana? Dari luar mau masuk wm atau dari dalam?"
]
  },
  {
    intent: "jsdjsids",
    pattern: /jadwal.*dari.*luar.*masuk.*ke.*wm.*paling.*pagi/i,
    keywords: ["jsdjsids"],
    responses: [
  "Mulai dari jam 9"
]
  },
  {
    intent: "penutupan",
    pattern: /^ok$/i,
    keywords: ["penutupan"],
    responses: [
      "Baik, kalau ada yang ditanyakan lagi, hubungi saya"
    ]
  },
  {
    intent: "tanya-jadwal-pagi",
    pattern: /Mau.*nanya.*jadwal.*ponton.*besok.*kalau.*dari.*wm.*ke.*tanah.*merah.*jam.*berapa.*ya\?/i,
    keywords: ["tanya-jadwal-pagi"],
    responses: [
  "Besok jadwal penyebrangan ponton dari WM ke Tanah Merah itu dimulai jam 8 pagi. Selain itu, ada juga keberangkatan jam 10 pagi, jam 1 siang, jam 3 sore, dan terakhir jam 5 sore. Semoga membantu!"
]
  },
];

export default intents;
