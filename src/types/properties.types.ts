import { IESUnits } from "../static/units.static.ts";

/**
 * Set of properties from Section 5.4 - Section 5.13
 */
export type IESProperties = {
    /**
     * Total number of lamps in the luminaire.
     */
    lamps: number

    /**
     * Lumens per lamp on which the photometric test is based.
     * In the case of absolute photometry, where lumens per lamp
     * are not the basis for the photometric data, use -1.
     */
    lumens_per_lamp: number

    /**
     * Multiplying factor applied to all candela values in the file.
     * Usually 1.0, but may be a value other than 1.0.
     */
    candela_multiplier: number

    /**
     * Total number of vertical angles in the photometric report.
     */
    total_vertical_angles: number

    /**
     * Total number of horizontal angles in the photometric report.
     */
    total_horizontal_angles: number

    /**
     * Type of photometry used for the luminaire.
     *
     * Allowed values:
     * 1 — Type C
     * 2 — Type B
     * 3 — Type A
     *
     * Refer to IESNA LM-75-012 for details on goniophotometer types.
     */
    photometric_type: number

    /**
     * Units used for the luminous dimensions of the luminaire.
     *
     * Allowed values:
     * 1 — Feet
     * 2 — Meters
     */
    units_type: number

    /**
     * Custom property describing the unit.
     */
    unit: typeof IESUnits[keyof typeof IESUnits]

    /**
     * Distance across the luminous opening measured perpendicular
     * to the 0° photometric plane (photometric horizontal).
     *
     * See Figure 1, Table 1, and Annex D for details.
     */
    width: number

    /**
     * Distance across the luminous opening measured parallel
     * to the 0° photometric plane (photometric horizontal).
     *
     * See Figure 1, Table 1, and Annex D for details.
     */
    length: number

    /**
     * Overall height of the luminous opening measured parallel
     * to photometric zero.
     *
     * See Figure 1, Table 1, and Annex D for details.
     */
    height: number

    /**
     * Ballast factor of the luminaire.
     *
     * Describes the application characteristics of the luminaire.
     * Represents the fractional lumens of a lamp (or lamps)
     * operated on a commercial ballast compared to the lumens
     * produced when operated on a standard (reference) ballast
     * used for lamp lumen rating.
     *
     * If the ballast factor is not known, the default value is 1.0.
     *
     * For application purposes, this factor is used to adjust
     * luminaire performance data from laboratory test conditions
     * to actual field conditions.
     *
     * Values in the file do not include the ballast factor.
     * This factor must be applied to all candela values at
     * application time.
     */
    ballast_factor: number

    /**
     * Reserved for future use.
     *
     * Must be set to 1 to remain compatible with
     * previous versions of LM-63.
     */
    future_use: number

    /**
     * Total input power of the luminaire in watts,
     * including ballast power.
     */
    input_watts: number

    /**
     * Vertical angles for which photometric data are provided.
     *
     * Angles must be listed in ascending order.
     */
    vertical_angles: number[]

    /**
     * Horizontal angles for which photometric data are provided.
     *
     * Angles must be listed in ascending order.
     */
    horizontal_angles: number[]

    /**
     * Custom property for color temperature in kelvins
     *
     * Not supported by IES, parsed from text content of IES file, can be inaccurate
     */
    color_temperature?: number

    /**
     * Custom property for physical type of luminare
     *
     * Not supported by IES, calculated from properties, can be inaccurate
     */
    luminare_type: 'panel' | 'spot'

    /**
     * Custom property for peak candela value
     *
     * Not supported by IES, based on candela matrix and is multiplied by candela_multiplier
     */
    peak_value: number

}
