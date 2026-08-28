// ── Modèles d'édition du composant ConferenceDetails ───────────────

// ── Éléments de base ─────────────────────────────────────────────
export interface ConferenceDetailsSpeaker {
  name: string;
  title: string;        // ex : "Directeur Innovation"
  company: string;
  bio: string;
  portraitUrl: string;
  isKeynote: boolean;
}

export interface ConferenceDetailsSession {
  icon: string;
  time: string;         // ex : "09h00 – 10h30"
  title: string;
  speaker: string;      // nom du/des intervenant(s)
  room: string;         // ex : "Salle Plénière A"
  type: 'keynote' | 'workshop' | 'panel' | 'networking' | 'break';
}

export interface ConferenceDetailsFaqItem {
  q: string;
  a: string;
}

export interface ConferenceDetailsSponsor {
  name: string;
  logoUrl: string;
  level: 'platine' | 'or' | 'argent';
  websiteUrl: string;
}

// ── Sections de contenu ───────────────────────────────────────────

export interface ConferenceDetailsHeroContent {
  title: string;             // ex : "Tech Summit 2026"
  subtitle: string;          // ex : "L'innovation au cœur de demain"
  edition: string;           // ex : "5ème édition"
  dateLabel: string;         // ex : "15 & 16 Septembre 2026"
  venueName: string;         // ex : "PALAIS DES CONGRÈS"
  venueCity: string;         // ex : "ABIDJAN"
  catchphrase: string;       // ex : "Connecter les esprits, accélérer les idées."
  targetDate: string;        // ISO pour le countdown
  maxAttendees: number;
  budget: string;            // calculé automatiquement
}

export interface ConferenceDetailsAboutContent {
  headline: string;
  description: string;
  stats: ConferenceDetailsStatItem[];
}

export interface ConferenceDetailsStatItem {
  value: string;    // ex : "2 500+"
  label: string;    // ex : "Participants"
  icon: string;     // ex : "👥"
}

export interface ConferenceDetailsDayAgenda {
  date: string;       // YYYY-MM-DD
  label: string;      // ex : "Lundi 15 Septembre 2026 · Jour 1"
  tabIcon: string;    // ex : "📅"
  tabDate: string;    // ex : "15 SEPT"
  tabLabel: string;   // ex : "Jour 1"
  sessions: ConferenceDetailsSession[];
}

export interface ConferenceDetailsAgendaContent {
  days: ConferenceDetailsDayAgenda[];
  footer: string;
}

export interface ConferenceDetailsSpeakersContent {
  headline: string;
  subheadline: string;
  speakers: ConferenceDetailsSpeaker[];
}

export interface ConferenceDetailsSponsorsContent {
  headline: string;
  sponsors: ConferenceDetailsSponsor[];
}

export interface ConferenceDetailsFaqContent {
  items: ConferenceDetailsFaqItem[];
}

export interface ConferenceDetailsRsvpContent {
  title: string;
  subtitle: string;
}

export interface ConferenceDetailsGalleryItem {
  url: string;
  caption: string;
  large: boolean;
}

export interface ConferenceDetailsGalleryContent {
  items: ConferenceDetailsGalleryItem[];
}

export interface ConferenceDetailsBackgroundsContent {
  hero: string;
  about: string;
  agendaBand: string;
  rsvp: string;
}

export interface ConferenceDetailsFooterContent {
  logoText: string;   // ex : "Tech Summit 2026"
  subText: string;    // ex : "15 & 16 Sept · Palais des Congrès · Abidjan"
  tagline: string;    // ex : "L'EXCELLENCE RÉUNIT LES ESPRITS"
}

// ── Conteneur principal ───────────────────────────────────────────
export interface ConferenceDetailsContent {
  hero: ConferenceDetailsHeroContent;
  about: ConferenceDetailsAboutContent;
  agenda: ConferenceDetailsAgendaContent;
  speakers: ConferenceDetailsSpeakersContent;
  sponsors: ConferenceDetailsSponsorsContent;
  faq: ConferenceDetailsFaqContent;
  rsvp: ConferenceDetailsRsvpContent;
  gallery: ConferenceDetailsGalleryContent;
  backgrounds: ConferenceDetailsBackgroundsContent;
  footer: ConferenceDetailsFooterContent;
}

// ── Onglets d'édition ────────────────────────────────────────────
export type ConferenceDetailsEditSection =
  | 'hero'
  | 'about'
  | 'agenda'
  | 'speakers'
  | 'sponsors'
  | 'faq'
  | 'rsvp'
  | 'gallery'
  | 'backgrounds'
  | 'footer';

export const CONFERENCE_DETAILS_SECTION_LABELS: Record<ConferenceDetailsEditSection, string> = {
  hero:        'Hero & Date',
  about:       'À Propos',
  agenda:      'Programme',
  speakers:    'Intervenants',
  sponsors:    'Sponsors',
  faq:         'FAQ',
  rsvp:        'RSVP',
  gallery:     'Galerie',
  backgrounds: 'Fonds & Bandeaux',
  footer:      'Footer',
};

// ── Tri chronologique des jours ───────────────────────────────────
export function sortConferenceDays(days: ConferenceDetailsDayAgenda[]): ConferenceDetailsDayAgenda[] {
  return [...days].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  });
}
