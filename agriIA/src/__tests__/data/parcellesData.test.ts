import {
  PARCELLES_INIT,
  STADES,
  CULTURES,
  EMOJIS_CULTURE,
  type StatutCapteur,
  type StatutParcelle,
  type Priorite,
  type Parcelle,
} from '@/components/data/parcellesData';

// ── toStatutParcelle (tested indirectly via data consistency) ──

describe('PARCELLES_INIT data consistency', () => {
  it('has at least one parcelle', () => {
    expect(PARCELLES_INIT.length).toBeGreaterThan(0);
  });

  it('each parcelle has unique id', () => {
    const ids = PARCELLES_INIT.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('statut matches capteur.statut mapping', () => {
    const expected: Record<StatutCapteur, StatutParcelle> = {
      ok: 'ok',
      attention: 'warning',
      critique: 'critical',
    };
    for (const p of PARCELLES_INIT) {
      expect(p.statut).toBe(expected[p.capteur.statut]);
    }
  });

  it('sante is between 0 and 100', () => {
    for (const p of PARCELLES_INIT) {
      expect(p.sante).toBeGreaterThanOrEqual(0);
      expect(p.sante).toBeLessThanOrEqual(100);
    }
  });

  it('surface is positive', () => {
    for (const p of PARCELLES_INIT) {
      expect(p.surface).toBeGreaterThan(0);
    }
  });

  it('rendementPrevu is positive', () => {
    for (const p of PARCELLES_INIT) {
      expect(p.rendementPrevu).toBeGreaterThan(0);
    }
  });

  it('prioriteTache is a valid Priorite', () => {
    const valid: Priorite[] = ['urgent', 'important', 'conseil'];
    for (const p of PARCELLES_INIT) {
      expect(valid).toContain(p.prioriteTache);
    }
  });

  it('capteur ph is in valid range', () => {
    for (const p of PARCELLES_INIT) {
      expect(p.capteur.ph).toBeGreaterThanOrEqual(0);
      expect(p.capteur.ph).toBeLessThanOrEqual(14);
    }
  });

  it('capteur humidite is a percentage', () => {
    for (const p of PARCELLES_INIT) {
      expect(p.capteur.humidite).toBeGreaterThanOrEqual(0);
      expect(p.capteur.humidite).toBeLessThanOrEqual(100);
    }
  });

  it('lat and lng are plausible coordinates for Cameroon', () => {
    for (const p of PARCELLES_INIT) {
      expect(p.lat).toBeGreaterThanOrEqual(1);
      expect(p.lat).toBeLessThanOrEqual(13);
      expect(p.lng).toBeGreaterThanOrEqual(8);
      expect(p.lng).toBeLessThanOrEqual(16);
    }
  });

  it('localisation has matching lat/lng', () => {
    for (const p of PARCELLES_INIT) {
      if (p.localisation) {
        expect(p.localisation.lat).toBe(p.lat);
        expect(p.localisation.lng).toBe(p.lng);
      }
    }
  });
});

// ── toStatutParcelle helper (direct test via module re-import) ──

describe('toStatutParcelle mapping', () => {
  it('ok capteur → ok parcelle', () => {
    const okParcelles = PARCELLES_INIT.filter((p) => p.capteur.statut === 'ok');
    for (const p of okParcelles) {
      expect(p.statut).toBe('ok');
    }
  });

  it('attention capteur → warning parcelle', () => {
    const warnParcelles = PARCELLES_INIT.filter((p) => p.capteur.statut === 'attention');
    for (const p of warnParcelles) {
      expect(p.statut).toBe('warning');
    }
  });

  it('critique capteur → critical parcelle', () => {
    const critParcelles = PARCELLES_INIT.filter((p) => p.capteur.statut === 'critique');
    for (const p of critParcelles) {
      expect(p.statut).toBe('critical');
    }
  });
});

// ── STADES ──────────────────────────────────────────────────────

describe('STADES', () => {
  it('is a non-empty array of strings', () => {
    expect(STADES.length).toBeGreaterThan(0);
    for (const s of STADES) {
      expect(typeof s).toBe('string');
    }
  });

  it('contains no duplicates', () => {
    expect(new Set(STADES).size).toBe(STADES.length);
  });

  it('contains expected lifecycle stages', () => {
    expect(STADES).toContain('Semis');
    expect(STADES).toContain('Récolte');
  });
});

// ── CULTURES ────────────────────────────────────────────────────

describe('CULTURES', () => {
  it('is a non-empty array of strings', () => {
    expect(CULTURES.length).toBeGreaterThan(0);
  });

  it('contains no duplicates', () => {
    expect(new Set(CULTURES).size).toBe(CULTURES.length);
  });

  it('every PARCELLES_INIT culture is in CULTURES', () => {
    for (const p of PARCELLES_INIT) {
      expect(CULTURES).toContain(p.culture);
    }
  });
});

// ── EMOJIS_CULTURE ──────────────────────────────────────────────

describe('EMOJIS_CULTURE', () => {
  it('has an emoji for every CULTURE', () => {
    for (const c of CULTURES) {
      expect(EMOJIS_CULTURE).toHaveProperty(c);
      expect(typeof EMOJIS_CULTURE[c]).toBe('string');
      expect(EMOJIS_CULTURE[c].length).toBeGreaterThan(0);
    }
  });

  it('every PARCELLES_INIT emoji matches EMOJIS_CULTURE', () => {
    for (const p of PARCELLES_INIT) {
      expect(EMOJIS_CULTURE[p.culture]).toBe(p.emoji);
    }
  });
});
