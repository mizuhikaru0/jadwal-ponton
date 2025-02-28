// js/main.js
import { updateTheme, toggleTheme } from "./theme.js";
import { renderSchedules, startCountdown } from "./schedule.js";
import { renderSavedRequests, handleWaitRequest } from "./waitRequest.js";
import { renderTariffInfo } from "./tarif.js";
import { renderRouteInfo } from "./rute.js";
import Chatbot from "./chatbot.js";

// Agar fungsi toggleTheme dapat diakses secara global dari HTML
window.toggleTheme = toggleTheme;

// Pasang event listener pada form permintaan (waitRequest)
const waitRequestForm = document.getElementById("waitRequestForm");
if (waitRequestForm) {
  waitRequestForm.addEventListener("submit", handleWaitRequest);
}

function initializeApp() {
  updateTheme();
  renderSchedules();
  startCountdown();
  renderSavedRequests();
  renderTariffInfo();
  renderRouteInfo();
  initializeChatbot(); // Inisialisasi Chatbot
}

initializeApp();

// Fungsi untuk mengintegrasikan Chatbot ke dalam modal dengan loader dinamis dan penyimpanan sesi chat.
function initializeChatbot() {
  const chatbot = new Chatbot();

  // Ambil elemen-elemen Chatbot dari modal
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatOutput = document.getElementById("chatOutput");
  const chatbotModal = document.getElementById("chatbotModal");

  // Saat modal Chatbot dibuka, kosongkan panel chat dan tampilkan loader dinamis
  if (chatbotModal && chatOutput) {
    chatbotModal.addEventListener("show.bs.modal", () => {
      // Kosongkan panel chat
      chatOutput.innerHTML = "";
      // Buat elemen loader dinamis
      const loaderElem = document.createElement("div");
      loaderElem.id = "chatLoader";
      loaderElem.innerHTML = `
        <div class="loader-spinner">
          <div class="spinner-circle"></div>
        </div>
        <p style="text-align:center; color:#fff; margin-top:10px;">Memuat Chatbot...</p>
      `;
      chatOutput.appendChild(loaderElem);
    });

    // Setelah modal tampil, hapus loader dan muat riwayat chat (jika ada) setelah 1 detik
    chatbotModal.addEventListener("shown.bs.modal", () => {
      setTimeout(() => {
        const loaderElem = document.getElementById("chatLoader");
        if (loaderElem) loaderElem.remove();
        loadChatHistory();
      }, 1000);
    });
  }

  // Inisialisasi tombol reset chat
  const resetChatBtn = document.getElementById("resetChatBtn");
  if (resetChatBtn && chatOutput) {
    resetChatBtn.addEventListener("click", () => {
      // Hapus sesi chat dari localStorage
      localStorage.removeItem("chatSession");
      // Bersihkan panel chat
      chatOutput.innerHTML = "";
    });
  }

  // Penanganan event ketika pengguna mengirim pesan melalui form Chatbot
  if (chatForm && chatInput && chatOutput) {
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const userMessage = chatInput.value.trim();
      if (!userMessage) return;

      // Tampilkan pesan pengguna pada panel chat dan simpan ke sesi
      appendMessageToChatOutput("user", userMessage);
      addMessageToSession("user", userMessage);
      chatInput.value = "";
      chatOutput.scrollTop = chatOutput.scrollHeight;

      // Tampilkan loader dinamis untuk respon bot
      const botLoaderElem = document.createElement("div");
      botLoaderElem.classList.add("chat-message", "bot-message");
      botLoaderElem.innerHTML = `
        <div class="loader-spinner">
          <div class="spinner-circle"></div>
        </div>
        <p style="text-align:left; color:#ffd700; margin-top:5px;">Loading...</p>
      `;
      chatOutput.appendChild(botLoaderElem);
      chatOutput.scrollTop = chatOutput.scrollHeight;

      // Simulasikan delay respon bot (1,5 detik)
      setTimeout(() => {
        botLoaderElem.remove();
        const botResponse = chatbot.getResponse(userMessage);
        appendMessageToChatOutput("bot", botResponse);
        addMessageToSession("bot", botResponse);
        chatOutput.scrollTop = chatOutput.scrollHeight;
      }, 1500);
    });
  } else {
    console.log("Elemen Chatbot tidak ditemukan.");
  }

  // Fungsi untuk menampilkan pesan pada panel chat
  function appendMessageToChatOutput(type, text) {
    const messageElem = document.createElement("div");
    messageElem.classList.add("chat-message", type === "user" ? "user-message" : "bot-message");
    // Mengubah newline menjadi <br> agar mendukung baris baru
    messageElem.innerHTML = text.replace(/\n/g, "<br>");
    chatOutput.appendChild(messageElem);
  }
  

  // Fungsi untuk memuat riwayat chat dari localStorage
  function loadChatHistory() {
    // Pastikan panel chat kosong
    chatOutput.innerHTML = "";
    const session = loadChatSession();
    session.forEach(message => {
      appendMessageToChatOutput(message.type, message.text);
    });
  }

  // Fungsi untuk mengambil sesi chat dari localStorage dengan batas waktu 24 jam
  function loadChatSession() {
    const sessionData = localStorage.getItem("chatSession");
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const now = Date.now();
      // Jika sesi lebih dari 24 jam (86400000 ms), hapus sesi dan kembalikan array kosong
      if (now - session.timestamp > 86400000) {
        localStorage.removeItem("chatSession");
        return [];
      } else {
        return session.messages;
      }
    }
    return [];
  }

  // Fungsi untuk menambahkan pesan ke sesi chat dan menyimpannya ke localStorage
  function addMessageToSession(type, text) {
    const now = Date.now();
    let session = { timestamp: now, messages: [] };
    const sessionData = localStorage.getItem("chatSession");
    if (sessionData) {
      session = JSON.parse(sessionData);
      // Jangan perbarui timestamp agar sesi tetap mengacu pada waktu pembuatan awal
    }
    session.messages.push({ type, text });
    localStorage.setItem("chatSession", JSON.stringify(session));
  }
}
