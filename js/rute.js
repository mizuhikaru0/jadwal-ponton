// js/rute.js

export const routeInfo = {
    title: "Informasi Rute Penyebrangan Ponton",
    description: "Dua rute utama untuk memudahkan mobilitas Anda antara Dermaga Muara dan Dermaga Tanah Merah.",
    routes: [
      {
        name: "Rute Muara ke Tanah Merah",
        details: [
          "Digunakan oleh penumpang untuk berangkat, pulang, atau keluar dari Desa Bumi Pratama Mandira.",
          "Tujuan: Dermaga Tanah Merah",
          "Waktu Keberangkatan: Pagi dan Sore",
          "Fungsi: Memudahkan warga desa menuju daerah luar atau berkunjung ke wilayah sekitar."
        ]
      },
      {
        name: "Rute Tanah Merah ke Muara",
        details: [
          "Digunakan oleh penumpang yang menuju Desa Bumi Pratama Mandiri.",
          "Tujuan: Dermaga Muara",
          "Waktu Keberangkatan: Pagi dan Sore",
          "Fungsi: Memudahkan tamu atau warga yang ingin menuju desa."
        ]
      }
    ]
  };
  
  export function renderRouteInfo() {
    const container = document.getElementById("ruteModalBody");
    if (!container) return;
    let html = `<h5 class="mb-3">${routeInfo.title}</h5>
                <p class="mb-4">${routeInfo.description}</p>`;
    routeInfo.routes.forEach(route => {
      html += `<div class="mb-4">
        <h6 class="text-primary">${route.name}</h6>
        <ul class="list-group list-group-flush">`;
      route.details.forEach(detail => {
        html += `<li class="list-group-item border-0 ps-0">${detail}</li>`;
      });
      html += `</ul>
      </div>`;
    });
    container.innerHTML = html;
  }
  