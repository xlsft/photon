import { useIES } from "../src/modules/parser/main.ts";

const content = await Deno.readTextFile('./test.ies')

const ies = useIES(content)

console.log(ies)