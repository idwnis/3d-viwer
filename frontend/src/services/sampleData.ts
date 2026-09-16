export interface SampleImage {
  id: string;
  name: string;
  category: string;
  dataUrl: string;
}

/**
 * Procedurally generates SVG data URLs for instant offline demo samples
 */
function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'chair',
    name: 'صندلی مدرن',
    category: 'مبلمان و دکوراسیون',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#1e293b"/>
        <defs>
          <radialGradient id="chairGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </radialGradient>
        </defs>
        <!-- Backrest -->
        <rect x="130" y="80" width="140" height="120" rx="20" fill="url(#chairGrad)" stroke="#0284c7" stroke-width="4"/>
        <!-- Seat cushion -->
        <ellipse cx="200" cy="220" rx="90" ry="35" fill="url(#chairGrad)" stroke="#0284c7" stroke-width="4"/>
        <!-- Legs -->
        <line x1="140" y1="240" x2="110" y2="340" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
        <line x1="260" y1="240" x2="290" y2="340" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
        <line x1="170" y1="240" x2="160" y2="320" stroke="#64748b" stroke-width="6" stroke-linecap="round"/>
        <line x1="230" y1="240" x2="240" y2="320" stroke="#64748b" stroke-width="6" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    id: 'sneaker',
    name: 'کفش ورزشی',
    category: 'پوشاک و مد',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#0f172a"/>
        <defs>
          <linearGradient id="shoeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ec4899"/>
            <stop offset="50%" stop-color="#8b5cf6"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
        <!-- Shoe upper -->
        <path d="M 80 230 C 90 180, 140 140, 200 150 C 230 155, 270 190, 310 230 C 330 250, 330 270, 310 275 C 260 280, 100 280, 80 270 Z" fill="url(#shoeGrad)" stroke="#cbd5e1" stroke-width="3"/>
        <!-- Sole -->
        <path d="M 70 270 C 130 265, 260 265, 325 270 C 335 285, 320 300, 300 300 C 240 300, 110 300, 70 295 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
        <!-- Laces -->
        <line x1="180" y1="180" x2="220" y2="195" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
        <line x1="190" y1="195" x2="230" y2="210" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
        <line x1="200" y1="210" x2="240" y2="225" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    id: 'vase',
    name: 'گلدان سرامیکی',
    category: 'صنایع دستی و هنر',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#18181b"/>
        <defs>
          <linearGradient id="vaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="40%" stop-color="#fef3c7"/>
            <stop offset="70%" stop-color="#d97706"/>
            <stop offset="100%" stop-color="#78350f"/>
          </linearGradient>
        </defs>
        <!-- Lip -->
        <ellipse cx="200" cy="90" rx="45" ry="12" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
        <!-- Neck and Body -->
        <path d="M 155 90 C 165 140, 120 180, 120 250 C 120 310, 160 330, 200 330 C 240 330, 280 310, 280 250 C 280 180, 235 140, 245 90 Z" fill="url(#vaseGrad)"/>
        <!-- Base -->
        <ellipse cx="200" cy="330" rx="55" ry="12" fill="#b45309"/>
      </svg>
    `)
  },
  {
    id: 'robot',
    name: 'نشان رباتیک',
    category: 'طراحی مهندسی',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#090d16"/>
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#047857"/>
          </linearGradient>
        </defs>
        <!-- Shield crest -->
        <path d="M 200 70 L 290 120 C 290 230, 240 300, 200 330 C 160 300, 110 230, 110 120 Z" fill="url(#shieldGrad)" stroke="#34d399" stroke-width="5"/>
        <!-- Gear core -->
        <circle cx="200" cy="190" r="40" fill="#0f172a" stroke="#6ee7b7" stroke-width="4"/>
        <circle cx="200" cy="190" r="16" fill="#34d399"/>
      </svg>
    `)
  }
];
