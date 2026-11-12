import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#0a0c10', fit: 'contain' } },
    apple: { ...minimal2023Preset.apple, padding: 0.05, resizeOptions: { background: '#0a0c10', fit: 'contain' } },
  },
  images: ['public/icon.svg'],
})