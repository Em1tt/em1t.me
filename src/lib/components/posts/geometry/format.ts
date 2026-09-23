/** A number as the readouts print it, with a real minus sign. */
export const num = (n: number) => (n < 0 ? `−${-n}` : `${n}`);

/** n², bracketed when negative so the square reads right: (−3)². */
export const squared = (n: number) => (n < 0 ? `(−${-n})²` : `${n}²`);

/** A term after the first, with its sign: + 3, − 3. */
export const plus = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);
