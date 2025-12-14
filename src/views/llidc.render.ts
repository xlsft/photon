import { IES } from "../utils/ies.ts";
import { alias } from "../static/alias.static.ts";
import { color } from "../static/color.static.ts";
import { size, padding } from "../static/pos.static.ts";
import { defineSvgChart } from "../utils/chart.ts";

/**
 * ## Linear Luminous Intensity Distribution Curve
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

    const projection = (plane: number) => [
        ...ies.properties.vertical_angles.map((angle, i) => ({
            angle: angle,
            value: ies.matrix[ies.index((360 - plane) % 360)][i],
        })),
        ...ies.properties.vertical_angles.toReversed().map((angle, i) => ({
            angle: -angle,
            value: ies.matrix[ies.index((180 - plane + 360) % 360)][ies.properties.vertical_angles.length - 1 - i],
        })),
    ];

    const projections = planes.map(p => projection(p));
    const points = projections.flatMap(p => p.map(pt => pt.value));
    const max = Math.max(...points);

    const scale = size * 0.8;
    const offset = (size - scale) / 2;
    const miny = Math.min(...points.map(pt => pt)), maxy = Math.max(...points.map(pt => pt))
    const cy = (miny + maxy) / 2;

    const sx = (angle: number) => offset + ((angle + 180) / 360) * scale;
    const sy = (val: number) => size / 2 - ((val - cy) / (maxy - miny) * scale);

    const graphs: string[] = [];
    const lines: string[] = [];
    const scales: string[] = [];
    const legends: string[] = [];

    // Projections
    projections.forEach((points, i) => {
        const path = points.map((p, j) => `${j === 0 ? 'M' : 'L'} ${sx(p.angle).toFixed(2)} ${sy(p.value).toFixed(2)}`).join(' ') 
        graphs.push(`<path stroke-linecap="round" d="${path}" fill="${color.accent[i % color.accent.length]}${i > 0 ? '10' : '33'}" stroke="none"/>`) 
        let segment: typeof points = [];
        points.forEach(point => {
            if (point.value > 0.005 * Math.max(...points.map(point => point.value))) segment.push(point);
            else if (segment.length > 0) {
                graphs.push(`<path stroke-linecap="round" d="${segment.map((pt, k) => `${k === 0 ? 'M' : 'L'} ${sx(pt.angle).toFixed(2)} ${sy(pt.value).toFixed(2)}`).join(' ')}" stroke="${color.accent[i % color.accent.length]}" fill="none"/>`);
                segment = [];
            }
        })
        if (segment.length > 0) graphs.push(`<path stroke-linecap="round" d="${segment.map((pt, k) => `${k === 0 ? 'M' : 'L'} ${sx(pt.angle).toFixed(2)} ${sy(pt.value).toFixed(2)}`).join(' ')}" stroke="${color.accent[i % color.accent.length]}" fill="none"/>`);
        legends.push(`<text x="${size - padding}" text-anchor="end" y="${size - padding - (i * 10)}" style="fill: ${color.accent[i % color.accent.length]} !important; font-weight: 500;">C${planes[i]} / C${planes[i] + 180} —</text>`);
    });

    // Center
    const center = size / 2;
    lines.push(`<line x1="${center}" y1="0" x2="${center}" y2="${size}" stroke="${color.stroke}80"/>`); // ось Y
    lines.push(`<line x1="0" y1="${center + scale / 2}" x2="${size}" y2="${center + scale / 2}" stroke="${color.stroke}80"/>`); // ось X

    // Grid 
    Array.from({ length: 13 }, (_, i) => { 
        const value = i * max / 12, y = sy(value), angle = -180 + i * (360 / 12), x = sx(angle)
        if (i !== 0) lines.push(`<line x1="${0}" y1="${y - 1}" x2="${size}" y2="${y - 1}" stroke="${color.stroke}40" stroke-dasharray="4 2" />`) 
        if (angle !== 0) lines.push(`<line x1="${x}" y1="${0}" x2="${x}" y2="${size}" stroke="${color.stroke}40" stroke-dasharray="4 2" />`)
        if (angle !== 0) scales.push(`<text x="${x}" y="${center + scale / 2 + 12}" text-anchor="middle">${angle}°</text>`)
        if (i !== 0) scales.push(`<text x="${center + 4}" y="${y - 6}" ${i === 12 ? `style="fill: ${color.accent[0]} !important; font-weight: 500; opacity: 1 !important;"` : ''}>${Math.round(ies.value(value, mode))} ${alias[mode]}</text>`)
    })

    // Max
    lines.push(`<line x1="0" x2="${size}" y1="${sy(max)}" y2="${sy(max)}" stroke="${color.accent[0]}" stroke-dasharray="4 2"></line>`)
    legends.push(`<text x="${padding}" y="${size - padding}" text-anchor="start" style="font-weight: 500; fill: ${color.accent[0]}">-- Max</text>`)

    return await defineSvgChart(/*svg*/`
        <g id="lines">${lines.filter(Boolean).join()}</g>
        <g id="outline">${scales.filter(Boolean).join()}</g>
        <g id="graphs">${graphs.filter(Boolean).join()}</g>
        <g id="scales">${scales.filter(Boolean).join()}</g>
        <g id="legends">${legends.filter(Boolean).join()}</g>
    `)
}
