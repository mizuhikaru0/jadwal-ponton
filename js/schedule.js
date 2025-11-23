// js/schedule.js

const ALARM_FREQUENCY = 1200;
const ALARM_DURATION = 5;
const COUNTDOWN_INTERVAL = 1000;

export const scheduleData = {
  "muara-tanahmerah": ["08:00", "10:00", "13:00", "15:00", "17:00"],
  "tanahmerah-muara": ["09:00", "11:00", "14:00", "16:00", "17:30"]
};

// Variabel Global Audio Context
let audioCtx = null;

// FIX: Fungsi inisialisasi AudioContext yang dipanggil saat user klik pertama kali
export const initAudioContext = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

export const adjustTimeIfFriday = (timeStr) => {
  const now = new Date();
  // Menggunakan '===' untuk perbandingan yang ketat
  return (now.getDay() === 5 && timeStr === "13:00") ? "13:30" : timeStr;
};

export const formatRouteName = (routeKey) => {
  if (!routeKey || typeof routeKey !== "string") return routeKey;
  return routeKey
    .split("-")
    .map(part => {
      const lower = part.toLowerCase().trim();
      if (lower === "tanahmerah") return "Tanah Merah";
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
  if (!container) return; // Silent fail jika elemen tidak ada di halaman ini
  
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
      
      let candidate = new Date(now);
      candidate.setHours(h, m, 0, 0);

      // Jika waktu sudah lewat hari ini, anggap besok (tapi logic ini sederhana, tidak cek hari Jumat besok)
      // Untuk kesederhanaan, kita hanya cek jadwal hari ini yang belum lewat
      if (candidate < now) {
         candidate.setDate(candidate.getDate() + 1);
      }

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

  // Reset flag jika jadwal masih jauh (> 5 menit)
  if (diff > 300000) {
    fiveMinuteAlertShown = false;
    departureAlertShown = false;
  }

  // Alert 5 Menit
  if (diff <= 300000 && diff > 0 && !fiveMinuteAlertShown) {
    fiveMinuteAlertShown = true;
    showAlert('warning', 'Peringatan: 5 menit menuju keberangkatan!', 10);
  }

  // Alert Berangkat
  if (diff <= 0 && diff > -60000 && !departureAlertShown) { // Tambah batas toleransi lewat 1 menit
    departureAlertShown = true;
    showDepartureAlert();
    return;
  }

  if (countdownElement) {
    // Menghindari angka negatif
    const safeDiff = diff < 0 ? 0 : diff;
    const hours = Math.floor(safeDiff / 3600000);
    const minutes = Math.floor((safeDiff % 3600000) / 60000);
    const seconds = Math.floor((safeDiff % 60000) / 1000);
    
    countdownElement.textContent =
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    countdownElement.style.color = (diff <= 300000 && diff > 0)
      ? "var(--bs-danger)" // Gunakan variabel bootstrap atau custom
      : "inherit";
  }
};

export const triggerAlarm = () => {
  try {
    // Gunakan context global yang sudah di-init
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.5; // Kecilkan volume agar tidak kaget
    
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.value = ALARM_FREQUENCY;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + ALARM_DURATION);
  } catch (e) {
    console.warn("Audio API error atau diblokir browser:", e);
  }
};

export const showDepartureAlert = () => {
  showAlert('departure', 'WAKTU KEBERANGKATAN!', 10);
  triggerAlarm();
};

export const showAlert = (type, message, durationSeconds) => {
  let overlay = document.getElementById('fullScreenAlert');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'fullScreenAlert';
    // Style harusnya di CSS, tapi kita inject inline untuk safety
    overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; display: flex; align-items: center; justify-content: center; flex-direction: column;";
    document.body.appendChild(overlay);
  }
 
  let bgColor = type === 'warning' ? '#ffc107' : '#dc3545';
  overlay.style.backgroundColor = bgColor;
  overlay.innerHTML = `
    <div style="text-align: center; color: #fff; padding: 20px;">
      <i class="bi bi-exclamation-triangle-fill" style="font-size: 4rem;"></i>
      <h2 class="mt-3">${message}</h2>
      <p id="alertCountdown" class="fs-4">${durationSeconds} detik</p>
      <button onclick="document.getElementById('fullScreenAlert').style.display='none'" class="btn btn-light mt-3">Tutup</button>
    </div>
  `;
  overlay.style.display = 'flex';
  
  let remaining = durationSeconds;
  // Hapus interval lama jika ada
  if(overlay.dataset.intervalId) clearInterval(overlay.dataset.intervalId);

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
  
  overlay.dataset.intervalId = intervalId;
};

export const startCountdown = () => {
  updateCountdown();
  setInterval(updateCountdown, COUNTDOWN_INTERVAL);
};