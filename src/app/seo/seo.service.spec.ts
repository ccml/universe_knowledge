import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let seo: SeoService;
  let document: Document;

  beforeEach(() => {
    seo = TestBed.inject(SeoService);
    document = TestBed.inject(DOCUMENT);
  });

  it('définit titre, description, URL canonique et données structurées', () => {
    seo.definir({
      titre: 'Le Big Bang',
      description: 'Une histoire d’expansion.',
      chemin: '/cosmologie/le-big-bang',
      donneesStructurees: { '@type': 'Article' },
    });

    expect(document.title).toBe(`Le Big Bang – ${seo.nomSite}`);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Une histoire d’expansion.',
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      seo.url('/cosmologie/le-big-bang'),
    );
    const jsonLd = JSON.parse(document.querySelector('script[data-seo]')!.textContent!);
    expect(jsonLd).toEqual({ '@context': 'https://schema.org', '@type': 'Article' });
  });

  it('remplace les balises d’une page à l’autre sans les dupliquer', () => {
    seo.definir({ description: 'A', chemin: '/' });
    seo.definir({ description: 'B', chemin: '/glossaire', noindex: true });

    expect(document.title).toBe(seo.nomSite);
    expect(document.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');
    expect(document.querySelector('script[data-seo]')).toBeNull();
  });
});
