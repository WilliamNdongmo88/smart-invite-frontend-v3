# Spécification détaillée de la page d'accueil — chris-line.info

**Site de mariage « L&C — Mariage » (Leatitia & Christophe)**

Document de spécification technique destiné à l'implémentation par une IA. Il décrit fidèlement la page d'accueil du site [https://chris-line.info](https://chris-line.info) telle qu'elle existe aujourd'hui : structure des sections, contenu textuel exact, mise en page, système de design (couleurs, typographies), animations et comportements interactifs.

---

## 1. Vue d'ensemble

Le site est une **page unique (one-page)** au style « luxe chaleureux » mêlant élégance éditoriale et culture ouest-africaine. Il alterne des sections sur fond crème/ivoire et des **bandeaux parallax pleins écran** composés d'une photo avec un overlay brun sombre et un titre serif centré qui apparaît en fondu au défilement. Les technologies d'origine sont **Angular + Tailwind CSS**, mais toute implémentation (React, Vue, HTML/CSS/JS pur) reproduisant le rendu visuel et les interactions conviendra.

| Élément global | Description |
|---|---|
| Titre de la page | « L&C — Mariage » |
| Langue | Français |
| Structure | Page unique avec ancres : `#couple`, `#histoire`, `#evenements`, `#photos`, `#infos`, `#rsvp`, plus une page `/portier` |
| Fond global | Ivoire `#fffaf2` avec deux halos radiaux décoratifs : or `rgba(201,169,97,.18)` en haut à gauche (rayon 36 %) et terracotta `rgba(182,90,58,.14)` en bas à droite (rayon 38 %) |
| Texture | Motifs floraux/feuilles dorés subtils en filigrane dans certaines sections (Photos, Programme) |
| Éléments flottants | Bouton musique (bas droite, fixe) + popup « Cagnotte des Mariés » (bas droite, apparaît au scroll) |
| Date cible du compte à rebours | `2026-08-08T14:00:00` |

---

## 2. Système de design

### 2.1 Palette de couleurs (variables CSS réelles)

Le site définit cinq variables CSS dans `:root`, qui constituent le système de couleur complet :

| Variable | Valeur | Usage |
|---|---|---|
| `--ivory` | `#fffaf2` | Fond principal (ivoire) |
| `--gold` | `#c9a961` | Accents dorés (eyebrows, icônes, séparateurs, timeline) |
| `--terracotta` | `#b65a3a` | Couleur d'accent primaire (boutons, dots timeline, palette) |
| `--terracotta-deep` | `#8d4128` | Variante foncée pour dégradés de boutons |
| `--ink` | `#2d241b` | Texte principal (brun presque noir) |

Couleurs complémentaires utilisées dans les composants : `#2d241e` (fond navigation/cartes sombres), `#ecdcc6` / `#ead8bf` / `#ead7bf` (bordures claires), `#fff8f0` (fond de cartes), `#d4a574` (bordure dorée claire), `#8b7967`, `#6d5a4a`, `#a77544` (textes secondaires), dégradés `linear-gradient(135deg,#b65a3a,#8d4128)` pour les boutons terracotta.

### 2.2 Typographies (Google Fonts, `font-display: swap`)

| Police | Rôles |
|---|---|
| **Cormorant Garamond** (serif, italique 300/400 inclus) | Titres de sections (2.25–3 rem), grandes citations, monogrammes, valeurs du compte à rebours, labels de programme (1.25–1.35 rem italique) |
| **Belleza** (sans-serif) | Corps de texte global (`body`), liens de navigation, boutons, badges (lettres espacées) |
| **Great Vibes** (script calligraphique) | Logo « L&C », le « & » du titre hero, « Leatitia & Christophe » du footer |
| **Josefin Sans** | Quelques micro-labels |

Convention typographique : les eyebrows/badges sont en Belleza, **majuscules, `letter-spacing` 0.16–0.28 em**, tailles 0.65–0.75 rem. Les titres de section sont en Cormorant Garamond. Les citations sont en italique Cormorant Garamond 300.

### 2.3 Motifs récurrents

Le motif décoratif signature est le **cœur « ♡ »** (parfois en doré, utilisé comme séparateur sous les citations). Les séparateurs de bloc sont des lignes fines dorées (1 px, couleur `#d8c2a3`/`#d9af74`). Les boutons sont soit « terracotta solide » (dégradé, texte blanc, arrondi 12–999 px), soit « outline » (bordure claire, fond transparent ou blanc cassé).

---

## 3. Navigation (header sticky)

Barre fixe en haut, fond brun foncé quasi opaque `#2d241ef2` avec `backdrop-filter: blur(12px)` et ombre portée, visible dès le haut de page et restant sticky au défilement.

| Position | Élément | Style |
|---|---|---|
| Gauche | Logo « *L&C* » | Script Great Vibes, doré `#c9a961`, taille ~1.5 rem |
| Centre | Liens d'ancrage : LE COUPLE · NOTRE HISTOIRE · ÉVÉNEMENTS · PHOTOS · INFOS · RSVP | Belleza, 0.75 rem, majuscules, `letter-spacing: .18em`, couleur `#ffffffd9`, soulignage/underline au survol, transition `color .3s` |
| Droite | Bouton « CAGNOTTE TRIBEE » | Pilule (radius 999 px), bordure 1 px `#d4a574`, dégradé terracotta, icône cadeau, 0.72 rem, ombre `#b65a3a59` → lien externe https://tribee.fr/participations/mariage-leatitia-christophe |
| Extrême droite | Lien « PORTIER » | `/portier` (page séparée) |

---

## 4. Sections, dans l'ordre de la page

### 4.1 Hero « Save The Date » (classe `landing-hero wedding-hero`)

Plein écran (`min-height: 100svh`), photo du couple en tenue traditionnelle africaine (tissu bleu brodé, colliers de perles corail) en `background-image: cover` centré, surmontée d'un **overlay dégradé brun sombre** `linear-gradient(180deg,#2b1f16a6,#2b1f16bf)` (z-index 1), contenu centré verticalement (z-index 2). Trois **orbes lumineuses flottantes** en `mix-blend-mode: multiply` avec animations `driftA/B/C` (8–15 s ease-in-out infinies) : orbe or en haut à gauche, terracotta en haut à droite, dorée en bas. Éléments décoratifs parallax : « leaf » (carré arrondi 32 px, bordure or semi-transparente, en haut à droite) et « ribbon » (bande arrondie, dégradé terracotta→or flou, en bas à gauche). Les éléments décoratifs se déplacent au scroll via `translate3d` limité à ±120 px (parfois avec rotation/scale).

Contenu centré, de haut en bas :

1. **Eyebrow** « SAVE THE DATE » — kicker : `width:fit-content`, bordure inférieure 1 px `#d8c2a3`, couleur `#9f6f43`, 0.72 rem, `letter-spacing: .28em`, majuscules.
2. **Titre** « Leatitia **&** Christophe » — Cormorant Garamond blanc crème, très grand (~4–5 rem), le « & » en Great Vibes doré.
3. **Séparateur** ligne fine dorée avec cœur ♡ au centre.
4. **Sous-titre** « Une célébration pensée comme un souvenir éternel. »
5. **Bloc date** aligné gauche avec barre verticale dorée : « **Les 07 & 08 Août 2026** » (serif) + « MA CABANE AU CANADA · GOSNE » (majuscules espacées, plus petit).
6. **Deux boutons CTA** : « DÉCOUVRIR LE PROGRAMME » (dégradé terracotta, ancre `#evenements`) et « INFOS PRATIQUES » (outline clair, ancre `#infos`), majuscules espacées, arrondi 12 px.
7. **Compte à rebours** : quatre chips `count-chip` (bordure `#eddcc5`, fond `#ffffffdb`, radius 14 px, ombre intérieure) affichant « 000 JOURS · 00 HEURES · 00 MINUTES · 00 SECONDES ». Valeurs en Cormorant Garamond 2 rem, labels en majuscules 0.66 rem `letter-spacing: .14em` couleur `#8b7967`. Séparés par des barres verticales fines. JavaScript : `updateCountdown()` recalculé chaque seconde via RxJS (`interval(1000)`), cible `2026-08-08T14:00:00` ; quand le temps est écoulé, tout affiche « 000/00 ». Format : jours sur 3 chiffres (`padStart(3,"0")`), autres sur 2.

### 4.2 Le Couple (id `#couple`, classe `couple-showcase`)

Fond ivoire. Structure : eyebrow doré « LES FUTURS MARIÉS », titre serif « **Le Couple** », citation centrée en italique :

> « Deux forces, une seule et même direction. »

suivie du séparateur cœur ♡. Puis **deux portraits en vis-à-vis** dans des médaillons arrondis en « arche » (`.portrait-circle` : 200×260 px, `border-radius: 120px 120px 30px 30px`, fond dégradé blanc→`#faf6ee`) : photo en `object-fit: cover`, **dégradé de fondu** sur le bas (45 % de hauteur, du transparent vers `#faf6ee` pour fondre dans le fond), et **anneau doré** intérieur (border 2 px `rgba(201,169,97,.45)`, shadow dorée) :

- **Leatitia — La Mariée** (image `leatitia-seule.webp`) : portrait à gauche. Texte : « Réservée et attentive, Leatitia est de celles qui parlent peu mais ressentent profondément. Elle observe, écoute et accorde sa confiance avec sincérité. Derrière son calme se cachent une grande sensibilité, une foi profonde et une capacité naturelle à prendre soin des autres avec discrétion et douceur. Dans leur histoire, elle apporte l'équilibre, la sérénité et cette présence apaisante qui transforme les choses simples en moments précieux. »
- **Christophe — Le Marié** (image `chris-seul.webp`) : portrait à droite. Texte : « Christophe aime les gens, les échanges et les moments partagés. Toujours entouré, toujours prêt à rassembler, il possède cette énergie chaleureuse qui crée du lien naturellement autour de lui. Mais derrière cette aisance se trouve surtout un homme profondément attentif, loyal et vrai. Dans leur histoire, il apporte l'élan, la spontanéité et cette capacité à aimer pleinement, sans retenue. »

Au centre, entre les deux portraits : monogramme « **L & C** » (le « & » stylisé doré) et le texte « Deux façons d'être. Une seule évidence. »

### 4.3 Bandeau parallax « Ma Cabane Au Canada »

Classe `.parallax-hero-v2` : `background-attachment: fixed`, `background-size: cover`, `min-height: 50vh` (variante `--tall` : 70 vh), contenu centré. Photo : paysage d'arbres nus au bord de l'eau en tons sépia. Overlay : `linear-gradient(180deg,#2b1f16a6,#2b1f16bf)`. Contenu : eyebrow « LE LIEU », titre serif « **Ma Cabane Au Canada** », sous-titre « GOSNE » (majuscules espacées) et la phrase « Entre jardins et lumière de fin d'été, chaque zone du domaine est pensée pour vivre la fête — du vin d'honneur à la dernière danse. »

### 4.4 Notre Histoire (id `#histoire`, classe `story-book`)

Eyebrow « NOTRE HISTOIRE », titre serif « **Une histoire construite avec le temps** », citation centrée :

> « Une rencontre. Une amitié. Une évidence. Et Seize années à avancer naturellement ensemble. »

puis séparateur ♡. Un **livre interactif à 4 chapitres** (états : `rencontre`, `complicite`, `oui`, `jour` ; navigation circulaire « Page 1 / 4 ») :

**Onglets** (boutons, classe `story-book__tabs`) : CHAPITRE I La rencontre · CHAPITRE II La complicité · CHAPITRE III Notre parcours · CHAPITRE IV La célébration. L'onglet actif est souligné (bordure inférieure dorée).

**Layout du chapitre actif** : grande photo à gauche (classe `story-book__page--photo`, avec légende en surimpression « Le premier regard » pour le chapitre I, « Les souvenirs à deux » pour le II, « Toi et moi, pour la vie » pour le III, « Le prochain chapitre » pour le IV), texte à droite comprenant : monogramme « L & C », **année en doré** (2008 / 2010 / 2011-2025 / 07 & 08 août 2026), titre serif, puis 1 à 3 paragraphes. Boutons « ← PAGE PRÉCÉDENTE » / « PAGE SUIVANTE → » de part et d'autre (pilules outline dorées, 0.66 rem). Ornements : « sprig » (rameau) et « monogram ».

Contenus exacts des chapitres :

| Chapitre | Année | Titre | Contenu |
|---|---|---|---|
| I — La rencontre | 2008 | Une rencontre inattendue | « À cette époque au sein de l'ACR, rien ne laisse imaginer ce que deviendra leur histoire. Ils collaborent, organisent des événements et partagent un même environnement… sans savoir qu'ils avancent déjà dans la même direction. » |
| II — La complicité | 2010 | L'amitié devenue évidence | « En 2010, leurs chemins se croisent à nouveau. Et cette fois, quelque chose change. Les échanges deviennent plus naturels. Les conversations s'allongent. Les silences deviennent confortables, et les rires arrivent sans effort. Parler de tout et de rien devient une évidence. Et les absences… un peu plus longues, commencent à dire ce que les mots n'avaient pas encore formulé. » |
| III — Notre parcours | 2011–2025 | Le chemin ensemble | « Ce n'est plus seulement une rencontre ni une évidence… C'est une vie construite à deux. Avec le temps, nous avons appris à avancer côte à côte, à travers les jours simples comme les moments plus intenses. Notre histoire s'est écrit naturellement, entre projets partagés, voyages, souvenirs et cette façon unique de nous comprendre. Peu à peu, nos rêves sont devenus une réalité. Et chaque étape nous a rapprochés encore plus, avec cette même complicité discrète, sincère et essentielle. Aujourd'hui, tout ce chemin nous conduit vers ce qui vient. » |
| IV — La célébration | 07 & 08 août 2026 | Deux jours pour se dire OUI | « Tout converge désormais vers ce moment : celui de célébrer notre union avec ceux que nous aimons. Bien plus qu'une célébration, c'est une pause dans le temps. Un moment de gratitude pour tout ce que nous avons traversé ensemble : les saisons, les joies, les épreuves et tout ce qui a façonné notre histoire. Cette étape ne marque pas le début d'une nouvelle histoire. Elle célèbre celle que nous écrivons déjà depuis tant d'années, avec patience, amour et confiance. Que la tendresse et la complicité continuent de guider ce que nous avons encore à écrire ensemble. » |

En bas de la section : « Merci de faire partie de notre histoire. Merci d'avoir traversé tant de chapitres à nos côtés. Et merci d'être là pour écrire la suite avec nous. »

**Images des chapitres** : `chap1-veste.webp`, `couple_zome_amor.webp`, `image-1-converted.webp`, `venue/domaine-vue-aerienne.webp`.

### 4.5 Bandeau parallax intermédiaire (photos)

Photo plein écran du couple qui s'embrasse (fond sombre), citation en calligraphie Great Vibes dorée centrée :

> « Il n'y a qu'un bonheur dans la vie, aimer et être aimé. »

### 4.6 Nos Plus Beaux Moments (id `#photos`)

Section fond `#faf6f0` avec textures florales dorées, padding `py-24`. Eyebrow + titre serif « **Nos Plus Beaux Moments** », citation « Puissiez-vous vivre aussi longtemps que vous aimez. »

**Galerie en mosaïque** : grille responsive (desktop : 3 colonnes, rangées de 260 px, gap 8 px ; tablette : 2 colonnes/200 px ; mobile : 2 colonnes/140 px). Item 1 en grand format (`.gallery-lg`, `grid-row: span 2`, légende « Notre complicité »), puis 5 photos carrées avec légendes superposées en bas :

| Image | Légende |
|---|---|
| `couple-fond-hero.webp` (grande) | Notre complicité |
| `galerie-photo-1.webp` | En amoureux |
| `couple_en_fete.webp` | Complices |
| `invitation-couple-real.webp` | Nos racines, notre fierté |
| `mr-mme-zome.webp` | Mr & Mme |
| `save-the-date-invit1.webp` | Save the date |

Style des items : `overflow: hidden`, border 1 px `#ead7bf`, radius 18 px, ombre `0 16px 30px #301f131a`, légende en italique calligraphique dorée au survol/superposée.

Bandeau de clôture de section (photo couple en fond, overlay sombre) : eyebrow « ET CE N'EST PAS TOUT », titre « **Notre histoire continue — Le temps de la célébrer ensemble** », bouton « Voir le programme » (ancre `#evenements`).

### 4.7 Le Week-end en Scènes (id `#evenements`, classe `programme-showcase`)

Eyebrow « PROGRAMME », titre serif « **Le Week-end en Scènes** », citation :

> « Si vous n'avez qu'un sourire, offrez-le aux gens que vous aimez. »

puis séparateur ♡. **Deux onglets jours** : « ☾ 07 AOÛT La Veille » et « ☼ 08 AOÛT Le Jour J » (icônes lune/soleil, labels en Cormorant Garamond 1.25 rem ; l'onglet actif est mis en évidence). Par défaut, l'onglet « Le Jour J » est actif.

**Timeline verticale** (`.timeline-shell` : fond dégradé `#fffefc→#fff8f0`, border `#ecdcc6`, radius 24 px, padding-gauche 2.6 rem) : rail vertical 3 px (`background #c9a9613d`) avec **barre de progression animée** (dégradé or→terracotta, hauteur calculée à chaque scroll : `timelineProgress = clamp((0.8*vh - top)/(0.8*vh + 0.5*height))`), et **dots** (14 px, fond terracotta `#b65a3a`, ring doré semi-transparent). Chaque item : carte blanche (radius 16 px, border `#ead8bf`), date en doré majuscules espacées 0.68 rem (`#a77544`), titre serif 1.9 rem `#30251c`, description 0.9 rem `#6d5a4a`, icône symbolique (♡, ♢, ♫, ◉, ⌖, ✦, ●).

**Jour I — Vendredi 7 Août 2026 · La Veille** :

| Icône | Horaire | Événement | Description |
|---|---|---|---|
| ♡ | 14h – 15h | Mariage Mairie | Cérémonie civile en présence des proches. Le premier « oui » officiel. |
| ⌖ | 15h – 15h30 | Déplacement au Thabord | Direction le Thabord pour la séance photos dans un cadre verdoyant. |
| ● | 15h30 – 16h30 | Séance Photos Thabord | Séance photos avec les mariés et les proches dans le magnifique parc du Thabord. |
| ✦ | 17h – 18h30 | Collation au Domaine | Un moment convivial autour d'un verre et de petites douceurs au domaine. |

**Jour II — Samedi 8 Août 2026 · Le Grand Jour** :

| Icône | Horaire | Événement | Description |
|---|---|---|---|
| ♡ | 10h00 – 11h30 | Cérémonie Religieuse | Le moment le plus émouvant. Cérémonie solennelle entourée de tous ceux qu'on aime. |
| ♢ | 12h – 14h | Vin d'Honneur | Champagne, pièces raffinées et rencontre des familles dans les jardins du domaine. |
| ♫ | 12h – 14h | Le Coin des P'tits Loups | Un espace ludique dédié aux plus petits, avec des jeux pour leur plus grand bonheur. |
| ◉ | 19h – 20h | Arrivée / Installation des Invités | Installation à table, retrouvailles et montée en ambiance pour la soirée. |

Clôture de section : « Chaque instant a été imaginé pour être vécu ensemble. »

### 4.8 Bandeau parallax hôtel « B&B Hôtel Rennes Liffré » (`.hotel-promo-parallax`)

Photo de chambre d'hôtel, overlay sombre, eyebrow « OFFRE HÉBERGEMENT », titre serif « **B&B Hôtel Rennes Liffré** ». Trois chips alignées : « Code promo **MARIAGEZOME** », « **20 %** de réduction », « Du **01/08** au **14/08** » (chips rondes/outline claires). Bouton outline « RÉSERVER AVEC LE CODE » → https://www.hotel-bb.com/fr/hotel/rennes-liffre

### 4.9 Infos Pratiques (id `#infos`)

Eyebrow « BON À SAVOIR », titre « **Infos Pratiques** ». **Trois cartes** côte à côte (cards arrondies, fond blanc cassé, ombre douce) :

| Carte | Titre | Détails |
|---|---|---|
| 1 | **Lieu** — Ma Cabane Au Canada | Accueil invités dès 12h00 · Parking sur place |
| 2 | **Hébergement** — Autour de Rennes | Hôtels recommandés à -20 min · Infos avec l'invitation |
| 3 | **RSVP** — Lien personnel WhatsApp | Confirmez via votre lien unique · Places, régime, table |

### 4.10 Le Domaine / Localisation (classe `py-20`, fond `#fffaf2`)

Eyebrow « LE DOMAINE », titre « **Ma Cabane Au Canada** », sous-titre « Un écrin naturel pour célébrer ensemble. », section « **Localisation & Hébergements** » avec l'intro : « Le domaine se situe à Gosné, à proximité de Rennes. Ouvrez directement l'itinéraire dans votre application de navigation. »

**Bloc « Adresse réception »** : titre « Ma Cabane Au Canada », sous-texte « 35140 Gosné · Hôtels à moins de 20 min », bouton « Ouvrir l'itinéraire » → Google Maps (`https://www.google.com/maps/search/?api=1&query=Ma%20Cabane%20Au%20Canada%2C%2035140%20Gosn%C3%A9`).

**Bloc « Hébergements Recommandés »** : « Quelques suggestions à proximité du lieu de réception », 4 cartes hébergement :

| Hôtel | Lieu / Distance | Prix | Détail | CTA |
|---|---|---|---|---|
| B&B Hotel Rennes Liffré | Offre invitée, code promo mariage | — | « Une adresse pratique pour dormir à proximité du mariage, avec une remise réservée aux invités. » Chips : MARIAGEZOME · 20 % · 01/08–14/08 | Réserver sur hotel-bb.com → |
| La Reposée Hôtel Restaurant & Spa | Liffré · ~12 min | 130 €/nuit | Spa, restaurant, chambres rénovées | Réserver → (lareposee.fr) |
| Kosy Suite | Saint-Aubin-du-Cormier · ~10 min | 74 €/nuit | Noté 8.7/10, idéal petit budget | Voir sur Booking → |
| Ibis Rennes Cesson-Sévigné | Cesson-Sévigné · ~20 min | 65 €/nuit | Classique, parking, petit-déj en option | Voir sur Booking → |
| Mon Chalet au Canada | Sur le domaine · 0 min | Sur devis | Badge « ⚡ Places limitées — infos dans l'invitation ». Gîte 23 couchages, spa, terrasse | — |

### 4.11 Dress code (`.dress-code-section`)

Eyebrow « ✦ Theme de la soirée », titre « **Palette Terracotta Chic** » (`palette-board` : fond semi-transparent sombre/radius 16 px), texte :

> Le plus important, c'est que vous soyez à l'aise et que vous passiez une soirée inoubliable. Pas de dress code imposé — venez comme vous vous sentez le mieux !

**Sélecteur de palettes** : deux boutons « Terracotta » et « Champagne ». La palette active affiche 4 nuanciers (grid 4 colonnes) avec label sous chaque pastille :

| Palette | Nuances |
|---|---|
| Terracotta | `#b65a3a` Terracotta · `#8d4128` Sienne · `#d58a67` Pêche · `#f2d2c2` Rosée |
| Champagne | `#f1e0bc` Champagne · `#dcc295` Doré · `#b99768` Miel · `#fff3dc` Ivoire |
| Sage *(définie dans le code mais sans bouton visible sur la page d'accueil)* | `#66785a` Sauge · `#829674` Olive · `#a3b197` Mousse · `#dfe6d9` Menthe |

Message de conseil : « Conseil : évitez le blanc intégral (réservé à la mariée). »

### 4.12 FAQ (`.faq-section`)

Titre « **Questions Fréquentes** ». Coquille (shell) arrondie 26 px fond dégradé clair, ombre douce ; chaque question est un `<details>`/`<summary>` (accordéon natif) dans une carte blanche radius 14 px :

1. **Le dress code est-il obligatoire ?** — « Pas de dress code strict, mais nous comptons sur votre bon goût — habillez-vous de façon soignée et appropriée à l'occasion. 😊 »
2. **Comment confirmer ma présence ?** — « Via le lien RSVP reçu sur WhatsApp. Votre réponse est enregistrée instantanément. »

### 4.13 RSVP final (id `#rsvp`)

Section `.parallax-hero-v2--tall` : photo de la cabane en bois, overlay brun, **carte centrale** arrondie semi-transparente (`background #ffffff14`, blur 16 px, border dorée). Contenu :

1. Eyebrow « VENEZ CÉLÉBRER AVEC NOUS »
2. Titre serif « **Nous avons hâte de vous retrouver !** »
3. Séparateur ornemental
4. Texte : « Surveillez WhatsApp: votre invitation personnelle contient votre lien RSVP unique et toutes les informations logistiques pour cette journée inoubliable. »
5. Deux boutons : « Voir le programme » (terracotta, ancre `#evenements`) et « Notre histoire » (outline clair, ancre `#histoire`)

### 4.14 Formulaire « Une question ? »

Sous la carte RSVP : section « **Autre question ?** » avec la mention « Réponse envoyée via WhatsApp ». Formulaire à trois champs (inputs/textarea arrondis, fond crème, border claire) avec placeholders « Votre nom », « Numéro WhatsApp ex: +33 6 12 34 56 78 », « Écrivez votre question ici… » et bouton « Envoyer » (terracotta, avec état « Envoi… » + spinner). Le bouton devient « Nouvelle question » après envoi (« Merci [nom] ! 🎉 — Votre question a été envoyée. On vous répond sur WhatsApp. »).

**Comportement exact** : à la soumission, le formulaire construit un message WhatsApp pré-rempli et ouvre `https://wa.me/33624623647?text=<message encodé>`. Le message envoyé contient : « Bonjour, j'ai une question concernant le mariage de Leatitia & Christophe. », Nom, Téléphone invité, Question, horodatage « Envoyé depuis le site le [date fr-FR] ». Validation : les trois champs doivent être non vides.

---

## 5. Footer

Fond brun foncé `#2d241b` (ou proche), centré :

1. « *Leatitia & Christophe* » en Great Vibes doré (grand, ~2.5 rem)
2. « 08 Août 2026 · Ma Cabane Au Canada · Rennes » (petit, clair)
3. Séparateur ornemental
4. « AVEC TOUT NOTRE AMOUR ❤ » (majuscules espacées, doré)
5. « SITE RÉALISÉ PAR **INDYLI SERVICES** » (lien vers https://indyli-services.com)

---

## 6. Éléments flottants et overlays

### 6.1 Bouton musique (`.music-fab`)

Fixé en bas à droite (`bottom: 2rem; right: 2rem; z-index: 100`), cercle 58 px, border 2 px `#d4a574`, dégradé `linear-gradient(135deg,#8b5e3c,#c4956a)`, icône haut-parleur blanche, ombre `#c4956a66`, animations continues : `music-bounce` (2 s ease-in-out), `music-pulse` (ombre pulsante) et `music-ring` (anneau). Bouton « Jouer la musique » (lecture d'une piste audio de fond, toggle play/pause).

### 6.2 Popup cagnotte (`.cagnotte-toast-banner`)

Apparaît au défilement (toast), fixée `bottom: 5.5rem; right: 2rem`, width max 380 px, radius 22 px, border dorée `rgba(201,169,97,.4)`, fond `#2d241ef0` avec blur 16 px, ombre foncée. Contenu : badge doré « 🎁 CAGNOTTE DES MARIÉS », texte « Vous souhaitez contribuer au bonheur de Leatitia & Christophe ? Participez à notre cagnotte en ligne Tribee. », actions : bouton primaire « Participer à la cagnotte » (dégradé terracotta → https://tribee.fr/participations/mariage-leatitia-christophe) et bouton secondaire « Plus tard », bouton de fermeture ✕ (cercle 26 px, `#ffffff1a`). Animation d'entrée `toast-slide-in` (translateY -20 px + opacité).

---

## 7. Animations et interactions (récapitulatif technique)

| Animation / interaction | Implémentation |
|---|---|
| Apparition des sections au scroll | `IntersectionObserver` (threshold 0.08, rootMargin `0px 0px -40px 0px`) : les éléments `.fade-up` (opacity 0, translateY 40 px, transition .8 s ease) reçoivent la classe `.visible` puis sont « unobserved » |
| Animation d'entrée ponctuelle | `.reveal-up` : `revealUp .8s cubic-bezier(.2,.7,.2,1) both` (opacity 0 → 1, translateY 20 px → 0) ; `.animate-rise` : `riseIn .8s` (18 px) ; `.animate-bounce-once` : `bounceOnce .6s` (scale .5→1) ; `.popIn` : scale .5 |
| Orbes flottantes du hero | `driftA` (8 s), `driftB` (11 s), `driftC` (10 s), durée portée à 15 s sur desktop : translation douce en boucle |
| Shimmer / éclat | `@keyframes shimmer` : translateX(-22 %) avec opacité, utilisé sur certains éléments dorés |
| Parallaxe au scroll | Fonctions `parallaxTransform`/`parallaxTransformScaled`/`parallaxTransformWithRotate` : `translate3d(0, ±min(120px, scrollY×facteur), 0)` appliqué aux éléments décoratifs (leaf, ribbon, orbes, photo galerie `rotate(-1.5deg)`) via listener `window.scroll` (valeurs signaux réactifs) |
| Progression de la timeline | Barre de progression dont la hauteur suit le défilement de la section programme (calcul de ratio viewport) |
| Compte à rebours | Mise à jour toutes les secondes, cible 2026-08-08 14:00, format JJJ:HH:MM:SS |
| Livre d'histoire | Onglets chapitres + navigation circulaire (previous/next, modulo 4), affichage « Page n / 4 » |
| Tabs du programme | Basculent entre les événements du 07 et du 08 août (même composant timeline, données filtrées) |
| Sélecteur de palette dress code | Bascule entre palettes « terracotta » et « champagne » (nuanciers mis à jour) |
| Formulaire WhatsApp | Validation 3 champs → `window.location.assign('https://wa.me/33624623647?text=…')` avec message pré-formaté ; état d'envoi avec spinner ; confirmation « Merci … ! 🎉 » puis bouton « Nouvelle question » (reset) |
| Nav au scroll | Fond opaque + blur + ombre dès le défilement (classe `.nav-scrolled`) |

---

## 8. Liste des images du site

Toutes les images sont au format WebP, servies depuis `/images/` :

| Fichier | Usage |
|---|---|
| `background-section-hero.webp` | Fond hero (couple en tenue traditionnelle) |
| `leatitia-seule.webp` | Portrait médaillon mariée |
| `chris-seul.webp` | Portrait médaillon marié |
| `chap1-veste.webp` | Chapitre I (photo) |
| `couple_zome_amor.webp` | Chapitre II (photo) |
| `image-1-converted.webp` | Chapitre III (photo) |
| `venue/domaine-vue-aerienne.webp` | Chapitre IV (photo) |
| `fond-section-photo.webp` | Bandeau parallax « baiser » |
| `couple-fond-hero.webp` | Galerie (grande, « Notre complicité ») |
| `galerie-photo-1.webp` | Galerie (« En amoureux ») |
| `couple_en_fete.webp` | Galerie (« Complices ») |
| `invitation-couple-real.webp` | Galerie (« Nos racines ») |
| `mr-mme-zome.webp` | Galerie (« Mr & Mme ») |
| `save-the-date-invit1.webp` | Galerie (« Save the date ») |
| `chambre-hotel-bb.webp` | Bandeau hôtel |
| `favicon.svg` | Favicon |

---

## 9. Liens externes récapitulés

| Lien | Destination |
|---|---|
| Cagnotte Tribee | https://tribee.fr/participations/mariage-leatitia-christophe |
| Portier | /portier (page interne) |
| B&B Hotel | https://www.hotel-bb.com/fr/hotel/rennes-liffre |
| Itinéraire | Google Maps (Ma Cabane Au Canada, 35140 Gosné) |
| La Reposée | https://www.lareposee.fr |
| Kosy Suite / Ibis | Recherches Booking.com (Saint-Aubin-du-Cormier ; ibis Rennes Cesson-Sévigné) |
| Crédit | https://indyli-services.com |
| WhatsApp formulaire | https://wa.me/33624623647 |

---

## 10. Checklist d'implémentation

1. Créer le design system : 5 variables de couleur, 4 polices Google (Cormorant Garamond, Belleza, Great Vibes, Josefin Sans), boutons terracotta/outlines, badges majuscules espacés.
2. Header sticky sombre avec logo script, liens ancrés et bouton cagnotte pilule.
3. Hero plein écran avec photo, overlay dégradé, orbes flottantes animées, éléments décoratifs parallax, titre avec « & » calligraphié, bloc date, 2 CTA et compte à rebours JS (cible 2026-08-08T14:00:00).
4. Section Couple avec médaillons « arche » (fondu inférieur + anneau doré) et textes descriptifs.
5. Bandeaux parallax (photo fixe + overlay + titre centré) entre les sections content.
6. Livre d'histoire à 4 chapitres avec onglets et navigation circulaire.
7. Galerie mosaïque responsive (6 photos, item 1 en double hauteur).
8. Programme à 2 onglets jours avec timeline à barre de progression animée au scroll.
9. Sections hôtel, infos pratiques (3 cartes), localisation (Google Maps + 4-5 cartes hébergement), dress code (sélecteur de palettes 4 nuanciers), FAQ (accordéon), RSVP (carte sombre + formulaire WhatsApp `wa.me/33624623647`).
10. Footer sombre calligraphié + bouton musique flottant (audio toggle, animations bounce/pulse/ring) + toast cagnotte au scroll (slide-in, fermable).
11. Animations au scroll via IntersectionObserver (`.fade-up` → `.visible`, une seule fois).

---

*Document produit par Manus AI — 17 août 2026, à partir de l'analyse du rendu visuel et du code source (styles-HY7WAXLA.css et main-2Q7XFBXH.js) du site chris-line.info.*
