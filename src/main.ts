import { createApp } from 'vue'
import App from './App.vue'
import router from './route'
import { pinia } from './stores'

import './style.css'
import '@unocss/reset/normalize.css'
import 'uno.css'


import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

const app = createApp(App)
app.use(router)
app.use(pinia)

app.mount('#app').$nextTick(() => {
  postMessage({ payload: 'removeLoading' }, '*')
})
