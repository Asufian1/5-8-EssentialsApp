"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@supabase/supabase-js"
import {
  CheckCircle,
  AlertTriangle,
  Database,
  RefreshCw,
  ArrowRight,
  Code,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { supabaseConfig, cleanUrl } from "@/lib/supabase-config"

// SQL to create tables
const createTablesSQL = `
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id),
  quantity NUMERIC NOT NULL DEFAULT 0,
  student_limit NUMERIC,
  limit_duration INTEGER DEFAULT 7,
  limit_duration_minutes INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'item',
  is_weighed BOOLEAN DEFAULT FALSE,
  has_limit BOOLEAN DEFAULT TRUE,
  cost DECIMAL(10, 2),
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  user_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unit TEXT,
  cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2)
);

-- Create student_checkouts table
CREATE TABLE IF NOT EXISTS student_checkouts (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unit TEXT
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  notified BOOLEAN DEFAULT FALSE,
  error TEXT
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  category TEXT,
  unit TEXT
);

-- Drop existing decrement_inventory function if it exists
DROP FUNCTION IF EXISTS decrement_inventory(TEXT, NUMERIC);

-- Create decrement_inventory function
CREATE OR REPLACE FUNCTION decrement_inventory(item_id_param TEXT, quantity_param NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
  current_quantity NUMERIC;
BEGIN
  -- Get current quantity
  SELECT quantity INTO current_quantity FROM inventory_items WHERE id = item_id_param;
  
  -- Check if we have enough inventory
  IF current_quantity >= quantity_param THEN
    -- Update inventory
    UPDATE inventory_items 
    SET quantity = quantity - quantity_param,
        updated_at = NOW()
    WHERE id = item_id_param;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;
`

export default function SupabaseSetupPage() {
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [connectionMessage, setConnectionMessage] = useState("")
  const [availableEnvVars, setAvailableEnvVars] = useState<string[]>([])
  const [schemaStatus, setSchemaStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [schemaMessage, setSchemaMessage] = useState("")
  const [seedStatus, setSeedStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [seedMessage, setSeedMessage] = useState("")
  const [activeTab, setActiveTab] = useState("connection")
  const [sqlCopied, setSqlCopied] = useState(false)
  const [supabaseProjectUrl, setSupabaseProjectUrl] = useState("")
  const [autoSetupStatus, setAutoSetupStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [autoSetupMessage, setAutoSetupMessage] = useState("")

  useEffect(() => {
    // Check for environment variables on page load
    checkEnvironmentVariables()
    // Automatically test connection on page load
    testConnection()
  }, [])

  const checkEnvironmentVariables = () => {
    // List all available environment variables (without values for security)
    const envVars = []
    for (const key in process.env) {
      if (key.includes("SUPABASE") || key.includes("supabase")) {
        envVars.push(key)
      }
    }
    setAvailableEnvVars(envVars)
  }

  const isValidUrl = (urlString: string) => {
    try {
      // Remove any extra quotes that might be in the URL string
      const cleanUrl = urlString.replace(/^["'](.*)["']$/, "$1")
      return Boolean(new URL(cleanUrl))
    } catch (e) {
      console.error("URL validation error:", e)
      return false
    }
  }

  const getSupabaseCredentials = () => {
    let supabaseUrl = supabaseConfig.supabaseUrl
    const supabaseKey = supabaseConfig.supabaseAnonKey

    // Clean the URL by removing any extra quotes
    if (supabaseUrl) {
      supabaseUrl = cleanUrl(supabaseUrl)
    }

    return { supabaseUrl, supabaseKey }
  }

  const testConnection = async () => {
    try {
      setConnectionStatus("loading")
      setConnectionMessage("Testing Supabase connection...")

      const { supabaseUrl, supabaseKey } = getSupabaseCredentials()

      console.log("Raw Supabase URL:", supabaseUrl)

      // Validate URL format
      if (!supabaseUrl) {
        throw new Error("Missing Supabase URL. Please check your environment variables.")
      }

      if (!isValidUrl(supabaseUrl)) {
        throw new Error(`Invalid Supabase URL format: "${supabaseUrl}". Please check your environment variables.`)
      }

      if (!supabaseKey) {
        throw new Error("Missing Supabase anon key. Please check your environment variables.")
      }

      // Create a direct client for testing
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Extract project URL for SQL editor link
      try {
        const url = new URL(supabaseUrl)
        const projectRef = url.hostname.split(".")[0]
        setSupabaseProjectUrl(`https://app.supabase.com/project/${projectRef}/sql`)
      } catch (e) {
        console.error("Could not parse project URL:", e)
      }

      // Try a simple query to test the connection
      const { data, error } = await supabase.from("categories").select("count", { count: "exact", head: true })

      // If the error is because the table doesn't exist, that's okay for initial setup
      if (error) {
        if (error.message.includes("does not exist")) {
          console.log("Categories table doesn't exist yet, but connection is working")
        } else {
          throw error
        }
      }

      setConnectionStatus("success")
      setConnectionMessage(
        error && error.message.includes("does not exist")
          ? "Successfully connected to Supabase! Categories table not found yet."
          : `Successfully connected to Supabase! Found categories table with ${data?.count || 0} entries.`,
      )

      // Auto-advance to schema tab if connection is successful
      if (activeTab === "connection") {
        setActiveTab("schema")
      }
    } catch (error) {
      console.error("Supabase connection test failed:", error)
      setConnectionStatus("error")
      setConnectionMessage(`Connection failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSqlCopied(true)
      setTimeout(() => setSqlCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const checkTablesExist = async () => {
    try {
      setSchemaStatus("loading")
      setSchemaMessage("Checking if tables exist...")

      const { supabaseUrl, supabaseKey } = getSupabaseCredentials()

      if (!supabaseUrl || !isValidUrl(supabaseUrl)) {
        throw new Error("Invalid Supabase URL")
      }

      if (!supabaseKey) {
        throw new Error("Missing Supabase anon key")
      }

      const supabase = createClient(supabaseUrl, supabaseKey)

      // Check if categories table exists
      const { error: categoriesError } = await supabase
        .from("categories")
        .select("count", { count: "exact", head: true })

      // Check if inventory_items table exists
      const { error: itemsError } = await supabase
        .from("inventory_items")
        .select("count", { count: "exact", head: true })

      // Check if transactions table exists
      const { error: transactionsError } = await supabase
        .from("transactions")
        .select("count", { count: "exact", head: true })

      // Check if student_checkouts table exists
      const { error: checkoutsError } = await supabase
        .from("student_checkouts")
        .select("count", { count: "exact", head: true })

      // Check if orders table exists
      const { error: ordersError } = await supabase.from("orders").select("count", { count: "exact", head: true })

      // Check if order_items table exists
      const { error: orderItemsError } = await supabase
        .from("order_items")
        .select("count", { count: "exact", head: true })

      const allTablesExist =
        !categoriesError ||
        (!categoriesError?.message?.includes("does not exist") && !itemsError) ||
        (!itemsError?.message?.includes("does not exist") && !transactionsError) ||
        (!transactionsError?.message?.includes("does not exist") && !checkoutsError) ||
        (!checkoutsError?.message?.includes("does not exist") && !ordersError) ||
        (!ordersError?.message?.includes("does not exist") && !orderItemsError) ||
        !orderItemsError?.message?.includes("does not exist")

      if (allTablesExist) {
        setSchemaStatus("success")
        setSchemaMessage("All required tables exist in the database!")

        // Auto-advance to seed tab if schema check is successful
        if (activeTab === "schema") {
          setActiveTab("seed")
        }
      } else {
        setSchemaStatus("idle")
        setSchemaMessage("Some tables are missing. Please execute the SQL to create them.")
      }
    } catch (error) {
      console.error("Schema check failed:", error)
      setSchemaStatus("error")
      setSchemaMessage(`Schema check failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const seedDatabase = async () => {
    try {
      setSeedStatus("loading")
      setSeedMessage("Seeding database with initial data...")

      const { supabaseUrl, supabaseKey } = getSupabaseCredentials()

      if (!supabaseUrl || !isValidUrl(supabaseUrl)) {
        throw new Error("Invalid Supabase URL")
      }

      if (!supabaseKey) {
        throw new Error("Missing Supabase anon key")
      }

      const supabase = createClient(supabaseUrl, supabaseKey)

      // Define the categories data
      const categories = [
        { id: "essentials", name: "Essentials", description: "Basic food items" },
        { id: "grains", name: "Grains", description: "Rice, pasta, and other grains" },
        { id: "canned", name: "Canned Goods", description: "Canned foods and preserved items" },
        { id: "produce", name: "Produce", description: "Fresh fruits and vegetables" },
        { id: "dairy", name: "Dairy", description: "Milk, cheese, and other dairy products" },
        { id: "south-asian", name: "South Asian", description: "South Asian food items" },
        { id: "other", name: "Other", description: "Miscellaneous items" },
      ]

      // Insert categories one by one to avoid onConflict issues
      for (const category of categories) {
        // Check if category exists
        const { data: existingCategory } = await supabase.from("categories").select("id").eq("id", category.id).single()

        // Only insert if it doesn't exist
        if (!existingCategory) {
          const { error } = await supabase.from("categories").insert(category)
          if (error) throw error
        }
      }

      // Define the inventory items data
      const inventoryItems = [
        {
          id: "1",
          name: "Rice",
          category_id: "grains",
          quantity: 50,
          student_limit: 1,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "kg",
          is_weighed: true,
          has_limit: true,
          cost: 2.5,
        },
        {
          id: "2",
          name: "Beans",
          category_id: "essentials",
          quantity: 30,
          student_limit: 2,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 1.25,
        },
        {
          id: "3",
          name: "Pasta",
          category_id: "grains",
          quantity: 40,
          student_limit: 2,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 1.75,
        },
        {
          id: "4",
          name: "Canned Soup",
          category_id: "canned",
          quantity: 25,
          student_limit: 3,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 1.5,
        },
        {
          id: "5",
          name: "Cereal",
          category_id: "essentials",
          quantity: 20,
          student_limit: 1,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 3.25,
        },
      ]

      // Insert inventory items one by one to avoid onConflict issues
      for (const item of inventoryItems) {
        // Check if item exists
        const { data: existingItem } = await supabase.from("inventory_items").select("id").eq("id", item.id).single()

        // Only insert if it doesn't exist
        if (!existingItem) {
          const { error } = await supabase.from("inventory_items").insert(item)
          if (error) throw error
        }
      }

      setSeedStatus("success")
      setSeedMessage("Database seeded successfully with sample data!")
    } catch (error) {
      console.error("Database seeding failed:", error)
      setSeedStatus("error")
      setSeedMessage(`Database seeding failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Function to automatically set up everything
  const autoSetupDatabase = async () => {
    try {
      setAutoSetupStatus("loading")
      setAutoSetupMessage("Setting up database automatically...")

      // 1. Test connection
      await testConnection()
      if (connectionStatus === "error") {
        throw new Error("Connection failed. Please check your Supabase credentials.")
      }

      // 2. Execute SQL to create schema
      setAutoSetupMessage("Creating database schema...")

      // Get Supabase credentials
      const { supabaseUrl, supabaseKey } = getSupabaseCredentials()
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Execute SQL directly using the REST API
      try {
        // Try to execute SQL using the REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            query: createTablesSQL,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to execute SQL: ${response.statusText}`)
        }
      } catch (sqlError) {
        console.error("Error executing SQL:", sqlError)
        setAutoSetupMessage(
          "Could not execute SQL directly. Please copy and execute the SQL manually in the Supabase SQL Editor.",
        )

        // Continue with the rest of the setup
        console.log("Continuing with setup despite SQL execution error")
      }

      // 3. Verify schema
      setAutoSetupMessage("Verifying schema...")
      await checkTablesExist()

      // 4. Seed database
      setAutoSetupMessage("Seeding database...")
      await seedDatabase()

      setAutoSetupStatus("success")
      setAutoSetupMessage("Database setup completed successfully!")
    } catch (error) {
      console.error("Auto setup failed:", error)
      setAutoSetupStatus("error")
      setAutoSetupMessage(`Auto setup failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Supabase Setup</h1>
        <p className="text-muted-foreground">
          Configure and test your Supabase connection for the Retriever Essentials application.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Automatic Database Setup
          </CardTitle>
          <CardDescription>
            Set up your Supabase database automatically using the environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">One-Click Setup</AlertTitle>
            <AlertDescription className="text-blue-700">
              Click the button below to automatically set up your Supabase database using the environment variables.
              This will create all necessary tables and seed the database with sample data.
            </AlertDescription>
          </Alert>

          {autoSetupStatus === "success" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Setup Successful</AlertTitle>
              <AlertDescription className="text-green-700">{autoSetupMessage}</AlertDescription>
            </Alert>
          )}

          {autoSetupStatus === "error" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Setup Failed</AlertTitle>
              <AlertDescription>{autoSetupMessage}</AlertDescription>
            </Alert>
          )}

          {autoSetupStatus === "loading" && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{autoSetupMessage}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {availableEnvVars.length > 0 ? (
              <span>Using environment variables: {availableEnvVars.join(", ")}</span>
            ) : (
              <span className="text-red-500">No Supabase environment variables found</span>
            )}
          </div>
          <div className="space-x-2">
            <Button
              onClick={autoSetupDatabase}
              disabled={autoSetupStatus === "loading" || availableEnvVars.length === 0}
              className="bg-primary text-black hover:bg-primary/90"
            >
              {autoSetupStatus === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Up...
                </>
              ) : (
                <>Set Up Database</>
              )}
            </Button>
            {autoSetupStatus === "success" && (
              <Link href="/dashboard/inventory">
                <Button>
                  Go to Inventory
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </CardFooter>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">1. Connection</TabsTrigger>
          <TabsTrigger value="schema">2. Schema</TabsTrigger>
          <TabsTrigger value="seed">3. Seed Data</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Supabase Connection
              </CardTitle>
              <CardDescription>Test your connection to Supabase using environment variables.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-4">
                <h3 className="text-sm font-medium">Available Supabase Environment Variables:</h3>
                {availableEnvVars.length > 0 ? (
                  <ul className="text-xs space-y-1 bg-muted p-3 rounded">
                    {availableEnvVars.map((envVar) => (
                      <li key={envVar} className="font-mono">
                        {envVar}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Supabase Environment Variables Found</AlertTitle>
                    <AlertDescription>
                      Make sure you have added the required Supabase environment variables to your project.
                    </AlertDescription>
                  </Alert>
                )}

                {connectionStatus === "success" && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
                    <AlertDescription className="text-green-700">{connectionMessage}</AlertDescription>
                  </Alert>
                )}

                {connectionStatus === "error" && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Connection Failed</AlertTitle>
                    <AlertDescription>{connectionMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={checkEnvironmentVariables}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Variables
              </Button>
              <Button
                onClick={testConnection}
                disabled={connectionStatus === "loading" || availableEnvVars.length === 0}
                className="bg-primary text-black hover:bg-primary/90"
              >
                {connectionStatus === "loading" ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    Test Connection
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="mr-2 h-5 w-5" />
                Database Schema
              </CardTitle>
              <CardDescription>Create the necessary database tables and functions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Manual SQL Execution Required</AlertTitle>
                <AlertDescription className="text-amber-700">
                  To create the database schema, you need to execute the SQL below in the Supabase SQL Editor. Copy the
                  SQL and paste it into the SQL Editor in your Supabase dashboard.
                </AlertDescription>
              </Alert>

              <div className="relative">
                <pre className="bg-muted p-4 rounded text-xs font-mono overflow-auto max-h-60">{createTablesSQL}</pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(createTablesSQL)}
                >
                  {sqlCopied ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {sqlCopied ? "Copied!" : "Copy SQL"}
                </Button>
              </div>

              {supabaseProjectUrl && (
                <div className="flex justify-center mt-4">
                  <a
                    href={supabaseProjectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open Supabase SQL Editor
                  </a>
                </div>
              )}

              {schemaStatus === "success" && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Schema Verified</AlertTitle>
                  <AlertDescription className="text-green-700">{schemaMessage}</AlertDescription>
                </Alert>
              )}

              {schemaStatus === "error" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Schema Verification Failed</AlertTitle>
                  <AlertDescription>{schemaMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveTab("connection")}
                disabled={schemaStatus === "loading"}
              >
                Back to Connection
              </Button>
              <Button
                onClick={checkTablesExist}
                disabled={schemaStatus === "loading" || connectionStatus !== "success"}
                className="bg-primary text-black hover:bg-primary/90"
              >
                {schemaStatus === "loading" ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking Tables...
                  </>
                ) : (
                  <>
                    Verify Schema
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="seed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Seed Database
              </CardTitle>
              <CardDescription>Populate your database with initial sample data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Important</AlertTitle>
                <AlertDescription className="text-amber-700">
                  This will add sample categories and inventory items to your database. Existing items with the same IDs
                  will not be overwritten.
                </AlertDescription>
              </Alert>

              {seedStatus === "success" && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Database Seeded</AlertTitle>
                  <AlertDescription className="text-green-700">{seedMessage}</AlertDescription>
                </Alert>
              )}

              {seedStatus === "error" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Seeding Failed</AlertTitle>
                  <AlertDescription>{seedMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("schema")} disabled={seedStatus === "loading"}>
                Back to Schema
              </Button>
              <div className="space-x-2">
                <Button
                  onClick={seedDatabase}
                  disabled={seedStatus === "loading" || schemaStatus !== "success"}
                  className="bg-primary text-black hover:bg-primary/90"
                >
                  {seedStatus === "loading" ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>Seed Database</>
                  )}
                </Button>
                {seedStatus === "success" && (
                  <Link href="/dashboard/inventory">
                    <Button>
                      Go to Inventory
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
