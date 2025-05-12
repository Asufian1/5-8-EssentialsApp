"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Check, ArrowLeft, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { createOrder, processDirectCheckout } from "@/lib/data-db"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseClient } from "@/lib/supabase"

function formatQty(qty: number): string {
  const rounded = Math.round((qty + Number.EPSILON) * 100) / 100
  return rounded.toFixed(2).replace(/\.?0+$/, "")
}

export default function CheckoutPage() {
  const [studentId, setStudentId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [userType, setUserType] = useState("")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [dbConnected, setDbConnected] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(true)

  // Check database connection on component mount
  useEffect(() => {
    const checkDbConnection = async () => {
      try {
        setCheckingConnection(true)
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.from("inventory_items").select("count").single()

        if (error) {
          console.error("Database connection error:", error)
          setDbConnected(false)
        } else {
          setDbConnected(true)
        }
      } catch (err) {
        console.error("Failed to check database connection:", err)
        setDbConnected(false)
      } finally {
        setCheckingConnection(false)
      }
    }

    checkDbConnection()
  }, [])

  // Load cart items and user type on component mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        setCartItems(JSON.parse(savedCart))
      }

      const storedUserType = localStorage.getItem("userType")
      setUserType(storedUserType || "")
    } catch (error) {
      console.error("Error parsing cart data:", error)
      setCartItems([])
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSuccessMessage(null)

    if (!studentId.trim()) {
      setError("Please enter your student ID")
      return
    }

    if (!dbConnected) {
      setError("Database connection error. Please try again later.")
      return
    }

    setIsSubmitting(true)

    if (cartItems.length === 0) {
      setError("Your cart is empty")
      setIsSubmitting(false)
      return
    }

    try {
      // For staff users, process the checkout directly
      if (userType === "staff") {
        const result = await processDirectCheckout(
          studentId,
          cartItems.map((item) => ({
            itemId: item.id,
            itemName: item.name,
            quantity: item.quantity,
            category: item.category,
            unit: item.unit,
          })),
        )

        if (!result.success) {
          setError(result.error || "Failed to process checkout. Please try again.")
          setIsSubmitting(false)
          return
        }

        // Clear cart
        localStorage.removeItem("cart")

        // Show success message
        setSuccess("Checkout processed successfully!")

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/dashboard/take-items?success=true")
        }, 1500)
      } else {
        // For students, create an order as before
        const orderItems = cartItems.map((item) => ({
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
          category: item.category,
          unit: item.unit,
        }))

        // Create the order
        const result = await createOrder(studentId, orderItems)

        if (result.success) {
          // Clear cart
          localStorage.removeItem("cart")
          setCartItems([])

          // Show success message
          setSuccessMessage(
            "Your order has been successfully submitted! You'll be notified when it's ready for pickup.",
          )

          // Redirect after a delay
          setTimeout(() => {
            router.push("/dashboard/take-items")
          }, 3000)
        } else {
          setError(result.error || "Failed to create order")
        }
      }
    } catch (error) {
      console.error("Error processing checkout:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate total items
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/dashboard/take-items">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Items</span>
          </Button>
        </Link>
      </div>

      {!dbConnected && !checkingConnection && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Connection Error</AlertTitle>
          <AlertDescription>
            Unable to connect to the database. Your order may not be processed correctly.
            <Button variant="outline" size="sm" className="ml-2" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                {userType === "staff" ? "Process Checkout" : "Checkout"}
              </CardTitle>
              <CardDescription>
                {userType === "staff"
                  ? "Enter the student ID to process their checkout directly"
                  : "Please provide your student ID to complete your request"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    placeholder="Enter student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-300">Success!</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">{successMessage}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-300">Success</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary text-black hover:bg-primary/90"
                  disabled={isSubmitting || !dbConnected}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check className="h-5 w-5" /> {userType === "staff" ? "Process Checkout" : "Place Order"}
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                {formatQty(totalItems)} {totalItems === 1 ? "item" : "items"} in your request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.length > 0 ? (
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center pb-2 border-b">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {formatQty(item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <span className="font-semibold">Total Items:</span>
              <span className="font-semibold">{formatQty(totalItems)}</span>
            </CardFooter>
          </Card>

          <div className="mt-4 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Important Note:</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {userType === "staff"
                ? "This will immediately process the checkout and update inventory quantities."
                : "Your order will be reviewed by staff and prepared for pickup. You'll be notified when it's ready. Please bring your student ID when you come to collect your items."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
