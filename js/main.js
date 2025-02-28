// js/main.js
import { updateTheme, toggleTheme } from "./theme.js";
import { renderSchedules, startCountdown } from "./schedule.js";
import { renderSavedRequests, handleWaitRequest } from "./waitRequest.js";
import { renderTariffInfo } from "./tarif.js";
import { renderRouteInfo } from "./rute.js";

// Agar fungsi toggleTheme dapat diakses secara global dari HTML
window.toggleTheme = toggleTheme;

// Pasang event listener pada form permintaan
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
}

initializeApp();
