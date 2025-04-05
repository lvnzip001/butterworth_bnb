// assets/js/supabase-client.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = "https://kuoyqhmywgtwajolfilw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1b3lxaG15d2d0d2Fqb2xmaWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3OTUyODEsImV4cCI6MjA1OTM3MTI4MX0.gvqeJhDnqCrWYyXPcQ7P-rg4zLxpQp7T5e43KmpbtMM";

// Create client instance
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Export as default (fixes the error)
export default supabaseClient;