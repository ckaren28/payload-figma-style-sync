# Payload + Figma style sync

Pulls design decisions out of a Figma file and stores them in Payload CMS, so the site renders from the same values the designer set.

- **Color styles** become `colors` records (name, hex)
- **Text styles** become `text-styles` records (font family, size, weight, line height)
- **Top-level frames** are rendered by Figma as 2x PNGs and saved to `media`
- **`/styleguide`** renders all three straight from the database

Every record keeps its Figma ID (`figmaStyleId` or `figmaNodeId`), so re-running the import updates existing records instead of duplicating them.

## How it works

`src/scripts/import-figma.ts`

1. `GET /v1/files/:key` from the Figma REST API returns the whole document tree plus a `styles` map.
2. A recursive `walk` visits every node. If a node uses a color or text style, the style's name and values are read off that node and saved (Figma stores style values on the layers that use them, not on the style, so a style only imports if it is applied to at least one layer).
3. Figma colors arrive as 0–1 channels and are converted to hex.
4. Top-level frames are sent to `GET /v1/images/:key`, which returns a temporary URL per frame; each PNG is downloaded and uploaded to the `media` collection.

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run dev            # http://localhost:3000/admin, create the first user
```

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | `file:./payload-figma-starter.db` (local SQLite) |
| `PAYLOAD_SECRET` | any long random string |
| `FIGMA_TOKEN` | personal access token, Figma → Settings → Security |
| `FIGMA_FILE_KEY` | the part of the file URL after `/design/` |

## Run the import

```bash
npx payload run src/scripts/import-figma.ts
```

Then open `/admin` to see the records, or `/styleguide` to see them rendered.

## Built with

Payload 3, Next.js, SQLite, the Figma REST API.
