import { useIES } from "../src/utils/ies.ts";

const content = await Deno.readTextFile('test/test.ies')

const ies = useIES(content)

console.log(ies.properties.vertical_angles) // number[]
console.log(ies.properties.horizontal_angles) // number[]
console.log(ies.matrix) // number[][]