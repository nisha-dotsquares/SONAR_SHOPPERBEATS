/**
    colorUtils.ts
 * Shared colour-name → hex palette and swatch helper.
 * Import { NAMED_COLORS, getSwatchColor } wherever colour swatches are needed.
 */

export const NAMED_COLORS: Record<string, string> = {
    // Core Basics
    black: "#000000",
    white: "#ffffff",
    grey: "#808080",
    gray: "#808080",
    silver: "#c0c0c0",
    gold: "#ffd700",
    red: "#ff0000",
    blue: "#0000ff",
    green: "#008000",
    yellow: "#ffff00",
    orange: "#ffa500",
    pink: "#ffc0cb",
    purple: "#800080",
    brown: "#8b4513",
    beige: "#f5f5dc",
    cream: "#fffdd0",
    ivory: "#fffff0",
    navy: "#000080",
    teal: "#008080",
    maroon: "#800000",
    olive: "#808000",

    // Extended Fashion
    charcoal: "#36454f",
    offwhite: "#f8f8f8",
    burgundy: "#800020",
    mustard: "#ffdb58",
    khaki: "#c3b091",
    tan: "#d2b48c",
    camel: "#c19a6b",
    coffee: "#6f4e37",
    chocolate: "#7b3f00",
    wine: "#722f37",
    rust: "#b7410e",
    brick: "#b22222",
    peach: "#ffe5b4",
    coral: "#ff7f50",
    salmon: "#fa8072",
    apricot: "#fbceb1",
    lavender: "#e6e6fa",
    lilac: "#c8a2c8",
    plum: "#dda0dd",
    magenta: "#ff00ff",
    fuchsia: "#ff00ff",
    mint: "#98ff98",
    turquoise: "#40e0d0",
    aqua: "#00ffff",
    skyblue: "#87ceeb",
    royalblue: "#4169e1",
    midnightblue: "#191970",
    forest: "#228b22",
    emerald: "#50c878",
    sage: "#9caf88",
    moss: "#8a9a5b",
    armygreen: "#4b5320",

    // Premium Neutrals
    stone: "#d2cfc4",
    pebble: "#b8b5ae",
    taupe: "#483c32",
    greige: "#bfb8a5",
    sand: "#c2b280",
    linen: "#faf0e6",
    ash: "#b2beb5",
    smoke: "#738276",
    graphite: "#383838",
    pearl: "#eae0c8",
    champagne: "#f7e7ce",
    almond: "#efdecd",
    wheat: "#f5deb3",
    eggshell: "#f0ead6",
    clay: "#b66a50",
    terracotta: "#e2725b",
    mahogany: "#c04000",
    walnut: "#5d3a1a",
    oak: "#a0522d",
    ivorywhite: "#fffff0",
    caramel: "#c68e17",
    mocha: "#967969",
    espresso: "#4b3832",
    latte: "#c8a27c",
    cappuccino: "#a67b5b",
    sandstone: "#786d5f",
    putty: "#c9c0bb",
    slate: "#708090",

    // Beauty Shades
    nude: "#e3bc9a",
    rose: "#ff007f",
    blush: "#de5d83",
    raspberry: "#e30b5d",
    watermelon: "#fc6c85",
    flamingo: "#fc8eac",
    ruby: "#9b111e",
    scarlet: "#ff2400",
    crimson: "#dc143c",
    bronze: "#cd7f32",
    copper: "#b87333",
    amber: "#ffbf00",
    honey: "#ffb300",
    marigold: "#eaa221",
    tangerine: "#f28500",
    pumpkin: "#ff7518",
    sunflower: "#ffda03",
    butter: "#fff1a8",
    mulberry: "#70193d",
    orchid: "#da70d6",
    periwinkle: "#ccccff",

    // Electronics / Modern Finishes
    matteblack: "#1c1c1c",
    glossyblack: "#0a0a0a",
    spacegray: "#4b4b4b",
    gunmetal: "#2a3439",
    carbon: "#333333",
    titanium: "#878681",
    midnight: "#121063",
    arcticwhite: "#f0f8ff",
    steel: "#71797e",
    chrome: "#e8e8e8",
    graphiteblack: "#2f2f2f",
    jetblack: "#0f0f0f",

    // Sports / Neon
    lime: "#00ff00",
    cyan: "#00ffff",
    indigo: "#4b0082",
    violet: "#8f00ff",
    powderblue: "#b0e0e6",
    babyblue: "#89cff0",
    iceblue: "#d6f1ff",
    pine: "#01796f",
    jade: "#00a86b",
    seafoam: "#9fe2bf",
    cobalt: "#0047ab",
    denim: "#1560bd",
    neonpink: "#ff6ec7",
    neonblue: "#4d4dff",
    neongreen: "#39ff14",
    neonyellow: "#ffff33",
    neonorange: "#ff5f1f",

    // Variants
    dustyrose: "#c08081",
    powderpink: "#f6c1c7",
    hotpink: "#ff69b4",
    steelblue: "#4682b4",
    mustardyellow: "#ffdb58",
    olivegreen: "#556b2f",
    darkgreen: "#006400",
    lightgreen: "#90ee90",
    darkblue: "#00008b",
    lightblue: "#add8e6",
    darkgrey: "#555555",
    lightgrey: "#d3d3d3",
    darkbrown: "#654321",
    lightbrown: "#a52a2a",

    // Multi / Pattern
    multicolor: "#ffffff",
    transparent: "transparent",
    clear: "transparent",
};

/**
 * Convert a colour name → hex/hsl string.
 * Looks up NAMED_COLORS first; falls back to a deterministic hash-based pastel
 * so unknown colour names always render as a visible, consistent colour.
 */
export function getSwatchColor(colorName: string): string {
    const key = colorName.toLowerCase().trim();
    if (NAMED_COLORS[key]) return NAMED_COLORS[key];

    // Deterministic hash → pastel hue for unknown names
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 60%)`;
}
