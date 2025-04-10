import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import AlertPlugin from './plugins/alert'

const app = createApp(App)
app.use(router)
app.use(AlertPlugin)
app.mount('#app')
