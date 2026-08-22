// ── Modèles d'édition de la page Home ──────────────────────────────

export interface HomeChapter {
  label: string;
  sublabel: string;
  year: string;
  title: string;
  caption: string;
  image: string;
  paragraphs: string[];
}

export interface HomeProgramItem {
  icon: string;
  time: string;
  title: string;
  desc: string;
}

export interface HomeFaqItem {
  q: string;
  a: string;
}

export interface HomePaletteItem {
  color: string;
  label: string;
}

export interface HomeHeroContent {
  brideFirstName: string;
  groomFirstName: string;
  dateLabel: string;
  venueName: string;
  venueCity: string;
  heroCatchphrase: string;
  targetDate: string; // ISO string pour le countdown
}

export interface HomeCoupleContent {
  bridePortraitUrl: string;
  brideBio: string;
  groomPortraitUrl: string;
  groomBio: string;
  coupleTagline: string;
}

export interface HomeStoryContent {
  headline: string;
  subheadline: string;
  chapters: HomeChapter[];
  footer: string;
}

export interface HomeProgramDay {
  date: string;           // YYYY-MM-DD — sert au tri chronologique
  label: string;          // ex : "Vendredi 7 Août 2026 · La Veille"
  tabIcon: string;        // ex : "☾"
  tabDate: string;        // ex : "07 AOÛT"
  tabLabel: string;       // ex : "La Veille"
  items: HomeProgramItem[];
}

export interface HomeProgramContent {
  days: HomeProgramDay[];
  footer: string;
}

export interface HomeDressCodeContent {
  title: string;
  description: string;
  advice: string;
  paletteTerracotta: HomePaletteItem[];
  paletteChampagne: HomePaletteItem[];
}

export interface HomeFaqContent {
  items: HomeFaqItem[];
}

export interface HomeRsvpContent {
  title: string;
  subtitle: string;
}

export interface HomeGalleryItem {
  url: string;
  caption: string;
  large: boolean; // true = occupe 2 rangées (effet mosaïque)
}

export interface HomeGalleryContent {
  items: HomeGalleryItem[];
}

export interface HomeContent {
  hero: HomeHeroContent;
  couple: HomeCoupleContent;
  story: HomeStoryContent;
  program: HomeProgramContent;
  dressCode: HomeDressCodeContent;
  faq: HomeFaqContent;
  rsvp: HomeRsvpContent;
  gallery: HomeGalleryContent;
}

// Section names for the edit modal tabs
export type EditSection =
  | 'hero'
  | 'couple'
  | 'story'
  | 'program'
  | 'dressCode'
  | 'faq'
  | 'rsvp'
  | 'gallery';

export const EDIT_SECTION_LABELS: Record<EditSection, string> = {
  hero:      'Hero & Date',
  couple:    'Le Couple',
  story:     'Notre Histoire',
  program:   'Programme',
  dressCode: 'Dress Code',
  faq:       'FAQ',
  rsvp:      'RSVP',
  gallery:   'Galerie Photos',
};
