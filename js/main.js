// js/main.js

import { updateTheme, toggleTheme } from "./theme.js";
import { renderSchedules, startCountdown, initAudioContext } from "./schedule.js"; 
import { renderSavedRequests, handleWaitRequest } from "./waitRequest.js";
import Chatbot from "./chatbot.js";

// Expose ke window agar bisa dipanggil via onclick HTML
window.toggleTheme = toggleTheme;

const waitRequestForm = document.getElementById("waitRequestForm");
if (waitRequestForm) {
  waitRequestForm.addEventListener("submit", handleWaitRequest);
}

// Fungsi inisialisasi aplikasi utama
function initializeApp() {
  updateTheme();
  
  // --- FITUR PENTING LAMA (JANGAN DIHAPUS) ---
  renderSchedules();
  startCountdown();
  renderSavedRequests();
  renderRouteInfo();
  
  // --- FITUR BARU ---
  initializeChatbot();
  
  // Audio Context untuk Alarm (Penting agar alarm berbunyi)
  document.body.addEventListener('click', initAudioContext, { once: true });
}

initializeApp();

function parseMarkdown(text) {
  if (!text) return "";
  
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
// LOGIKA CHATBOT TERINTEGRASI (BARU)
// ----------------------------------------------------------

function initializeChatbot() {
  const chatbot = new Chatbot();
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatOutput = document.getElementById("chatOutput");
  const chatbotModal = document.getElementById("chatbotModal");
  const resetChatBtn = document.getElementById("resetChatBtn");

  // --- 1. QUICK REPLIES (Fitur Baru) ---
  function renderQuickReplies() {
      // Cek apakah container chips sudah ada
      let chipsContainer = document.getElementById("chatChips");
      
      // Jika belum ada, buat elemennya secara manual
      if (!chipsContainer && chatbotModal) {
         chipsContainer = document.createElement("div");
         chipsContainer.id = "chatChips";
         chipsContainer.className = "d-flex gap-2 overflow-auto px-3 py-2 border-top bg-light";
         chipsContainer.style.whiteSpace = "nowrap";
         
         // Sisipkan di atas input form (footer modal)
         const modalFooter = chatbotModal.querySelector(".modal-footer");
         if(modalFooter) {
            modalFooter.parentElement.insertBefore(chipsContainer, modalFooter);
         }
      }

      if(chipsContainer) {
          chipsContainer.innerHTML = ""; // Reset isi
          const questions = [
            "Jadwal kapal berikutnya?",
            "Tarif motor?",
            "Nomor WA Nahkoda?",
            "Rute Tanah Merah"
          ];
          
          questions.forEach(q => {
             const btn = document.createElement("button");
             btn.className = "btn btn-outline-primary btn-sm rounded-pill";
             btn.textContent = q;
             btn.onclick = () => {
                 if(chatInput) {
                    chatInput.value = q;
                    // Trigger submit manual
                    chatForm.dispatchEvent(new Event('submit'));
                 }
             };
             chipsContainer.appendChild(btn);
          });
      }
  }

  // --- 2. EVENT LISTENERS ---

  if (chatbotModal) {
    chatbotModal.addEventListener("show.bs.modal", () => {
      if (chatOutput && chatOutput.childElementCount === 0) {
         chatOutput.innerHTML = "";
      }
      renderQuickReplies(); // Render tombol cepat saat modal dibuka
    });

    chatbotModal.addEventListener("shown.bs.modal", () => {
       loadChatHistory();
       scrollToBottom();
    });
  }

  if (resetChatBtn && chatOutput) {
    resetChatBtn.addEventListener("click", () => {
      localStorage.removeItem("chatSession");
      chatOutput.innerHTML = "";
      const greeting = "Halo! Riwayat percakapan telah dihapus. Ada yang bisa saya bantu?";
      appendMessageWithTypingEffect("bot", greeting);
    });
  }

  if (chatForm && chatInput && chatOutput) {
    chatForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const userMessage = chatInput.value.trim();
      if (!userMessage) return;

      // A. Tampilkan pesan user ke layar
      const formattedUserMsg = parseMarkdown(userMessage);
      appendMessageToChatOutput("user", formattedUserMsg);
      addMessageToSession("user", userMessage); // Simpan
      
      chatInput.value = "";
      scrollToBottom();

      // B. Tampilkan Loader (Sedang mengetik...)
      const botLoaderElem = document.createElement("div");
      botLoaderElem.classList.add("chat-message", "bot-message");
      botLoaderElem.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
            <span class="fst-italic text-muted small">Asisten sedang mengetik...</span>
        </div>
      `;
      chatOutput.appendChild(botLoaderElem);
      scrollToBottom();

      try {
        // C. Ambil History untuk dikirim ke AI
        const history = loadChatSession(); 

        // D. Panggil API Chatbot dengan History
        const aiResponseRaw = await chatbot.getResponse(userMessage, history);
        
        botLoaderElem.remove();

        // E. Tampilkan jawaban AI dengan efek ngetik
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
  
  // --- 3. HELPER FUNCTIONS ---

  function scrollToBottom() {
    if(chatOutput) chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  function appendMessageToChatOutput(type, htmlText) {
    if(!chatOutput) return;
    const messageElem = document.createElement("div");
    messageElem.classList.add("chat-message", type === "user" ? "user-message" : "bot-message");
    messageElem.innerHTML = htmlText;
    chatOutput.appendChild(messageElem);
    scrollToBottom();
  }

  function appendMessageWithTypingEffect(type, rawText, callback) {
    if(!chatOutput) return;
    const messageElem = document.createElement("div");
    messageElem.classList.add("chat-message", type === "user" ? "user-message" : "bot-message");
    chatOutput.appendChild(messageElem);

    // Typing effect
    typeMessage(messageElem, rawText, 10, () => {
      messageElem.innerHTML = parseMarkdown(rawText); // Render Markdown setelah selesai ngetik
      scrollToBottom();
      if (callback) callback();
    });
  }

  function typeMessage(element, text, delay = 20, callback) {
    let i = 0;
    element.textContent = "";
    
    // Clear interval lama jika ada (cegah glitch)
    if(element.dataset.typingInterval) clearInterval(element.dataset.typingInterval);

    const interval = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      scrollToBottom();
      if (i >= text.length) {
        clearInterval(interval);
        delete element.dataset.typingInterval;
        if (callback) callback();
      }
    }, delay);
    
    element.dataset.typingInterval = interval;
  }

  function loadChatHistory() {
    if(!chatOutput) return;
    chatOutput.innerHTML = ""; // Bersihkan tampilan
    const history = loadChatSession();
    
    if (history.length === 0) {
        // Pesan default jika kosong
        const greeting = "Halo! Saya Asisten Virtual Ponton. Silakan pilih tombol di bawah atau ketik pertanyaan Anda.";
        appendMessageToChatOutput("bot", parseMarkdown(greeting));
    } else {
        // Load history lama
        history.forEach(message => {
            appendMessageToChatOutput(message.type, parseMarkdown(message.text));
        });
    }
  }

  // Mengambil sesi dan mengembalikan array messages murni
  function loadChatSession() {
    const sessionData = localStorage.getItem("chatSession");
    if (sessionData) {
      try {
          const session = JSON.parse(sessionData);
          const now = Date.now();
          // Reset jika lebih dari 24 jam
          if (now - session.timestamp > 86400000) { 
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
        session.timestamp = now; // Update timestamp
      } catch(e) {
        session = { timestamp: now, messages: [] };
      }
    }
    
    session.messages.push({ type, text });
    
    // Batasi penyimpanan lokal (misal 50 pesan terakhir saja agar tidak berat)
    if(session.messages.length > 50) {
        session.messages = session.messages.slice(-50);
    }
    
    localStorage.setItem("chatSession", JSON.stringify(session));
  }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
         // SW Registered
      })
      .catch((error) => {
        console.warn('SW Fail:', error);
      });
  });
}