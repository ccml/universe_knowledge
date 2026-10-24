import { PLANETES, SOLEIL, disposer } from './disposition';

describe('disposer', () => {
  const terre = PLANETES.find((p) => p.id === 'terre')!;
  const jupiter = PLANETES.find((p) => p.id === 'jupiter')!;

  it('garde les proportions entre les astres', () => {
    const { cercles } = disposer([terre, jupiter], false, 1000, 260);
    expect(cercles[1].r / cercles[0].r).toBeCloseTo(jupiter.rayonKm / terre.rayonKm, 5);
  });

  it('tient dans le cadre, sans chevauchement', () => {
    const { cercles } = disposer(PLANETES, false, 1000, 260);
    for (const [i, c] of cercles.entries()) {
      expect(c.cx + c.r).toBeLessThanOrEqual(1000);
      expect(2 * c.r).toBeLessThanOrEqual(260);
      if (i > 0) expect(c.cx - c.r).toBeGreaterThan(cercles[i - 1].cx + cercles[i - 1].r);
    }
  });

  it('dessine le Soleil à la même échelle, dont seul le bord dépasse à gauche', () => {
    const { cercles, soleil } = disposer([terre], true, 1000, 260);
    expect(soleil!.r / cercles[0].r).toBeCloseTo(SOLEIL.rayonKm / terre.rayonKm, 5);
    expect(soleil!.cx + soleil!.r).toBeLessThan(cercles[0].cx - cercles[0].r);
  });

  it('grossit les astres trop petits pour être vus', () => {
    // Cadre étroit : Mercure tomberait sous le rayon minimum.
    const { cercles, agrandis } = disposer(PLANETES, true, 600, 260);
    expect(Math.min(...cercles.map((c) => c.r))).toBeGreaterThanOrEqual(4);
    expect(agrandis).toContain('mercure');
    expect(agrandis).not.toContain('jupiter');
  });
});
