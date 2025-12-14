import { IES, useIES } from "../src/utils/ies.ts";
import renderPlidc from "../src/views/plidc.render.ts";
import renderLlidc from "../src/views/llidc.render.ts";
import renderLftd from "../src/views/lftd.render.ts";

const content = await Deno.readTextFile('test/test.ies')

const ies = useIES(content)

await Deno.writeTextFile('test/plidc.svg', await renderPlidc(ies, [0, 90], 'cdklm'))
await Deno.writeTextFile('test/llidc.svg', await renderLlidc(ies, [0, 90], 'cdklm'))
await Deno.writeTextFile('test/lftd.svg', await renderLftd(ies))