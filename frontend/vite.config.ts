import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
// import { nitro } from 'nitro/vite';
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  // resolve: { tsconfigPaths: true },
  //   server: {
  //   allowedHosts: [
  //     '223a-2400-1a00-5b20-bdbd-8057-5b5-830-ad55.ngrok-free.app',
  //   ],
  // },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    // nitro(),

    viteReact(),
  ],
})

export default config
