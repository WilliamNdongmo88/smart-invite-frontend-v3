// ── Modèles d'édition du composant WeddingDetails ──────────────────

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

export interface WeddingDetailsHeroContent {
  brideFirstName: string;
  groomFirstName: string;
  dateLabel: string;
  venueName: string;
  venueCity: string;
  heroCatchphrase: string;
  targetDate: string; // ISO string pour le countdown
  maxGuests: number;  // nombre max d'invités (saisi dans le wizard)
  budget: string;     // montant calculé automatiquement (maxGuests × 52 XAF)
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
  date: string;      // YYYY-MM-DD — sert au tri chronologique
  label: string;     // ex : "Vendredi 7 Août 2026 · La Veille"
  tabIcon: string;   // ex : "☾"
  tabDate: string;   // ex : "07 AOÛT"
  tabLabel: string;  // ex : "La Veille"
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
  large: boolean; // true = occupe 2 rangées (effet mosaïque)
}

export interface WeddingDetailsGalleryContent {
  items: WeddingDetailsGalleryItem[];
}

export interface WeddingDetailsBackgroundsContent {
  hero: string;        // .hero-section
  venue: string;       // .band-venue
  quote: string;       // .band-quote
  galleryBand: string; // .gallery-close-band
  rsvp: string;        // .rsvp-section
}

export interface WeddingDetailsFooterContent {
  logoText: string;  // ex : "Leatitia & Christophe"
  subText: string;   // ex : "08 Août 2026 · Ma Cabane Au Canada · Rennes"
  loveText: string;  // ex : "AVEC TOUT NOTRE AMOUR ❤"
}

export interface WeddingDetailsContent {
  hero: WeddingDetailsHeroContent;
  couple: WeddingDetailsCoupleContent;
  story: WeddingDetailsStoryContent;
  program: WeddingDetailsProgramContent;
  dressCode: WeddingDetailsDressCodeContent;
  faq: WeddingDetailsFaqContent;
  rsvp: WeddingDetailsRsvpContent;
  gallery: WeddingDetailsGalleryContent;
  backgrounds: WeddingDetailsBackgroundsContent;
  footer: WeddingDetailsFooterContent;
}

// Section names for the edit modal tabs
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
  | 'footer';

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
};
