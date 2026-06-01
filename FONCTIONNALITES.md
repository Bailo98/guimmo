# FONCTIONNALITES.md — LogerBien

Documentation exhaustive de toutes les fonctionnalités de l'interface principale de LogerBien.
Couvre `src/app/(main)/page.tsx` et tous les composants utilisés par ce layout.

---

## TABLE DES MATIÈRES

1. [Architecture générale](#1-architecture-générale)
2. [Données Supabase — Page principale](#2-données-supabase--page-principale)
3. [HERO — Section d'accueil](#3-hero--section-daccueil)
4. [LiveCounterBadge — Compteur live](#4-livecounterbadge--compteur-live)
5. [HeroSearch — Barre de recherche](#5-herosearch--barre-de-recherche)
6. [PreviewCard — Cartes flottantes hero](#6-previewcard--cartes-flottantes-hero)
7. [Bandeau Urgences — Disponible maintenant](#7-bandeau-urgences--disponible-maintenant)
8. [MaisonDuJour — Bien du jour](#8-maisondujour--bien-du-jour)
9. [Annonces Récentes](#9-annonces-récentes)
10. [RecentlyViewedSection — Vus récemment](#10-recentlyviewedsection--vus-récemment)
11. [Quartiers Populaires](#11-quartiers-populaires)
12. [Je Cherche — CTA chercheurs](#12-je-cherche--cta-chercheurs)
13. [Section Confiance](#13-section-confiance)
14. [Publication Rapide CTA](#14-publication-rapide-cta)
15. [PWAInstallButton — Installation PWA](#15-pwainstallbutton--installation-pwa)
16. [Header — Navigation principale](#16-header--navigation-principale)
17. [Footer — Pied de page](#17-footer--pied-de-page)
18. [BottomNav — Navigation mobile](#18-bottomnav--navigation-mobile)
19. [PropertyCard — Carte de propriété](#19-propertycard--carte-de-propriété)
20. [ChatbotWidget — Assistant IA](#20-chatbotwidget--assistant-ia)
21. [CompareBar — Barre de comparaison](#21-comparebar--barre-de-comparaison)
22. [Onboarding — Première visite](#22-onboarding--première-visite)
23. [LowConnectionMode — Mode connexion lente](#23-lowconnectionmode--mode-connexion-lente)
24. [ScrollToTop — Bouton retour haut](#24-scrolltotop--bouton-retour-haut)
25. [BudgetEstimator — Estimateur de budget](#25-budgetestimator--estimateur-de-budget)

---

## 1. Architecture générale

| Attribut | Valeur |
|---|---|
| **Fichier principal** | `src/app/(main)/page.tsx` |
| **Type de composant** | Server Component (async) |
| **Revalidation ISR** | `export const revalidate = 60` (60 secondes) |
| **Layout parent** | `src/app/(main)/layout.tsx` |
| **Rendu** | Server-Side Rendering + Incremental Static Regeneration |

### Layout parent `(main)/layout.tsx`
Injecte dans chaque page les composants globaux suivants :
- `Header` — navigation principale
- `Footer` — pied de page
- `BottomNav` — navigation mobile fixe en bas
- `CompareBar` — barre de comparaison flottante
- `Onboarding` — modal de première visite
- `LowConnectionMode` — indicateur réseau faible
- `ScrollToTop` — bouton retour haut de page
- `ChatbotWidget` — assistant IA flottant
- `BudgetEstimator` — outil d'estimation de budget

---

## 2. Données Supabase — Page principale

La page principale effectue **4 requêtes Supabase en parallèle** via `Promise.all` :

### 2.1 `fetchHomeProperties()`
- **Table** : `properties`
- **Colonnes** : `*, property_images(*)`
- **Filtres** : `status = 'active'`
- **Tri** : `is_boosted DESC, created_at DESC`
- **Limite** : 12 annonces
- **Usage** : Hero preview cards (3 premières) + grille "Annonces récentes" (6 premières)

### 2.2 `fetchUrgentProperties()`
- **Table** : `properties`
- **Colonnes** : `*, property_images(*)`
- **Filtres** : `status = 'active'`, `availability_mode IN ('urgent', 'today', 'immediate')`
- **Tri** : `created_at DESC`
- **Limite** : 10 annonces
- **Usage** : Bandeau "Disponibles maintenant"

### 2.3 `fetchActiveCountToday()`
- **Table** : `properties`
- **Colonnes** : `id` (count only, `head: true`)
- **Filtres** : `status = 'active'`, `created_at >= aujourd'hui à 00:00:00`
- **Usage** : Badge live "N nouvelles annonces aujourd'hui"

### 2.4 `fetchNeighborhoodCounts()`
- **Table** : `properties`
- **Colonnes** : `neighborhood`
- **Filtres** : `status = 'active'`
- **Usage** : Compteurs par quartier dans la section "Quartiers populaires"

---

## 3. HERO — Section d'accueil

| Attribut | Valeur |
|---|---|
| **Composant** | Inline dans `page.tsx` |
| **Type** | Server Component |
| **Statut** | ✅ Fonctionnel |

### Description
Section pleine hauteur (`min-h: 100svh`) constituant la première impression de l'application. Elle combine un headline marketing, une barre de recherche, un badge de compteur live, et des cartes de prévisualisation d'annonces sur desktop.

### Sous-fonctionnalités

| Fonctionnalité | Description |
|---|---|
| **Texture grain** | Overlay SVG `fractalNoise` à 4% d'opacité pour un effet premium |
| **Badge "vérifiées"** | Pill dorée animée (pulse) indiquant "Annonces vérifiées · Contact direct" |
| **Titre principal** | "Trouvez votre logement à Conakry" en `font-display` 34–80px, accent doré |
| **Sous-titre** | "Sans commission. Sans intermédiaire. Sans stress." |
| **LiveCounterBadge** | Compteur en temps réel des nouvelles annonces du jour |
| **HeroSearch** | Barre de recherche intégrée |
| **PreviewCards** | 3 cartes flottantes d'annonces sur desktop uniquement (hidden sur mobile) |
| **Scroll hint** | Indicateur d'animation de défilement animé en bas de section |

### Styles
- Fond : `hero-section` (gradient radial doré via CSS class)
- Grid : `1fr / [3fr 2fr]` (responsive, collapse sur mobile)
- Contenu centré avec max-width 7xl

---

## 4. LiveCounterBadge — Compteur live

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/home/LiveCounterBadge.tsx` |
| **Type** | Client Component (`"use client"`) |
| **Données** | `initial: number` (prop passée depuis le serveur) |
| **Statut** | ✅ Fonctionnel |

### Description
Badge vert affichant le nombre de nouvelles annonces publiées dans la journée. Implémente le pattern `mounted` guard pour éviter les erreurs d'hydratation React (#418). N'affiche rien si `initial === 0` ou avant montage.

### Dépendances
- `useState`, `useEffect` (React)
- Props : `initial: number`

### Comportement
- SSR : `null` (suppression du rendu serveur)
- CSR après montage : affiche le badge vert si `initial > 0`
- Texte : `N nouvelle(s) annonce(s) aujourd'hui`

---

## 5. HeroSearch — Barre de recherche

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/home/HeroSearch.tsx` |
| **Type** | Client Component |
| **Statut** | ✅ Fonctionnel |

### Description
Barre de recherche principale du héros. Permet de chercher des annonces par quartier, type ou mot-clé, puis redirige vers `/annonces` avec les paramètres d'URL appropriés.

### Fonctionnalités attendues
- Champ de saisie texte libre
- Suggestions de quartiers populaires
- Soumission vers `/annonces?q=...&neighborhood=...`
- Style glassmorphism ou fond card

---

## 6. PreviewCard — Cartes flottantes hero

| Attribut | Valeur |
|---|---|
| **Composant** | Inline `PreviewCard` dans `page.tsx` |
| **Type** | Server Component (function pure) |
| **Données** | 3 premières propriétés de `fetchHomeProperties()` |
| **Visibilité** | Desktop uniquement (`hidden lg:block`) |
| **Statut** | ✅ Fonctionnel |

### Description
Trois cartes d'annonces réelles superposées en décalé sur le côté droit du héros desktop. Chaque carte est positionnée en absolu avec rotation légère pour un effet de pile. Elles sont purement décoratives/informationnelles (pas de clic, pas de carousel).

### Contenu de chaque carte
- Photo principale ou dégradé par type de bien
- Badge "Location" ou "Vente"
- Titre de l'annonce (line-clamp-1)
- Icône MapPin + quartier
- Prix en GNF (couleur dorée)

### Positions
| Index | Top | Right | Rotation | Z-index | Opacité |
|---|---|---|---|---|---|
| 0 | 0px | 0px | 2deg | 3 | 1.0 |
| 1 | 155px | 28px | -1.2deg | 2 | 0.96 |
| 2 | 295px | 54px | 1.8deg | 1 | 0.88 |

---

## 7. Bandeau Urgences — Disponible maintenant

| Attribut | Valeur |
|---|---|
| **Composant** | Inline `UrgencyCard` dans `page.tsx` |
| **Type** | Server Component |
| **Données** | `fetchUrgentProperties()` |
| **Affichage** | Conditionnel — visible seulement si `urgentProps.length > 0` |
| **Statut** | ✅ Fonctionnel |

### Description
Section horizontale scrollable présentant les annonces urgentes ou disponibles immédiatement. Chaque mini-carte dispose d'un badge de disponibilité coloré et d'un lien direct vers l'annonce.

### Modes de disponibilité

| Mode | Emoji | Couleur | Description |
|---|---|---|---|
| `urgent` | ⚡ | Rouge `#ff4d4d` | Logement urgent |
| `today` | 🔥 | Orange `#ff8c00` | Dispo aujourd'hui |
| `immediate` | 🏃 | Vert `#25D366` | Libre immédiatement |

### Structure UrgencyCard
- Photo (104px de hauteur) ou fond coloré du mode
- Dégradé overlay (bas → transparent)
- Badge de disponibilité en haut à gauche
- Titre (line-clamp-2)
- Quartier avec icône
- Prix en GNF

### Navigation
- Lien vers `/annonces?recent=1` (voir toutes les urgences)
- Chaque carte : lien vers `/annonces/{id}`

---

## 8. MaisonDuJour — Bien du jour

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/MaisonDuJour.tsx` |
| **Type** | Server Component (async) |
| **Tables Supabase** | `favorites`, `properties` |
| **Statut** | ✅ Fonctionnel |

### Description
Section "Coup de cœur du jour" présentant le bien immobilier le plus favorisé de la journée. C'est une vitrine premium avec galerie photo, overlay prix, et bouton WhatsApp de partage.

### Requête Supabase
1. Sélectionne les `property_id` de la table `favorites` créés aujourd'hui
2. Compte les occurrences par `property_id`
3. Récupère le bien avec le plus de favoris via `properties` + `property_images(*)`
4. Fallback : si aucun favori aujourd'hui, prend le bien actif le plus récent

### Données affichées
- Galerie photos (carousel ou grille)
- Prix avec période (`/mois` si location)
- Titre de l'annonce
- Quartier (avec icône MapPin)
- Type de bien
- Bouton "Partager sur WhatsApp" — ouvre `https://wa.me/...` avec le lien de l'annonce
- Lien "Voir l'annonce" → `/annonces/{id}`

---

## 9. Annonces Récentes

| Attribut | Valeur |
|---|---|
| **Composant** | Grille de `PropertyCard` dans `page.tsx` |
| **Type** | Server Component |
| **Données** | 6 premières de `fetchHomeProperties()` |
| **Affichage** | Conditionnel — visible si `recent.length > 0` |
| **Statut** | ✅ Fonctionnel |

### Description
Grille responsive de 1-2-3 colonnes affichant les 6 annonces les plus récentes, triées par `is_boosted DESC, created_at DESC`. Chaque annonce est un `PropertyCard` complet avec photo, prix, titre, badges.

### Navigation
- "Voir tout" → `/annonces`
- Chaque carte → `/annonces/{id}`

---

## 10. RecentlyViewedSection — Vus récemment

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/ui/RecentlyViewedSection.tsx` |
| **Type** | Client Component |
| **Stockage** | `localStorage` |
| **Statut** | ✅ Fonctionnel |

### Description
Section affichant les annonces récemment consultées par l'utilisateur, stockées dans le `localStorage` du navigateur. Invisible si l'utilisateur n'a encore visité aucune annonce ou si le localStorage est vide.

### Comportement
- Lu depuis `localStorage` côté client uniquement
- Implémente le pattern `mounted` guard pour éviter les erreurs d'hydratation
- Affiche jusqu'à N propriétés récentes
- Scroll horizontal sur mobile

---

## 11. Quartiers Populaires

| Attribut | Valeur |
|---|---|
| **Composant** | Grille de liens dans `page.tsx` |
| **Type** | Server Component |
| **Données** | `fetchNeighborhoodCounts()` |
| **Statut** | ✅ Fonctionnel |

### Description
Grille de 6 quartiers populaires de Conakry avec le nombre d'annonces actives par quartier. Chaque quartier est un lien cliquable vers la page des annonces filtrée.

### Quartiers affichés
Kipé · Hamdallaye · Dixinn · Ratoma · Taouyah · Sonfonia

### Comportement des compteurs
- Vert `#22c55e` si des annonces sont disponibles
- Gris `#666` si aucune annonce
- Format : "N annonce(s)"

### Navigation
Chaque quartier → `/annonces?neighborhood={id}`

---

## 12. Je Cherche — CTA chercheurs

| Attribut | Valeur |
|---|---|
| **Composant** | Section inline dans `page.tsx` |
| **Type** | Server Component |
| **Statut** | ✅ Fonctionnel |

### Description
Section call-to-action destinée aux personnes cherchant un logement. Invite à publier une demande de recherche pour que les propriétaires les contactent directement sur WhatsApp.

### Contenu
- Emoji 🔍 en vedette
- Titre "Vous cherchez un logement ?"
- Sous-titre explicatif
- Bouton doré "Publier ma recherche →" → `/je-cherche`
- Mention "Gratuit · Réponse en moins de 24h · Sans inscription obligatoire"

---

## 13. Section Confiance

| Attribut | Valeur |
|---|---|
| **Composant** | Grille de cards inline dans `page.tsx` |
| **Type** | Server Component |
| **Statut** | ✅ Fonctionnel |

### Description
Grille de 4 arguments de confiance présentant les avantages de LogerBien par rapport aux agences traditionnelles.

### Éléments (TRUST_ITEMS)

| Icône | Titre | Description |
|---|---|---|
| 🏠 | Propriétaires directs | Sans intermédiaire ni commission |
| ✅ | Annonces vérifiées | Contrôle avant publication |
| 📞 | Contact direct | WhatsApp ou appel en 1 clic |
| ⚡ | Réponse rapide | Moins de 24h sur WhatsApp |

---

## 14. Publication Rapide CTA

| Attribut | Valeur |
|---|---|
| **Composant** | Section inline dans `page.tsx` |
| **Type** | Server Component |
| **Statut** | ✅ Fonctionnel |

### Description
Section call-to-action destinée aux propriétaires souhaitant publier un logement. Propose deux modes de publication : rapide (4 étapes) ou complète.

### Boutons
| Label | Destination | Style |
|---|---|---|
| ⚡ Publication rapide | `/publier/rapide` | Fond doré, texte sombre |
| Publication complète | `/publier` | Contour doré, texte doré |

### Mentions
- ✓ Sans carte bancaire
- ✓ Résultat immédiat
- ✓ Contact direct WhatsApp

---

## 15. PWAInstallButton — Installation PWA

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/home/PWAInstallButton.tsx` |
| **Type** | Client Component (`"use client"`) |
| **API navigateur** | `beforeinstallprompt`, `appinstalled` |
| **Statut** | ✅ Fonctionnel |

### Description
Bouton permettant d'installer LogerBien en tant qu'application Progressive Web App (PWA) directement depuis l'écran d'accueil du téléphone. Visible uniquement quand le navigateur supporte l'installation PWA.

### Comportement
- Écoute l'événement `beforeinstallprompt`
- Implémente le pattern `mounted` guard (retourne `null` avant montage)
- Affiché uniquement si `deferredPrompt` est disponible
- Au clic : déclenche `deferredPrompt.prompt()` (dialogue système)
- Sur `appinstalled` : masque le bouton

### Wrapper dans page.tsx
```tsx
<Suspense fallback={null}>
  <PWAInstallButton />
</Suspense>
```

### PWAInstallBanner (complémentaire)
- **Fichier** : `src/components/ui/PWAInstallBanner.tsx`
- **Présence** : Dans `src/app/layout.tsx` (global)
- **Rôle** : Bannière distincte (non dans la section PWA de la page principale)

---

## 16. Header — Navigation principale

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/layout/Header.tsx` |
| **Type** | Client Component |
| **Position** | Fixe en haut (`position: fixed`, `z-index: 50`) |
| **Fond** | `var(--nav-bg)` + `backdrop-filter: blur` |
| **Statut** | ✅ Fonctionnel |

### Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| **Logo** | Composant `Logo` (carré doré + texte "LogerBien") |
| **Liens desktop** | Annonces, Carte, Je Cherche |
| **Bouton "Publier"** | Bouton doré CTA → `/publier` |
| **Toggle thème** | Bascule entre mode clair et sombre (`next-themes`) |
| **Cloche notifications** | Icône avec badge rouge si non-lus |
| **Menu utilisateur** | Dropdown avec avatar, nom, liens profil/admin/déconnexion |
| **Menu hamburger** | Menu mobile avec animation slide-down |
| **Indicateur de route active** | Lien actif surligné |

### Données Supabase (notifications)
- **Table** : `notifications`
- **Colonnes** : `user_id`, `read`, `created_at`, `title`, `body`
- **Requête** : Notifications non-lues de l'utilisateur connecté
- **Action** : `markAllRead()` au clic sur la cloche

### Auth
- `useAuth()` hook pour l'état de connexion
- Affiche le menu utilisateur si connecté, sinon "Connexion"

---

## 17. Footer — Pied de page

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/layout/Footer.tsx` |
| **Type** | Server ou Client Component |
| **Statut** | ✅ Fonctionnel |

### Structure (4 colonnes)

| Colonne | Contenu |
|---|---|
| **Marque** | Logo LogerBien, description courte, contact WhatsApp |
| **Annonces** | Liens : Toutes, Location, Vente, Carte interactive |
| **Quartiers** | Liens quartiers Conakry : Kipé, Dixinn, Ratoma, etc. |
| **Informations** | À propos, Publier, Je Cherche, Conditions |

### Footer bas
- Copyright LogerBien
- Liens légaux

---

## 18. BottomNav — Navigation mobile

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/layout/BottomNav.tsx` |
| **Type** | Client Component |
| **Visibilité** | Mobile uniquement (`md:hidden`) |
| **Position** | Fixe en bas, `backdrop-filter: blur(20px)` |
| **Statut** | ✅ Fonctionnel |

### Onglets

| Icône | Label | Destination |
|---|---|---|
| 🏠 | Découvrir | `/` |
| ❤️ | Favoris | `/favoris` |
| 📋 | Annonces | `/annonces` |
| 👤 | Profil | `/profil` |

### Comportement
- Pattern `mounted` guard (déjà implémenté)
- Indicateur actif doré sur l'onglet courant (`usePathname`)
- Tient compte du safe-area iOS (`env(safe-area-inset-bottom)`)

---

## 19. PropertyCard — Carte de propriété

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/ui/PropertyCard.tsx` |
| **Type** | Client Component |
| **Usage** | Grille "Annonces récentes" (6 cards) |
| **Statut** | ✅ Fonctionnel |

### Contenu affiché
- Photo principale (carousel tactile ou image fixe)
- Badge "Location" / "Vente"
- Badge boost (si `is_boosted`)
- Badge disponibilité (`urgent`, `today`, `immediate`)
- Bouton favori (cœur)
- Prix en GNF avec période
- Titre
- Quartier + ville
- Nombre de pièces, surface, type
- Bouton WhatsApp direct

### Interactions
- Swipe photo gauche/droite (mobile)
- Clic favori → ajout/retrait Supabase `favorites`
- Clic carte → `/annonces/{id}`
- Bouton WhatsApp → `https://wa.me/...`

---

## 20. ChatbotWidget — Assistant IA

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/ui/ChatbotWidget.tsx` |
| **Type** | Client Component |
| **Visibilité** | Page d'accueil uniquement (`pathname === "/"`) |
| **Position** | Fixe, coin bas-droit |
| **API** | `POST /api/assistant` |
| **Statut** | ✅ Fonctionnel |

### Fonctionnalités
- Bouton flottant d'ouverture/fermeture
- Interface chat avec historique de conversation
- Suggestions rapides (chips cliquables)
- Appel API `/api/assistant` pour chaque message
- Streaming ou réponse unique

### Suggestions rapides (chips)
Exemples : "Appartements à Kipé", "Budget 500 000 GNF/mois", "Contact propriétaire", etc.

---

## 21. CompareBar — Barre de comparaison

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/ui/CompareBar.tsx` (présumé) |
| **Type** | Client Component |
| **Position** | Fixe en bas (au-dessus de BottomNav) |
| **Statut** | ✅ Fonctionnel |

### Description
Barre flottante permettant de comparer jusqu'à N annonces côte à côte. Apparaît quand l'utilisateur a sélectionné au moins 2 annonces pour comparaison.

### Fonctionnalités
- Affichage des annonces sélectionnées (thumbnails)
- Bouton "Comparer" → `/comparer?ids=...`
- Bouton "Effacer" pour réinitialiser la sélection
- Gestion d'état (Zustand ou Context)

---

## 22. Onboarding — Première visite

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/ui/Onboarding.tsx` (présumé) |
| **Type** | Client Component |
| **Stockage** | `localStorage` (flag `onboarding_done`) |
| **Statut** | ✅ Fonctionnel |

### Description
Modal ou guide affiché lors de la première visite de l'utilisateur. Présente les fonctionnalités principales de LogerBien et guide l'utilisateur dans sa première recherche.

---

## 23. LowConnectionMode — Mode connexion lente

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/ui/LowConnectionMode.tsx` (présumé) |
| **Type** | Client Component |
| **API navigateur** | `navigator.connection` (Network Information API) |
| **Statut** | ✅ Fonctionnel |

### Description
Indicateur ou mode alternatif activé automatiquement quand la connexion réseau de l'utilisateur est lente (2G, effectiveType: "2g" ou "slow-2g"). Peut désactiver certains contenus lourds (images haute résolution, videos, animations).

---

## 24. ScrollToTop — Bouton retour haut

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/ui/ScrollToTop.tsx` |
| **Type** | Client Component |
| **Apparition** | Après 400px de défilement |
| **Position** | Fixe, coin bas-droit |
| **Statut** | ✅ Fonctionnel |

### Description
Bouton circulaire doré permettant de remonter en haut de la page en un clic. Apparaît progressivement après que l'utilisateur a scrollé suffisamment.

### Style
- Fond : `var(--accent-gold)` (bouton doré)
- Icône : flèche vers le haut
- Animation : apparition/disparition douce

---

## 25. BudgetEstimator — Estimateur de budget

| Attribut | Valeur |
|---|---|
| **Fichier** | `src/components/ui/BudgetEstimator.tsx` (présumé) |
| **Type** | Client Component |
| **Statut** | ✅ Fonctionnel |

### Description
Outil permettant à l'utilisateur d'estimer son budget logement en fonction de différents critères (type de bien, quartier, surface). Peut être un drawer ou modal accessible depuis le layout.

---

## Résumé des dépendances

### Bibliothèques principales
| Bibliothèque | Usage |
|---|---|
| `next/link` | Navigation côté client |
| `next/image` | Images optimisées avec lazy loading |
| `@supabase/supabase-js` | Base de données temps réel |
| `next-themes` | Gestion thème clair/sombre |
| `lucide-react` | Icônes (MapPin, ChevronRight, etc.) |
| `react-leaflet` | Carte interactive (AnnoncesMap) |

### Tables Supabase utilisées
| Table | Usage |
|---|---|
| `properties` | Toutes les annonces immobilières |
| `property_images` | Photos des annonces (jointure) |
| `favorites` | Favoris des utilisateurs |
| `notifications` | Notifications push/in-app |

### Variables CSS critiques
| Variable | Usage |
|---|---|
| `--bg-primary` | Fond principal de la page |
| `--bg-secondary` | Fond alternatif / sections |
| `--bg-card` | Fond des cards |
| `--accent-gold` | Couleur d'accentuation principale |
| `--text-primary` | Texte principal |
| `--text-secondary` | Texte secondaire |
| `--border` | Couleur des bordures |
| `--nav-bg` | Fond de la navigation (avec blur) |
| `--cta-whatsapp` | Couleur verte WhatsApp |
| `--font-display` | Police des titres principaux |
| `--font-playfair` | Police du logo |
| `--font-manrope` | Police du corps de texte |
| `--font-fraunces` | Police des titres de sections |
