<script setup lang="ts">
import { RouterView } from 'vue-router'
import { darkTheme, lightTheme } from 'naive-ui'
import { NConfigProvider, GlobalThemeOverrides } from 'naive-ui'

const themeOverrides: GlobalThemeOverrides = {
  // common: {
  //   primaryColor: '#FF0000'
  // },
  // Button: {
  //   textColor: '#FF0000'
  // }
}

const theme = ref(lightTheme)


</script>


<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <RouterView />
  </n-config-provider>
</template>

<style scoped></style>