import { inject } from '@angular/core';
import { CanMatchFn, Routes } from '@angular/router';
import { ContenuService } from './contenu/contenu.service';

/** La route ne correspond que si le domaine existe ; sinon on tombe sur la page introuvable. */
const domaineExiste: CanMatchFn = (_route, segments) =>
  !!inject(ContenuService).domaine(segments[0]?.path ?? '');

const articleExiste: CanMatchFn = (_route, segments) =>
  !!inject(ContenuService).article(segments[0]?.path ?? '', segments[1]?.path ?? '');

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/accueil/accueil').then((m) => m.Accueil),
  },
  {
    path: 'glossaire',
    loadComponent: () => import('./pages/glossaire/glossaire').then((m) => m.GlossairePage),
  },
  {
    path: ':domaine',
    canMatch: [domaineExiste],
    loadComponent: () => import('./pages/domaine/domaine').then((m) => m.DomainePage),
  },
  {
    path: ':domaine/:article',
    canMatch: [articleExiste],
    loadComponent: () => import('./pages/article/article').then((m) => m.ArticlePage),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/introuvable/introuvable').then((m) => m.Introuvable),
  },
];
