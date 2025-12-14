import { IES } from "../utils/ies.ts";
import { alias } from "../static/alias.static.ts";
import { color } from "../static/color.static.ts";
import { size, padding } from "../static/pos.static.ts";
import { defineSvgChart } from "../utils/chart.ts";

/**
 * ## Polar Luminous Intensity Distribution Curve
 * 
 * This render function implements Type C projections only
 * 
 * Planes: Default planes is C0 an C90
 * 
 * Unit modes: 
 * - **cdklm** - Candles per Kilolumen (cd/klm)
 * - **cd** (default) - Candles (cd)
 */
export default async (ies: IES, planes = [0, 90], mode: 'cd' | 'cdklm' = 'cd'): Promise<string> => {

    const projection = (plane: number = 0) => {
        const curve = [
            ...ies.properties.vertical_angles.map((angle, i) => {
                const rad = angle * Math.PI / 180, r = ies.matrix[ies.index(plane)][i]
                return { x: -r * Math.sin(rad), y: r * Math.cos(rad) }
            }),
            ...ies.properties.vertical_angles.toReversed().map((angle, i) => {
                const rad = angle * Math.PI / 180, r = ies.matrix[ies.index((plane + 180) % 360)][ies.properties.vertical_angles.length - 1 - i]
                return { x: r * Math.sin(rad), y: r * Math.cos(rad) }
            }),
        ]
        const max = Math.max(...ies.matrix[ies.index(plane)], ...ies.matrix[ies.index((plane + 180) % 360)])
        return { curve, max, planes }
    }

    const projections = planes.map(p => projection(p))
    const points = projections.flatMap(p => p.curve)
    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    const minx = Math.min(...xs), maxx = Math.max(...xs)
    const miny = Math.min(...ys), maxy = Math.max(...ys)
    const scale = 0.8 * (size - 20) / Math.max(maxx - minx, maxy - miny)
    const cx = (minx + maxx) / 2
    const cy = (miny + maxy) / 2
    const ox = size / 2 - cx * scale
    const oy = size / 2 - cy * scale
    const max = Math.max(...projections.map(p => p.max))
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

    // Projections
    projections.forEach(({ curve }, i) => {
        const closed = ies.properties.photometric_type === 1
        graphs.push(`<path d="${curve.map((p, i) => `${i === 0 ? "M" : "L"} ${(p.x * scale + ox).toFixed(2)} ${(p.y * scale + oy).toFixed(2)}`).join(" ") + (closed ? " Z" : "")}" stroke="${color.accent[i % color.accent.length]}" fill="${color.accent[i % color.accent.length]}${i > 0 ? '10' : '33'}"/>`)
        legends.push(`<text x="${size-padding}" text-anchor="end" y="${size - padding - (i * 10)}" style="fill: ${color.accent[i % color.accent.length]} !important; font-weight: 500;">C${planes[i]} / C${planes[i] + 180} —</text>`)
    })

    // Angles
    Array.from({ length: Math.floor(180 / 15) + 1 }, (_, i) => i * 15).forEach(angle => {
        let dirs: number[] = []; if (angle === 0) dirs = [0]; else if (angle === 180) dirs = [0]; else dirs = [-1, 1]
        dirs.forEach(dir => {
            const rad = angle === 0 ? Math.PI / 2 : angle === 180 ? -Math.PI / 2 : ((90 + dir * angle) * Math.PI) / 180, cos = Math.cos(rad), sin = Math.sin(rad), tt = Math.min(
                Math.abs(cos === 0 ? Infinity : (cos > 0 ? (size - ox - padding / 4) / cos : -(ox - padding / 2) / cos)),
                Math.abs(sin === 0 ? Infinity : (sin > 0 ? (size - oy - padding) / sin : -(oy - padding - padding) / sin))
            ), tl = Math.min(
                Math.abs(cos === 0 ? Infinity : (cos > 0 ? (size - ox) / cos : -(ox) / cos)),
                Math.abs(sin === 0 ? Infinity : (sin > 0 ? (size - oy) / sin : -(oy) / sin))
            )
            const lx = Math.min(Math.max(ox + cos * tl, 0), size), ly = Math.min(Math.max(oy + sin * tl, 0), size)
            const tx = ox + cos * tt, ty = oy + sin * tt
            lines.push(`<line x1="${ox}" y1="${oy}" x2="${lx}" y2="${ly}" stroke="${color.stroke}80"/>`)
            if (Math.hypot(tx - ox, ty - oy) > max * scale && !((tx < padding * 4 && ty > size - padding * 4) || (tx > size - padding * 4 && ty > size - padding * 4))) scales.push(`<text x="${tx}" y="${ty}" text-anchor="${dir === 0 ? "middle" : dir > 0 ? "start" : "end"}" dx="${dir > 0 ? 4 : dir < 0 ? -4 : 0}">${angle}°</text>`)
        })
    })

    // Circles
    Array.from({ length: Math.floor(max / steps) }, (_, i) => {
        const value = (i + 1) * steps
        const r = value * scale
        const tx = ox + 1, ty = oy + r + 2
        
        lines.push(`<circle cx="${ox}" cy="${oy}" r="${r.toFixed(2)}" fill="${i === 0 ? color.background : 'none'}" stroke="${color.stroke}80"/>`)
        if (ty < size) scales.push(`<text x="${tx}" y="${ty}" text-anchor="middle">${ies.value(value, mode)} <tspan dy="4px" text-anchor="middle" x="${tx-0.5}" style="font-size: 4px !important; font-weight: 500;">${alias[mode]}</tspan></text>`)
    })

    // Max
    legends.push(`<text x="${padding}" y="${size - padding}" text-anchor="start" style="font-weight: 500; fill: ${color.accent[0]}">-- Max</text>`)
    lines.push(`<circle cx="${ox}" cy="${oy}" r="${(max * scale).toFixed(2)}" fill="none" stroke="${color.accent[0]}" stroke-dasharray="4 2"/>`)
    scales.push(`<text x="${ox + 1}" y="${oy + max * scale + 12}" text-anchor="middle" style="fill: ${color.accent[0]} !important; font-weight: 500; opacity: 1 !important;">${ies.value(max, mode)} <tspan dy="4px" text-anchor="middle" x="${ox-0.5}" style="font-size: 4px !important; font-weight: 800;">${alias[mode]}</tspan></text>`)

    return await defineSvgChart(/*svg*/`
        <g id="lines">${lines.filter(Boolean).join()}</g>
        <g id="outline">${scales.filter(Boolean).join()}</g>
        <g id="graphs">${graphs.filter(Boolean).join()}</g>
        <g id="scales">${scales.filter(Boolean).join()}</g>
        <g id="legends">${legends.filter(Boolean).join()}</g>
    `)

}
