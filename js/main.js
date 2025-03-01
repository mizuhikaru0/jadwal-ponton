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

function initializeChatbot() {
  const chatbot = new Chatbot();
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatOutput = document.getElementById("chatOutput");
  const chatbotModal = document.getElementById("chatbotModal");

  if (chatbotModal && chatOutput) {
    chatbotModal.addEventListener("show.bs.modal", () => {
      chatOutput.innerHTML = "";
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

    chatbotModal.addEventListener("shown.bs.modal", () => {
      setTimeout(() => {
        const loaderElem = document.getElementById("chatLoader");
        if (loaderElem) removeLoaderWithTransition(loaderElem);
        loadChatHistory();
      }, 1000);
    });
  }

  const resetChatBtn = document.getElementById("resetChatBtn");
  if (resetChatBtn && chatOutput) {
    resetChatBtn.addEventListener("click", () => {
      localStorage.removeItem("chatSession");
      chatOutput.innerHTML = "";
    });
  }

  if (chatForm && chatInput && chatOutput) {
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const userMessage = chatInput.value.trim();
      if (!userMessage) return;
      appendMessageToChatOutput("user", userMessage);
      addMessageToSession("user", userMessage);
      chatInput.value = "";
      chatOutput.scrollTop = chatOutput.scrollHeight;
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
      setTimeout(() => {
        botLoaderElem.remove();
        const botResponse = chatbot.getResponse(userMessage);
        appendMessageWithTypingEffect("bot", botResponse, () => {
          if (botResponse.includes("Baik, sesi ditutup")) {
            setTimeout(() => {
              let modalInstance = bootstrap.Modal.getInstance(chatbotModal);
              if (!modalInstance) {
                modalInstance = new bootstrap.Modal(chatbotModal);
              }
              modalInstance.hide();
            }, 500);
          }
        });
        addMessageToSession("bot", botResponse);
      }, 1500);
    });
  } else {
    console.log("Elemen Chatbot tidak ditemukan.");
  }

  function appendMessageToChatOutput(type, text) {
    const messageElem = document.createElement("div");
    messageElem.classList.add("chat-message", type === "user" ? "user-message" : "bot-message");
    messageElem.innerHTML = text.replace(/\n/g, "<br>");
    chatOutput.appendChild(messageElem);
  }

  function appendMessageWithTypingEffect(type, formattedText, callback) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedText;
    let plainText = tempDiv.innerText;
    plainText = plainText.replace(/\.([^ \n])/g, ". $1");
    const messageElem = document.createElement("div");
    messageElem.classList.add("chat-message", type === "user" ? "user-message" : "bot-message");
    messageElem.style.whiteSpace = "pre-wrap";
    chatOutput.appendChild(messageElem);
    typeMessage(messageElem, plainText, 50, () => {
      messageElem.innerHTML = formattedText;
      messageElem.style.whiteSpace = "pre-wrap";
      chatOutput.scrollTop = chatOutput.scrollHeight;
      if (callback && typeof callback === "function") {
        callback();
      }
    });
  }

  function typeMessage(element, text, delay = 50, callback) {
    let i = 0;
    element.textContent = "";
    const interval = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, delay);
  }

  function loadChatHistory() {
    chatOutput.innerHTML = "";
    const session = loadChatSession();
    session.forEach(message => {
      appendMessageToChatOutput(message.type, message.text);
    });
  }

  function loadChatSession() {
    const sessionData = localStorage.getItem("chatSession");
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const now = Date.now();
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

  function removeLoaderWithTransition(loaderElem) {
    loaderElem.style.opacity = 0;
    setTimeout(() => {
      loaderElem.remove();
    }, 500);
  }
}
