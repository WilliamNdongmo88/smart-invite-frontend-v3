// ── Modèles d'édition du composant CeremonieDetails ─────────────────

export interface CeremonieDetailsMoment {
  icon: string;
  time: string;      // ex : "10h00 – 11h00"
  title: string;
  desc: string;
}

export interface CeremonieDetailsGuest {
  name: string;
  role: string;       // ex : "Officiant", "Témoin principal", "Parrain"
  bio: string;
  portraitUrl: string;
}

export interface CeremonieDetailsFaqItem {
  q: string;
  a: string;
}

export interface CeremonieDetailsGalleryItem {
  url: string;
  caption: string;
  large: boolean;
}

// ── Sections ──────────────────────────────────────────────────────

export interface CeremonieDetailsHeroContent {
  type: string;         // ex : "BAPTÊME", "COMMUNION", "REMISE DE DIPLÔMES"
  title: string;        // ex : "Baptême de Léo"
  subtitle: string;     // ex : "Une journée de grâce et de partage"
  dateLabel: string;
  venueName: string;
  venueCity: string;
  catchphrase: string;
  targetDate: string;
  maxGuests: number;
  budget: string;
}

export interface CeremonieDetailsAboutContent {
  headline: string;
  description: string;
  message: string;       // message d'invitation ou de signification
  messageIcon: string;   // ex : "🕊️"
}

export interface CeremonieDetailsProgramContent {
  headline: string;
  moments: CeremonieDetailsMoment[];
  footer: string;
}

export interface CeremonieDetailsKeyGuestsContent {
  headline: string;
  subheadline: string;
  guests: CeremonieDetailsGuest[];
}

export interface CeremonieDetailsDressCodeContent {
  title: string;
  description: string;
  advice: string;
  swatches: { color: string; label: string }[];
}

export interface CeremonieDetailsFaqContent {
  items: CeremonieDetailsFaqItem[];
}

export interface CeremonieDetailsRsvpContent {
  title: string;
  subtitle: string;
}

export interface CeremonieDetailsGalleryContent {
  items: CeremonieDetailsGalleryItem[];
}

export interface CeremonieDetailsBackgroundsContent {
  hero: string;
  about: string;
  programBand: string;
  rsvp: string;
}

export interface CeremonieDetailsFooterContent {
  logoText: string;
  subText: string;
  tagline: string;
}

// ── Conteneur principal ───────────────────────────────────────────
export interface CeremonieDetailsContent {
  hero: CeremonieDetailsHeroContent;
  about: CeremonieDetailsAboutContent;
  program: CeremonieDetailsProgramContent;
  keyGuests: CeremonieDetailsKeyGuestsContent;
  dressCode: CeremonieDetailsDressCodeContent;
  faq: CeremonieDetailsFaqContent;
  rsvp: CeremonieDetailsRsvpContent;
  gallery: CeremonieDetailsGalleryContent;
  backgrounds: CeremonieDetailsBackgroundsContent;
  footer: CeremonieDetailsFooterContent;
}

// ── Onglets d'édition ─────────────────────────────────────────────
export type CeremonieDetailsEditSection =
  | 'hero'
  | 'about'
  | 'program'
  | 'keyGuests'
  | 'dressCode'
  | 'faq'
  | 'rsvp'
  | 'gallery'
  | 'backgrounds'
  | 'footer';

export const CEREMONIE_DETAILS_SECTION_LABELS: Record<CeremonieDetailsEditSection, string> = {
  hero:       'Hero & Date',
  about:      'À Propos',
  program:    'Programme',
  keyGuests:  'Personnes clés',
  dressCode:  'Tenue',
  faq:        'FAQ',
  rsvp:       'RSVP',
  gallery:    'Galerie',
  backgrounds:'Fonds & Bandeaux',
  footer:     'Footer',
};
