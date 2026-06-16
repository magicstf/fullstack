import { defineStore } from 'pinia'
import { THEME_KEY } from '../constants/chat.js'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'light'
  }),

  actions: {
    applyTheme(value) {
      this.theme = value
      document.documentElement.setAttribute('data-theme', value)
      localStorage.setItem(THEME_KEY, value)
    },

    loadTheme() {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'dark' || saved === 'light') {
        this.applyTheme(saved)
        return
      }
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      this.applyTheme(prefersDark ? 'dark' : 'light')
    },

    toggleTheme() {
      this.applyTheme(this.theme === 'light' ? 'dark' : 'light')
    }
  }
})
