// js/main.js

import { updateTheme, toggleTheme } from "./theme.js";
import { renderSchedules, startCountdown } from "./schedule.js";
import { renderSavedRequests, handleWaitRequest } from "./waitRequest.js";
import { renderTariffInfo } from "./tarif.js";
import { renderRouteInfo } from "./rute.js";
import Chatbot from "./chatbot.js";

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
}

initializeApp();

function parseMarkdown(text) {
  if (!text) return "";
  let formattedText = text
    .replace(/\[AUTOWA:.*?\]/g, '') 
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>');
  return formattedText.replace(/\n/g, '<br>');
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
      // Bersihkan chat saat dibuka (opsional)
      if (chatOutput.childElementCount === 0) {
         chatOutput.innerHTML = "";
      }
    });

    chatbotModal.addEventListener("shown.bs.modal", () => {
       loadChatHistory();
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
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const userMessage = chatInput.value.trim();
      if (!userMessage) return;

      appendMessageToChatOutput("user", parseMarkdown(userMessage));
      addMessageToSession("user", userMessage);
      
      chatInput.value = "";
      scrollToBottom();

      const botLoaderElem = document.createElement("div");
      botLoaderElem.classList.add("chat-message", "bot-message");
      botLoaderElem.innerHTML = `
        <div class="loader-spinner" style="margin:0; width:20px; height:20px; border-width:3px;">
          <div class="spinner-circle"></div>
        </div>
        <span style="margin-left:10px; font-style:italic;">Mengetik...</span>
      `;
      chatOutput.appendChild(botLoaderElem);
      scrollToBottom();

      // Proses Respon Bot
      setTimeout(() => {
        botLoaderElem.remove();
        
        const rawResponse = chatbot.getResponse(userMessage);
        const formattedResponse = parseMarkdown(rawResponse);

        appendMessageWithTypingEffect("bot", formattedResponse, () => {
          const autoWaMatch = rawResponse.match(/\[AUTOWA:(.*?)\]/);
          if (autoWaMatch && autoWaMatch[1]) {
            const waUrl = autoWaMatch[1];
            setTimeout(() => {
                window.open(waUrl, "_blank");
            }, 500); // Delay 500ms agar user sempat melihat pesan
          }
          // ---------------------------------

          if (rawResponse.includes("Sesi ditutup") || rawResponse.includes("Sampai jumpa")) {
            setTimeout(() => {
              let modalInstance = bootstrap.Modal.getInstance(chatbotModal);
              if (!modalInstance) {
                modalInstance = new bootstrap.Modal(chatbotModal);
              }
              modalInstance.hide();
            }, 1500);
          }
        });
        
        const historyText = rawResponse.replace(/\[AUTOWA:.*?\]/g, "").trim(); 
        addMessageToSession("bot", historyText);
      }, 800);
    });
  } else {
    console.log("Elemen Chatbot tidak ditemukan.");
  }

  function scrollToBottom() {
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  // Menampilkan pesan langsung (tanpa ketikan)
  function appendMessageToChatOutput(type, htmlText) {
    const messageElem = document.createElement("div");
    messageElem.classList.add("chat-message", type === "user" ? "user-message" : "bot-message");
    messageElem.innerHTML = htmlText;
    chatOutput.appendChild(messageElem);
    scrollToBottom();
  }

  // Menampilkan pesan dengan efek mengetik
  function appendMessageWithTypingEffect(type, formattedHtml, callback) {
    // Buat elemen dummy untuk mengambil teks polosnya (tanpa tag HTML)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedHtml;
    let plainText = tempDiv.innerText || tempDiv.textContent; // Ambil teks murninya saja

    const messageElem = document.createElement("div");
    messageElem.classList.add("chat-message", type === "user" ? "user-message" : "bot-message");
    chatOutput.appendChild(messageElem);

    // Ketik teks polosnya dulu
    typeMessage(messageElem, plainText, 20, () => {
      // Setelah selesai mengetik, ganti dengan HTML yang sudah diformat (Tebal/Miring muncul)
      messageElem.innerHTML = formattedHtml; 
      scrollToBottom();
      if (callback && typeof callback === "function") {
        callback();
      }
    });
  }

  function typeMessage(element, text, delay = 20, callback) {
    let i = 0;
    element.textContent = "";
    const interval = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      chatOutput.scrollTop = chatOutput.scrollHeight; // Auto scroll saat ngetik
      if (i >= text.length) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, delay);
  }

  function loadChatHistory() {
    chatOutput.innerHTML = "";
    const session = loadChatSession();
    if (session.length === 0) {
        // Sapaan awal jika history kosong
        const greeting = "Halo! Saya asisten virtual Ponton. Ada yang bisa dibantu mengenai jadwal atau tarif?";
        appendMessageWithTypingEffect("bot", greeting);
    } else {
        session.forEach(message => {
            // Render history dengan format HTML juga
            appendMessageToChatOutput(message.type, parseMarkdown(message.text));
        });
    }
  }

  function loadChatSession() {
    const sessionData = localStorage.getItem("chatSession");
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const now = Date.now();
      // Reset history jika lebih dari 24 jam
      if (now - session.timestamp > 86400000) {
        localStorage.removeItem("chatSession");
        return [];
      } else {
        return session.messages;
      }
    }
    return [];
  }

  function addMessageToSession(type, text) {
    const now = Date.now();
    let session = { timestamp: now, messages: [] };
    const sessionData = localStorage.getItem("chatSession");
    if (sessionData) {
      session = JSON.parse(sessionData);
    }
    session.messages.push({ type, text });
    localStorage.setItem("chatSession", JSON.stringify(session));
  }
}