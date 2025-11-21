// js/tarif.js

export const tariffData = [
    { description: "Orangnya saja", price: "5000" },
    { description: "Motor sendiri tanpa boncengan", price: "40000" },
    { description: "Motor dengan boncengan", price: "45000" },
    { description: "Tuslah kenaikan selama hari raya Idul Fitri dan Idul Adha", price: "Tidak ada" },
  ];
  
  export function renderTariffInfo() {
    const container = document.getElementById("tarifModalBody");
    if (!container) return;
    container.innerHTML = tariffData.map(item => {
      return item.price
        ? `<li class="list-group-item d-flex justify-content-between align-items-center">
             ${item.description}
             <span class="badge bg-primary rounded-pill">${item.price}</span>
           </li>`
        : `<li class="list-group-item">${item.description}</li>`;
    }).join("");
  }
  