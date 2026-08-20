import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // .env один на монорепозиторий: три приложения ходят в одну базу.
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  server: {
    // Порт задаётся окружением (dev-обвязка выдаёт свободный), иначе дефолт Vite.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
    // Слушать на всех интерфейсах — чтобы телефон в той же Wi-Fi сети видел сервер.
    host: true,
  },
})
