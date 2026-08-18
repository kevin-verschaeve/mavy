import { createClient } from '@libsql/client/web';
import Constants from 'expo-constants';

// Configuration Turso (utilise HTTPS pour compatibilité React Native)
//
// SÉCURITÉ : ce token est embarqué en clair dans le bundle JS, donc extractible
// de l'APK. Il donne un accès lecture/écriture complet à la base des deux profils.
// C'est un risque assumé (app familiale privée, données sans enjeu) et non un oubli.
// Voir la section « Modèle de sécurité » du README : ce qui rendrait ce choix
// caduc, et la procédure de rotation du token en cas de fuite d'un APK.
export const tursoConfig = {
  url: Constants.expoConfig?.extra?.tursoUrl || process.env.EXPO_PUBLIC_TURSO_DATABASE_URL,
  authToken: Constants.expoConfig?.extra?.tursoAuthToken || process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN,
};

// Indique si la configuration Turso est complète (URL + token présents)
export const isTursoConfigured = () =>
  Boolean(tursoConfig.url) && Boolean(tursoConfig.authToken);

// Client Turso
let client = null;

export const getTursoClient = () => {
  if (!client) {
    if (!isTursoConfigured()) {
      // Cas typique d'un build de production où les variables TURSO_URL /
      // TURSO_AUTH_TOKEN n'ont pas été injectées (secrets EAS manquants).
      throw new Error(
        'Configuration Turso manquante ' +
          `(url: ${tursoConfig.url ? 'présente' : 'ABSENTE'}, ` +
          `token: ${tursoConfig.authToken ? 'présent' : 'ABSENT'}). ` +
          'Vérifie les variables TURSO_URL / TURSO_AUTH_TOKEN du build.'
      );
    }
    client = createClient(tursoConfig);
  }
  return client;
};
