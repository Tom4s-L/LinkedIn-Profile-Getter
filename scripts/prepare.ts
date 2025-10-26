import fs from 'fs-extra'

async function copyManifest() {
  await fs.ensureDir('extension')
  fs.copyFileSync('src/manifest.json', 'extension/manifest.json')
}

copyManifest()
