import { size } from "../static/pos.static.ts"
import { color } from "../static/color.static.ts"

export const defineSvgChart = async (content: string) => /*svg*/`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="${color.background}" xmlns="http://www.w3.org/2000/svg">
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
                fill: ${color.text};
                opacity: .5;
            }

            #outline text {
                font-family: 'IBM Plex Sans', sans-serif;
                font-size: 8px;
                fill: white;
                filter: url(#solid);
            }

            #scales text {
                opacity: .5 !important;
            }

            #legends text {
                opacity: 1 !important;
                filter: url(#background);
            }

        </style>
        <defs>
            <clipPath id="clip">
                <rect x="0" y="0" width="${size}" height="${size}"/>
            </clipPath>
            <filter id="solid" x="-50%" y="-50%" width="200%" height="200%">
                <feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="outline" />
                <feFlood flood-color="${color.background}" result="bg" />
                <feComposite in="bg" in2="outline" operator="in" result="bgOutline"/>
                <feMerge>
                    <feMergeNode in="bgOutline"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <filter x="0" y="0" width="1" height="1" id="background"> 
                <feFlood flood-color="${color.background}" result="bg" /> 
                <feMerge> 
                    <feMergeNode in="bg"/> 
                    <feMergeNode in="SourceGraphic"/> 
                </feMerge> 
            </filter>
        </defs>
        <g clip-path="url(#clip)">
            <rect x="0" y="0" width="${size}" height="${size}" fill="${color.background}"/>
            ${content}
        </g>
        <rect x="0" y="0" width="${size}" height="${size}" fill="none" stroke="${color.stroke}"/>
    </svg>
`