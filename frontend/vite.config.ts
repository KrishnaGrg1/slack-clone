import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  // resolve: { tsconfigPaths: true },
  //   server: {
  //   allowedHosts: [
  //     '94d0-2400-1a00-5b22-2fb2-7096-5cbe-6c34-65e0.ngrok-free.app',
  //   ],
  // },
  plugins: [devtools(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
})

export default config
