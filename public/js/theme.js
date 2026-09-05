// public/js/theme.js - Instant Zero-Flicker Theme Engine
export class ThemeManager {
  static STORAGE_KEY = 'stratum_theme';

  static init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const activeTheme = saved || (prefersDark ? 'dark' : 'light');
    this.applyTheme(activeTheme);
    return activeTheme;
  }

  static applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }
  }

  static toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    return next;
  }
}