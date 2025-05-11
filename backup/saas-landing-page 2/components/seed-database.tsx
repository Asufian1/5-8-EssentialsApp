"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function SeedDatabase() {
  const [isSeeding, setIsSeeding] = useState(false)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleSeedDatabase = async () => {
    setIsSeeding(true)
    try {
      setIsLoading(true)
      setError("")

      // Get the Supabase client
      const supabase = getSupabaseClient()

      // Execute the seed SQL
      const { error } = await supabase.rpc("seed_database")

      if (error) throw error

      setIsSuccess(true)
      setMessage("Database seeded successfully!")
    } catch (err) {
      console.error("Error seeding database:", err)
      setError(`Failed to seed database: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
      setIsSeeding(false)
    }
  }

  return (
    <Button onClick={handleSeedDatabase} disabled={isSeeding} variant="outline" className="flex items-center gap-2">
      {isSeeding ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Seeding...
        </>
      ) : (
        "Seed Database"
      )}
    </Button>
  )
}
