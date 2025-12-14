import { useColor } from 'jsr:@xlsft/nuxt@1.1.34'

const color = useColor()

export const temp = (temperature?: number) => { const k = !temperature ? 4000 : temperature, factor = 0; return color.convert.rgb.hex({
    r: Math.round(Math.max(0, Math.min(255,((k + factor) / 100) <= 66 ? 255 : 329.698727446 * Math.pow(((k + factor) / 100) - 60, -0.1332047592)))),
    g: Math.round(Math.max(0, Math.min(255,((k + factor) / 100) <= 66 ? 99.4708025861 * Math.log(((k + factor) / 100)) - 161.1195681661 : 288.1221695283 * Math.pow(((k + factor) / 100) - 60, -0.0755148492)))),
    b: Math.round(Math.max(0, Math.min(255,((k + factor) / 100) <= 66 ? ((k + factor) / 100) <= 19 ? 0 : 138.5177312231 * Math.log(((k + factor) / 100) - 10) - 305.0447927307 : 255))),
})}