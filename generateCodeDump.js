// generateCodeDump.js

const fs = require("fs");
const path = require("path");

const outputDir = ".";
const outputFileName = `${new Date()
  .toISOString()
  .replace(/T/, "_")
  .replace(/:/g, "-")
  .split(".")[0]}_code_dump.txt`;
const outputPath = path.join(outputDir, outputFileName);

const allowedExtensions = [".js", ".ts", ".jsx", ".tsx"];
const includedDirs = ["pages", "components", "lib"];

function walkDir(dirPath, callback) {
  fs.readdirSync(dirPath).forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (stat.isFile()) {
      callback(fullPath);
    }
  });
}

function extractAndDumpCode() {
  const writeStream = fs.createWriteStream(outputPath, { encoding: "utf-8" });

  includedDirs.forEach((dir) => {
    const absPath = path.join(__dirname, dir);
    if (!fs.existsSync(absPath)) {
      console.warn(`[WARN] Skipped missing directory: ${absPath}`);
      return;
    }

    walkDir(absPath, (filePath) => {
      const ext = path.extname(filePath);
      if (allowedExtensions.includes(ext)) {
        const relativePath = path.relative(__dirname, filePath);
        const content = fs.readFileSync(filePath, "utf-8");

        writeStream.write(`\n\n/* ========== ${relativePath} ========== */\n\n`);
        writeStream.write(content);
      }
    });
  });

  writeStream.end(() => {
    console.log(`✅ Code dumped into: ${outputFileName}`);
  });
}

extractAndDumpCode();
