// Centralised environment configuration.
// API keys are read from Expo environment variables at build time
// (via app.config.ts / eas.json / .env) and never hardcoded in source.

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const ENV = {
  OWM_KEY: (extra.OWM_KEY as string) ?? '',
  GEMINI_KEY: (extra.GEMINI_KEY as string) ?? '',
} as const;
