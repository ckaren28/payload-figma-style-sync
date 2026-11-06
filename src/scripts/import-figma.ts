import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

const res = await fetch(`https://api.figma.com/v1/files/${process.env.FIGMA_FILE_KEY}`, {
  headers: { 'X-Figma-Token': process.env.FIGMA_TOKEN! },
})
const file = await res.json()

// convert Figma color to hex, Figma gives colors as 0-1 decimals: { r: 1, g: 0.5, b: 0 }
function toHex( color: { r: number, g: number, b: number }) {
//  turn one channel (0-1) into 2 hex digits (00-ff)
    const channel = ( value: number ) =>
        Math.round (value * 255)
        .toString(16)
        .padStart(2, '0')
    return '#' + channel (color.r) + channel(color.g) + channel(color.b)
}

// save a color (update it if it exists, otherwise create it)
 async function saveColor(styleId: string, name: string, hex: string) {
   // look for a color that already has this Figma style ID
   const existing = await payload.find({
     collection: 'colors',
     where: { figmaStyleId: { equals: styleId } },
   })
   const data = { name, hex, figmaStyleId: styleId }

   if (existing.docs.length > 0) {
     // found one: update it
     await payload.update({ collection: 'colors', id: existing.docs[0].id, data })
   } else {
     // none yet: create it
     await payload.create({ collection: 'colors', data })
   }
 }

// save a text style (same pattern as saveColor)
async function saveTextStyle(styleId: string, name: string, style: any) {
  const existing = await payload.find({
    collection: 'text-styles',
    where: { figmaStyleId: { equals: styleId } },
  })
  const data = {
    name,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeightPx,
    figmaStyleId: styleId,
  }

  if (existing.docs.length > 0) {
    await payload.update({ collection: 'text-styles', id: existing.docs[0].id, data })
  } else {
    await payload.create({ collection: 'text-styles', data })
  }
}

// walk the tree: one walk function that checks for both kinds of style
async function walk(node: any) {
  // does this node use a color style?
  const fillId = node.styles?.fill
  if (fillId && file.styles[fillId]?.styleType === 'FILL') {
    const name = file.styles[fillId].name
    const hex = toHex(node.fills[0].color)
    await saveColor(fillId, name, hex)
  }

  // does this node use a text style?
  const textId = node.styles?.text
  if (textId && file.styles[textId]?.styleType === 'TEXT') {
    const name = file.styles[textId].name
    await saveTextStyle(textId, name, node.style)
  }

  // then visit every child, one at a time
  for (const child of node.children ?? []) {
    await walk(child)
  }
}

if (!res.ok) {
  console.error('Figma API error', res.status, JSON.stringify(file))
  process.exit(1)
}

await walk(file.document)
console.log('styles done')

// save one frame image to Media (same update-or-create pattern, keyed by the frame's node ID)
async function saveFrame(nodeId: string, name: string, imageUrl: string) {
  // download the PNG Figma rendered for us
  const img = await fetch(imageUrl)
  const buffer = Buffer.from(await img.arrayBuffer())
  const fileName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png'
  const upload = { data: buffer, mimetype: 'image/png', name: fileName, size: buffer.length }
  const data = { alt: name, figmaNodeId: nodeId }

  const existing = await payload.find({
    collection: 'media',
    where: { figmaNodeId: { equals: nodeId } },
  })
  if (existing.docs.length > 0) {
    await payload.update({ collection: 'media', id: existing.docs[0].id, data, file: upload, overwriteExistingFiles: true })
  } else {
    await payload.create({ collection: 'media', data, file: upload })
  }
}

// collect every top-level frame on every page
const frames = file.document.children.flatMap((page: any) =>
  page.children.filter((node: any) => node.type === 'FRAME'),
)

if (frames.length > 0) {
  // ask Figma to render those frames as PNGs (2x); it answers with { images: { nodeId: url } }
  const ids = frames.map((f: any) => f.id).join(',')
  const imgRes = await fetch(
    `https://api.figma.com/v1/images/${process.env.FIGMA_FILE_KEY}?ids=${ids}&format=png&scale=2`,
    { headers: { 'X-Figma-Token': process.env.FIGMA_TOKEN! } },
  )
  const { images } = await imgRes.json()

  for (const frame of frames) {
    if (images[frame.id]) await saveFrame(frame.id, frame.name, images[frame.id])
  }
}
console.log(`frames done: ${frames.length}`)
process.exit(0)
