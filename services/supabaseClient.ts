import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nkegjvtxooykumvxagol.supabase.co';
const supabaseKey = 'sb_publishable_vxVfrWEOxYjQ5umR6pJXFg_c4CNXL59';

export const supabase = createClient(supabaseUrl, supabaseKey);