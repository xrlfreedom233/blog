import Alpine from "alpinejs";

window.Alpine = Alpine;

document.addEventListener("alpine:init", () => {
  Alpine.store("darkMode", {
    theme: localStorage.getItem("theme") || "light",

    init() {
      this.applyTheme(this.theme);
    },

    toggle() {
      // 循环切换基础的 dark/light 或者是保持现状
      this.theme = this.theme === "dark" ? "light" : "dark";
      this.applyTheme(this.theme);
    },

    applyTheme(theme) {
      this.theme = theme;
      localStorage.setItem("theme", theme);
      document.documentElement.setAttribute('data-theme', theme);
      
      if (theme === 'dark') {
        document.documentElement.classList.add("dark");
      } else if (theme === 'light') {
        document.documentElement.classList.remove("dark");
      } else {
        // 对于春夏秋冬主题，根据背景色决定是否需要 dark 类（通常这些主题是基于亮色的）
        document.documentElement.classList.remove("dark");
      }
    }
  });
});

// 监听来自 ThemeSwitch 的自定义事件
window.addEventListener('theme-changed', (event: any) => {
  if (window.Alpine) {
    (window.Alpine.store('darkMode') as any).applyTheme(event.detail.theme);
  }
});

Alpine.start();
