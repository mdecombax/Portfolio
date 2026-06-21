import { Html } from '@react-three/drei'

// Pour ajouter une zone : 1) ZONE_PANELS  2) ZONE_POSITIONS  3) ZONE_VIEWS dans CameraController
const ZONE_PANELS = {
  // Bureau / TV — apps web fonctionnelles (outils, IA, scraping)
  screen: {
    title: 'apps & outils',
    items: [
      { id: 'finolio',      label: 'Finolio',              desc: 'Suivi de portefeuille DCA ETF',          url: 'https://finolio.fr/',
        caseStudy: { label: 'étude technique — Import IA (Vertex AI)', url: 'https://github.com/mdecombax/suivi-finance/blob/main/docs/ai-import/README.md' } },
      { id: 'flightscrape', label: 'FlightScrape',         desc: 'Meilleur prix pour un vol flexible',     url: 'https://flightscrape-437494083751.europe-west1.run.app/' },
      { id: 'autocast',     label: 'AutoCast Chess',       desc: "Commentaire audio d'une partie chess.com", url: 'https://autocastchess-855080868600.europe-west1.run.app/' },
      { id: 'avismaps',     label: 'Avis Maps',            desc: 'Avis Google Maps + analyse de prospects', url: 'https://avis-maps-app-74733590596.europe-west1.run.app/' },
      { id: 'newsletter',   label: 'Newsletter Reddit',    desc: 'Newsletter générée depuis tes subreddits', url: 'https://first-finale-fgjotolufq-ew.a.run.app/static/' },
      { id: 'wikiloc',      label: 'Wikiloc Search',       desc: 'Recherche sémantique de randonnées',     url: 'https://wikiloc-search-uzi6vittua-ew.a.run.app' },
    ],
  },
  // Téléphone (lit) — expériences 3D / data-art
  phone: {
    title: 'expériences 3d',
    items: [
      { id: 'terresite',     label: 'TerreSite',             desc: 'Globe terrestre 3D manipulable',        url: 'https://mdecombax.github.io/TerreSite/' },
      { id: 'constellation', label: 'Constellation Finance', desc: 'Données financières en constellation 3D', url: 'https://mdecombax.github.io/constellation_finance/' },
    ],
  },
  // Table de chevet — sites vitrine / web design
  drawer: {
    title: 'sites vitrine',
    items: [
      { id: 'linda',  label: 'Portfolio Linda', desc: "Portfolio web à l'identité originale", url: 'https://portfolio-linda-one.vercel.app/' },
      { id: 'casa',   label: 'Site Casa',       desc: "Site 3D d'agence immobilière",         url: 'https://mdecombax.github.io/SiteWebCasa/' },
      { id: 'enso',   label: 'ENSO',            desc: 'Café artisanal japonais, expérience soignée', url: 'https://mdecombax.github.io/Cafe/' },
      { id: 'dumain', label: 'Dumain',          desc: "Site d'entreprise aux effets 3D",      url: 'https://mdecombax.github.io/Dumain/' },
    ],
  },
}

const ZONE_POSITIONS = {
  screen: [-0.95, -0.05, -0.65],
  phone:  [0.6, -0.3, -0.9],
  drawer: [-1.05, -0.72, 2.05],
}

export default function ProjectCard({ focusedZone, zoomReady }) {
  if (!focusedZone || !zoomReady) return null

  const panel = ZONE_PANELS[focusedZone.zone]
  if (!panel) return null

  const pos = ZONE_POSITIONS[focusedZone.zone] ?? [
    focusedZone.position.x,
    focusedZone.position.y + 0.4,
    focusedZone.position.z,
  ]

  return (
    <Html
      position={pos}
      center
      distanceFactor={1.5}
      zIndexRange={[100, 0]}
    >
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pc-item { transition: background 0.15s, padding-left 0.15s; border-radius: 3px; }
        .pc-item:hover { background: rgba(170, 200, 255, 0.06); padding-left: 8px; }
        .pc-item:hover .pc-label { color: #ff9944; }
        .pc-desc {
          max-height: 0; opacity: 0; margin-top: 0; overflow: hidden;
          transition: max-height 0.22s ease, opacity 0.18s ease, margin-top 0.22s ease;
        }
        .pc-item:hover .pc-desc { max-height: 36px; opacity: 1; margin-top: 4px; color: rgba(200, 214, 240, 0.72); }
        .pc-item:hover .pc-arrow { opacity: 1; transform: translateX(0); }
        .pc-case {
          max-height: 0; opacity: 0; margin-top: 0; overflow: hidden;
          transition: max-height 0.22s ease, opacity 0.18s ease, margin-top 0.22s ease;
        }
        .pc-item:hover .pc-case { max-height: 30px; opacity: 1; margin-top: 6px; }
        .pc-case-link { color: rgba(255, 153, 68, 0.7); transition: color 0.15s; }
        .pc-case-link:hover { color: #ff9944; }
      `}</style>
      <div
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
        style={{
          animation: 'cardIn 0.22s ease-out forwards',
          background: 'rgba(5, 5, 15, 0.9)',
          border: '1px solid rgba(170, 200, 255, 0.22)',
          borderRadius: '4px',
          padding: '16px 22px',
          fontFamily: 'monospace',
          color: '#c8d6f0',
          minWidth: '210px',
          maxWidth: '260px',
          userSelect: 'none',
          pointerEvents: 'auto',
        }}
      >
        <div style={{
          fontSize: '0.58rem',
          letterSpacing: '0.22em',
          color: '#ff9944',
          textTransform: 'uppercase',
          marginBottom: '10px',
          opacity: 0,
          animation: 'fadeUp 0.2s ease-out 0.15s forwards',
        }}>
          {panel.title}
        </div>

        {panel.items.map((item, i) => (
          <div
            key={item.id}
            className="pc-item"
            onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
            style={{
              padding: '8px 0',
              borderBottom: i < panel.items.length - 1 ? '1px solid rgba(170, 200, 255, 0.1)' : 'none',
              cursor: 'pointer',
              opacity: 0,
              animation: `fadeUp 0.2s ease-out ${0.25 + i * 0.08}s forwards`,
            }}
          >
            <div
              className="pc-label"
              style={{
                fontSize: '0.74rem',
                letterSpacing: '0.06em',
                color: '#c8d6f0',
                transition: 'color 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {item.label}
              <span
                className="pc-arrow"
                style={{
                  fontSize: '0.62rem',
                  color: '#ff9944',
                  opacity: 0,
                  transform: 'translateX(-3px)',
                  transition: 'opacity 0.15s, transform 0.15s',
                }}
              >
                ↗
              </span>
            </div>
            <div
              className="pc-desc"
              style={{
                fontSize: '0.55rem',
                letterSpacing: '0.02em',
                lineHeight: 1.35,
                color: 'rgba(200, 214, 240, 0.42)',
              }}
            >
              {item.desc}
            </div>
            {item.caseStudy && (
              <div
                className="pc-case"
                onClick={e => {
                  e.stopPropagation()
                  window.open(item.caseStudy.url, '_blank', 'noopener,noreferrer')
                }}
              >
                <span
                  className="pc-case-link"
                  style={{
                    fontSize: '0.54rem',
                    letterSpacing: '0.02em',
                    lineHeight: 1.3,
                  }}
                >
                  ↗ {item.caseStudy.label}
                </span>
              </div>
            )}
          </div>
        ))}

        <div style={{
          marginTop: '12px',
          fontSize: '0.52rem',
          letterSpacing: '0.14em',
          color: 'rgba(200, 214, 240, 0.35)',
          textTransform: 'uppercase',
          opacity: 0,
          animation: `fadeUp 0.2s ease-out ${0.25 + panel.items.length * 0.08}s forwards`,
        }}>
          esc pour fermer
        </div>
      </div>
    </Html>
  )
}
