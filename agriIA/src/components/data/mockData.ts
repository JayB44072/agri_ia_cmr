export type Culture = 'Maïs' | 'Manioc' | 'Tomate' | 'Cacao' | 'Plantain' | 'Arachide' | 'Café';
export type AlerteNiveau = 'info' | 'warning' | 'danger';
export type StatutCapteur = 'actif' | 'inactif' | 'erreur';

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface Parcelle {
  id: string;
  nom: string;
  culture: Culture;
  superficie: number;
  localisation: string;
  sante: number;
  dateCreation: string;
  stade: string;
  joursRestants: number;
  icone: string;
}

export interface DonneesSol {
  ph: number;
  humidite: number;
  temperature: number;
  azote: number;
  phosphore: number;
  potassium: number;
  conductivite: number;
  matiereOrganique: number;
}

export interface Meteo {
  ville: string;
  temperature: number;
  ressentie: number;
  humidite: number;
  vent: number;
  condition: string;
  icone: string;
  uvIndex: number;
  visibilite: number;
  pluieProbabilite: number;
  previsions: PrevisionJour[];
}

export interface PrevisionJour {
  jour: string;
  min: number;
  max: number;
  icone: string;
  pluie: number;
}

export interface Alerte {
  id: string;
  titre: string;
  message: string;
  niveau: AlerteNiveau;
  culture: string;
  heure: string;
  parcelle: string;
  lu: boolean;
  icone: string;
}

export interface Recommandation {
  id: string;
  culture: Culture;
  action: string;
  priorite: 'haute' | 'moyenne' | 'faible';
  icone: string;
  detail: string;
  delai: string;
  impact: string;
}

export interface EvolutionPoint {
  mois: string;
  maïs: number;
  tomate: number;
  manioc: number;
}

export interface CapteurIoT {
  id: string;
  nom: string;
  parcelle: string;
  parcelleId: string;
  statut: StatutCapteur;
  batterie: number;
  signal: number;
  derniereMaj: string;
  donnees: DonneesCapteur;
}

export interface DonneesCapteur {
  temperature: number;
  humidite: number;
  luminosite: number;
  co2: number;
  ph: number;
}

export interface HistoriqueIoT {
  heure: string;
  temperature: number;
  humidite: number;
}

export interface StatIoT {
  label: string;
  valeur: number;
  unite: string;
  icone: string;
  couleur: string;
  min: number;
  max: number;
  optimal: { min: number; max: number };
}

export type TypeAnnonce = 'vente_recolte' | 'vente_intrant' | 'achat_recolte';

export interface Annonce {
  id: string;
  type: TypeAnnonce;
  titre: string;
  description: string;
  prix: number;
  unite: string;
  quantite: number;
  vendeur: string;
  ville: string;
  region: string;
  datePublication: string;
  telephone: string;
  culture?: string;
  icone: string;
}

// ── Données simulées ─────────────────────────────────────────────────────────

export const CULTURE_ICONS: Record<string, string> = {
  'Maïs':     'leaf-outline',
  'Manioc':   'nutrition-outline',
  'Tomate':   'rose-outline',
  'Cacao':    'earth-outline',
  'Plantain': 'sunny-outline',
  'Arachide': 'ellipse-outline',
  'Café':     'café-outline',
};

export const PARCELLES: Parcelle[] = [
  { id: 'p1', nom: 'Parcelle Nord',  culture: 'Maïs',     superficie: 2.5, localisation: 'Bafoussam',  sante: 87, dateCreation: '2024-01-15', stade: 'Floraison',      joursRestants: 32, icone: 'leaf-outline'      },
  { id: 'p2', nom: 'Champ Sud',      culture: 'Tomate',   superficie: 1.2, localisation: 'Yaoundé',    sante: 72, dateCreation: '2024-02-20', stade: 'Fructification', joursRestants: 18, icone: 'rose-outline'      },
  { id: 'p3', nom: 'Zone Ouest',     culture: 'Manioc',   superficie: 3.0, localisation: 'Douala',     sante: 91, dateCreation: '2024-03-10', stade: 'Croissance',     joursRestants: 65, icone: 'nutrition-outline' },
  { id: 'p4', nom: 'Jardin Est',     culture: 'Cacao',    superficie: 4.5, localisation: 'Nkongsamba', sante: 65, dateCreation: '2024-04-05', stade: 'Maturation',     joursRestants: 45, icone: 'earth-outline'     },
  { id: 'p5', nom: 'Ferme Centre',   culture: 'Plantain', superficie: 2.0, localisation: 'Ebolowa',    sante: 80, dateCreation: '2024-05-01', stade: 'Régime formé',   joursRestants: 28, icone: 'sunny-outline'     },
];

export const DONNEES_SOL: DonneesSol = {
  ph:               6.4,
  humidite:         68,
  temperature:      26,
  azote:            42,
  phosphore:        35,
  potassium:        58,
  conductivite:     1.8,
  matiereOrganique: 3.2,
};

export const METEO: Meteo = {
  ville:            'Yaoundé',
  temperature:      27,
  ressentie:        30,
  humidite:         74,
  vent:             12,
  condition:        'Partiellement nuageux',
  icone:            'partly-sunny-outline',
  uvIndex:          6,
  visibilite:       10,
  pluieProbabilite: 35,
  previsions: [
    { jour: 'Lun', min: 21, max: 28, icone: 'partly-sunny-outline', pluie: 10 },
    { jour: 'Mar', min: 20, max: 29, icone: 'sunny-outline',        pluie: 5  },
    { jour: 'Mer', min: 19, max: 26, icone: 'rainy-outline',        pluie: 80 },
    { jour: 'Jeu', min: 21, max: 27, icone: 'cloud-outline',        pluie: 40 },
    { jour: 'Ven', min: 22, max: 30, icone: 'sunny-outline',        pluie: 5  },
  ],
};

export const ALERTES: Alerte[] = [
  {
    id: 'a1', titre: 'Humidité critique',
    message: 'Sol trop sec sur Parcelle Nord, irrigation recommandée immédiatement.',
    niveau: 'danger', culture: 'Maïs', heure: 'il y a 10 min',
    parcelle: 'p1', lu: false, icone: 'water-outline',
  },
  {
    id: 'a2', titre: 'Risque de maladie',
    message: 'Conditions favorables au mildiou détectées sur Champ Sud.',
    niveau: 'warning', culture: 'Tomate', heure: 'il y a 1h',
    parcelle: 'p2', lu: false, icone: 'bug-outline',
  },
  {
    id: 'a3', titre: 'pH optimal atteint',
    message: 'Le pH de Zone Ouest est idéal pour la culture du manioc.',
    niveau: 'info', culture: 'Manioc', heure: 'il y a 3h',
    parcelle: 'p3', lu: true, icone: 'checkmark-circle-outline',
  },
  {
    id: 'a4', titre: 'Pluie prévue demain',
    message: "Reporter l'arrosage prévu, précipitations attendues 15mm.",
    niveau: 'info', culture: 'Toutes', heure: 'il y a 5h',
    parcelle: 'all', lu: true, icone: 'rainy-outline',
  },
];

export const RECOMMANDATIONS: Recommandation[] = [
  {
    id: 'r1', culture: 'Maïs',   action: 'Irriguer maintenant',
    priorite: 'haute',   icone: 'water-outline',
    detail: 'Humidité sol à 42% — seuil critique atteint',
    delai: "Aujourd'hui", impact: '+12% rendement',
  },
  {
    id: 'r2', culture: 'Tomate', action: 'Appliquer fongicide',
    priorite: 'haute',   icone: 'shield-checkmark-outline',
    detail: 'Risque mildiou élevé — traitement préventif conseillé',
    delai: 'Sous 48h', impact: 'Prévient -40% perte',
  },
  {
    id: 'r3', culture: 'Cacao',  action: 'Ajouter engrais potassique',
    priorite: 'moyenne', icone: 'flask-outline',
    detail: 'Potassium à 35% — fertilisation recommandée sous 7j',
    delai: 'Cette semaine', impact: '+8% qualité',
  },
  {
    id: 'r4', culture: 'Manioc', action: 'Récolte dans 2 semaines',
    priorite: 'faible',  icone: 'calendar-outline',
    detail: 'Maturité estimée à 94% selon les données capteurs',
    delai: 'Dans 14 jours', impact: 'Rendement optimal',
  },
];

export const EVOLUTION: EvolutionPoint[] = [
  { mois: 'Jan', maïs: 65, tomate: 50, manioc: 70 },
  { mois: 'Fév', maïs: 70, tomate: 55, manioc: 75 },
  { mois: 'Mar', maïs: 68, tomate: 62, manioc: 80 },
  { mois: 'Avr', maïs: 80, tomate: 58, manioc: 78 },
  { mois: 'Mai', maïs: 87, tomate: 72, manioc: 91 },
];

export const CAPTEURS_IOT: CapteurIoT[] = [
  {
    id: 'c1', nom: 'Capteur A1', parcelle: 'Parcelle Nord', parcelleId: 'p1',
    statut: 'actif', batterie: 87, signal: 92, derniereMaj: 'il y a 2 min',
    donnees: { temperature: 26.4, humidite: 42, luminosite: 78, co2: 412, ph: 6.2 },
  },
  {
    id: 'c2', nom: 'Capteur B2', parcelle: 'Champ Sud', parcelleId: 'p2',
    statut: 'actif', batterie: 63, signal: 78, derniereMaj: 'il y a 5 min',
    donnees: { temperature: 28.1, humidite: 71, luminosite: 65, co2: 398, ph: 6.8 },
  },
  {
    id: 'c3', nom: 'Capteur C3', parcelle: 'Zone Ouest', parcelleId: 'p3',
    statut: 'actif', batterie: 94, signal: 85, derniereMaj: 'il y a 1 min',
    donnees: { temperature: 25.8, humidite: 68, luminosite: 82, co2: 405, ph: 6.4 },
  },
  {
    id: 'c4', nom: 'Capteur D4', parcelle: 'Jardin Est', parcelleId: 'p4',
    statut: 'erreur', batterie: 12, signal: 23, derniereMaj: 'il y a 2h',
    donnees: { temperature: 27.2, humidite: 55, luminosite: 70, co2: 420, ph: 7.1 },
  },
  {
    id: 'c5', nom: 'Capteur E5', parcelle: 'Ferme Centre', parcelleId: 'p5',
    statut: 'actif', batterie: 75, signal: 88, derniereMaj: 'il y a 3 min',
    donnees: { temperature: 24.9, humidite: 76, luminosite: 60, co2: 388, ph: 6.6 },
  },
];

export const HISTORIQUE_IOT: HistoriqueIoT[] = [
  { heure: '06h', temperature: 22.1, humidite: 82 },
  { heure: '08h', temperature: 23.5, humidite: 78 },
  { heure: '10h', temperature: 25.2, humidite: 74 },
  { heure: '12h', temperature: 27.4, humidite: 68 },
  { heure: '14h', temperature: 28.8, humidite: 62 },
  { heure: '16h', temperature: 27.1, humidite: 65 },
  { heure: '18h', temperature: 25.6, humidite: 70 },
];

export const STATS_IOT: StatIoT[] = [
  {
    label: 'Température',  valeur: 26.4, unite: '°C',
    icone: 'thermometer-outline',    couleur: '#f5a623',
    min: 15,  max: 40,  optimal: { min: 20, max: 30 },
  },
  {
    label: 'Humidité sol', valeur: 42,   unite: '%',
    icone: 'water-outline',           couleur: '#3498db',
    min: 0,   max: 100, optimal: { min: 60, max: 80 },
  },
  {
    label: 'Luminosité',   valeur: 78,   unite: '%',
    icone: 'sunny-outline',           couleur: '#f39c12',
    min: 0,   max: 100, optimal: { min: 60, max: 90 },
  },
  {
    label: 'CO₂',          valeur: 412,  unite: 'ppm',
    icone: 'cloud-outline',           couleur: '#9b59b6',
    min: 300, max: 800, optimal: { min: 350, max: 450 },
  },
  {
    label: 'pH sol',       valeur: 6.2,  unite: '',
    icone: 'flask-outline',           couleur: '#27ae60',
    min: 0,   max: 14,  optimal: { min: 6.0, max: 7.0 },
  },
  {
    label: 'Signal',       valeur: 92,   unite: '%',
    icone: 'wifi-outline',            couleur: '#3cb95a',
    min: 0,   max: 100, optimal: { min: 70, max: 100 },
  },
];

export const ANNONCES: Annonce[] = [
  {
    id: 'an1', type: 'vente_recolte',
    titre: 'Maïs frais — récolte du jour',
    description: 'Maïs de qualité supérieure, cultivé sans pesticides chimiques.',
    prix: 150, unite: 'kg', quantite: 500,
    vendeur: 'Jean-Pierre Mbarga', ville: 'Bafoussam', region: 'Ouest',
    datePublication: 'il y a 2h', telephone: '+237 6XX XXX XXX',
    culture: 'Maïs', icone: 'leaf-outline',
  },
  {
    id: 'an2', type: 'vente_intrant',
    titre: 'Engrais NPK 20-10-10',
    description: 'Sacs de 50kg, idéal pour céréales et légumineuses.',
    prix: 18000, unite: 'sac', quantite: 20,
    vendeur: 'AgroShop Cameroun', ville: 'Yaoundé', region: 'Centre',
    datePublication: 'il y a 5h', telephone: '+237 6XX XXX XXX',
    icone: 'flask-outline',
  },
  {
    id: 'an3', type: 'achat_recolte',
    titre: 'Recherche tomates — 2 tonnes',
    description: 'Grossiste cherche tomates fraîches pour approvisionnement marché central.',
    prix: 200, unite: 'kg', quantite: 2000,
    vendeur: 'Marché Central Douala', ville: 'Douala', region: 'Littoral',
    datePublication: 'il y a 1j', telephone: '+237 6XX XXX XXX',
    culture: 'Tomate', icone: 'storefront-outline',
  },
];