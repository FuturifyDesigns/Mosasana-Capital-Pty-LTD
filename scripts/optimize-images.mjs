import sharp from 'sharp'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const publicDir = path.resolve('public')

function maxWidthFor(file) {
  if (/favicon|apple-touch|logo-512/i.test(file)) return null
  if (/thumb/i.test(file)) return 720
  if (/hero-money|money-band/i.test(file)) return 1280
  if (/auth-sign/i.test(file)) return 1080
  if (/logo-transparent/i.test(file)) return 512
  return 1200
}

const files = (await readdir(publicDir)).filter((f) => f.endsWith('.png'))

for (const file of files) {
  const input = path.join(publicDir, file)
  const webpOut = path.join(publicDir, file.replace(/\.png$/i, '.webp'))
  const maxWidth = maxWidthFor(file)

  let pipeline = sharp(input)
  if (maxWidth) pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true })

  await pipeline.webp({ quality: 82, effort: 4 }).toFile(webpOut)

  const pngSize = (await stat(input)).size
  const webpSize = (await stat(webpOut)).size
  console.log(`${file} → ${file.replace('.png', '.webp')} (${Math.round(pngSize / 1024)}KB → ${Math.round(webpSize / 1024)}KB)`)
}

console.log('Done.')
