// js/main.js

import { updateTheme, toggleTheme } from "./theme.js";
import { renderSchedules, startCountdown, initAudioContext } from "./schedule.js"; // Tambah initAudioContext
import { renderSavedRequests, handleWaitRequest } from "./waitRequest.js";
import { renderTariffInfo } from "./tarif.js";
import { renderRouteInfo } from "./rute.js";
import Chatbot from "./chatbot.js";

// Expose ke window agar bisa dipanggil via onclick HTML
window.toggleTheme = toggleTheme;

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
  initializeChatbot();
  
  // FIX: Inisialisasi Audio Context saat user pertama kali klik di mana saja
  // Ini penting agar alarm tidak diblokir browser
  document.body.addEventListener('click', initAudioContext, { once: true });
}

initializeApp();

function parseMarkdown(text) {
  if (!text) return "";
  
  // FIX: Sanitasi HTML untuk mencegah XSS (Security)
  let safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  let formattedText = safeText
    .replace(/\[AUTOWA:.*?\]/g, '') 
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-primary text-decoration-underline">$1</a>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
    
  return formattedText;
}

// ----------------------------------------------------------

function initializeChatbot() {
  const chatbot = new Chatbot();
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatOutput = document.getElementById("chatOutput");
  const chatbotModal = document.getElementById("chatbotModal");

  if (chatbotModal && chatOutput) {
    chatbotModal.addEventListener("show.bs.modal", () => {
      if (chatOutput.childElementCount === 0) {
         chatOutput.innerHTML = "";
      }
    });

    chatbotModal.addEventListener("shown.bs.modal", () => {
       loadChatHistory();
       scrollToBottom();
    });
  }

  const resetChatBtn = document.getElementById("resetChatBtn");
  if (resetChatBtn && chatOutput) {
    resetChatBtn.addEventListener("click", () => {
      localStorage.removeItem("chatSession");
      chatOutput.innerHTML = "";
      const greeting = "Halo! Ada yang bisa saya bantu mengenai jadwal, tarif, atau rute?";
      appendMessageWithTypingEffect("bot", greeting);
    });
  }

  if (chatForm && chatInput && chatOutput) {
    chatForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const userMessage = chatInput.value.trim();
      if (!userMessage) return;

      // 1. Tampilkan pesan user
      const formattedUserMsg = parseMarkdown(userMessage);
      appendMessageToChatOutput("user", formattedUserMsg);
      addMessageToSession("user", userMessage); // Simpan mentahan
      
      chatInput.value = "";
      scrollToBottom();

      // 2. Tampilkan Loader
      const botLoaderElem = document.createElement("div");
      botLoaderElem.classList.add("chat-message", "bot-message");
      botLoaderElem.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
            <span class="fst-italic text-muted small">Sedang berpikir...</span>
        </div>
      `;
      chatOutput.appendChild(botLoaderElem);
      scrollToBottom();

      try {
        const aiResponseRaw = await chatbot.getResponse(userMessage);
        botLoaderElem.remove();

        // 3. Tampilkan jawaban AI
        appendMessageWithTypingEffect("bot", aiResponseRaw, () => {
            scrollToBottom();
        });
        
        addMessageToSession("bot", aiResponseRaw);

      } catch (error) {
        botLoaderElem.remove();
        appendMessageToChatOutput("bot", "Maaf, koneksi terputus. Silakan coba lagi.");
      }
    });
  }
  
  function scrollToBottom() {
    if(chatOutput) chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  function appendMessageToChatOutput(type, htmlText) {
    const messageElem = document.createElement("div");
    messageElem.classList.add("chat-message", type === "user" ? "user-message" : "bot-message");
    messageElem.innerHTML = htmlText;
    chatOutput.appendChild(messageElem);
    scrollToBottom();
  }

  function appendMessageWithTypingEffect(type, rawText, callback) {
    const messageElem = document.createElement("div");
    messageElem.classList.add("chat-message", type === "user" ? "user-message" : "bot-message");
    chatOutput.appendChild(messageElem);

    // Ketik teks mentah dulu (agar efek ngetik terlihat natural)
    // FIX: Parsing markdown dilakukan SETELAH mengetik selesai untuk menghindari tag HTML terlihat saat diketik
    typeMessage(messageElem, rawText, 15, () => {
      messageElem.innerHTML = parseMarkdown(rawText); // Ubah ke HTML setelah selesai
      scrollToBottom();
      if (callback) callback();
    });
  }

  function typeMessage(element, text, delay = 20, callback) {
    let i = 0;
    element.textContent = "";
    
    // FIX: Cegah interval menumpuk jika fungsi dipanggil cepat
    if(element.dataset.typingInterval) clearInterval(element.dataset.typingInterval);

    const interval = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      if(chatOutput) chatOutput.scrollTop = chatOutput.scrollHeight;
      if (i >= text.length) {
        clearInterval(interval);
        delete element.dataset.typingInterval;
        if (callback) callback();
      }
    }, delay);
    
    element.dataset.typingInterval = interval;
  }

  function loadChatHistory() {
    chatOutput.innerHTML = "";
    const session = loadChatSession();
    if (session.length === 0) {
        const greeting = "Halo! Saya asisten virtual Ponton. Ada yang bisa dibantu mengenai jadwal atau tarif?";
        // Jangan pakai typing effect saat load history agar cepat
        appendMessageToChatOutput("bot", parseMarkdown(greeting));
    } else {
        session.forEach(message => {
            appendMessageToChatOutput(message.type, parseMarkdown(message.text));
        });
    }
  }

  function loadChatSession() {
    const sessionData = localStorage.getItem("chatSession");
    if (sessionData) {
      try {
          const session = JSON.parse(sessionData);
          const now = Date.now();
          if (now - session.timestamp > 86400000) { // 24 jam
            localStorage.removeItem("chatSession");
            return [];
          } else {
            return session.messages || [];
          }
      } catch(e) {
          localStorage.removeItem("chatSession");
          return [];
      }
    }
    return [];
  }

  function addMessageToSession(type, text) {
    const now = Date.now();
    let session = { timestamp: now, messages: [] };
    const sessionData = localStorage.getItem("chatSession");
    if (sessionData) {
      try {
        session = JSON.parse(sessionData);
        session.timestamp = now; // Update timestamp aktivitas terakhir
      } catch(e) {
        session = { timestamp: now, messages: [] };
      }
    }
    session.messages.push({ type, text });
    localStorage.setItem("chatSession", JSON.stringify(session));
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // FIX: Pastikan path service worker benar (root directory)
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
        // console.log('Service Worker OK');
      })
      .catch((error) => {
        console.warn('SW Fail:', error);
      });
  });
}