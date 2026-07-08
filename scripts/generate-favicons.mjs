import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const src = path.join('public', 'favicon.png')
const publicDir = 'public'

if (!fs.existsSync(src)) {
  console.error('Missing source:', src)
  process.exit(1)
}

const outputs = [
  { size: 16, file: 'favicon-16.png' },
  { size: 32, file: 'favicon-32.png' },
  { size: 48, file: 'favicon-48.png' },
  { size: 180, file: 'apple-touch-icon.png' },
  { size: 512, file: 'logo-512.png' },
]

for (const { size, file } of outputs) {
  const out = path.join(publicDir, file)
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(out)
  console.log('Wrote', out)
}

await sharp(src).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'))
console.log('Wrote public/favicon.ico')
