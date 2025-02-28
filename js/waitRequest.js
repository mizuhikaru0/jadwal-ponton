// js/waitRequest.js

const petugasMapping = {
    petugas1: { name: "Riko", phone: "6282252869605" },
    petugas2: { name: "Ihsan Maulana", phone: "6282211061254" }
  };
  
  export function renderSavedRequests() {
    const savedRequests = JSON.parse(localStorage.getItem("waitRequests")) || [];
    const listElement = document.getElementById("savedRequestsList");
    if (!listElement) return;
    listElement.innerHTML = "";
    savedRequests.forEach((req, index) => {
      const listItem = document.createElement("li");
      listItem.className = "list-group-item";
      listItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h6 class="mb-1">${req.identifier}</h6>
            <p class="mb-0"><small>Petugas: ${petugasMapping[req.petugasKey].name}</small></p>
            <p class="mb-0"><small>Rute: ${req.route}</small></p>
            <p class="mb-0"><small>Alasan: ${req.reason}</small></p>
          </div>
          <div class="d-flex align-items-center">
            <span class="badge bg-primary rounded-pill">${req.submittedAt}</span>
            <button class="btn btn-sm btn-danger ms-2 delete-btn" title="Hapus Permintaan">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      `;
      // Tambahkan event listener untuk tombol hapus
      const deleteBtn = listItem.querySelector(".delete-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          deleteRequest(index);
        });
      }
      listElement.appendChild(listItem);
    });
  }
  
  function deleteRequest(index) {
    let requests = JSON.parse(localStorage.getItem("waitRequests")) || [];
    requests.splice(index, 1);
    localStorage.setItem("waitRequests", JSON.stringify(requests));
    renderSavedRequests();
  }
  
  export function handleWaitRequest(event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Tampilkan spinner dan nonaktifkan tombol (indikator loading)
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Mengirim...`;
    submitBtn.disabled = true;
    
    const formData = new FormData(event.target);
    const requestData = {
      identifier: formData.get("identifier"),
      petugasKey: formData.get("petugas"),
      route: formData.get("route"),
      reason: formData.get("reason"),
      submittedAt: new Date().toLocaleString()
    };
  
    // Simpan data permintaan ke localStorage
    let requests = JSON.parse(localStorage.getItem("waitRequests")) || [];
    requests.push(requestData);
    localStorage.setItem("waitRequests", JSON.stringify(requests));
  
    renderSavedRequests();
  
    // Siapkan pesan untuk WhatsApp
    const pesan =
      `${requestData.reason}\n` +
      `${requestData.identifier}\n` +
      `dari ${requestData.route}`;
    const encodedMessage = encodeURIComponent(pesan);
    const selectedPetugas = petugasMapping[requestData.petugasKey];
    const waUrl = `https://api.whatsapp.com/send?phone=${selectedPetugas.phone}&text=${encodedMessage}`;
  
    // Simulasi delay 1 detik untuk menampilkan spinner
    setTimeout(() => {
      // Kembalikan tampilan tombol ke semula
      submitBtn.innerHTML = `<i class="bi bi-send-check"></i> Kirim Permintaan`;
      submitBtn.disabled = false;
      
      // Tampilkan notifikasi visual dengan toast (bukan alert)
      var toastEl = document.getElementById('liveToast');
var toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 1000 });
toast.show();

      
      // Tutup modal
      const modalEl = document.getElementById("waitRequestModal");
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      modalInstance.hide();
      
      // Buka WhatsApp
      window.open(waUrl, "_blank");
    }, 3000); // delay 1 detik
  }
  
  