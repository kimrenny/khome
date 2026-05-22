const fs = require("fs");
const path = require("path");

const inputDir = "./new";
const outputDir = "./new-bg";

let startNumber = 63;

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs
  .readdirSync(inputDir)
  .filter((file) => fs.statSync(path.join(inputDir, file)).isFile())
  .sort((a, b) => a.localeCompare(b));

files.forEach((file) => {
  const ext = path.extname(file);
  const newName = `photo_${startNumber}${ext}`;

  const oldPath = path.join(inputDir, file);
  const newPath = path.join(outputDir, newName);

  fs.copyFileSync(oldPath, newPath);

  console.log(`${file} → ${newName}`);

  startNumber++;
});
