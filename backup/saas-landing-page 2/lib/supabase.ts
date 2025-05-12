import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"
import { supabaseConfig, isConfigValid } from "@/lib/supabase-config"

// Create a single supabase client for the entire application
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export function createSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  // Get clean URL and key
  const supabaseUrl = supabaseConfig.supabaseUrl
  const supabaseAnonKey = supabaseConfig.supabaseAnonKey

  // Debug logging
  console.log("Creating Supabase client with URL:", supabaseUrl)
  console.log("Supabase Anon Key:", supabaseAnonKey ? "Available" : "Not available")

  // Validate configuration
  if (!isConfigValid()) {
    console.error("Invalid Supabase configuration:", {
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseAnonKey),
    })
    throw new Error("Invalid Supabase configuration. Check your environment variables.")
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
  return isConfigValid()
}
