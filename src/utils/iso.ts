export const cos30 = Math.cos(Math.PI / 6);
export const sin30 = Math.sin(Math.PI / 6);

export const iso = (x: number, y: number, z: number) => ({
    x: (x - y) * cos30,
    y: (x + y) * sin30 - z,
    z
});

export const norm = (v: { x: number, y: number }, l: number) => {
    const vector = Math.sqrt(v.x * v.x + v.y * v.y);
    return { x: v.x / vector * l, y: v.y / vector * l };
};
