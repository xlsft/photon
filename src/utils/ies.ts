import { IESUnits } from "../static/units.static.ts";
import { IESProperties } from "../types/properties.types.ts";

/**
 * Standard File Format for the Electronic Transfer of Photometric Data
 * 
 * Based on *IESNA:LM-63-2002 RFC*
 */
export class IES {
    /**
     * IESNA:LM-63-2002 (Section 5.1).
     *
     * Must contain the string `IESNA:LM-63-2002`.
     * This string distinguishes the file from other formats
     * and marks the beginning of the photometric data.
     */
    public version: string

    /**
     * Keyword section (Section 5.2).
     *
     * Following `IESNA:LM-63-2002` and prior to `TILT=`,
     * any number of defined IES keywords may be used
     * (see Annex A and B). Each keyword line must begin
     * with an appropriate keyword.
     *
     * Required keywords:
     * - [TEST]       Test report number
     * - [TESTLAB]   Photometric testing laboratory
     * - [ISSUEDATE] Date the manufacturer issued the file
     * - [MANUFAC]   Manufacturer of the luminaire
     *
     * Suggested minimum optional keywords:
     * - [LUMCAT]     Luminaire catalog number
     * - [LUMINAIRE] Luminaire description
     * - [LAMPCAT]   Lamp catalog number
     * - [LAMP]      Lamp description (type, wattage, size, etc.)
     */
    public keywords: Record<string, string>

    /**
     * Set of photometric properties defined in
     * Sections 5.4 through 5.13.
     */
    public properties: IESProperties

    /**
     * Tilt definition (Section 5.3).
     *
     * Indicates whether lamp output varies as a function
     * of luminaire tilt angle and, if so, where the tilt
     * multiplier information is located.
     *
     * Possible values:
     * - `TILT=NONE`
     *   Lamp output does not vary with tilt angle
     *   (skip to Section 5.4).
     *
     * - `TILT=INCLUDE`
     *   Tilt information is included in this photometric file.
     *
     * - `TILT=<filename>`
     *   Tilt information is stored in a separate file.
     *   The filename must end with `.tlt` or `.TLT`
     *   (extension is not case-sensitive), e.g. `MH100V.TLT`.
     *
     * The format of tilt information is identical whether
     * it is included in this file or stored separately
     * (see Annex F).
     *
     * Note:
     * The phrase `TILT=` must appear exactly as shown
     * and begin in column 1, as it signifies the end of
     * the keyword section.
     */
    public tilt: 'NONE' | 'INCLUDE' | string = 'NONE'
    
    /**
     * Candela values matrix corresponding to the photometric data.
     *
     * - Each sub-array corresponds to a single horizontal angle.
     * - Values within each sub-array correspond to vertical angles.
     * - The order of candela values must exactly match the order
     *   of the vertical angles.
     * - Successive horizontal planes are listed in sequence
     *   according to the horizontal angles array.
     * - The first candela value for each horizontal angle starts
     *   a new sub-array (or line in the file).
     * - Values may be continued on additional lines if needed.
     *
     * Example:
     * [
     *   [<candela values for all vertical angles at 1st horizontal angle>],
     *   [<candela values for all vertical angles at 2nd horizontal angle>],
     *   ...
     *   [<candela values for all vertical angles at last horizontal angle>]
     * ]
     */
    public matrix: number[][]

    constructor (public content: string) {
        const lines = this.content.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

        this.version = lines[0]
        this.keywords = {}

        let i = 1; for (; i < lines.length; i++) {
            const line = lines[i]
            if (line.startsWith('TILT=')) { this.tilt = line.slice(5); i++; break }
            if (line.startsWith('[')) {
                const end = line.indexOf(']'); if (end === -1) continue
                const key = line.slice(1, end).toLowerCase()
                const value = line.slice(end + 1).trim()
                if (this.keywords[key]) this.keywords[key] += '\n' + value
                else this.keywords[key] = value
            }
        }
        if (this.tilt === 'INCLUDE') i += 4 // Skip tilt parsing (Section 5.0)

        this.properties ||= {
            luminare_type: 'panel'
        } as IESProperties

        const [ lamps, lumens_per_lamp, candela_multiplier, total_vertical_angles, total_horizontal_angles, photometric_type, units_type, width, length, height ] = lines[i].split(/\s+/).map(parseFloat)
        this.properties = {
            ...this.properties,
            lamps, lumens_per_lamp, candela_multiplier, total_vertical_angles, total_horizontal_angles, photometric_type, units_type, 
            width: Math.abs(width), length: Math.abs(length), height: Math.abs(height),
            unit: IESUnits[units_type as keyof typeof IESUnits],
        }

        i += 1; const [ ballast_factor, future_use, input_watts ] = lines[i].split(/\s+/).map(parseFloat)
        this.properties = {
            ...this.properties,
            ballast_factor, future_use, input_watts
        }
        
        i += 1; const vertical_angles: number[] = []; let vertical_angles_collected = 0; while (vertical_angles_collected < this.properties.total_vertical_angles) {
            const angles = lines[i].trim().split(/\s+/).map(parseFloat)
            vertical_angles.push(...angles)
            vertical_angles_collected += angles.length
            i++
        }

        const horizontal_angles: number[] = []; let horizontal_angles_collected = 0; while (horizontal_angles_collected < this.properties.total_horizontal_angles) {
            const angles = lines[i].trim().split(/\s+/).map(parseFloat)
            horizontal_angles.push(...angles)
            horizontal_angles_collected += angles.length
            i++
        }

        this.properties = {
            ...this.properties,
            vertical_angles, horizontal_angles
        }

        const matrix: number[][] = [], linear_values: number[] = []

        while (linear_values.length < this.properties.total_vertical_angles * this.properties.total_horizontal_angles) {
            const numbers = lines[i].trim().split(/\s+/).map((n) => parseFloat(n) * this.properties.candela_multiplier)
            linear_values.push(...numbers)
            i++
        }

        for (let h = 0; h < this.properties.total_horizontal_angles; h++) {
            matrix.push(linear_values.slice(h * this.properties.total_vertical_angles, (h + 1) * this.properties.total_vertical_angles))
        }

        this.matrix = matrix

        const color_temperature_text = content.match(/(?<!\d)(\d{3,5})\s*K\b/i)
        this.properties.color_temperature = color_temperature_text ? Number(color_temperature_text[1]) : undefined

        this.properties.luminare_type = this.properties.width / this.properties.length > 0.85 && this.properties.width / this.properties.length < 1.15 ? 'spot' : 'panel'
    }

    /**
     * Returns index of horizontal plane based on angle
     * @param angle 
     * @returns 
     */
    public index(angle: number) {
        const angles = this.properties.horizontal_angles;
        let idx = 0;
        let min = Infinity;
        for (let i = 0; i < angles.length; i++) {
            const d = Math.abs(angles[i] - angle);
            if (d < min) { min = d; idx = i; }
        }
        return idx;
    }

    public value(cd: number, mode: 'cd' | 'cdklm') {
        const convert = {
            'cd': (cd: number) => Math.floor(cd),
            'cdklm': (cd: number) => Math.floor(cd * (1000 / (this.properties.lamps * this.properties.lumens_per_lamp)))
        }
        return convert[mode](cd)
    }

}

export const useIES = (content: string) => new IES(content)