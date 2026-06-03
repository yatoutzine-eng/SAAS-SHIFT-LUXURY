/**
 * Générateur de liens WhatsApp contextuels pour le luxe
 */
export const generateWhatsAppLink = (phone, type, data) => {
  const baseUrl = "https://wa.me/";
  const cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
  
  const templates = {
    prolong: `Bonjour, je suis ${data.clientName}. Je loue actuellement la ${data.vehicle} (Réf: #${data.resId}). J'aimerais prolonger ma location de quelques jours. Quelles sont les disponibilités ?`,
    delivery: `Bonjour, je souhaite organiser la récupération/livraison de mon véhicule ${data.vehicle} (Réf: #${data.resId}). Pouvez-vous me confirmer le créneau ?`,
    support: `URGENT - Assistance Technique : Je rencontre un problème avec la ${data.vehicle} (Réf: #${data.resId}). Merci de me recontacter immédiatement.`,
    default: `Bonjour, je suis ${data.clientName}, client Shift Luxury. J'ai une question concernant ma réservation #${data.resId}.`
  };

  const message = encodeURIComponent(templates[type] || templates.default);
  return `${baseUrl}${cleanPhone}?text=${message}`;
};
