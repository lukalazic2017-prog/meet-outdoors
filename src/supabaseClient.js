import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tktvrzktvrcbiatxrrwk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrdHZyemt0dnJjYmlhdHhycndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDcwMTYsImV4cCI6MjA3NjcyMzAxNn0.XbhAvGUaDcK_vdoA6fhDfRUCykBczSa6D-JZb9MZHDg";

export const supabase = createClient(supabaseUrl, supabaseKey);