# AgriSmart Mobile App

## Présentation

AgriSmart est une application mobile Expo/React Native dédiée à l'agriculture intelligente au Cameroun. Elle propose un tableau de bord agricole, une gestion de parcelles, des prix du marché local, des prévisions météo et des recommandations pilotées par l'IA.

L'application est organisée avec `expo-router` et utilise des composants React, des cartes de données agronomiques et des interfaces utilisateur fluides.

## Fonctionnalités principales

### 1. Écran d'accueil / Splash

- Animation d'introduction moderne avec logo et message de marque
- Présentation des points forts : IoT, IA, monitoring 24/7
- Navigation vers l'écran de connexion

### 2. Authentification

- Écran de connexion (`src/app/(auth)/login.tsx`)
  - Saisie e-mail et mot de passe
  - Affichage d'erreur si les champs sont vides
  - Toggle affichage du mot de passe
  - Navigation vers l'écran d'inscription

- Écran d'inscription multi-étapes (`src/app/(auth)/register.tsx`)
  - Informations personnelles et création de compte
  - Localisation automatique par ville + région + zone climatique
  - Sélection des cultures, superficie, nombre de parcelles
  - Objectifs agricoles et niveau d'expérience
  - Choix des défis principaux
  - Validation de formulaire par étape
  - Création du profil utilisateur et redirection vers l'application

### 3. Navigation par onglets personnalisée

- Navigation principale sous forme d'onglets (`src/app/(tabs)/_layout.tsx`)
- Onglets disponibles :
  - Accueil
  - Parcelles
  - Marché
  - Météo
  - Profil
- Barre d'onglets animée avec icônes et transitions

### 4. Tableau de bord (Accueil)

- Composant `src/app/(tabs)/index.tsx`
- Sections affichées :
  - Météo du jour
  - État du sol
  - Évolution des cultures
  - Alertes IA
  - Synthèse des parcelles
  - Recommandations IA
- Bannière profil IA utilisant les données du profil utilisateur
- Cartes métier réutilisables dans `src/components/dashboard/`
  - `DashboardHeader.tsx`
  - `MeteoCard.tsx`
  - `SolCard.tsx`
  - `EvolutionChart.tsx`
  - `AlertesCard.tsx`
  - `ParcellesCard.tsx`
  - `RecommandationsCard.tsx`

### 5. Gestion des parcelles

- Écran `src/app/(tabs)/parcelles.tsx`
- Fonctionnalités :
  - Liste des parcelles avec recherche et filtres
  - Filtres par statut : toutes, ok, attention, critique
  - Carte de parcelles interactive (`src/components/parcelles/ParcelleMap.tsx`)
  - Visualisation des parcelles sur une carte stylisée
  - Sélection d'une parcelle pour voir les détails
  - Ajout / modification / suppression de parcelles
  - Saisie de nom, culture, surface, type de sol, localisation
  - Statistiques globales de parcelles : nombre, superficie totale, état, rendement attendu

- Détails de parcelle (`src/components/parcelles/ParcelleDetailModal.tsx`)
  - Affichage des capteurs en direct : humidité, température, pH, azote
  - État de santé de la parcelle et barre de progression
  - Stade de croissance de la culture
  - Actions rapides simulées (arrosage, récolte, photo, historique)
  - Informations pratiques : dernier arrosage, prochaine tâche, position GPS, rendement

- Formulaire de parcelle (`src/components/parcelles/ParcelleFormModal.tsx`)
  - Création et édition de parcelles
  - Sélection de culture, type de sol, localisation
  - Contrôle de validation et saisie guidée

- Données initiales et modèle de parcelle dans `src/components/data/parcellesData.ts`
  - Statut du capteur, statut de la parcelle, métriques de culture
  - Données simulées pour plusieurs parcelles

### 6. Marché agricole

- Écran `src/app/(tabs)/marche.tsx`
- Affiche une liste de produits agricoles avec :
  - prix actuels
  - tendance de prix (hausse / baisse / stable)
  - état du stock (abondant / normal / rare)
  - nombre de vendeurs
  - conseils de vente
- Recherche et filtres catégorie
- Résumé du marché et statistiques rapides
- Publication d'annonce de vente via modal
- Intégration IA pour conseils de marché via Gemini (`src/app/(tabs)/marche.tsx`)
  - Prompt génératif pour conseils agricoles
  - Fallback statique si l'API n'est pas disponible

### 7. Météo agricole

- Écran `src/app/(tabs)/meteo.tsx`
- Données météo en direct via OpenWeatherMap
  - température, ressenti, humidité, vent, visibilité, UV, pluie
  - lever/coucher du soleil
- Prévisions sur 5 jours
- Onglets : Aujourd'hui / 5 jours / Conseils IA
- Conseils agricoles personnalisés avec Gemini
- Effets de rafraîchissement et animation des données
- Fallback météo si l'API OpenWeatherMap échoue

### 8. Profil utilisateur

- Écran `src/app/(tabs)/profil.tsx`
- Stockage du profil dans `src/context/UserContext.tsx`
- Fonctionnalités :
  - Visualisation des données personnelles et agricoles
  - Edition du profil utilisateur
  - Sélection des cultures, zone climatique, objectif, expérience
  - Score et analyse IA Gemini
  - Points forts, axes d'amélioration et prochaines actions
  - Paramètres de notifications et support
  - Mode édition et mode consultation

## Architecture et structure

### Sources principales

- `src/app/` : routes Expo Router
- `src/context/UserContext.tsx` : contexte utilisateur global
- `src/components/` : composants réutilisables UI et métier
- `src/components/dashboard/` : cartes du tableau de bord
- `src/components/parcelles/` : carte, liste, modals de parcelles
- `src/components/data/` : jeux de données mock et constantes
- `src/constants/theme.ts` : palette de couleurs et styles globaux

### Principales dépendances

- `expo`, `expo-router`, `expo-location`, `expo-web-browser`, `expo-status-bar`
- `react`, `react-native`, `react-native-chart-kit`, `react-native-reanimated`, `react-native-svg`
- `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/elements`
- `@expo/vector-icons`
- `typescript`

### Scripts utiles

- `npm install`
- `npm start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run reset-project`

## Configuration à ajouter

Pour activer les données externes et l'IA :

- `src/app/(tabs)/meteo.tsx`
  - Remplacer `YOUR_OWM_KEY` par une clé OpenWeatherMap
  - Remplacer `YOUR_GEMINI_KEY` par une clé Gemini
- `src/app/(tabs)/marche.tsx` et `src/app/(tabs)/profil.tsx`
  - Remplacer `AIzaSyDemo_placeholder` / `YOUR_GEMINI_KEY` par une clé Gemini valide

## Notes importantes

- Le projet utilise des données simulées pour les parcelles et les prix du marché.
- Les fonctionnalités IA sont conçues pour fonctionner avec Gemini, mais tombent en fallback quand l'API n'est pas accessible.
- Le profil utilisateur est conservé en mémoire via React Context et n'est pas persisté sur un serveur.

## Structure de dossier clé

- `src/app/_layout.tsx` : layout global et navigation des stacks
- `src/app/index.tsx` : splash screen
- `src/app/(auth)/login.tsx` : connexion
- `src/app/(auth)/register.tsx` : inscription multi-étapes
- `src/app/(tabs)/index.tsx` : tableau de bord
- `src/app/(tabs)/parcelles.tsx` : gestion des parcelles
- `src/app/(tabs)/marche.tsx` : marché agricole
- `src/app/(tabs)/meteo.tsx` : météo et conseils IA
- `src/app/(tabs)/profil.tsx` : profil utilisateur
- `src/components/parcelles/ParcelleMap.tsx` : carte des parcelles
- `src/components/parcelles/ParcelleDetailModal.tsx` : détails de parcelle
- `src/components/parcelles/ParcelleFormModal.tsx` : création et édition de parcelles
- `src/components/data/parcellesData.ts` : modèle de données de parcelle

## Lancement rapide

```bash
cd agriIA
npm install
npm start
```

Puis choisissez votre plateforme : Android, iOS ou web.

---

Pour tout développement futur, utilisez les composants existants et les données mock comme point de départ pour intégrer un backend réel et une persistance locale ou distante.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
