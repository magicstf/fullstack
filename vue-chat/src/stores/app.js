import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    isOnline: navigator.onLine
  }),

  actions: {
    setOnline(value) {
      this.isOnline = value
    }
  }
})
