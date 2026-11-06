import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'

// always read fresh from the database, so a re-import shows up on reload
export const dynamic = 'force-dynamic'

export default async function StyleguidePage() {
  const payload = await getPayload({ config: await config })

  // pull everything the Figma import saved
  const colors = await payload.find({ collection: 'colors', sort: 'name', limit: 100 })
  const textStyles = await payload.find({ collection: 'text-styles', sort: '-fontSize', limit: 100 })
  const frames = await payload.find({
    collection: 'media',
    where: { figmaNodeId: { exists: true } },
    limit: 100,
  })

  // the Figma style names look like "Color/Clay"; show just the last part
  const shortName = (name: string) => name.split('/').pop()

  return (
    <div style={{ background: '#fff', color: '#1c1b19', padding: '48px 24px', minHeight: '100vh', textAlign: 'left' }}>
      {/* load the fonts the text styles name */}
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=IBM+Plex+Mono&family=Inter:wght@400&display=swap"
      />

      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 56 }}>
        <header>
          <h1 style={{ margin: 0, fontSize: 32 }}>Styleguide</h1>
          <p style={{ margin: '8px 0 0', color: '#6b665d' }}>
            Generated from Figma: {colors.totalDocs} colors, {textStyles.totalDocs} text styles, {frames.totalDocs} frames.
          </p>
        </header>

        <section>
          <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Colors</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 }}>
            {colors.docs.map((c) => (
              <div key={c.id}>
                <div style={{ background: c.hex, aspectRatio: '1', borderRadius: 8, border: '1px solid #0001' }} />
                <div style={{ fontSize: 13, marginTop: 8 }}>{shortName(c.name)}</div>
                <code style={{ fontSize: 12, color: '#6b665d' }}>{c.hex}</code>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Text styles</h2>
          <div style={{ display: 'grid', gap: 24 }}>
            {textStyles.docs.map((t) => (
              <div key={t.id}>
                {/* render the sample with the exact values stored from Figma */}
                <div
                  style={{
                    fontFamily: `"${t.fontFamily}"`,
                    fontSize: t.fontSize,
                    fontWeight: t.fontWeight ?? undefined,
                    lineHeight: t.lineHeight ? `${t.lineHeight}px` : undefined,
                  }}
                >
                  {shortName(t.name)}
                </div>
                <code style={{ fontSize: 12, color: '#6b665d' }}>
                  {t.fontFamily} · {t.fontSize}px · weight {t.fontWeight} · line height {t.lineHeight}px
                </code>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Frames</h2>
          {frames.docs.map((f) =>
            f.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={f.id} src={f.url} alt={f.alt} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
            ) : null,
          )}
        </section>
      </div>
    </div>
  )
}
