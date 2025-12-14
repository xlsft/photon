import { IES } from "../utils/ies.ts";
import { alias } from "../static/alias.static.ts";
import { color } from "../static/color.static.ts";
import { size, padding } from "../static/pos.static.ts";
import { defineSvgChart } from "../utils/chart.ts";
import { iso, norm } from "../utils/iso.ts";
import { temp } from "../utils/temp.ts";
import { useColor } from 'jsr:@xlsft/nuxt@1.1.34'

const { modify } = useColor()

/**
 * ## Light fixture technical drawing
 * 
 * 3D physical isometric projection of lamp
 */
export default async (ies: IES, mode: 'cd' | 'cdklm' = 'cd'): Promise<string> => {

    const { width, height, length } = ies.properties
    const temperature = temp(ies.properties.color_temperature)
    const peak = ies.value(ies.properties.peak_value, mode);

    const points = [
        iso(0, 0, 0),               // A — far bottom right
        iso(width, 0, 0),           // B — far bottom left
        iso(width, length, 0),      // C — near bottom left
        iso(0, length, 0),          // D — near bottom right
        iso(0, 0, height),          // E — far top right
        iso(width, 0, height),      // F — far top left 
        iso(width, length, height), // G — near top left 
        iso(0, length, height),     // H — near top right 
    ]; const [ A, B, C, D, E, F, G, H ] = points

    const cell = .1, cells = Math.ceil(size / cell);
    const xs = points.map(p => p.x), ys = points.map(p => p.y)
    const minx = Math.min(...xs), maxx = Math.max(...xs)
    const miny = Math.min(...ys), maxy = Math.max(...ys)
    const w = maxx - minx, h = maxy - miny;
    const scale = Math.min((size * 0.8) / w, (size * 0.8) / h);
    const ox = size / 2 - (minx + w / 2) * scale, oy = size / 2 - (miny + h / 2) * scale

    const vectors = [
        norm({ x: B.x - A.x, y: B.y - A.y }, size / scale),
        norm({ x: D.x - A.x, y: D.y - A.y }, size / scale),
        norm({ x: E.x - A.x, y: E.y - A.y }, size / scale),
        norm({ x: B.x - A.x, y: B.y - A.y }, cell),
        norm({ x: D.x - A.x, y: D.y - A.y }, cell)
    ]; const [ X, Y, Z, XV, YV ] = vectors

    const grid: string[] = []; for (let i = 0; i <= cells; i++) {
        const ox = { x: YV.x * i, y: YV.y * i }, oy = { x: XV.x * i, y: XV.y * i };
        const xp1 = { x: A.x + ox.x, y: A.y + ox.y }, xp2 = { x: xp1.x + XV.x * cells, y: xp1.y + XV.y * cells };
        const yp1 = { x: A.x + oy.x, y: A.y + oy.y }, yp2 = { x: yp1.x + YV.x * cells, y: yp1.y + YV.y * cells };
        grid.push(`<line x1="${xp1.x}" y1="${xp1.y}" x2="${xp2.x}" y2="${xp2.y}" />`);
        grid.push(`<line x1="${yp1.x}" y1="${yp1.y}" x2="${yp2.x}" y2="${yp2.y}" />`);
    }

    const circle = ies.properties.luminare_type === 'spot' ? Array.from({ length: 32 }, (_, i) => {
        const angle = (i / 32) * 2 * Math.PI;
        return iso((width / 2) * Math.cos(angle) + width / 2, (width / 2) * Math.sin(angle) + length / 2, height);
    }) : [];

    const scales: string[] = []

    const arrow = (a: { x: number, y: number }, b: { x: number, y: number }, label: string, offset = 8) => {
        const dx = b.x - a.x, dy = b.y - a.y
        const len = Math.hypot(dx, dy); if (!len) return ''
        const nx = -dy / len, ny = dx / len
        const ox = nx * offset / scale, oy = ny * offset / scale
        const a1 = { x: a.x + ox, y: a.y + oy }, b1 = { x: b.x + ox, y: b.y + oy }
        const al = 5 / scale, aw = 2.5 / scale
        const ux = dx / len, uy = dy / len
        const mx = (a1.x + b1.x) / 2, my = (a1.y + b1.y) / 2
        const to = 6 / scale, tx = mx + nx * to, ty = my + ny * to
        const angle = Math.atan2(b1.y - a1.y, b1.x - a1.x) * 180 / Math.PI

        const head = (p: { x: number, y: number }, dir: 1 | -1) => `
            <line stroke="${color.stroke}" x1="${p.x + ux * al * dir + nx * aw}" y1="${p.y + uy * al * dir + ny * aw}" x2="${p.x}" y2="${p.y}" />
            <line stroke="${color.stroke}" x1="${p.x + ux * al * dir - nx * aw}" y1="${p.y + uy * al * dir - ny * aw}" x2="${p.x}" y2="${p.y}" />
        `

        return `
            <g>
                <line stroke="${color.stroke}" x1="${a1.x}" y1="${a1.y}" x2="${b1.x}" y2="${b1.y}" />
                ${head(a1, 1)} ${head(b1, -1)}
                <text
                    x="${tx}" y="${ty}"
                    text-anchor="middle"
                    dominant-baseline="central"
                    style="font-size: ${6 / scale}px !important; text-rendering: geometricPrecision; font-weight: 50 !important; filter: none !important"
                    fill="${color.text}"
                    transform="rotate(${angle} ${tx} ${ty})"
                >
                    ${label}
                </text>
            </g>
        `
    }

    scales.push(arrow(D, C, `${width.toFixed(3)}${alias[ies.properties.unit]}`))
    scales.push(arrow(C, B, `${length.toFixed(3)}${alias[ies.properties.unit]}`))
    scales.push(arrow(H, D, `${height.toFixed(3)}${alias[ies.properties.unit]}`))

    const legends: string[] = []

    legends.push(`<text x="${padding}" y="${padding * 2}" style="fill: ${color.text} !important; font-weight: 500;">
        ${ies.keywords.luminaire}
        <tspan style="opacity: .75"> | ${ies.keywords.manufac}</tspan>
    </text>`)
    
    legends.push(`<text x="${size - padding}" y="${padding * 2}" text-anchor="end" style="fill: ${color.text} !important; opacity: .75 !important; font-weight: 500;">
        ${ies.keywords.testlab}
    </text>`)

    const values: Record<string, string | undefined> = {
        'Power': ies.properties.input_watts ? `${ies.properties.input_watts}${alias['w']}` : undefined,
        'Peak intensity': peak ? `${peak} ${alias[mode]}` : undefined,
        'Temperature':  ies.properties.color_temperature ? `${ies.properties.color_temperature}${alias['k']}` : undefined
    }

    legends.push(`<text x="${padding - .5}" y="${padding * 2 + 10}" text-anchor="start" style="fill: ${color.text} !important; opacity: .75 !important; font-weight: 500;">
        ${Object.entries(values).map(([ key, value ]) => {
            if (!value) return ''
            return `<tspan x="${padding - .5}" fill="${color.text}" style="opacity: 1 !important" dy="10px" text-anchor="start"><tspan>${key}: </tspan><tspan style="opacity: .75">${value}</tspan></tspan>`
        }).join('\n')}
    </text>`)

    return await defineSvgChart(/*svg*/ `
        <g id="axis" transform="translate(${ox},${oy}) scale(${scale})" stroke-width="${1.2/scale}" vector-effect="non-scaling-stroke"> 
            <line stroke="${color.axis.x}" x1="${A.x}" y1="${A.y}" x2="${A.x+X.x}" y2="${A.y+X.y}" /> 
            <line stroke="${color.axis.y}" x1="${A.x}" y1="${A.y}" x2="${A.x+Y.x}" y2="${A.y+Y.y}" /> 
            <line stroke="${color.axis.z}" x1="${A.x}" y1="${A.y}" x2="${A.x+Z.x}" y2="${A.y+Z.y}" /> 
        </g> 
        <g id="lines" stroke="${color.stroke}80" transform="translate(${ox},${oy}) scale(${scale})" stroke-width="${1/scale}" vector-effect="non-scaling-stroke">
            ${grid.join("\n")} 
        </g> 
        <g id="graphs" transform="translate(${ox},${oy}) scale(${scale})"> 
            <polygon fill="${modify.lightness.add(color.stroke, -10)}" points="${[A, D, H, E].map(p => `${p.x},${p.y}`).join(" ")}" /> 
            <polygon fill="${modify.lightness.add(color.stroke, -20)}" points="${[A, B, F, E].map(p => `${p.x},${p.y}`).join(" ")}" /> 
            <polygon fill="${modify.lightness.add(color.stroke, 10)}" points="${[C, D, H, G].map(p => `${p.x},${p.y}`).join(" ")}" /> 
            <polygon fill="${modify.lightness.add(color.stroke, 0)}" points="${[B, C, G, F].map(p => `${p.x},${p.y}`).join(" ")}" /> 
            <polygon fill="${modify.lightness.add(color.stroke, 100)}" points="${[E, F, G, H].map(p => `${p.x},${p.y}`).join(" ")}" /> 
            ${ies.properties.luminare_type === 'panel' ?
                `<polygon fill="${temperature}" points="${[E, F, G, H].map(p => `${p.x},${p.y}`).join(" ")}" />`
                :
                `<polygon fill="${temperature}" points="${circle.map(p => `${p.x},${p.y}`).join(" ")}" />`
            } 
            <g fill="none" stroke="${color.stroke}" stroke-width="${1 / scale}" vector-effect="non-scaling-stroke"> 
                <polygon points="${[E, F, G, H].map(p => `${p.x},${p.y}`).join(" ")}" /> 
                <line x1="${B.x}" y1="${B.y}" x2="${F.x}" y2="${F.y}" /> 
                <line x1="${C.x}" y1="${C.y}" x2="${G.x}" y2="${G.y}" /> 
                <line x1="${D.x}" y1="${D.y}" x2="${H.x}" y2="${H.y}" /> 
                <line x1="${D.x}" y1="${D.y}" x2="${C.x}" y2="${C.y}" /> 
            </g> 
        </g>
        <g
    id="scales"
    transform="translate(${ox},${oy}) scale(${scale})"
    fill="none"
    stroke="${color.text}"
    stroke-width="${1 / scale}"
    vector-effect="non-scaling-stroke"
    style="font-size: ${10 / scale}px; fill: ${color.text};"
>
    ${scales.join("\n")}
</g>

        <g id="legends">${legends.filter(Boolean).join()}</g>
    `)
}
