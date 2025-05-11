import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"
import { supabaseConfig, cleanUrl } from "@/lib/supabase-config"

// Create a single supabase client for the entire application
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

// Helper function to validate URL
function isValidUrl(urlString: string) {
  try {
    return Boolean(new URL(urlString))
  } catch (e) {
    return false
  }
}

export function createSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  // Try different environment variable naming conventions
  // Replace:
  // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  // const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // With:
  const supabaseUrl = cleanUrl(supabaseConfig.supabaseUrl)
  const supabaseAnonKey = supabaseConfig.supabaseAnonKey

  // Debug logging
  console.log("Supabase URL:", supabaseUrl)
  console.log("Supabase Anon Key:", supabaseAnonKey ? "Available" : "Not available")

  // Validate URL before creating client
  if (!supabaseUrl || !isValidUrl(supabaseUrl)) {
    console.error("Invalid Supabase URL:", supabaseUrl)
    throw new Error("Invalid Supabase URL")
  }

  if (!supabaseAnonKey) {
    console.error("Missing Supabase anon key")
    throw new Error("Missing Supabase anon key")
  }

  try {
    // Create the client
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)
    return supabaseInstance
  } catch (error) {
    console.error("Error initializing Supabase client:", error)
    throw error
  }
}

// Create a server-side client with service role key for admin operations
export function createAdminClient() {
  const supabaseUrl = cleanUrl(supabaseConfig.supabaseUrl)

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  // Validate URL before creating client
  if (!supabaseUrl || !isValidUrl(supabaseUrl)) {
    console.error("Invalid Supabase URL:", supabaseUrl)
    throw new Error("Invalid Supabase URL")
  }

  if (!supabaseServiceKey) {
    console.error("Missing Supabase service role key")
    throw new Error("Missing Supabase service role key")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Helper to get the client in browser environments with fallback
export function getSupabaseClient() {
  try {
    return createSupabaseClient()
  } catch (error) {
    console.error("Failed to get Supabase client:", error)
    return null
  }
}

// Check if Supabase is properly configured
export function isSupabaseConfigured() {
  const supabaseUrl = cleanUrl(supabaseConfig.supabaseUrl)

  const supabaseAnonKey = supabaseConfig.supabaseAnonKey

  return Boolean(supabaseUrl && isValidUrl(supabaseUrl) && supabaseAnonKey)
}
