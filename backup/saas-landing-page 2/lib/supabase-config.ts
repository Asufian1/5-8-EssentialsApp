// This file contains the Supabase configuration
// It's imported by other files that need to access Supabase

// These values are loaded from .env.local
export const supabaseConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
}

// Helper function to clean URL (remove quotes if present)
export function cleanUrl(url: string): string {
  return url.replace(/^["'](.*)["']$/, "$1")
}
