import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import site from '../../../site.config.json';

export interface PageSeo {
  /** Titre de la page, sans le nom du site. Absent pour l'accueil. */
  titre?: string;
  description: string;
  /** Chemin absolu de la page, par ex. « /cosmologie/le-big-bang ». */
  chemin: string;
  type?: 'website' | 'article';
  /** Données structurées schema.org, injectées en JSON-LD. */
  donneesStructurees?: Record<string, unknown>;
  /** Page à ne pas indexer (404…). */
  noindex?: boolean;
}

/** Titre, description, URL canonique et balises Open Graph de chaque page. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  readonly nomSite = site.nom;

  url(chemin: string): string {
    return site.url.replace(/\/$/, '') + chemin;
  }

  definir(page: PageSeo): void {
    const titre = page.titre ? `${page.titre} – ${site.nom}` : site.nom;
    const url = this.url(page.chemin);
    this.title.setTitle(titre);

    const balises: Array<[attribut: 'name' | 'property', cle: string, valeur: string]> = [
      ['name', 'description', page.description],
      ['name', 'robots', page.noindex ? 'noindex' : 'index, follow'],
      ['property', 'og:title', page.titre ?? site.nom],
      ['property', 'og:description', page.description],
      ['property', 'og:type', page.type ?? 'website'],
      ['property', 'og:url', url],
      ['property', 'og:site_name', site.nom],
      ['property', 'og:locale', 'fr_FR'],
      ['name', 'twitter:card', 'summary'],
    ];
    for (const [attribut, cle, valeur] of balises) {
      this.meta.updateTag({ [attribut]: cle, content: valeur }, `${attribut}="${cle}"`);
    }

    this.lien('canonical', url);
    this.jsonLd(page.donneesStructurees);
  }

  private lien(rel: string, href: string): void {
    let lien = this.document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!lien) {
      lien = this.document.createElement('link');
      lien.rel = rel;
      this.document.head.appendChild(lien);
    }
    lien.href = href;
  }

  private jsonLd(donnees?: Record<string, unknown>): void {
    this.document.head.querySelector('script[data-seo]')?.remove();
    if (!donnees) return;
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', '');
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...donnees });
    this.document.head.appendChild(script);
  }
}
