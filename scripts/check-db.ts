import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkFlows() {
  const { data: flows, error: flowsError } = await supabase.from('flows').select('*')
  if (flowsError) {
    console.error('Error fetching flows:', flowsError)
    return
  }

  console.log(`Found ${flows?.length} flows:`)
  for (const flow of flows || []) {
    console.log(`- Flow: ${flow.name} (${flow.id}), Status: ${flow.status}`)
    const { data: nodes, error: nodesError } = await supabase.from('flow_nodes').select('*').eq('flow_id', flow.id)
    if (nodesError) {
      console.error(`  Error fetching nodes for flow ${flow.id}:`, nodesError)
    } else {
      console.log(`  Nodes (${nodes?.length}):`, nodes?.map(n => `${n.node_key} (${n.type})`))
    }
  }
}

checkFlows()
