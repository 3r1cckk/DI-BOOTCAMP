const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { execSync } = require('child_process');

async function createPackages() {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Create tar.gz using GNU tar
  try {
    const tarCmd = `tar --exclude="./node_modules" --exclude="./dist" --exclude="./.git" --exclude="./public" -czf ${path.join(publicDir, 'duepulse-app.tar.gz')} -C ${rootDir} .`;
    execSync(tarCmd);
    console.log('Created public/duepulse-app.tar.gz');
  } catch (err) {
    console.error('Failed to create tar.gz:', err);
  }

  // 2. Create ZIP archive using JSZip
  const zip = new JSZip();

  function addDirToZip(currentDir, relativePath = '') {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      if (item === 'node_modules' || item === 'dist' || item === '.git' || item === 'public') {
        continue;
      }
      const fullPath = path.join(currentDir, item);
      const zipPath = relativePath ? `${relativePath}/${item}` : item;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        addDirToZip(fullPath, zipPath);
      } else {
        const fileData = fs.readFileSync(fullPath);
        zip.file(zipPath, fileData);
      }
    }
  }

  addDirToZip(rootDir);

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const zipDest = path.join(publicDir, 'duepulse-app.zip');
  fs.writeFileSync(zipDest, zipBuffer);
  console.log(`Created public/duepulse-app.zip (${Math.round(zipBuffer.length / 1024)} KB)`);
}

createPackages();
