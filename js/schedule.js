
const ALARM_FREQUENCY = 1200;
const ALARM_DURATION = 5;
const COUNTDOWN_INTERVAL = 1000;


export const scheduleData = {
  "muara-tanahmerah": ["08:00", "10:00", "13:00", "15:00", "17:00"],
  "tanahmerah-muara": ["09:00", "11:00", "14:00", "16:00", "17:30"]
};

export const adjustTimeIfFriday = (timeStr) => {
  const now = new Date();
  return (now.getDay() === 5 && timeStr === "13:00") ? "13:30" : timeStr;
};

export const formatRouteName = (routeKey) => {
  if (!routeKey || typeof routeKey !== "string") return routeKey;
  return routeKey
    .split("-")
    .map(part => {
      const lower = part.toLowerCase().trim();
      if (lower === "tanahmerah") return "Tanah Merah";
      if (lower === "tanah") return "Tanah";
      if (lower === "merah") return "Merah";
      if (lower === "muara") return "Muara";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" – ");
};

export const renderSchedules = () => {
  renderSchedule("muara-tanahmerah", "muaraSchedule", scheduleData["muara-tanahmerah"]);
  renderSchedule("tanahmerah-muara", "tanahMerahSchedule", scheduleData["tanahmerah-muara"]);
};

export const renderSchedule = (route, elementId, times) => {
  const container = document.getElementById(elementId);
  if (!container) {
    console.warn(`Container dengan id "${elementId}" tidak ditemukan.`);
    return;
  }
  container.innerHTML = times
    .map(time => {
      const adjustedTime = adjustTimeIfFriday(time);
      return `
        <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
          <span>⏰ ${adjustedTime} WIB</span>
        </div>
      `;
    })
    .join("");
};

export const getNextDeparture = () => {
  const now = new Date();
  let nextTime = null;
  let nextRoute = "";
  Object.keys(scheduleData).forEach(route => {
    scheduleData[route].forEach(timeStr => {
      const adjustedTime = adjustTimeIfFriday(timeStr);
      const [h, m] = adjustedTime.split(":").map(Number);
      let candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      if (candidate < now) candidate.setDate(candidate.getDate() + 1);
      if (!nextTime || candidate < nextTime) {
        nextTime = candidate;
        nextRoute = route;
      }
    });
  });
  return { nextTime, nextRoute };
};

let fiveMinuteAlertShown = false;
let departureAlertShown = false;

export const updateCountdown = () => {
  const { nextTime, nextRoute } = getNextDeparture();
  if (!nextTime) return;

  const departureElement = document.getElementById("nextDeparture");
  const countdownElement = document.getElementById("countdown");

  if (departureElement) {
    departureElement.textContent =
      `Keberangkatan berikutnya untuk rute ${formatRouteName(nextRoute)}: ${nextTime.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', hour12: false })} WIB`;
  }

  const now = new Date();
  const diff = nextTime - now;

  if (diff > 300000) {
    fiveMinuteAlertShown = false;
    departureAlertShown = false;
  }

  if (diff <= 300000 && diff > 0 && !fiveMinuteAlertShown) {
    fiveMinuteAlertShown = true;
    showAlert('warning', 'Peringatan: 5 menit menuju keberangkatan!', 10);
  }

  if (diff <= 0 && !departureAlertShown) {
    departureAlertShown = true;
    showDepartureAlert();
    setTimeout(updateCountdown, ALARM_DURATION * 1000);
    return;
  }

  if (countdownElement) {
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    countdownElement.textContent =
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    countdownElement.style.color = diff <= 300000
      ? "var(--countdown-warning)"
      : "var(--countdown-normal)";
  }
};

export const triggerAlarm = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.0;
    const oscillator = ctx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.value = ALARM_FREQUENCY;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + ALARM_DURATION);
  } catch (e) {
    console.warn("Audio API tidak tersedia", e);
  }
};

export const showDepartureAlert = () => {
  showAlert('departure', 'Peringatan: Waktu keberangkatan sekarang!', 10);
  triggerAlarm();
};

export const showAlert = (type, message, durationSeconds) => {
  let overlay = document.getElementById('fullScreenAlert');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'fullScreenAlert';
    overlay.className = 'full-screen-alert';
    document.body.appendChild(overlay);
  }
 
  let bgColor = type === 'warning' ? '#ffc107' : '#dc3545';
  overlay.style.backgroundColor = bgColor;
  overlay.innerHTML = `
    <div style="text-align: center; color: #fff;">
      <i class="bi bi-exclamation-triangle-fill" style="font-size: 4rem;"></i>
      <h2>${message}</h2>
      <p id="alertCountdown">${durationSeconds} detik</p>
    </div>
  `;
  overlay.style.display = 'flex';
  let remaining = durationSeconds;
  const intervalId = setInterval(() => {
    remaining--;
    const countdownEl = document.getElementById('alertCountdown');
    if (countdownEl) {
      countdownEl.textContent = `${remaining} detik`;
    }
    if (remaining <= 0) {
      clearInterval(intervalId);
      overlay.style.display = 'none';
    }
  }, 1000);
};

export const startCountdown = () => {
  updateCountdown();
  setInterval(updateCountdown, COUNTDOWN_INTERVAL);
};
