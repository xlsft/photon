import { useIES } from "../src/utils/ies.ts";
import render from "../src/views/lidc.render.ts";

const content = await Deno.readTextFile('test/test.ies')

const ies = useIES(content)

await Deno.writeTextFile('test/lidc.svg', await render(ies))