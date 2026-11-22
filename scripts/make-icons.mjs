// Renders scripts/penny-icon.svg to the app icons.
// Run from the project root: node scripts/make-icons.mjs
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile(new URL("./penny-icon.svg", import.meta.url));
const out = [
  ["public/icon-512.png", 512],
  ["public/icon-192.png", 192],
  ["public/apple-touch-icon.png", 180],
  ["src/app/icon.png", 64], // browser tab icon
];
for (const [path, size] of out) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(path);
  console.log("wrote", path, size);
}
