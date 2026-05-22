const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const inputDir = "./bg-jpg";
const outputDir = "./bg-webp";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const allowedExtensions = [".png", ".jpg", ".jpeg"];

fs.readdirSync(inputDir).forEach(async (file) => {
  const ext = path.extname(file).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return;
  }

  const inputPath = path.join(inputDir, file);

  const outputFileName = path.parse(file).name + ".webp";

  const outputPath = path.join(outputDir, outputFileName);

  try {
    await sharp(inputPath)
      .webp({
        quality: 80,
        effort: 6,
      })
      .toFile(outputPath);

    console.log(`Done: ${outputFileName}`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
});
