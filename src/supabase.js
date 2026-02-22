import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://znlvodzmijjfhdvwxwbh.supabase.co'
const supabaseKey = 'sb_publishable_VVeCdrefj8oQ7m1WySwJBQ_u1CdgqVm'

export const supabase = createClient(supabaseUrl, supabaseKey)
