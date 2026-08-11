import { copyFile, mkdir, rm } from "node:fs/promises";

const outputDir = "dist";
const staticFiles = [
  "index.html",
  "how-it-works.html",
  "styles.css",
  "app.js",
  "historical-returns.js",
  "robots.txt",
  "sitemap.xml",
];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await Promise.all(
  staticFiles.map((file) => copyFile(file, `${outputDir}/${file}`)),
);

console.log(`Built Money Seasons into ${outputDir}/`);
