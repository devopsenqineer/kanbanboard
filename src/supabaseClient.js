import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfwlhsznwzsoxhxueacf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1md2xoc3pud3pzb3hoeHVlYWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTA2NzgsImV4cCI6MjA2ODIyNjY3OH0.ZeW5IMpB-zMltflKGLRZ6mJ9E24IWJ05rsePriKJKaQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
