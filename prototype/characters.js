/* Original SVG character illustrations for Calmodoro prototype */

function svgHydrate() {
  return `<svg class="anim-hydrate" viewBox="0 0 128 160" width="128" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Body -->
    <g class="swallow">
      <circle class="person-head" cx="64" cy="42" r="16"/>
      <path d="M52 38 Q64 32 76 38" stroke="#3D2B1F" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="58" cy="40" r="2" fill="#3D2B1F"/>
      <circle cx="70" cy="40" r="2" fill="#3D2B1F"/>
      <path d="M60 48 Q64 52 68 48" stroke="#C07060" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <line class="person-body" x1="64" y1="58" x2="64" y2="110"/>
      <line class="person-body" x1="64" y1="72" x2="44" y2="88"/>
      <line class="person-body" x1="64" y1="72" x2="84" y2="88"/>
      <line class="person-body" x1="64" y1="110" x2="50" y2="140"/>
      <line class="person-body" x1="64" y1="110" x2="78" y2="140"/>
    </g>
    <!-- Cup -->
    <g class="cup">
      <rect x="78" y="78" width="22" height="28" rx="4" fill="#6BA3BE" opacity="0.8"/>
      <rect x="80" y="80" width="18" height="10" rx="2" fill="#4E8AA6"/>
      <path d="M100 86 Q108 86 108 94 Q108 102 100 102" stroke="#6BA3BE" stroke-width="2" fill="none"/>
    </g>
    <!-- Water stream -->
    <path class="water-stream" d="M88 80 Q82 70 68 62" stroke="#6BA3BE" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- Ground -->
    <ellipse cx="64" cy="148" rx="36" ry="4" fill="#7C9A82" opacity="0.2"/>
  </svg>`;
}

function svgBlink() {
  return `<svg class="anim-blink" viewBox="0 0 128 160" width="128" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Face -->
    <circle cx="64" cy="70" r="38" fill="#FFD5A8"/>
    <path d="M38 52 Q64 28 90 52" fill="#6B3A2A"/>
    <!-- Open eyes -->
    <g class="eye-open">
      <ellipse cx="50" cy="68" rx="8" ry="9" fill="white"/>
      <ellipse cx="50" cy="69" rx="4" ry="5" fill="#3D2B1F"/>
      <ellipse cx="78" cy="68" rx="8" ry="9" fill="white"/>
      <ellipse cx="78" cy="69" rx="4" ry="5" fill="#3D2B1F"/>
    </g>
    <!-- Closed eyes -->
    <g class="eye-closed">
      <path d="M42 68 Q50 62 58 68" stroke="#3D2B1F" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M70 68 Q78 62 86 68" stroke="#3D2B1F" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </g>
    <ellipse cx="42" cy="82" rx="6" ry="3" fill="#FF9999" opacity="0.5"/>
    <ellipse cx="86" cy="82" rx="6" ry="3" fill="#FF9999" opacity="0.5"/>
    <path d="M54 90 Q64 98 74 90" stroke="#C07060" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- 20-20-20 hint -->
    <text class="blink-hint" x="64" y="130" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="11" fill="#7C9A82" font-weight="600">Look 20 ft away</text>
    <ellipse cx="64" cy="148" rx="36" ry="4" fill="#7C9A82" opacity="0.2"/>
  </svg>`;
}

function svgStretch() {
  return `<svg class="anim-stretch" viewBox="0 0 128 160" width="128" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g class="torso">
      <circle cx="64" cy="38" r="14" fill="#FFD5A8"/>
      <line x1="64" y1="52" x2="64" y2="100" stroke="#7C9A82" stroke-width="4" stroke-linecap="round"/>
      <line x1="64" y1="100" x2="48" y2="138" stroke="#7C9A82" stroke-width="4" stroke-linecap="round"/>
      <line x1="64" y1="100" x2="80" y2="138" stroke="#7C9A82" stroke-width="4" stroke-linecap="round"/>
    </g>
    <g class="arm-left">
      <line x1="64" y1="68" x2="28" y2="48" stroke="#7C9A82" stroke-width="4" stroke-linecap="round"/>
      <circle cx="26" cy="46" r="5" fill="#7C9A82"/>
    </g>
    <g class="arm-right">
      <line x1="64" y1="68" x2="100" y2="48" stroke="#7C9A82" stroke-width="4" stroke-linecap="round"/>
      <circle cx="102" cy="46" r="5" fill="#7C9A82"/>
    </g>
    <ellipse cx="64" cy="148" rx="36" ry="4" fill="#7C9A82" opacity="0.2"/>
  </svg>`;
}

function svgWalk() {
  return `<svg class="anim-walk" viewBox="0 0 128 160" width="128" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g class="walker">
      <circle cx="68" cy="36" r="14" fill="#FFD5A8"/>
      <line x1="66" y1="50" x2="62" y2="96" stroke="#D4A574" stroke-width="4" stroke-linecap="round"/>
      <g class="arm-left">
        <line x1="64" y1="68" x2="48" y2="58" stroke="#D4A574" stroke-width="4" stroke-linecap="round"/>
      </g>
      <g class="arm-right">
        <line x1="64" y1="68" x2="78" y2="78" stroke="#D4A574" stroke-width="4" stroke-linecap="round"/>
      </g>
      <g class="leg-left">
        <line x1="62" y1="96" x2="44" y2="132" stroke="#D4A574" stroke-width="4" stroke-linecap="round"/>
      </g>
      <g class="leg-right">
        <line x1="62" y1="96" x2="76" y2="128" stroke="#D4A574" stroke-width="4" stroke-linecap="round"/>
      </g>
      <!-- Motion lines -->
      <line x1="20" y1="80" x2="32" y2="80" stroke="#D4A574" stroke-width="2" opacity="0.4" stroke-linecap="round"/>
      <line x1="16" y1="90" x2="30" y2="90" stroke="#D4A574" stroke-width="2" opacity="0.25" stroke-linecap="round"/>
    </g>
    <ellipse cx="64" cy="148" rx="36" ry="4" fill="#D4A574" opacity="0.2"/>
  </svg>`;
}
