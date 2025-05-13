"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [availableEnvVars, setAvailableEnvVars] = useState<string[]>([])
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const testConnection = async () => {
    try {
      setStatus("loading")
      setMessage("Testing Supabase connection...")
      setDebugInfo(null)

      // List all available environment variables (without values for security)
      const envVars = []
      for (const key in process.env) {
        if (key.includes("SUPABASE") || key.includes("supabase")) {
          envVars.push(key)
        }
      }
      setAvailableEnvVars(envVars)

      // Get Supabase URL and key directly
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      // Debug info
      const debug = {
        hasUrl: Boolean(supabaseUrl),
        hasKey: Boolean(supabaseKey),
        urlLength: supabaseUrl ? supabaseUrl.length : 0,
        keyLength: supabaseKey ? supabaseKey.length : 0,
        urlFirstChars: supabaseUrl ? supabaseUrl.substring(0, 10) + "..." : "N/A",
      }
      setDebugInfo(debug)

      // Validate URL and key
      if (!supabaseUrl) {
        throw new Error("Missing Supabase URL. Please check your environment variables.")
      }

      if (!supabaseKey) {
        throw new Error("Missing Supabase anon key. Please check your environment variables.")
      }

      // Clean URL (remove quotes if present)
      const cleanUrl = supabaseUrl.replace(/^["'](.*)["']$/, "$1")

      // Try to create a URL object to validate
      try {
        new URL(cleanUrl)
      } catch (e) {
        throw new Error(`Invalid Supabase URL format: "${cleanUrl}". Please check your environment variables.`)
      }

      console.log("Creating Supabase client with URL:", cleanUrl)

      // Create Supabase client directly
      const supabase = createClient(cleanUrl, supabaseKey)

      // Try a simple query to test the connection
      const { data, error } = await supabase.from("categories").select("count", { count: "exact", head: true })

      if (error) {
        // If the error is because the table doesn't exist, that's okay for initial setup
        if (error.message && error.message.includes("does not exist")) {
          setStatus("success")
          setMessage("Successfully connected to Supabase! Categories table not found yet.")
          return
        }
        throw error
      }

      setStatus("success")
      setMessage(`Successfully connected to Supabase! Found ${data?.count || 0} categories.`)
    } catch (error) {
      console.error("Supabase connection test failed:", error)
      setStatus("error")
      setMessage(`Connection failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={testConnection}
        disabled={status === "loading"}
        className="bg-primary text-black hover:bg-primary/90"
      >
        {status === "loading" ? "Testing..." : "Test Supabase Connection"}
      </Button>

      {status === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
          <AlertDescription className="text-green-700">{message}</AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Failed</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {availableEnvVars.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Available Supabase Environment Variables:</h3>
          <ul className="text-xs space-y-1 bg-muted p-2 rounded">
            {availableEnvVars.map((envVar) => (
              <li key={envVar}>{envVar}</li>
            ))}
          </ul>
        </div>
      )}

      {debugInfo && (
        <div className="mt-4 p-3 bg-slate-100 rounded-md">
          <h3 className="text-sm font-medium mb-2">Debug Information:</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
