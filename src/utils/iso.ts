const cos30 = Math.cos(Math.PI / 6);
const sin30 = Math.sin(Math.PI / 6);

export const iso = (x: number, y: number, z: number) => ({
    x: (x - y) * cos30,
    y: (x + y) * sin30 - z
});