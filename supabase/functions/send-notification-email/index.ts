import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { to, subject, html } = await req.json();
    if (!to || !subject) {
      return new Response(JSON.stringify({ error: 'to and subject are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY') || ''}`,
      },
      body: JSON.stringify({
        from: Deno.env.get('EMAIL_FROM') || 'Trustall <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
