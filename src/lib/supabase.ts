import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  throw new Error('Supabase URL is not defined');
}
if (!supabaseAnonKey) {
  throw new Error('Supabase anon key is not defined');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);