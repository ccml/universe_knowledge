# CLAUDE.md — Connaissances de l'univers

## Objectif du projet

Produire du **contenu pédagogique de vulgarisation** sur l'univers, destiné à un public curieux mais non spécialiste : articles, fiches, cours et explications, publiés sur un site web.

Domaines couverts :
- **Système solaire** : Soleil, planètes, lunes, astéroïdes, comètes
- **Étoiles et galaxies** : formation et vie des étoiles, nébuleuses, trous noirs, galaxies, amas
- **Cosmologie** : Big Bang, expansion, matière noire, énergie sombre, structure à grande échelle

## Langue et ton

- Rédiger **tout le contenu en français**.
- Quand un terme technique est surtout connu en anglais, l'ajouter entre parenthèses à sa première apparition, par exemple « sursaut gamma (*gamma-ray burst*) ».
- Ton clair, chaleureux et enthousiaste, sans être infantilisant. Tutoiement ou vouvoiement : rester cohérent au sein d'un même document (vouvoiement par défaut).
- Privilégier des phrases courtes et un vocabulaire courant. Définir chaque terme technique dès sa première utilisation.

## Principes de vulgarisation

- **Exactitude avant tout** : simplifier sans jamais dire quelque chose de faux. Si une simplification est forte, le signaler (« en simplifiant un peu… »).
- **Analogies et ordres de grandeur** : rendre les échelles concrètes (« si le Soleil était un ballon de football, la Terre serait… »).
- **Partir d'une question** : ouvrir un sujet par une question que se pose le lecteur.
- **Distinguer** clairement ce qui est établi, ce qui est probable et ce qui reste débattu ou inconnu (ex. : nature de la matière noire).
- Éviter les équations ; si une formule est vraiment éclairante (ex. E = mc²), l'expliquer en mots.
- Pas de sensationnalisme ni de mythes répandus (« on voit la Grande Muraille de Chine depuis la Lune », « il n'y a pas de gravité dans l'espace »…) ; au contraire, les corriger quand c'est pertinent.

## Fiabilité des informations

- Les sources ne sont pas obligatoires dans le texte, mais **vérifier les chiffres et faits récents** (nombre de lunes connues, résultats de missions, découvertes) auprès de sources fiables : NASA, ESA, ESO, CNES, IAU, observatoires, publications scientifiques.
- Les valeurs qui évoluent (nombre de satellites, exoplanètes confirmées, constante de Hubble…) doivent être accompagnées d'une date (« en 2026 ») ou d'une formulation prudente.
- Utiliser les unités du Système international et les unités astronomiques usuelles (ua, année-lumière, parsec), en expliquant chacune.
- Écrire les nombres à la française : virgule décimale, espace pour les milliers (ex. 149,6 millions de km ; 300 000 km/s).

## Structure type d'un article

1. **Titre** accrocheur et explicite
2. **Accroche** : une question ou un fait surprenant
3. **Corps** en sections courtes avec intertitres `##` (un sommaire s'affiche à partir de 3 intertitres)
4. **Encadré « À retenir »** (`:::a-retenir`) : 3 à 5 points clés
5. *(Optionnel)* **Pour aller plus loin** : liens ou suggestions de lecture

## Écrire le contenu (dossier `contenu/`)

```
contenu/
  glossaire.md                    termes du glossaire (front matter)
  systeme-solaire/
    index.md                      présentation du domaine
    le-systeme-solaire-a-l-echelle.md
  etoiles-et-galaxies/…
  cosmologie/…
```

- Un dossier par domaine, avec un `index.md`. Un fichier par article. Noms en minuscules, sans accents, avec des tirets : ils deviennent l'URL (`/cosmologie/le-big-bang`).
- **Front matter d'un article** (obligatoire sauf mention) :
  ```yaml
  titre: Le Big Bang, l'histoire d'une expansion
  description: Une ou deux phrases (200 caractères au plus), reprises par les moteurs de recherche.
  niveau: decouverte          # ou intermediaire
  mise_a_jour: 2026-10-24
  mots_cles: [Big Bang, expansion]   # facultatif
  ordre: 1                    # facultatif : position dans le domaine
  brouillon: true             # facultatif : article exclu du site
  ```
- **Front matter d'un domaine** (`index.md`) : `titre`, `description`, `symbole` (`soleil`, `etoile` ou `spirale`), `ordre`.
- **Glossaire** : liste `termes` de `{ terme, definition, id? }` dans `contenu/glossaire.md`. L'`id` (ancre) est déduit du terme s'il est absent.
- **Syntaxe maison** :
  - `:::a-retenir` … `:::` — encadré « À retenir ».
  - `:::encadre[Le saviez-vous ?]` … `:::` — encadré titré.
  - `:terme[années-lumière]{#annee-lumiere}` — mot relié au glossaire (définition en info-bulle). Sans `{#…}`, l'id est déduit du libellé.
  - `::composant{nom=echelle-planetes}` — composant interactif Angular.
  - Liens internes en chemin absolu : `[le Big Bang](/cosmologie/le-big-bang)`. Liens externes en `https://`.
  - Images relatives au fichier (`![texte alternatif](images/x.webp)`), texte alternatif obligatoire.
- La **typographie française** est appliquée automatiquement (apostrophe courbe, espaces insécables avant `; : ! ?`, dans les nombres et avant les unités) : écrire normalement dans les fichiers.
- Le build **échoue** si un article est incomplet ou contient un lien interne cassé, un terme absent du glossaire, une directive ou un composant inconnu, une image sans texte alternatif. Le message indique le fichier et la ligne.

## Le site web

### Principe directeur : frontend seul

- **Angular seul, sans backend**, aussi longtemps que possible. Le contenu est statique : il vit dans le dépôt, est converti au build et prérendu.
- Un backend n'est envisagé qu'en dernier recours, quand une fonctionnalité ne peut vraiment pas se faire côté client (comptes utilisateurs partagés entre appareils, données saisies par les visiteurs, secret d'API à protéger…). **Toujours demander avant d'introduire un backend**, en expliquant pourquoi une solution frontend ne suffit pas.
- Pour une donnée propre à un visiteur (favoris, progression, préférences), préférer le stockage navigateur (IndexedDB, `localStorage`) à un backend.
- Le petit serveur Node (`src/server.ts`) ne sert qu'à distribuer les pages prérendues et à rendre la page 404 : ce n'est pas un backend, n'y ajouter aucune API sans le demander.

### Architecture

```
contenu/                     Markdown (source de vérité du contenu)
scripts/contenu.mjs          conversion Markdown → données du site (+ scripts/contenu/lib.mjs, testé)
site.config.json             nom, URL publique du site (sitemap, URL canoniques)
src/generated/               généré, ignoré par git : index (contenu.ts) + un module par article
src/app/
  pages/                     accueil, domaine, article, glossaire, introuvable (routes lazy)
  contenu/                   modèles et ContenuService (accès au contenu généré)
  seo/                       SeoService : title, meta, canonical, Open Graph, JSON-LD
  shared/                    contenu-html (affiche le HTML généré), ciel, symbole, meta-article
  interactifs/               composants insérables dans un article + registre
  i18n/fr.json               libellés d'interface
src/server.ts                serveur Express (pages prérendues, 404)
```

- **Rendu du contenu au build** (décision prise) : `scripts/contenu.mjs` (`unified`/`remark`/`rehype` + `gray-matter`) produit `src/generated/contenu.ts` (domaines, résumés d'articles, glossaire, chargeurs), un module par article (chargé à la demande, un chunk JS chacun), `public/sitemap.xml` et copie les images dans `public/contenu-images/`. Aucun convertisseur Markdown n'est livré au navigateur ; `ContenuHtml` affiche le HTML (contenu de confiance), fait passer les liens internes par le routeur et monte les composants interactifs.
- **Prérendu** : toutes les pages sont prérendues au build (`app.routes.server.ts`, paramètres tirés de `src/generated/contenu.ts`). Les adresses inconnues sont rendues par le serveur avec un **vrai statut 404**. Tout le monde reçoit le HTML prérendu, puis Angular s'hydrate : il n'y a pas besoin de détecter les robots comme le fait MyPianoTool.
- **Composant interactif** : créer le composant dans `src/app/interactifs/<nom>/`, l'ajouter à `registre.ts` **et** à `interactifs.json` (lu par le script pour valider le contenu ; un test vérifie que les deux concordent). Il est monté dans le navigateur uniquement ; prévoir une version utilisable au clavier et un texte alternatif.

### Stack frontend — modèle : MyPianoTool

Projet de référence : `~/projects/site_music/mypianotool`. Choix repris :

- **Angular 22**, composants **standalone**, **zoneless** (par défaut en Angular 22), état via les **signals**, `ChangeDetectionStrategy.OnPush`. Fichiers au nouveau style (`accueil.ts`, sans suffixe `.component`).
- **TypeScript strict**, pas de `any`. Node ≥ 22.22 (images Docker en Node 26).
- Builder `@angular/build:application`, styles en **SCSS** par composant + `src/styles.scss` global (jetons de couleur et de typographie en variables CSS).
- **Bootstrap 5** (CSS, thème sombre) + `@ng-bootstrap/ng-bootstrap`.
- **`@ngx-translate`** : les libellés d'interface passent par `src/app/i18n/fr.json` et le pipe `translate`, jamais en dur dans les templates. Le fichier est intégré au bundle (`ChargeurStatique`) pour être disponible au prérendu, sans requête HTTP. Le contenu pédagogique, lui, reste dans `contenu/`.
- **Routes toutes en lazy loading** dans `app.routes.ts`.
- **SEO** : chaque page appelle `SeoService.definir()` (titre, description, URL canonique, Open Graph, données structurées). `robots.txt` dans `public/`, `sitemap.xml` généré.
- **PWA** via `@angular/service-worker` (production seulement), configuration dans `ngsw-config.json` : les articles étant des chunks JS, ils sont mis en cache pour la lecture hors ligne.
- **Formulaires** : `ReactiveFormsModule` si un formulaire devient nécessaire.
- **Tests** : **Vitest** — `*.spec.ts` colocalisés pour Angular (`ng test`), `scripts/**/*.test.mjs` pour le script de contenu.
- Mise en forme : Prettier (`printWidth` 100, guillemets simples), `npm run format`.
- **Hôtes autorisés** pour le rendu serveur : `security.allowedHosts` dans `angular.json` (`univers.ccmlits.net`, `localhost`). À mettre à jour si le domaine change, ainsi que `site.config.json` et `public/robots.txt`.

### Commandes

```bash
npm install
npm start               # contenu (surveillé) + ng serve → http://localhost:4200
npm run contenu         # régénère le contenu une fois (et le valide)
npm test                # tests Angular + tests du script de contenu
npm run build           # contenu + build + prérendu → dist/connaissances-univers
npm run serve:ssr       # sert le build → http://localhost:4000
npm run docker:build    # image amd64 + arm64 poussée sur Docker Hub (ccmlits/connaissances-univers:<version>)
```

### Déploiement

Image Docker en deux étapes (`Dockerfile` : build Angular, puis runtime Node minimal sans `node_modules`, le serveur SSR étant autonome), lancée par Docker Compose derrière Nginx Proxy Manager, comme MyPianoTool (`site_music/srv_config`). Exemple dans `deploiement/compose.yml`.

### Si un backend devient nécessaire — modèle : CatalogueMaison

Projet de référence : `~/projects/CatalogueMaison`. En reprendre les choix techniques :

- **.NET 10 / ASP.NET Core Minimal APIs**, C#, `nullable` et warnings-as-errors activés.
- Code et identifiants publics en **anglais** ; les libellés affichés restent en français, dans le frontend.
- **Un dossier par fonctionnalité** plutôt qu'un découpage par couche technique. **DTOs explicites** aux frontières HTTP, jamais d'entité EF exposée.
- **PostgreSQL** via **EF Core 10** (`Npgsql.EntityFrameworkCore.PostgreSQL`), nommage `snake_case` (`EFCore.NamingConventions`), migrations versionnées.
- Versions de paquets **centralisées** dans `Directory.Packages.props` (épinglage transitif, aucune version flottante, aucune version dans un `.csproj`).
- Configuration par `IOptions<T>`, **aucun secret dans le dépôt** (user-secrets en dev, variables d'environnement ailleurs).
- Si une authentification est nécessaire : OAuth2 / OIDC via **Keycloak**, Authorization Code + PKCE côté Angular (`oidc-client-ts`), validation JWT bearer côté API.
- Tests **xUnit** (+ Testcontainers pour PostgreSQL).
- Docker Compose pour le dev local ; en production, seul le conteneur frontend est exposé et relaie l'API sous la même origine.
- Ne reprendre de CatalogueMaison que ce qui est utile : pas de microservices ni de multitenant sans besoin réel.

## Consignes pour Claude

- Avant de créer un nouveau contenu, vérifier s'il existe déjà un fichier sur le sujet pour éviter les doublons et assurer la cohérence.
- Relire chaque texte pour l'exactitude scientifique et l'orthographe française avant de le livrer.
- En cas de doute sur un fait, le vérifier plutôt que de l'affirmer.
- Après un ajout de contenu : `npm run contenu` (validation), puis `npm test`.
- Toute nouvelle page du site : route en lazy loading, `SeoService.definir()` appelé, route prérendue (`app.routes.server.ts`) et présente dans le sitemap.
- Ne jamais modifier `src/generated/` à la main : il est régénéré à partir de `contenu/`.
- **Ne pas s'occuper de git** : ni commit, ni branche, ni push. L'utilisateur gère git lui-même ; les modifications restent dans l'arbre de travail.

## À demander avant de décider seul

- Ajout d'un backend, d'une base de données ou d'un service hébergé, ou d'une API dans `src/server.ts`.
- Ajout d'une API externe payante ou nécessitant une clé.
- Remise en cause de la conversion du Markdown au build (ex. rendu dans le navigateur, passage à Analog.js).
- Abandon du prérendu ou de la stratégie SEO.
- Changement du domaine public du site ou de l'identité visuelle (couleurs, polices).
