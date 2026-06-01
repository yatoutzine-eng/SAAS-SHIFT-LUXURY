/**
 * Simulateur de Géocodage Ultra-Précis
 * Retourne les coordonnées exactes pour les hubs de luxe
 */
const CITY_COORDINATES = {
  "PARIS": [48.8566, 2.3522],
  "MONACO": [43.7384, 7.4246],
  "NICE": [43.7102, 7.2620],
  "CANNES": [43.5528, 7.0174],
  "DUBAI": [25.2048, 55.2708],
  "COURCHEVEL": [45.4151, 6.6311],
  "ST TROPEZ": [43.2677, 6.6391]
};

export const getCoordinatesFromAddress = (address) => {
  if (!address) return [48.8566, 2.3522];
  
  const upperAddress = address.toUpperCase();
  
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (upperAddress.includes(city)) {
      return coords;
    }
  }
  
  // Fallback Paris par défaut
  return [48.8566, 2.3522];
};
