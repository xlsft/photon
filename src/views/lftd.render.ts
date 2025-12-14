import { IES } from "../utils/ies.ts";
import { alias } from "../static/alias.static.ts";
import { color } from "../static/color.static.ts";
import { size, padding } from "../static/pos.static.ts";
import { defineSvgChart } from "../utils/chart.ts";
import { iso } from "../utils/iso.ts";
import { temp } from "../utils/temp.ts";
import { useColor } from 'jsr:@xlsft/nuxt@1.1.34'

const { modify } = useColor()
const norm = (v: { x: number, y: number }, l: number) => {
    const vector = Math.sqrt(v.x * v.x + v.y * v.y);
    return { x: v.x / vector * l, y: v.y / vector * l };
};

/**
 * ## Light fixture technical drawing
 * 
 * 3D physical isometric projection of lamp
 */
export default async (ies: IES): Promise<string> => {

    const { width, height, length } = ies.properties
    const temperature = temp(ies.properties.color_temperature)

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

    const xs = points.map(p => p.x), ys = points.map(p => p.y)
    const minx = Math.min(...xs), maxx = Math.max(...xs)
    const miny = Math.min(...ys), maxy = Math.max(...ys)
    const w = maxx - minx, h = maxy - miny;
    const scale = Math.min((size * 0.8) / w, (size * 0.8) / h);
    const ox = size / 2 - (minx + w / 2) * scale, oy = size / 2 - (miny + h / 2) * scale

    const axis = [
        norm({ x: B.x - A.x, y: B.y - A.y }, size / scale),
        norm({ x: D.x - A.x, y: D.y - A.y }, size / scale),
        norm({ x: E.x - A.x, y: E.y - A.y }, size / scale)
    ]; const [ X, Y, Z ] = axis

    const gridSize = 20; // размер ячейки сетки
const gridCount = 50; // количество линий в каждой оси

const gridLines: string[] = []

for (let i = -gridCount; i <= gridCount; i++) {
    // линии вдоль X (параллельно Y)
    const p1 = iso(i * gridSize, -gridCount * gridSize, 0)
    const p2 = iso(i * gridSize, gridCount * gridSize, 0)
    gridLines.push(`<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" />`)

    // линии вдоль Y (параллельно X)
    const p3 = iso(-gridCount * gridSize, i * gridSize, 0)
    const p4 = iso(gridCount * gridSize, i * gridSize, 0)
    gridLines.push(`<line x1="${p3.x}" y1="${p3.y}" x2="${p4.x}" y2="${p4.y}" />`)
}


    return await defineSvgChart(/*svg*/`
        <g id="axis" transform="translate(${ox},${oy}) scale(${scale})" stroke-width="${1.2/scale}" vector-effect="non-scaling-stroke">
            <line stroke="${color.axis.x}" x1="${A.x}" y1="${A.y}" x2="${A.x+X.x}" y2="${A.y+X.y}" />
            <line stroke="${color.axis.y}" x1="${A.x}" y1="${A.y}" x2="${A.x+Y.x}" y2="${A.y+Y.y}" />
            <line stroke="${color.axis.z}" x1="${A.x}" y1="${A.y}" x2="${A.x+Z.x}" y2="${A.y+Z.y}" />
        </g>
        <g id="lines" stroke="${color.stroke}80" transform="translate(${ox},${oy}) scale(${scale})" stroke-width="${1.2/scale}" vector-effect="non-scaling-stroke">
            ${gridLines.join('\n')}
        </g>
        <g id="graphs" transform="translate(${ox},${oy}) scale(${scale})">
            <polygon fill="${modify.lightness.add(color.stroke, -10)}" points="${[A, D, H, E].map(p => `${p.x},${p.y}`).join(" ")}" />
            <polygon fill="${modify.lightness.add(color.stroke, -20)}" points="${[A, B, F, E].map(p => `${p.x},${p.y}`).join(" ")}" />
            <polygon fill="${modify.lightness.add(color.stroke, 10)}" points="${[C, D, H, G].map(p => `${p.x},${p.y}`).join(" ")}" />
            <polygon fill="${modify.lightness.add(color.stroke, 0)}" points="${[B, C, G, F].map(p => `${p.x},${p.y}`).join(" ")}" />
            <polygon fill="${temperature}" points="${[E, F, G, H].map(p => `${p.x},${p.y}`).join(" ")}" />
            <g fill="none" stroke="${color.stroke}" stroke-width="${1 / scale}" vector-effect="non-scaling-stroke">
                <polygon points="${[E, F, G, H].map(p => `${p.x},${p.y}`).join(" ")}" />
                <line x1="${B.x}" y1="${B.y}" x2="${F.x}" y2="${F.y}" />
                <line x1="${C.x}" y1="${C.y}" x2="${G.x}" y2="${G.y}" />
                <line x1="${D.x}" y1="${D.y}" x2="${H.x}" y2="${H.y}" />
                <line x1="${D.x}" y1="${D.y}" x2="${C.x}" y2="${C.y}" />
            </g>
        </g>
    `)
}
