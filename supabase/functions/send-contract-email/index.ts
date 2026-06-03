const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { 
      clientEmail, clientName, clientPhone, clientLicense,
      merchantEmail, merchantName,
      vehicleModel, startDate, endDate, totalPrice, duration,
      signatureData, contractUrl, reservationId
    } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    const contractEmail = (isClient: boolean) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif">
<div style="max-width:680px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 4px 24px rgba(0,0,0,0.1)">

  <!-- Header -->
  <div style="background:#000;padding:28px 40px;text-align:center">
    <div style="font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:-1px;color:white">
      Shift <span style="color:#D4AF37">Luxury</span>
    </div>
    <div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin-top:6px">Location de Véhicules de Prestige</div>
  </div>

  <!-- Badge statut -->
  <div style="background:#D4AF37;padding:16px 40px;text-align:center">
    <div style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#000">
      ✅ Contrat de Location Signé
    </div>
  </div>

  <!-- Intro -->
  <div style="padding:32px 40px 0">
    <p style="font-size:15px;color:#333;margin:0 0 6px">Bonjour <strong>${isClient ? clientName : merchantName || 'Marchand'}</strong>,</p>
    <p style="font-size:13px;color:#666;margin:0 0 28px;line-height:1.6">
      ${isClient 
        ? `Votre contrat de location pour le véhicule <strong>${vehicleModel}</strong> a été signé avec succès. Vous trouverez ci-dessous le récapitulatif complet.`
        : `Le contrat de location pour <strong>${clientName}</strong> a été signé. Voici le récapitulatif.`
      }
    </p>
  </div>

  <!-- Récap réservation -->
  <div style="margin:0 40px 28px;border:1px solid #eee;border-radius:12px;overflow:hidden">
    <div style="background:#f9f9f9;padding:12px 20px;border-bottom:1px solid #eee">
      <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#999">Récapitulatif de la Réservation</div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:14px 20px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;width:45%;border-bottom:1px solid #f5f5f5">N° Réservation</td><td style="padding:14px 20px;font-size:13px;font-weight:900;border-bottom:1px solid #f5f5f5">${reservationId?.slice(0,8).toUpperCase() || '—'}</td></tr>
      <tr style="background:#fafafa"><td style="padding:14px 20px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;border-bottom:1px solid #f5f5f5">Véhicule</td><td style="padding:14px 20px;font-size:13px;font-weight:900;border-bottom:1px solid #f5f5f5">${vehicleModel}</td></tr>
      <tr><td style="padding:14px 20px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;border-bottom:1px solid #f5f5f5">Client</td><td style="padding:14px 20px;font-size:13px;font-weight:700;border-bottom:1px solid #f5f5f5">${clientName}</td></tr>
      <tr style="background:#fafafa"><td style="padding:14px 20px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;border-bottom:1px solid #f5f5f5">Départ</td><td style="padding:14px 20px;font-size:13px;font-weight:700;border-bottom:1px solid #f5f5f5">${startDate}</td></tr>
      <tr><td style="padding:14px 20px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;border-bottom:1px solid #f5f5f5">Retour</td><td style="padding:14px 20px;font-size:13px;font-weight:700;border-bottom:1px solid #f5f5f5">${endDate}</td></tr>
      <tr style="background:#fafafa"><td style="padding:14px 20px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;border-bottom:1px solid #f5f5f5">Durée</td><td style="padding:14px 20px;font-size:13px;font-weight:700;border-bottom:1px solid #f5f5f5">${duration} jour(s)</td></tr>
      <tr style="background:#000"><td style="padding:16px 20px;font-size:12px;font-weight:900;text-transform:uppercase;color:#D4AF37">Total TTC</td><td style="padding:16px 20px;font-size:20px;font-weight:900;color:#D4AF37">${totalPrice} €</td></tr>
    </table>
  </div>

  <!-- Parties -->
  <div style="margin:0 40px 28px;display:flex;gap:16px">
    <div style="flex:1;border:1px solid #eee;border-radius:12px;padding:20px">
      <div style="font-size:9px;font-weight:900;text-transform:uppercase;color:#D4AF37;letter-spacing:2px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0">Le Loueur</div>
      <div style="font-size:13px;font-weight:900;margin-bottom:6px">${merchantName || 'Shift Luxury'}</div>
      <div style="font-size:11px;color:#666;line-height:1.6">contact@shift-luxury.fr</div>
    </div>
    <div style="flex:1;border:1px solid #eee;border-radius:12px;padding:20px">
      <div style="font-size:9px;font-weight:900;text-transform:uppercase;color:#D4AF37;letter-spacing:2px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0">Le Locataire</div>
      <div style="font-size:13px;font-weight:900;margin-bottom:6px">${clientName}</div>
      <div style="font-size:11px;color:#666;line-height:1.6">
        ${clientPhone ? clientPhone + '<br/>' : ''}
        ${clientEmail}<br/>
        ${clientLicense ? 'Permis : ' + clientLicense : ''}
      </div>
    </div>
  </div>

  <!-- Signature -->
  ${signatureData && signatureData !== 'signed' ? `
  <div style="margin:0 40px 28px;border:1px solid #eee;border-radius:12px;padding:20px">
    <div style="font-size:9px;font-weight:900;text-transform:uppercase;color:#D4AF37;letter-spacing:2px;margin-bottom:12px">Signature du Locataire</div>
    <img src="${signatureData}" style="max-height:60px;max-width:200px;display:block"/>
    <div style="font-size:10px;color:#999;margin-top:8px">${today}</div>
  </div>` : ''}

  <!-- Conditions résumées -->
  <div style="margin:0 40px 28px;background:#f9f9f9;border-radius:12px;padding:20px">
    <div style="font-size:10px;font-weight:900;text-transform:uppercase;color:#999;letter-spacing:2px;margin-bottom:12px">Rappel des Conditions</div>
    <ul style="margin:0;padding:0 0 0 16px;font-size:11px;color:#666;line-height:2">
      <li>Véhicule restitué en même état qu'à la prise en charge</li>
      <li>Plein de carburant obligatoire au retour</li>
      <li>Caution restituée sous 7 jours après retour</li>
      <li>Retard facturé au double du tarif journalier</li>
      <li>Utilisation sur circuit strictement interdite</li>
    </ul>
  </div>

  <!-- Footer -->
  <div style="background:#000;padding:20px 40px;text-align:center">
    <p style="color:#555;font-size:10px;margin:0;text-transform:uppercase;letter-spacing:2px">Shift Luxury SaaS • ${today}</p>
  </div>
</div>
</body>
</html>`;

    // Email client
    if (clientEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Shift Luxury <onboarding@resend.dev>',
          to: [clientEmail],
          subject: `✅ Votre contrat signé — ${vehicleModel}`,
          html: contractEmail(true),
        }),
      });
    }

    // Email marchand
    if (merchantEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Shift Luxury <onboarding@resend.dev>',
          to: [merchantEmail],
          subject: `📋 Contrat signé — ${clientName} · ${vehicleModel}`,
          html: contractEmail(false),
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
