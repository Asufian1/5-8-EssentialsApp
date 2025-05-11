"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseClient } from "@/lib/supabase"
import { CheckCircle, AlertTriangle } from "lucide-react"

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [availableEnvVars, setAvailableEnvVars] = useState<string[]>([])

  const testConnection = async () => {
    try {
      setStatus("loading")
      setMessage("Testing Supabase connection...")

      // List all available environment variables (without values for security)
      const envVars = []
      for (const key in process.env) {
        if (key.includes("SUPABASE") || key.includes("supabase")) {
          envVars.push(key)
        }
      }
      setAvailableEnvVars(envVars)

      // Get the Supabase client
      const supabase = getSupabaseClient()

      // Try a simple query to test the connection
      const { data, error } = await supabase.from("categories").select("*").limit(1)

      if (error) {
        throw error
      }

      setStatus("success")
      setMessage(`Successfully connected to Supabase! Found ${data.length} categories.`)
    } catch (error) {
      console.error("Supabase connection test failed:", error)
      setStatus("error")
      setMessage(`Connection failed: ${error instanceof Error ? error.message : String(error)}`)
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
    </div>
  )
}
