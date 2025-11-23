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
    // FIX: Fallback jika petugasKey lama tidak ada di mapping baru
    const petugasInfo = petugasMapping[req.petugasKey] || { name: "Petugas", phone: "" };
    
    const listItem = document.createElement("li");
    listItem.className = "list-group-item";

    listItem.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h6 class="mb-1">${req.identifier || "Tanpa Nama"}</h6>
          <p class="mb-0"><small>Petugas: ${petugasInfo.name}</small></p>
          <p class="mb-0"><small>Rute: ${req.route}</small></p>
          <p class="mb-0"><small>Alasan: ${req.reason}</small></p>
        </div>
        <div class="d-flex align-items-center">
          <span class="badge bg-primary rounded-pill">${req.submittedAt}</span>
          <button class="btn btn-sm btn-danger ms-2 delete-btn" title="Hapus">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;

    const deleteBtn = listItem.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => {
      deleteRequest(index);
    });

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
  const originalHtml = submitBtn.innerHTML;

  submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Mengirim...`;
  submitBtn.disabled = true;

  const formData = new FormData(event.target);
  const petugasKey = formData.get("petugas");
  
  const requestData = {
    identifier: formData.get("identifier"),
    petugasKey: petugasKey,
    route: formData.get("route"),
    reason: formData.get("reason"),
    submittedAt: new Date().toLocaleString()
  };

  let requests = JSON.parse(localStorage.getItem("waitRequests")) || [];
  requests.push(requestData);
  localStorage.setItem("waitRequests", JSON.stringify(requests));

  renderSavedRequests();

  const pesan =
    `*MINTA TUNGGU PONTON*\n` +
    `Nama/Plat: ${requestData.identifier}\n` +
    `Rute: ${requestData.route}\n` +
    `Alasan: ${requestData.reason}`;

  const encodedMessage = encodeURIComponent(pesan);
  const selectedPetugas = petugasMapping[requestData.petugasKey];
  
  // FIX: Validasi jika petugas dipilih
  if (selectedPetugas) {
      const waUrl = `https://wa.me/${selectedPetugas.phone}?text=${encodedMessage}`;
      
      setTimeout(() => {
        submitBtn.innerHTML = originalHtml;
        submitBtn.disabled = false;

        // Tutup Modal dengan aman
        const modalEl = document.getElementById("waitRequestModal");
        // Cek global bootstrap variabel
        if (typeof bootstrap !== 'undefined') {
             const modalInstance = bootstrap.Modal.getInstance(modalEl);
             if (modalInstance) modalInstance.hide();
             
             // Toast
             const toastEl = document.getElementById('liveToast');
             if(toastEl) {
                 const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 1500 });
                 toast.show();
             }
        }
        
        // Reset Form
        event.target.reset();

        window.open(waUrl, "_blank");
      }, 1000);
  } else {
      alert("Error: Data petugas tidak valid.");
      submitBtn.innerHTML = originalHtml;
      submitBtn.disabled = false;
  }
}