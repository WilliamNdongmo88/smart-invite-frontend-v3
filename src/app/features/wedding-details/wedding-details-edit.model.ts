// ── Modèles d'édition du composant WeddingDetails ──────────────────

// ── Éléments atomiques ────────────────────────────────────────────
export interface WeddingDetailsChapter {
  label: string;
  sublabel: string;
  year: string;
  title: string;
  caption: string;
  image: string;
  paragraphs: string[];
}

export interface WeddingDetailsProgramItem {
  icon: string;
  time: string;
  title: string;
  desc: string;
}

export interface WeddingDetailsFaqItem {
  q: string;
  a: string;
}

export interface WeddingDetailsPaletteItem {
  color: string;
  label: string;
}

// ── Thème visuel personnalisable ──────────────────────────────────
/**
 * Mappe vers les CSS custom properties déclarées dans :host du composant :
 *   colorBackground     → --ivory      (fond page)
 *   colorAccent         → --gold       (titres, séparateurs, bordures)
 *   colorAccentSecondary→ --terracotta (boutons CTA)
 *   colorAccentDeep     → --terracotta-deep (hover boutons)
 *   colorText           → --ink        (texte principal)
 *   colorTextSecondary  → --text-secondary
 *   colorCardBg         → --card-bg    (cartes, surfaces)
 */
export interface WeddingDetailsTheme {
  /** Identifiant de la palette prédéfinie, ou 'custom' */
  preset:               string;
  colorBackground:      string;  // --ivory
  colorAccent:          string;  // --gold
  colorAccentSecondary: string;  // --terracotta
  colorAccentDeep:      string;  // --terracotta-deep
  colorText:            string;  // --ink
  colorTextSecondary:   string;  // --text-secondary
  colorCardBg:          string;  // --card-bg
  colorSectionBg:       string;  // --section-bg  (sections alternées)
  colorSurface:         string;  // --surface      (cartes, FAQ, inputs)
  overlayColor:         string;  // --overlay-color (RGB pour rgba())
}

export interface WeddingThemePreset {
  id:              string;
  name:            string;
  description:     string;
  badge:           string;
  primaryColor:    string;   // → colorAccent
  secondaryColor:  string;   // → colorAccentSecondary
  secondaryDeep:   string;   // → colorAccentDeep
  backgroundColor: string;   // → colorBackground
  cardBackground:  string;   // → colorCardBg
  sectionBg:       string;   // → colorSectionBg
  surfaceBg:       string;   // → colorSurface
  textColor:       string;   // → colorText
  textSecondary:   string;   // → colorTextSecondary
  swatches: { color: string; label: string }[];
}

export const WEDDING_THEME_PRESETS: WeddingThemePreset[] = [
  {
    id: 'royal-gold',
    name: 'Royal Noir & Or',
    description: 'Velours sombre & dorures étincelantes — le classique intemporel',
    badge: '👑',
    primaryColor:    '#d4af37',
    secondaryColor:  '#ffd97d',
    secondaryDeep:   '#9e7b25',
    backgroundColor: '#0d0b10',
    cardBackground:  '#18141c',
    sectionBg:       '#120e17',
    surfaceBg:       '#18141c',
    textColor:       '#fdfaf6',
    textSecondary:   '#c8beaf',
    swatches: [
      { color: '#d4af37', label: 'Or Impérial' },
      { color: '#ffd97d', label: 'Champagne' },
      { color: '#9e7b25', label: 'Or Brossé' },
      { color: '#0d0b10', label: 'Noir Velours' },
    ],
  },
  {
    id: 'ivory-silk',
    name: 'Blanc Soie & Or',
    description: 'Pureté immaculée et or lumineux — mariage de jour classique',
    badge: '🕊️',
    primaryColor:    '#b8860b',
    secondaryColor:  '#c9a861',
    secondaryDeep:   '#8d6128',
    backgroundColor: '#fdfaf2',
    cardBackground:  '#fff8f0',
    sectionBg:       '#f5efe2',
    surfaceBg:       '#fff8f0',
    textColor:       '#2d241b',
    textSecondary:   '#6d5a4a',
    swatches: [
      { color: '#b8860b', label: 'Or Antique' },
      { color: '#c9a861', label: 'Or Lumineux' },
      { color: '#f3ede2', label: 'Soie Crème' },
      { color: '#fdfaf2', label: 'Ivoire' },
    ],
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold & Glamour',
    description: 'Douceur rose et reflets cuivrés — moderne et glamour',
    badge: '🌸',
    primaryColor:    '#c9748e',
    secondaryColor:  '#e0848a',
    secondaryDeep:   '#8b3a52',
    backgroundColor: '#1a0d12',
    cardBackground:  '#2b1520',
    sectionBg:       '#200f18',
    surfaceBg:       '#2b1520',
    textColor:       '#fdf6f8',
    textSecondary:   '#c8a8b0',
    swatches: [
      { color: '#c9748e', label: 'Rose Gold' },
      { color: '#f4b8c8', label: 'Poudre' },
      { color: '#8b3a52', label: 'Framboise' },
      { color: '#ffe4ec', label: 'Blush' },
    ],
  },
  {
    id: 'emerald-gold',
    name: 'Émeraude & Or',
    description: 'Verdure luxuriante et éclats dorés — raffiné et naturel',
    badge: '🌿',
    primaryColor:    '#d4af37',
    secondaryColor:  '#2ecc71',
    secondaryDeep:   '#1a8a4a',
    backgroundColor: '#061a14',
    cardBackground:  '#0b2b22',
    sectionBg:       '#07201a',
    surfaceBg:       '#0b2b22',
    textColor:       '#f0fdf4',
    textSecondary:   '#a7c5b5',
    swatches: [
      { color: '#2ecc71', label: 'Émeraude' },
      { color: '#d4af37', label: 'Or Pur' },
      { color: '#1b4332', label: 'Vert Forêt' },
      { color: '#a7c957', label: 'Sauge Dorée' },
    ],
  },
  {
    id: 'burgundy-rose',
    name: 'Bordeaux & Or Rose',
    description: 'Passion profonde et douceur rosée — romantique et intense',
    badge: '🍷',
    primaryColor:    '#e07a5f',
    secondaryColor:  '#f4a261',
    secondaryDeep:   '#b85c3f',
    backgroundColor: '#18090f',
    cardBackground:  '#28101a',
    sectionBg:       '#1e0c14',
    surfaceBg:       '#28101a',
    textColor:       '#fff0ec',
    textSecondary:   '#c8a090',
    swatches: [
      { color: '#800f2f', label: 'Bordeaux' },
      { color: '#e07a5f', label: 'Or Rose' },
      { color: '#f4a261', label: 'Pêche Dorée' },
      { color: '#590d22', label: 'Prune Sombre' },
    ],
  },
  {
    id: 'sapphire-navy',
    name: 'Bleu Nuit & Saphir',
    description: 'Ciel étoilé et reflets argentés — élégance mystérieuse',
    badge: '🌌',
    primaryColor:    '#38bdf8',
    secondaryColor:  '#93c5fd',
    secondaryDeep:   '#1d6fad',
    backgroundColor: '#060d1e',
    cardBackground:  '#0c1734',
    sectionBg:       '#08102a',
    surfaceBg:       '#0c1734',
    textColor:       '#f0f8ff',
    textSecondary:   '#94b8d4',
    swatches: [
      { color: '#1d4ed8', label: 'Bleu Saphir' },
      { color: '#38bdf8', label: 'Cyan Céleste' },
      { color: '#e2e8f0', label: 'Argent' },
      { color: '#0f172a', label: 'Nuit Profonde' },
    ],
  },
  {
    id: 'lavender-dream',
    name: 'Lavande & Violet',
    description: 'Nuances féeriques et dorures champêtres — romantisme fleuri',
    badge: '💜',
    primaryColor:    '#c77dff',
    secondaryColor:  '#e0aaff',
    secondaryDeep:   '#8b4fc5',
    backgroundColor: '#120d1c',
    cardBackground:  '#1f162e',
    sectionBg:       '#170f24',
    surfaceBg:       '#1f162e',
    textColor:       '#faf5ff',
    textSecondary:   '#c4a8d8',
    swatches: [
      { color: '#9d4edd', label: 'Améthyste' },
      { color: '#c77dff', label: 'Lavande' },
      { color: '#e0aaff', label: 'Lilas Soie' },
      { color: '#ffd97d', label: 'Éclat Doré' },
    ],
  },
  {
    id: 'terracotta-warm',
    name: 'Terracotta & Cannelle',
    description: 'Chaleur de la terre et épices dorées — boho chic',
    badge: '🏺',
    primaryColor:    '#c9a961',
    secondaryColor:  '#b65a3a',
    secondaryDeep:   '#8d4128',
    backgroundColor: '#fffaf2',
    cardBackground:  '#fff4e6',
    sectionBg:       '#f5ede0',
    surfaceBg:       '#fff4e6',
    textColor:       '#2d241b',
    textSecondary:   '#6d5a4a',
    swatches: [
      { color: '#b65a3a', label: 'Terracotta' },
      { color: '#8d4128', label: 'Sienne' },
      { color: '#d58a67', label: 'Pêche' },
      { color: '#c9a961', label: 'Or Doux' },
    ],
  },
];

/** Thème par défaut — Royal Noir & Or (correspond aux variables CSS actuelles) */
export const DEFAULT_WEDDING_THEME: WeddingDetailsTheme = {
  preset:               'royal-gold',
  colorBackground:      '#0d0b10',
  colorAccent:          '#d4af37',
  colorAccentSecondary: '#ffd97d',
  colorAccentDeep:      '#9e7b25',
  colorText:            '#fdfaf6',
  colorTextSecondary:   '#c8beaf',
  colorCardBg:          '#18141c',
  colorSectionBg:       '#120e17',
  colorSurface:         '#18141c',
  overlayColor:         '13, 11, 16',
};

// ── Sections de contenu ───────────────────────────────────────────
export interface WeddingDetailsHeroContent {
  brideFirstName: string;
  groomFirstName: string;
  dateLabel: string;
  venueName: string;
  venueCity: string;
  heroCatchphrase: string;
  targetDate: string;
  maxGuests: number;
  budget: string;
}

export interface WeddingDetailsCoupleContent {
  bridePortraitUrl: string;
  brideBio: string;
  groomPortraitUrl: string;
  groomBio: string;
  coupleTagline: string;
}

export interface WeddingDetailsStoryContent {
  headline: string;
  subheadline: string;
  chapters: WeddingDetailsChapter[];
  footer: string;
}

export interface WeddingDetailsProgramDay {
  date: string;
  label: string;
  tabIcon: string;
  tabDate: string;
  tabLabel: string;
  items: WeddingDetailsProgramItem[];
}

export interface WeddingDetailsProgramContent {
  days: WeddingDetailsProgramDay[];
  footer: string;
}

export interface WeddingDetailsDressCodeContent {
  title: string;
  description: string;
  advice: string;
  paletteTerracotta: WeddingDetailsPaletteItem[];
  paletteChampagne: WeddingDetailsPaletteItem[];
}

export interface WeddingDetailsFaqContent {
  items: WeddingDetailsFaqItem[];
}

export interface WeddingDetailsRsvpContent {
  title: string;
  subtitle: string;
}

export interface WeddingDetailsGalleryItem {
  url: string;
  caption: string;
  large: boolean;
}

export interface WeddingDetailsGalleryContent {
  items: WeddingDetailsGalleryItem[];
}

export interface WeddingDetailsBackgroundsContent {
  hero: string;
  venue: string;
  quote: string;
  galleryBand: string;
  rsvp: string;
}

export interface WeddingDetailsFooterContent {
  logoText: string;
  subText: string;
  loveText: string;
}

// ── Conteneur principal ───────────────────────────────────────────
export interface WeddingDetailsContent {
  hero:        WeddingDetailsHeroContent;
  couple:      WeddingDetailsCoupleContent;
  story:       WeddingDetailsStoryContent;
  program:     WeddingDetailsProgramContent;
  dressCode:   WeddingDetailsDressCodeContent;
  faq:         WeddingDetailsFaqContent;
  rsvp:        WeddingDetailsRsvpContent;
  gallery:     WeddingDetailsGalleryContent;
  backgrounds: WeddingDetailsBackgroundsContent;
  footer:      WeddingDetailsFooterContent;
  theme:       WeddingDetailsTheme;
}

// ── Onglets d'édition ─────────────────────────────────────────────
export type WeddingDetailsEditSection =
  | 'hero'
  | 'couple'
  | 'story'
  | 'program'
  | 'dressCode'
  | 'faq'
  | 'rsvp'
  | 'gallery'
  | 'backgrounds'
  | 'footer'
  | 'theme';

export const WEDDING_DETAILS_SECTION_LABELS: Record<WeddingDetailsEditSection, string> = {
  hero:        'Hero & Date',
  couple:      'Le Couple',
  story:       'Notre Histoire',
  program:     'Programme',
  dressCode:   'Dress Code',
  faq:         'FAQ',
  rsvp:        'RSVP',
  gallery:     'Galerie Photos',
  backgrounds: 'Fonds & Bandeaux',
  footer:      'Footer',
  theme:       '🎨 Thème',
};
