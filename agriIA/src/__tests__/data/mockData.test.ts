import {
  CULTURE_ICONS,
  PARCELLES,
  DONNEES_SOL,
  METEO,
  ALERTES,
  RECOMMANDATIONS,
  EVOLUTION,
  CAPTEURS_IOT,
  HISTORIQUE_IOT,
  STATS_IOT,
  ANNONCES,
  type Culture,
  type AlerteNiveau,
  type StatutCapteur,
  type Parcelle,
  type DonneesSol,
  type Meteo,
  type Alerte,
  type Recommandation,
  type EvolutionPoint,
  type CapteurIoT,
  type HistoriqueIoT,
  type StatIoT,
  type Annonce,
  type TypeAnnonce,
} from '@/components/data/mockData';

// ── CULTURE_ICONS ──────────────────────────────────────────────

describe('CULTURE_ICONS', () => {
  it('contains an entry for every expected culture', () => {
    const expected: Culture[] = ['Maïs', 'Manioc', 'Tomate', 'Cacao', 'Plantain', 'Arachide', 'Café'];
    for (const c of expected) {
      expect(CULTURE_ICONS).toHaveProperty(c);
      expect(typeof CULTURE_ICONS[c]).toBe('string');
    }
  });

  it('icon values end with "-outline"', () => {
    for (const icon of Object.values(CULTURE_ICONS)) {
      expect(icon).toMatch(/-outline$/);
    }
  });
});

// ── PARCELLES ──────────────────────────────────────────────────

describe('PARCELLES', () => {
  it('has at least one entry', () => {
    expect(PARCELLES.length).toBeGreaterThan(0);
  });

  it('each parcelle has unique id', () => {
    const ids = PARCELLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each parcelle has required fields with valid types', () => {
    for (const p of PARCELLES) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.nom).toBe('string');
      expect(typeof p.culture).toBe('string');
      expect(typeof p.superficie).toBe('number');
      expect(p.superficie).toBeGreaterThan(0);
      expect(typeof p.localisation).toBe('string');
      expect(p.sante).toBeGreaterThanOrEqual(0);
      expect(p.sante).toBeLessThanOrEqual(100);
      expect(typeof p.dateCreation).toBe('string');
      expect(typeof p.stade).toBe('string');
      expect(typeof p.joursRestants).toBe('number');
      expect(p.joursRestants).toBeGreaterThanOrEqual(0);
      expect(typeof p.icone).toBe('string');
    }
  });

  it('dateCreation is a valid date string', () => {
    for (const p of PARCELLES) {
      const d = new Date(p.dateCreation);
      expect(d.getTime()).not.toBeNaN();
    }
  });
});

// ── DONNEES_SOL ────────────────────────────────────────────────

describe('DONNEES_SOL', () => {
  it('has all expected soil-data keys', () => {
    const keys: (keyof DonneesSol)[] = [
      'ph', 'humidite', 'temperature', 'azote',
      'phosphore', 'potassium', 'conductivite', 'matiereOrganique',
    ];
    for (const k of keys) {
      expect(DONNEES_SOL).toHaveProperty(k);
      expect(typeof DONNEES_SOL[k]).toBe('number');
    }
  });

  it('ph is in a realistic range', () => {
    expect(DONNEES_SOL.ph).toBeGreaterThanOrEqual(0);
    expect(DONNEES_SOL.ph).toBeLessThanOrEqual(14);
  });

  it('humidite is a percentage', () => {
    expect(DONNEES_SOL.humidite).toBeGreaterThanOrEqual(0);
    expect(DONNEES_SOL.humidite).toBeLessThanOrEqual(100);
  });
});

// ── METEO ──────────────────────────────────────────────────────

describe('METEO', () => {
  it('has a ville string', () => {
    expect(typeof METEO.ville).toBe('string');
    expect(METEO.ville.length).toBeGreaterThan(0);
  });

  it('previsions is a non-empty array', () => {
    expect(Array.isArray(METEO.previsions)).toBe(true);
    expect(METEO.previsions.length).toBeGreaterThan(0);
  });

  it('each prevision has min <= max', () => {
    for (const p of METEO.previsions) {
      expect(p.min).toBeLessThanOrEqual(p.max);
    }
  });

  it('pluieProbabilite is between 0 and 100', () => {
    expect(METEO.pluieProbabilite).toBeGreaterThanOrEqual(0);
    expect(METEO.pluieProbabilite).toBeLessThanOrEqual(100);
  });
});

// ── ALERTES ────────────────────────────────────────────────────

describe('ALERTES', () => {
  it('has unique ids', () => {
    const ids = ALERTES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('niveau is one of the valid AlerteNiveau values', () => {
    const validLevels: AlerteNiveau[] = ['info', 'warning', 'danger'];
    for (const a of ALERTES) {
      expect(validLevels).toContain(a.niveau);
    }
  });

  it('lu is a boolean', () => {
    for (const a of ALERTES) {
      expect(typeof a.lu).toBe('boolean');
    }
  });
});

// ── RECOMMANDATIONS ────────────────────────────────────────────

describe('RECOMMANDATIONS', () => {
  it('each has a valid priorite', () => {
    const valid = ['haute', 'moyenne', 'faible'];
    for (const r of RECOMMANDATIONS) {
      expect(valid).toContain(r.priorite);
    }
  });

  it('each has a non-empty action string', () => {
    for (const r of RECOMMANDATIONS) {
      expect(r.action.length).toBeGreaterThan(0);
    }
  });
});

// ── EVOLUTION ──────────────────────────────────────────────────

describe('EVOLUTION', () => {
  it('has at least one data point', () => {
    expect(EVOLUTION.length).toBeGreaterThan(0);
  });

  it('each point has numeric crop values', () => {
    for (const e of EVOLUTION) {
      expect(typeof e.mois).toBe('string');
      expect(typeof e.maïs).toBe('number');
      expect(typeof e.tomate).toBe('number');
      expect(typeof e.manioc).toBe('number');
    }
  });
});

// ── CAPTEURS_IOT ───────────────────────────────────────────────

describe('CAPTEURS_IOT', () => {
  it('has unique ids', () => {
    const ids = CAPTEURS_IOT.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('statut is a valid StatutCapteur', () => {
    const valid: StatutCapteur[] = ['actif', 'inactif', 'erreur'];
    for (const c of CAPTEURS_IOT) {
      expect(valid).toContain(c.statut);
    }
  });

  it('batterie and signal are percentages', () => {
    for (const c of CAPTEURS_IOT) {
      expect(c.batterie).toBeGreaterThanOrEqual(0);
      expect(c.batterie).toBeLessThanOrEqual(100);
      expect(c.signal).toBeGreaterThanOrEqual(0);
      expect(c.signal).toBeLessThanOrEqual(100);
    }
  });
});

// ── HISTORIQUE_IOT ─────────────────────────────────────────────

describe('HISTORIQUE_IOT', () => {
  it('entries have chronological order pattern', () => {
    expect(HISTORIQUE_IOT.length).toBeGreaterThan(1);
    for (const h of HISTORIQUE_IOT) {
      expect(typeof h.heure).toBe('string');
      expect(typeof h.temperature).toBe('number');
      expect(typeof h.humidite).toBe('number');
    }
  });
});

// ── STATS_IOT ──────────────────────────────────────────────────

describe('STATS_IOT', () => {
  it('each stat has min <= optimal.min <= optimal.max <= max', () => {
    for (const s of STATS_IOT) {
      expect(s.min).toBeLessThanOrEqual(s.optimal.min);
      expect(s.optimal.min).toBeLessThanOrEqual(s.optimal.max);
      expect(s.optimal.max).toBeLessThanOrEqual(s.max);
    }
  });

  it('valeur is within [min, max]', () => {
    for (const s of STATS_IOT) {
      expect(s.valeur).toBeGreaterThanOrEqual(s.min);
      expect(s.valeur).toBeLessThanOrEqual(s.max);
    }
  });
});

// ── ANNONCES ───────────────────────────────────────────────────

describe('ANNONCES', () => {
  it('has unique ids', () => {
    const ids = ANNONCES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('type is a valid TypeAnnonce', () => {
    const valid: TypeAnnonce[] = ['vente_recolte', 'vente_intrant', 'achat_recolte'];
    for (const a of ANNONCES) {
      expect(valid).toContain(a.type);
    }
  });

  it('prix and quantite are positive', () => {
    for (const a of ANNONCES) {
      expect(a.prix).toBeGreaterThan(0);
      expect(a.quantite).toBeGreaterThan(0);
    }
  });
});
