// ── Modèles d'édition du composant GalaDetails ──────────────────────

export interface GalaDetailsProgramItem {
  icon: string;
  time: string;      // ex : "19h00 – 20h00"
  title: string;
  desc: string;
}

export interface GalaDetailsPerformer {
  name: string;
  role: string;       // ex : "Chanteuse principale", "DJ", "Orchestre"
  bio: string;
  portraitUrl: string;
}

export interface GalaDetailsTableItem {
  number: string;     // ex : "Table 1"
  label: string;      // ex : "VIP"
  capacity: number;
}

export interface GalaDetailsFaqItem {
  q: string;
  a: string;
}

export interface GalaDetailsGalleryItem {
  url: string;
  caption: string;
  large: boolean;
}

// ── Sections de contenu ────────────────────────────────────────────

export interface GalaDetailsHeroContent {
  title: string;           // ex : "Gala de Charité 2026"
  subtitle: string;        // ex : "Une soirée d'exception au profit de l'éducation"
  edition: string;         // ex : "3ème édition"
  dateLabel: string;       // ex : "Samedi 28 Novembre 2026"
  venueName: string;       // ex : "GRAND HÔTEL IVOIRE"
  venueCity: string;       // ex : "ABIDJAN"
  catchphrase: string;     // ex : "Élégance, générosité et partage."
  dressCode: string;       // ex : "Tenue de soirée exigée"
  targetDate: string;      // ISO pour le countdown
  maxGuests: number;
  budget: string;
}

export interface GalaDetailsAboutContent {
  headline: string;
  description: string;
  cause: string;            // ex : "100% des bénéfices reversés à l'ONG..."
  causeIcon: string;        // ex : "🎗️"
}

export interface GalaDetailsProgramContent {
  headline: string;
  items: GalaDetailsProgramItem[];
  footer: string;
}

export interface GalaDetailsPerformersContent {
  headline: string;
  subheadline: string;
  performers: GalaDetailsPerformer[];
}

export interface GalaDetailsDressCodeContent {
  title: string;
  description: string;
  advice: string;
  swatches: { color: string; label: string }[];
}

export interface GalaDetailsFaqContent {
  items: GalaDetailsFaqItem[];
}

export interface GalaDetailsRsvpContent {
  title: string;
  subtitle: string;
}

export interface GalaDetailsGalleryContent {
  items: GalaDetailsGalleryItem[];
}

export interface GalaDetailsBackgroundsContent {
  hero: string;
  about: string;
  programBand: string;
  rsvp: string;
}

export interface GalaDetailsFooterContent {
  logoText: string;    // ex : "Gala de Charité 2026"
  subText: string;     // ex : "28 Nov 2026 · Grand Hôtel Ivoire · Abidjan"
  tagline: string;     // ex : "UNE SOIRÉE, UNE CAUSE, DES SOUVENIRS"
}

// ── Conteneur principal ───────────────────────────────────────────
export interface GalaDetailsContent {
  hero: GalaDetailsHeroContent;
  about: GalaDetailsAboutContent;
  program: GalaDetailsProgramContent;
  performers: GalaDetailsPerformersContent;
  dressCode: GalaDetailsDressCodeContent;
  faq: GalaDetailsFaqContent;
  rsvp: GalaDetailsRsvpContent;
  gallery: GalaDetailsGalleryContent;
  backgrounds: GalaDetailsBackgroundsContent;
  footer: GalaDetailsFooterContent;
}

// ── Onglets d'édition ─────────────────────────────────────────────
export type GalaDetailsEditSection =
  | 'hero'
  | 'about'
  | 'program'
  | 'performers'
  | 'dressCode'
  | 'faq'
  | 'rsvp'
  | 'gallery'
  | 'backgrounds'
  | 'footer';

export const GALA_DETAILS_SECTION_LABELS: Record<GalaDetailsEditSection, string> = {
  hero:       'Hero & Date',
  about:      'À Propos',
  program:    'Programme',
  performers: 'Artistes',
  dressCode:  'Dress Code',
  faq:        'FAQ',
  rsvp:       'RSVP',
  gallery:    'Galerie',
  backgrounds:'Fonds & Bandeaux',
  footer:     'Footer',
};

// ── Tri chronologique des items programme ─────────────────────────
export function sortProgramItems(items: GalaDetailsProgramItem[]): GalaDetailsProgramItem[] {
  return [...items].sort((a, b) => a.time.localeCompare(b.time));
}
