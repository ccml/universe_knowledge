import { TestBed } from '@angular/core/testing';
import { ContenuService } from './contenu.service';

describe('ContenuService', () => {
  let service: ContenuService;

  beforeEach(() => {
    service = TestBed.inject(ContenuService);
  });

  it('expose les domaines dans leur ordre', () => {
    const ordres = service.domaines.map((d) => d.ordre);
    expect(ordres).toEqual([...ordres].sort((a, b) => a - b));
  });

  it('retrouve chaque article de chaque domaine, et charge son HTML', async () => {
    for (const d of service.domaines) {
      for (const a of service.articlesDe(d.slug)) {
        expect(service.article(d.slug, a.slug)).toBe(a);
        const corps = await service.corps(d.slug, a.slug);
        expect(corps.html.length).toBeGreaterThan(0);
      }
    }
  });

  it('ne trouve pas un article ou un domaine inconnu', async () => {
    expect(service.domaine('astrologie')).toBeUndefined();
    expect(service.article('cosmologie', 'inconnu')).toBeUndefined();
    await expect(service.corps('cosmologie', 'inconnu')).rejects.toThrow();
  });

  it('donne les articles voisins dans le domaine', () => {
    const premier = service.domaines.flatMap((d) => service.articlesDe(d.slug))[0];
    const { precedent } = service.voisins(premier.domaine, premier.slug);
    expect(precedent).toBeUndefined();
  });
});
