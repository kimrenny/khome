const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const inputDir = "./bg-webp";
const outputDir = "./thumbs";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdirSync(inputDir).forEach(async (file) => {
  const inputPath = path.join(inputDir, file);

  const outputFileName = path.parse(file).name + ".webp";

  const outputPath = path.join(outputDir, outputFileName);

  await sharp(inputPath)
    .resize({
      width: 256,
      withoutEnlargement: true,
    })
    .webp({
      quality: 70,
    })
    .toFile(outputPath);

  console.log(`Done: ${outputFileName}`);
});
