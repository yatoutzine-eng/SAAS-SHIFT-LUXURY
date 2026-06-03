import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno';
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { bookingId, amount, vehicleModel, clientEmail } = await req.json();
    const origin = req.headers.get('origin') || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: clientEmail,
      line_items: [{ price_data: { currency: 'eur', product_data: { name: `Caution — ${vehicleModel}` }, unit_amount: Math.round(amount * 100) }, quantity: 1 }],
      success_url: `${origin}/?deposit_success=true&booking_id=${bookingId}`,
      cancel_url: `${origin}/?deposit_cancelled=true`,
    });
    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});