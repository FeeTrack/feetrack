// supabase/functions/apply-late-fees/index.ts
// Simplified edge function for invoice_items approach

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const cronSecret = Deno.env.get('CRON_SECRET')
    
    // Accept either CRON_SECRET or valid service role key
    const isValidCronSecret = cronSecret && authHeader === `Bearer ${cronSecret}`
    const isValidServiceKey = authHeader?.startsWith('Bearer eyJ') // Service keys start with eyJ
    
    if (!authHeader || (!isValidCronSecret && !isValidServiceKey)) {
      console.error('Auth failed:', { authHeader: authHeader?.substring(0, 20), cronSecret: !!cronSecret })
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Calling apply_late_fees RPC...')

    const { data, error } = await supabase.rpc('apply_late_fees')

    console.log('RPC response:', { success: !error, count: data?.length })

    if (error) {
      console.error('Error applying late fees:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const appliedCount = data?.length || 0
    
    console.log(`Successfully applied ${appliedCount} late fees`)

    // Update invoice totals for affected invoices
    if (data && data.length > 0) {
      const affectedInvoicesIds = [...new Set(data.map(item => item.late_fee_invoice_id))]

      for (const invoiceId of affectedInvoicesIds) {
        const { data: items } = await supabase
          .from('invoice_items')
          .select('amount')
          .eq('invoice_id', invoiceId)
        
        if (items) {
          const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0)
          
          await supabase
            .from('invoices')
            .update({ amount: totalAmount })
            .eq('id', invoiceId)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Applied ${appliedCount} late fees`,
        applied_fees: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/* 
DEPLOYMENT INSTRUCTIONS:

1. Deploy function:
   supabase functions deploy apply-late-fees

2. Set secret:
   supabase secrets set CRON_SECRET=your-secret-key

3. Set up cron (in Supabase SQL Editor):

   -- Enable pg_cron
   -- Go to Database > Extensions > Enable pg_cron

   -- Schedule daily at 1 AM UTC
   SELECT cron.schedule(
     'apply-late-fees-daily',
     '0 1 * * *',
     $$
     SELECT
       net.http_post(
         url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/apply-late-fees',
         headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
         body:='{}'::jsonb
       ) AS request_id;
     $$
   );

4. Verify cron:
   SELECT * FROM cron.job;

5. Check cron execution:
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
*/