# AgriSmart Project Audit

Ce rapport d'analyse présente un audit complet de la structure, des écrans, des composants, des contextes, des routes et des dépendances de l'application AgriSmart avant le début des travaux de migration vers Supabase.

---

## 1. Dépendances existantes (`package.json`)

Le projet est basé sur **React 19**, **React Native 0.83**, **Expo 55** et **TypeScript**. Les dépendances clés déjà installées sont :

* **Moteur & Framework** : `expo` (~55.0.18), `expo-router` (~55.0.14)
* **Base de données / Client Cloud** : `@supabase/supabase-js` (^2.108.2) — déjà configuré !
* **Navigation** : `@react-navigation/bottom-tabs` (^7.15.5), `@react-navigation/native` (^7.1.33)
* **Météo & Localisation** : `expo-location` (~55.1.9)
* **Auth tiers** : `expo-auth-session` (^56.0.14), `expo-web-browser` (~55.0.14), `expo-linking` (~55.0.14)
* **UI / Animation** : `react-native-reanimated` (^4.2.1), `react-native-gesture-handler` (~2.30.0), `react-native-svg` (^15.15.3), `expo-symbols` (~55.0.7), `expo-glass-effect` (~55.0.10)
* **Rapports & Graphiques** : `react-native-chart-kit` (^6.12.2)

---

## 2. Routes de l'application (Expo Router)

Les fichiers de routage sont définis sous `src/app/` :

1. **`index.tsx` (Splash Screen / Onboarding)** : Écran d'accueil avec micro-animations d'introduction pour présenter l'application. Redirige vers `/(auth)/login`.
2. **`(auth)/`** :
   * **`_layout.tsx`** : Layout de navigation stack pour l'authentification.
   * **`login.tsx`** : Formulaire de connexion par e-mail et mot de passe (actuellement simulé avec un délai de 1.5s).
   * **`register.tsx`** : Processus d'inscription guidé en 5 étapes (Compte → Localisation → Exploitation → Objectifs → Confirmation) avec enregistrement temporaire dans le `UserContext`.
3. **`(tabs)/`** :
   * **`_layout.tsx`** : Layout principal avec barre d'onglets personnalisée et animée (`AgriTabBar`), définissant 5 onglets.
   * **`index.tsx` (Accueil / Tableau de bord)** : Affiche la météo, l'état du sol, des graphiques d'évolution, les alertes prioritaires, un résumé des parcelles et les recommandations de l'IA.
   * **`parcelles.tsx` (Mes parcelles)** : Gestion des parcelles avec vue cartographique 2D locale, barre de recherche, filtres par statut de capteur, et options de création/modification/suppression.
   * **`marche.tsx` (Le marché)** : Prix en direct pour les denrées de base au Cameroun (Maïs, Cacao, Tomate, etc.), conseils de marché par Gemini IA (placeholder), publication d'annonces de vente via modal et simulateur de revenus.
   * **`meteo.tsx` (Météo détaillée)** : Conditions courantes (Yaoundé), prévisions à 5 jours via OpenWeatherMap (ou fallback), conseils agricoles de l'IA par Gemini (ou fallback) et indicateurs UV/vent.
   * **`profil.tsx` (Mon profil)** : Configuration du profil agricole (superficie, parcelles, zone climatique, cultures, niveau d'expérience, objectifs), paramètres de l'application et outil d'évaluation agricole Gemini IA.

---

## 3. Composants réutilisables

Les composants sont organisés de manière modulaire sous `src/components/` :

### Tableau de bord (`src/components/dashboard/`)
* **`DashboardHeader.tsx`** : Header personnalisé avec message de bienvenue, avatar et date du jour.
* **`MeteoCard.tsx`** : Version carte simplifiée de la météo pour l'écran d'accueil.
* **`SolCard.tsx`** : Carte affichant l'humidité, la température et le pH du sol.
* **`SolChart.tsx`** / **`EvolutionChart.tsx`** : Graphiques de suivi basés sur `react-native-chart-kit`.
* **`AlertesCard.tsx`** : Liste déroulante des alertes critiques pour les cultures.
* **`ParcellesCard.tsx`** : Raccourci vers la liste des parcelles.
* **`RecommandationsCard.tsx`** : Présentation des actions IA recommandées (arrosage, engrais).

### Parcelles (`src/components/parcelles/`)
* **`parcelleHeader.tsx`** : Résumé des métriques de l'exploitation (surface totale, santé moyenne, alertes actives, rendement prévu).
* **`parcelleMap.tsx`** : Carte interactive affichant la disposition géographique relative des parcelles.
* **`ParcelleStatsBar.tsx`** : Filtres rapides par statut (Ok, Attention, Critique) et barre de recherche textuelle.
* **`ParcelleListItem.tsx`** : Rendu individuel d'une parcelle (culture, surface, stade, santé, dernière action).
* **`ParcelleDetailModal.tsx`** : Fiche détaillée de la parcelle, incluant les relevés précis des capteurs d'humidité, de température, de pH, et d'azote.
* **`ParcelleFormModal.tsx`** : Formulaire pour configurer ou modifier une parcelle (nom, type de sol, surface, culture, etc.).

### UI de base (`src/components/ui/`)
* **`Card.tsx`** : Conteneur standardisé.
* **`Badge.tsx`** : Indication de statuts avec couleurs dynamiques.
* **`SectionTitle.tsx`** : Titre de section standardisé avec bouton d'action secondaire.
* **`collapsible.tsx`** : Bloc repliable (accordion).

### Composants globaux
* **`animated-icon.tsx` / `animated-icon.web.tsx`** : Icônes animées pour le web et le mobile.
* **`app-tabs.tsx` / `app-tabs.web.tsx`** : Wrappers d'onglets.
* **`external-link.tsx`** : Gestion des liens sortants dans l'application.
* **`hint-row.tsx`** : Ligne d'aide explicative.
* **`web-badge.tsx`** : Badge web.

---

## 4. Données mockées (Simulées)

Les données mockées constituent la majeure partie des données affichées. Elles se trouvent principalement dans :

* **`src/components/data/mockData.ts`** :
  * `PARCELLES` : Données de démonstration pour l'écran d'accueil.
  * `DONNEES_SOL` : Valeurs d'humidité, de NPK et de pH.
  * `ALERTES` : Liste des alertes de sécheresse, maladies et pH.
  * `RECOMMANDATIONS` : Liste des actions agronomiques suggérées.
  * `EVOLUTION` : Données historiques des rendements.
  * `CAPTEURS_IOT` / `STATS_IOT` : Données de capteurs simulés (CO2, batterie, humidité, etc.).
  * `ANNONCES` : Liste des offres de vente et d'achat du marché.
* **`src/components/data/parcellesData.ts`** :
  * `PARCELLES_INIT` : Liste de parcelles détaillées avec coordonnées géographiques locales pour l'onglet parcelles.
* **Fallbacks de secours** :
  * `src/app/(tabs)/meteo.tsx` : `METEO_FALLBACK` et `PREVISIONS_FALLBACK`.
  * `src/app/(tabs)/marche.tsx` : `PRODUITS_BASE`.
  * `src/app/(tabs)/profil.tsx` : Fallback JSON de l'analyse IA.

---

## 5. Contextes existants (`src/context/`)

1. **`UserContext.tsx`** : Stocke l'état temporaire du profil utilisateur (`UserProfile | null`). Permet à l'application de réagir à la configuration de la ferme (cultures suivies, objectifs) pour adapter les interfaces.
2. **`AuthContext.tsx`** : Ébauche d'authentification intégrée à Supabase. Contient déjà les définitions de signature pour `signUp`, `signIn`, `signInWithGoogle` (OAuth), `signOut` et `resetPassword`. Ce contexte est initialisé mais pas encore rattaché au `RootLayout` global.

---

## 6. Services d'infrastructure existants

Une structure de services est déjà présente pour interagir avec Supabase :

* **`lib/supabase.ts`** : Initialisation du client `createClient` avec détection des variables d'environnement.
* **`services/auth/supabaseAuth.ts`** : Encapsule les appels `signUp`, `signInWithPassword`, `signInWithOAuth`, `signOut` et `resetPasswordForEmail` du client Supabase Auth.
* **`services/database/profiles.ts`** : Requêtes de base pour récupérer et enregistrer les données des profils (`profiles` table).
* **`services/storage/supabaseStorage.ts`** : Helpers pour téléverser les photos des profils, parcelles et diagnostics vers Supabase Storage.
* **`services/realtime/supabaseRealtime.ts`** : Helpers pour écouter les canaux de modifications Postgres en temps réel.

---

## Conclusion de l'audit

L'application AgriSmart possède une excellente base visuelle et interactive. De nombreuses ébauches de services Supabase et d'authentification sont en place mais n'ont pas encore été connectées aux formulaires d'interface, et les données de la base ne sont pas encore lues ou écrites (toutes les fonctionnalités reposent sur les mock data locaux).

Le plan de transition consistera à relier ces services, concevoir la base de données PostgreSQL, activer le RLS et remplacer progressivement les données simulées par des données persistantes stockées dans le cloud Supabase.
