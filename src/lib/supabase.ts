import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://hkyyzdqzdfyrvdigkrzf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhreXl6ZHF6ZGZ5cnZkaWdrcnpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5OTAwODQsImV4cCI6MjA2MTU2NjA4NH0.uR09LjwB8lqc5GDpCEudWsc8TYFpw5UcIRQEHOTIEZE';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);