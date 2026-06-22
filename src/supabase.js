import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mtpbskfnkgjqltlspifm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2rDHbZocC1uH9XihYYxzAA_rLBMg28w';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
