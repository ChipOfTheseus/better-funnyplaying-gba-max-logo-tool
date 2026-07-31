import fs from "node:fs/promises";

const clientPath = "dist/index.html";
const prerenderPath = ".prerender-dist/index.html";
const clientHtml = await fs.readFile(clientPath, "utf8");
const prerenderHtml = await fs.readFile(prerenderPath, "utf8");
const prerenderMatch = prerenderHtml.match(
  /<div id="root">([\s\S]*?)<\/div><div id="prerender-marker"><\/div>/
);

if (!prerenderMatch) throw new Error("Unable to locate prerendered root markup");

const clientRootPattern = /<div id="root">([\s\S]*?)<\/div><div id="prerender-marker"><\/div>/;

const replaced = clientHtml.replace(clientRootPattern, `<div id="root">${prerenderMatch[1]}</div>`);
if (replaced === clientHtml) throw new Error("Unable to locate client root placeholder");

await fs.writeFile(clientPath, replaced);
