import { defineStore } from 'pinia'
import { darkTheme, lightTheme } from 'naive-ui'
import type { GlobalTheme } from 'naive-ui'

export interface AppState {
  theme: 'light' | 'dark'
  themeOverrides: {
    common?: {
      primaryColor?: string
      primaryColorHover?: string
      primaryColorPressed?: string
    }
  }
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    theme: 'light',
    themeOverrides: {
      common: {
        primaryColor: '#18a058',
        primaryColorHover: '#36ad6a',
        primaryColorPressed: '#0c7a43'
      }
    }
  }),

  getters: {
    // 获取当前主题对象
    currentTheme(): GlobalTheme {
      return this.theme === 'dark' ? darkTheme : lightTheme
    },

    // 获取主题配置
    currentThemeOverrides(): AppState['themeOverrides'] {
      return this.themeOverrides
    },

    // 是否为深色主题
    isDarkTheme(): boolean {
      return this.theme === 'dark'
    }
  },

  actions: {
    // 切换主题
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      this.updateSystemTheme()
    },

    // 设置主题
    setTheme(theme: 'light' | 'dark') {
      this.theme = theme
      this.updateSystemTheme()
    },

    // 更新系统主题
    updateSystemTheme() {
      // 更新 body class
      if (this.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },

    // 初始化主题
    initTheme() {
      this.updateSystemTheme()
    }
  }
}) 