// This file contains the Supabase configuration
// It's imported by other files that need to access Supabase

// Helper function to clean URL (remove quotes if present)
export function cleanUrl(url: string): string {
  if (!url) return ""
  return url.replace(/^["'](.*)["']$/, "$1")
}

// These values are loaded from .env.local
export const supabaseConfig = {
  // Get the URL and clean it
  supabaseUrl: cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || ""),
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
}

// Debug function to check if config is valid
export function isConfigValid() {
  const { supabaseUrl, supabaseAnonKey } = supabaseConfig

  // Check if URL and key are present
  if (!supabaseUrl || !supabaseAnonKey) {
    return false
  }

  // Check if URL is valid
  try {
    new URL(supabaseUrl)
    return true
  } catch (e) {
    return false
  }
}

// Log configuration status on load (client-side only)
if (typeof window !== "undefined") {
  console.log("Supabase config loaded:", {
    hasUrl: Boolean(supabaseConfig.supabaseUrl),
    hasKey: Boolean(supabaseConfig.supabaseAnonKey),
    isValid: isConfigValid(),
  })
}
