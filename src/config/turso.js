import { createClient } from '@libsql/client/web';
import Constants from 'expo-constants';

// Configuration Turso (utilise HTTPS pour compatibilité React Native)
export const tursoConfig = {
  url: Constants.expoConfig?.extra?.tursoUrl || process.env.EXPO_PUBLIC_TURSO_DATABASE_URL,
  authToken: Constants.expoConfig?.extra?.tursoAuthToken || process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN,
};

// Client Turso
let client = null;

export const getTursoClient = () => {
  if (!client) {
    client = createClient(tursoConfig);
  }
  return client;
};
