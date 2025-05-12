// This file can be run to test if environment variables are loaded correctly

export function testEnvironmentVariables() {
    const variables = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  
    const results = {
      hasSupabaseUrl: Boolean(variables.NEXT_PUBLIC_SUPABASE_URL),
      hasSupabaseAnonKey: Boolean(variables.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasServiceRoleKey: Boolean(variables.SUPABASE_SERVICE_ROLE_KEY),
      urlFirstChars: variables.NEXT_PUBLIC_SUPABASE_URL
        ? variables.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10) + "..."
        : "N/A",
    }
  
    return results
  }
  
  // If this file is imported on the client side, run the test
  if (typeof window !== "undefined") {
    console.log("Environment variable test:", testEnvironmentVariables())
  }
  