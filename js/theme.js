// js/theme.js
export const appState = {
    theme: localStorage.getItem("theme") || "light"
  };
  
  export function toggleTheme() {
    appState.theme = appState.theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", appState.theme);
    updateTheme();
  }
  
  export function updateTheme() {
    document.documentElement.setAttribute("data-theme", appState.theme);
    document.querySelectorAll('button[onclick="toggleTheme()"] i').forEach(icon => {
      icon.className = appState.theme === "dark" ? "bi bi-sun-fill fs-4" : "bi bi-moon-fill fs-4";
    });
  }
  