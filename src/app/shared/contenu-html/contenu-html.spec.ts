import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ContenuHtml } from './contenu-html';

describe('ContenuHtml', () => {
  function creer(html: string) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ContenuHtml);
    fixture.componentRef.setInput('html', html);
    fixture.detectChanges();
    return fixture;
  }

  it('affiche le HTML tel quel, attributs compris', () => {
    const fixture = creer('<h2 id="une-etoile">Une étoile</h2><aside class="a-retenir">x</aside>');
    const hote: HTMLElement = fixture.nativeElement;
    expect(hote.querySelector('h2')?.id).toBe('une-etoile');
    expect(hote.querySelector('aside.a-retenir')).not.toBeNull();
  });

  it('fait passer les liens internes par le routeur', () => {
    const fixture = creer('<a href="/glossaire#nebuleuse">nébuleuse</a>');
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const evenement = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    fixture.nativeElement.querySelector('a').dispatchEvent(evenement);
    expect(navigation).toHaveBeenCalledWith('/glossaire#nebuleuse');
    expect(evenement.defaultPrevented).toBe(true);
  });

  it('laisse le navigateur gérer les liens externes', () => {
    const fixture = creer('<a href="https://www.esa.int">ESA</a>');
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    let empecheParLeComposant = true;
    // Après le composant : on observe, puis on bloque la vraie navigation (non gérée par jsdom).
    fixture.nativeElement.addEventListener('click', (e: Event) => {
      empecheParLeComposant = e.defaultPrevented;
      e.preventDefault();
    });
    const evenement = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    fixture.nativeElement.querySelector('a').dispatchEvent(evenement);
    expect(navigation).not.toHaveBeenCalled();
    expect(empecheParLeComposant).toBe(false);
  });
});
