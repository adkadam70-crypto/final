import { ImageResponse } from 'next/og'

export const alt = 'Shortlisted — College Predictor'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Approximate hex equivalents of the app's oklch theme tokens — this render
// pipeline (satori) doesn't have access to globals.css, so the palette is
// duplicated here rather than shared.
const BG = '#0a0e12'
const TEAL = '#2dd4bf'
const MUTED = '#9ca3af'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: BG,
          backgroundImage: `radial-gradient(circle at 8% 40%, rgba(45,212,191,0.35) 0%, rgba(10,14,18,0) 60%)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 84,
              height: 84,
              borderRadius: 24,
              backgroundColor: TEAL,
              color: BG,
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            ✦
          </div>
          <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, color: 'white' }}>Shortlisted</div>
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: TEAL, fontWeight: 600, marginBottom: 18 }}>
          College Admission Predictor
        </div>
        <div style={{ display: 'flex', fontSize: 27, color: MUTED }}>
          US · UK · Australia · Singapore · Hong Kong · India
        </div>
      </div>
    ),
    { ...size },
  )
}
