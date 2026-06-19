// ─────────────────────────────────────────────────────────────
//  parcellesData.ts
// ─────────────────────────────────────────────────────────────

export type StatutCapteur = 'ok' | 'attention' | 'critique';
export type StatutParcelle = 'ok' | 'warning' | 'critical';
export type Priorite      = 'urgent' | 'important' | 'conseil';

export interface Capteur {
  humidite:    number;
  temperature: number;
  ph:          number;
  azote:       number;
  statut:      StatutCapteur;
}

export interface Localisation {
  ville:  string;
  region: string;
  lat:    number;
  lng:    number;
}

export interface Parcelle {
  id:              string;
  nom:             string;
  culture:         string;
  emoji:           string;
  surface:         number;    // hectares (nom original conservé)
  stade:           string;
  sante:           number;    // 0-100
  rendementPrevu:  number;    // t/ha
  dernierArrosage: string;
  prochaineTache:  string;
  prioriteTache:   Priorite;
  couleur:         string;
  capteur:         Capteur;
  mapX:            number;
  mapY:            number;
  lat:             number;
  lng:             number;
  // Champs supplémentaires
  typeSol?:        string;
  localisation?:   Localisation;
  statut:          StatutParcelle; // calculé depuis capteur.statut
}

// Helper : convertit statut capteur → statut parcelle
const toStatutParcelle = (s: StatutCapteur): StatutParcelle =>
  s === 'ok' ? 'ok' : s === 'attention' ? 'warning' : 'critical';

export const PARCELLES_INIT: Parcelle[] = [
  {
    id: 'p1',
    nom: 'Parcelle Nord',
    culture: 'Maïs',
    emoji: '🌽',
    surface: 2.4,
    stade: 'Floraison',
    sante: 87,
    rendementPrevu: 6.2,
    dernierArrosage: 'Il y a 2h',
    prochaineTache: 'Fertilisation dans 3 jours',
    prioriteTache: 'conseil',
    couleur: '#22c55e',
    capteur: { humidite: 68, temperature: 28.4, ph: 6.8, azote: 18, statut: 'ok' },
    statut: 'ok',
    mapX: 18, mapY: 22,
    lat: 3.848, lng: 11.502,
    typeSol: 'Argileux',
    localisation: { ville: 'Yaoundé', region: 'Centre', lat: 3.848, lng: 11.502 },
  },
  {
    id: 'p2',
    nom: 'Parcelle Est',
    culture: 'Tomate',
    emoji: '🍅',
    surface: 1.8,
    stade: 'Fructification',
    sante: 72,
    rendementPrevu: 8.5,
    dernierArrosage: 'Il y a 5h',
    prochaineTache: 'Arrosage urgent !',
    prioriteTache: 'urgent',
    couleur: '#f97316',
    capteur: { humidite: 52, temperature: 31.2, ph: 6.2, azote: 12, statut: 'attention' },
    statut: 'warning',
    mapX: 63, mapY: 32,
    lat: 3.852, lng: 11.512,
    typeSol: 'Limoneux',
    localisation: { ville: 'Mbalmayo', region: 'Centre', lat: 3.852, lng: 11.512 },
  },
  {
    id: 'p3',
    nom: 'Parcelle Sud',
    culture: 'Manioc',
    emoji: '🌿',
    surface: 3.1,
    stade: 'Croissance',
    sante: 94,
    rendementPrevu: 12.0,
    dernierArrosage: 'Il y a 1h',
    prochaineTache: 'Désherbage dans 5 jours',
    prioriteTache: 'conseil',
    couleur: '#a855f7',
    capteur: { humidite: 74, temperature: 26.8, ph: 7.1, azote: 22, statut: 'ok' },
    statut: 'ok',
    mapX: 42, mapY: 68,
    lat: 3.838, lng: 11.508,
    typeSol: 'Humifère',
    localisation: { ville: 'Obala', region: 'Centre', lat: 3.838, lng: 11.508 },
  },
  {
    id: 'p4',
    nom: 'Parcelle Ouest',
    culture: 'Piment',
    emoji: '🌶️',
    surface: 0.9,
    stade: 'Semis',
    sante: 61,
    rendementPrevu: 2.1,
    dernierArrosage: 'Il y a 9h',
    prochaineTache: 'Capteur critique — vérifier',
    prioriteTache: 'urgent',
    couleur: '#ef4444',
    capteur: { humidite: 41, temperature: 33.5, ph: 5.9, azote: 8, statut: 'critique' },
    statut: 'critical',
    mapX: 76, mapY: 62,
    lat: 3.844, lng: 11.495,
    typeSol: 'Sableux',
    localisation: { ville: 'Bafia', region: 'Centre', lat: 3.844, lng: 11.495 },
  },
  {
    id: 'p5',
    nom: 'Nouvelle Zone',
    culture: 'Plantain',
    emoji: '🍌',
    surface: 1.5,
    stade: 'Plantation',
    sante: 80,
    rendementPrevu: 5.0,
    dernierArrosage: 'Il y a 3h',
    prochaineTache: 'Surveiller croissance',
    prioriteTache: 'important',
    couleur: '#eab308',
    capteur: { humidite: 65, temperature: 29.0, ph: 6.5, azote: 15, statut: 'ok' },
    statut: 'ok',
    mapX: 30, mapY: 45,
    lat: 3.843, lng: 11.505,
    typeSol: 'Latéritique',
    localisation: { ville: 'Soa', region: 'Centre', lat: 3.843, lng: 11.505 },
  },
];

export const STADES         = ['Semis', 'Germination', 'Croissance', 'Floraison', 'Fructification', 'Récolte'];
export const CULTURES       = ['Maïs', 'Tomate', 'Manioc', 'Piment', 'Plantain', 'Arachide', 'Igname', 'Haricot'];
export const EMOJIS_CULTURE: Record<string, string> = {
  Maïs: '🌽', Tomate: '🍅', Manioc: '🌿', Piment: '🌶️',
  Plantain: '🍌', Arachide: '🥜', Igname: '🫚', Haricot: '🫘',
};