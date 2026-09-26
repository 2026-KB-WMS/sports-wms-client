import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), reactRouter()],
  server: {
    // 개발 중 백엔드(wms-server) 호출을 같은 origin으로 넘겨 CORS 설정 없이 연동한다.
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
})
