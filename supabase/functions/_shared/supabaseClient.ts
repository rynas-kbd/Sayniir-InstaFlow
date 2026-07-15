import { createClient } from 'npm:@supabase/supabase-js@2'

export function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}
