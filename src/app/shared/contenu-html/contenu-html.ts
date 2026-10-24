import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  afterRenderEffect,
  computed,
  createComponent,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { registreInteractifs } from '../../interactifs/registre';

/**
 * Affiche du HTML produit par scripts/contenu.mjs.
 *
 * - Le HTML vient du dépôt (contenu/), il est donc de confiance : pas d'assainissement.
 * - Les liens internes passent par le routeur, sans recharger la page.
 * - Les emplacements [data-interactif] reçoivent leur composant Angular, dans le navigateur.
 */
@Component({
  selector: 'app-contenu-html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'prose', '[innerHTML]': 'contenu()', '(click)': 'clic($event)' },
  template: '',
})
export class ContenuHtml {
  readonly html = input.required<string>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injecteur = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);
  private montes: ComponentRef<unknown>[] = [];

  protected readonly contenu = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.html()));

  constructor() {
    afterRenderEffect(() => {
      this.contenu();
      void this.monterInteractifs();
    });
    inject(DestroyRef).onDestroy(() => this.demonter());
  }

  protected clic(evenement: MouseEvent): void {
    const lien = (evenement.target as Element | null)?.closest('a');
    const href = lien?.getAttribute('href');
    if (
      !href?.startsWith('/') ||
      lien?.target ||
      evenement.button !== 0 ||
      evenement.metaKey ||
      evenement.ctrlKey ||
      evenement.shiftKey ||
      evenement.altKey
    ) {
      return;
    }
    evenement.preventDefault();
    void this.router.navigateByUrl(href);
  }

  private async monterInteractifs(): Promise<void> {
    this.demonter();
    const emplacements = this.hote.nativeElement.querySelectorAll<HTMLElement>('[data-interactif]');
    for (const emplacement of Array.from(emplacements)) {
      const charger = registreInteractifs[emplacement.dataset['interactif'] ?? ''];
      if (!charger) continue;
      const type = await charger();
      if (!emplacement.isConnected) return; // le contenu a changé entre-temps
      emplacement.replaceChildren();
      const ref = createComponent(type, {
        environmentInjector: this.injecteur,
        hostElement: emplacement,
      });
      this.appRef.attachView(ref.hostView);
      this.montes.push(ref);
    }
  }

  private demonter(): void {
    for (const ref of this.montes) ref.destroy();
    this.montes = [];
  }
}
