import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'agriIA',
  slug: config.slug ?? 'agriIA',
  extra: {
    ...config.extra,
    OWM_KEY: process.env.OWM_KEY ?? '',
    GEMINI_KEY: process.env.GEMINI_KEY ?? '',
  },
});
