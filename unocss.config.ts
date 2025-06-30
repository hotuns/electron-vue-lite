import {
    defineConfig,
    presetAttributify,
    presetIcons,
    presetWebFonts,
    presetWind4,
    transformerDirectives
} from 'unocss'


export default defineConfig({
    shortcuts: [
    ],
    presets: [
        presetWind4(),
        presetAttributify(),
        presetIcons({
            scale: 1.2,
            warn: true,
        }),
    ],
    transformers: [
        transformerDirectives(),
    ],
})