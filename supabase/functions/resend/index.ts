// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const handler = async (_request: Request): Promise<Response> => {
  // Retrieve data from the contactForm table
  const { data: contactForm, error } = await supabase
    .from('contactForm')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)

  if (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        
      },
    })
  }

  // Check if the contactForm array is not empty
  if (contactForm.length > 0) {
    // Extract the relevant data from the first entry
    const contact = contactForm[0]
    const from = contact.from
    const to = contact.to
    const subject = contact.subject
    const html = contact.html

    // Send an email using the Resend API with the extracted data
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },

      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    })

    const data = await res.json()
    console.log(JSON.stringify(data, null, 2))

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } else {
    // Handle the case where the contactForm array is empty
    console.error('No entries found in contactForm table')

    return new Response(JSON.stringify({ error: 'No entries found in contactForm table' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}

serve(handler)

// To invoke:
// curl -i --location --request POST "http://localhost:54321/functions/v1/" \
//   --header "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
//   --header "Content-Type: application/json" \
//   --data "{"name":"Functions"}"
