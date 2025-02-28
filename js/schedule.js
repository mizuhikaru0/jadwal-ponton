// js/schedule.js

// Konstanta untuk konfigurasi
const ALARM_FREQUENCY = 1200; // Frekuensi alarm (Hz)
const ALARM_DURATION = 5;     // Durasi alarm (detik)
const COUNTDOWN_INTERVAL = 1000; // Interval update countdown (ms)

// Data jadwal
export const scheduleData = {
  "muara-tanahmerah": ["08:00", "10:00", "13:00", "15:00", "17:00"],
  "tanahmerah-muara": ["09:00", "11:00", "14:00", "16:00", "17:30"]
};

// Fungsi untuk menyesuaikan waktu jika hari Jumat
export const adjustTimeIfFriday = (timeStr) => {
  const now = new Date();
  // Jika hari Jumat dan waktu 13:00, ubah menjadi 13:30
  return (now.getDay() === 5 && timeStr === "13:00") ? "13:30" : timeStr;
};

// Render semua jadwal
export const renderSchedules = () => {
  renderSchedule("muara-tanahmerah", "muaraSchedule", scheduleData["muara-tanahmerah"]);
  renderSchedule("tanahmerah-muara", "tanahMerahSchedule", scheduleData["tanahmerah-muara"]);
};

// Render jadwal untuk satu rute
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

// Mendapatkan keberangkatan selanjutnya
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

// Flags untuk notifikasi visual
let fiveMinuteAlertShown = false;
let departureAlertShown = false;

// Update tampilan countdown dan trigger notifikasi visual
export const updateCountdown = () => {
  const { nextTime, nextRoute } = getNextDeparture();
  if (!nextTime) return;

  const departureElement = document.getElementById("nextDeparture");
  const countdownElement = document.getElementById("countdown");

  if (departureElement) {
    departureElement.textContent =
      `Keberangkatan berikutnya untuk rute ${nextRoute}: ${nextTime.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', hour12: false })} WIB`;
  }

  const now = new Date();
  const diff = nextTime - now;

  // Reset flag jika jadwal masih jauh (lebih dari 5 menit)
  if (diff > 300000) {
    fiveMinuteAlertShown = false;
    departureAlertShown = false;
  }

  // Peringatan 5 menit sebelum keberangkatan dengan warna kuning
  if (diff <= 300000 && diff > 0 && !fiveMinuteAlertShown) {
    fiveMinuteAlertShown = true;
    showAlert('warning', 'Peringatan: 5 menit menuju keberangkatan!', 10);
  }

  // Peringatan waktu keberangkatan dengan warna merah
  if (diff <= 0 && !departureAlertShown) {
    departureAlertShown = true;
    showDepartureAlert();
    // Tunggu sampai alarm selesai sebelum memperbarui countdown
    setTimeout(updateCountdown, ALARM_DURATION * 1000);
    return;
  }

  if (countdownElement) {
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    countdownElement.textContent =
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Ubah warna teks countdown: merah jika kurang dari atau sama dengan 5 menit, hijau jika lebih
    countdownElement.style.color = diff <= 300000 ? "#dc3545" : "#28a745";
  }
};

// Fungsi trigger alarm (hanya memainkan suara)
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

// Fungsi menampilkan notifikasi keberangkatan (tampilan penuh dengan warna merah) dan memicu alarm
export const showDepartureAlert = () => {
  showAlert('departure', 'Peringatan: Waktu keberangkatan sekarang!', 10);
  triggerAlarm();
};

// Fungsi untuk menampilkan notifikasi full layar dengan countdown
export const showAlert = (type, message, durationSeconds) => {
  let overlay = document.getElementById('fullScreenAlert');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'fullScreenAlert';
    overlay.className = 'full-screen-alert';
    document.body.appendChild(overlay);
  }
  // Pilih warna latar sesuai tipe notifikasi: kuning untuk "warning", merah untuk "departure"
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

// Memulai interval countdown
export const startCountdown = () => {
  updateCountdown();
  setInterval(updateCountdown, COUNTDOWN_INTERVAL);
};