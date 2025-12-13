import { color } from "../static/color.static.ts";
import { IES } from "../utils/ies.ts";

const size = 400

/**
 * Luminous Intensity Distribution Curve
 */
export default async (ies: IES, planes = [0]): Promise<string> => {

    const convertCd = (cd: number): number => cd * (1000 / (ies.properties.lamps * ies.properties.lumens_per_lamp))
    
    const parsePlane = (plane: number = 0) => {
        const slice = ies.matrix[plane]
        const max = Math.max(...slice)
        const curve = ies.properties.vertical_angles.map((angle, i) => {
            const rad = (angle * Math.PI) / 180
            const r = slice[i]
            return { x: r * Math.sin(rad), y: r * Math.cos(rad) }
        });
        const array = [...curve, ...curve.slice(1, -1).reverse().map(p => ({ x: -p.x, y: p.y }))]
        const xs = array.map(p => p.x), ys = array.map(p => p.y)
        const minx = Math.min(...xs), maxx = Math.max(...xs)
        const miny = Math.min(...ys), maxy = Math.max(...ys)
        const scale = 0.8 * (size - 2 * 10) / Math.max(maxx - minx, maxy - miny)
        const peak = max * scale
        const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2, ox = size / 2 - cx * scale, oy = size / 2 - cy * scale
        return { array, scale, peak, cx, cy, ox, oy, max }
    }

    const { scale, peak, ox, oy, max } = parsePlane(planes[0])

    const steps = ((max: number, target = 10) => {
        const raw = max / target
        const pow = Math.pow(10, Math.floor(Math.log10(raw)))
        const n = raw / pow
        const step =
            n < 1.5 ? 1 :
            n < 3 ? 2 :
            n < 7 ? 5 : 10
        return step * pow
    })(max)
    
    const graphs: string[] = []
    const lines: string[] = []
    const scales: string[] = []
    const legends: string[] = []

    Array.from({ length: planes.length }, (_, i) => planes[i]).reverse().flatMap((plane, i)=> {
        const { scale, ox, oy, array } = parsePlane(plane)
        graphs.push( `<path d="${array.map((p, i) => `${i === 0 ? "M" : "L"} ${(p.x * scale + ox).toFixed(2)} ${(p.y * scale + oy).toFixed(2)}`).join(" ") + " Z"}" stroke="${color.accent[i % color.accent.length]}" fill="${color.accent[i % color.accent.length]}${i > 0 ? '00' : '33'}"/>`)
        legends.push(`<tspan x="6" dy="10px" style="fill: ${color.accent[i % color.accent.length]} !important">— C${ies.properties.horizontal_angles[plane]} / C${ies.properties.horizontal_angles[plane]+ 180}</tspan>`)
    })

    Array.from({ length: Math.floor(180 / 15) + 1 }, (_, i) => i * 15).flatMap(angle => (angle === 0 ? [0] : [-1, 1]).map((dir) => {
        const rad = ((90 + dir * angle) * Math.PI) / 180, cos = Math.cos(rad), sin = Math.sin(rad), t = Math.min(
            Math.abs(cos === 0 ? Infinity : (cos > 0 ? (size - ox) / cos : -ox / cos)),
            Math.abs(sin === 0 ? Infinity : (sin > 0 ? (size - oy) / sin : -oy / sin))
        )
        const lx = Math.min(Math.max(ox + cos * t, 0), size), ly = Math.min(Math.max(oy + sin * t, 0), size)
        const crx = ox + cos * t, cry = (oy + sin * t) - (angle <= 29 ? 6 : 0)
        lines.push(`<line x1="${ox}" y1="${oy}" x2="${lx}" y2="${ly}" stroke="${color.stroke}80"/>`)
        if (angle <= 90 && angle !== 30) scales.push(`<text x="${crx}" y="${cry}" text-anchor="${dir === 0 ? "middle" : dir > 0 ? "start" : "end"}" dx="${dir > 0 ? 4 : dir < 0 ? -4 : 0}">${angle}°</text>`)
    }))

    Array.from({ length: Math.floor(max / steps) }, (_, i) => {
        const cd = (i + 1) * steps
        const r = cd * scale
        const tx = ox, ty = oy + r + 4
        lines.push(`<circle cx="${ox}" cy="${oy}" r="${r.toFixed(2)}" fill="${i === 0 ? color.background : 'none'}" stroke="${color.stroke}80"/>`)
        if (ty < size) scales.push(`<text x="${tx}" y="${ty}" text-anchor="middle">${Math.floor(convertCd(cd))}</text>`)
    })

    scales.push(`<text x="${size - 6}" y="${size - 6}" text-anchor="end">cd/klm</text>`)
    lines.push(`<circle cx="${ox}" cy="${oy}" r="${peak.toFixed(2)}" fill="none" stroke="${color.accent[0]}80" stroke-dasharray="4 2"/>`)
    scales.push(`<text x="${ox}" y="${oy + peak + 12}" text-anchor="middle" style="fill: ${color.accent[0]} !important; font-weight: 500;">${Math.floor(convertCd(max))}</text>`)
    legends.push(`<tspan x="6" dy="10px" style="fill: ${color.accent[0]} !important">-- Peak</tspan>`)

    return /*svg*/`
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <style>
                @font-face {
                    font-family: 'IBM Plex Sans';
                    font-style: normal;
                    font-weight: size;
                    src: url(data:font/woff2;base64,${btoa(String.fromCharCode(...await Deno.readFile('src/static/font.static.woff2')))}) format('woff2');
                }
                text {
                    font-family: 'IBM Plex Sans', sans-serif;
                    font-size: 8px;
                    fill: ${color.text}80;
                    filter: url(#solid);
                }
            </style>
            <defs>
                <clipPath id="clip">
                    <rect x="0" y="0" width="${size}" height="${size}"/>
                </clipPath>
                <filter x="0" y="0" width="1" height="1" id="solid">
                    <feFlood flood-color="${color.background}" result="bg" />
                    <feMerge>
                        <feMergeNode in="bg"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <rect x="0" y="0" width="${size}" height="${size}" fill="${color.background}" stroke="${color.stroke}"/>
            <g clip-path="url(#clip)">
                ${lines.filter(Boolean).join()}
                ${scales.filter(Boolean).join()}
                ${graphs.filter(Boolean).join()}
                <text x="6" y="${size - legends.length * 10 - 6}">
                    ${legends.filter(Boolean).join()}
                </text>
            </g>
        </svg>
    `

}
