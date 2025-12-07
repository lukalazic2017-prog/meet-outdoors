import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gvdhpruhnwzsnrjeekmd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2ZGhwcnVobnd6c25yamVla21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MDM3MjQsImV4cCI6MjA4MDM3OTcyNH0.-YeJcjryZ85aECWfY6Qb8DOPa6k2PdqJe4H6ujbiRJ8";

export const supabase = createClient(supabaseUrl, supabaseKey);