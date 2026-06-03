/**
 * SHIFT LUXURY - MOTEUR DE TARIFICATION DYNAMIQUE (V1.0)
 * Calcule le prix final en fonction des réglages commerçant et du calendrier.
 */

/**
 * Calcule le prix pour un instant T (utilisé pour l'affichage catalogue)
 */
export const calculateDynamicPrice = (basePrice, settings) => {
  if (!settings || !settings.dynamic_pricing_enabled) {
    return { 
      finalPrice: basePrice, 
      isSurge: false, 
      markup: 0 
    };
  }

  const now = new Date();
  const day = now.getDay(); // 0 = Dimanche, 6 = Samedi
  const isWeekend = (day === 0 || day === 6);

  if (isWeekend && settings.weekend_markup > 0) {
    const markupAmount = (basePrice * settings.weekend_markup) / 100;
    return {
      finalPrice: Math.round(basePrice + markupAmount),
      isSurge: true,
      markup: settings.weekend_markup
    };
  }

  return { 
    finalPrice: basePrice, 
    isSurge: false, 
    markup: 0 
  };
};

/**
 * Calcule le total pour une période donnée (itération jour par jour)
 */
export const calculateStayPrice = (basePrice, startDate, endDate, settings) => {
  if (!startDate || !endDate) return { total: basePrice, days: 1, hasSurge: false };

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  let total = 0;
  let hasSurge = false;

  for (let i = 0; i < diffDays; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const day = current.getDay();
    const isWeekend = (day === 0 || day === 6);

    if (isWeekend && settings?.dynamic_pricing_enabled) {
      const markup = (basePrice * (settings.weekend_markup || 0)) / 100;
      total += (basePrice + markup);
      hasSurge = true;
    } else {
      total += basePrice;
    }
  }

  return {
    total: Math.round(total),
    days: diffDays,
    hasSurge
  };
};
