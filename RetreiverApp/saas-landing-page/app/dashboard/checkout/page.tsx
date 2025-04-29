"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Check, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createOrder } from "@/lib/data"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CheckoutPage() {
  const [studentId, setStudentId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const [cartItems, setCartItems] = useState<any[]>([])

  // Load cart items on component mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        setCartItems(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error("Error parsing cart data:", error)
      setCartItems([])
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!studentId.trim()) {
      setError("Please enter your student ID")
      return
    }

    setIsSubmitting(true)

    if (cartItems.length === 0) {
      setError("Your cart is empty")
      setIsSubmitting(false)
      return
    }

    try {
      // Create order using the createOrder function from lib/data.ts
      const result = createOrder(
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
        setError(result.error || "Failed to place order. Please try again.")
        setIsSubmitting(false)
        return
      }

      // Clear cart
      localStorage.removeItem("cart")

      // Redirect to confirmation page
      setTimeout(() => {
        router.push("/dashboard/take-items?success=true")
      }, 1000)
    } catch (error) {
      console.error("Error creating order:", error)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                Checkout
              </CardTitle>
              <CardDescription>Please provide your student ID to complete your request</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    placeholder="Enter your student ID"
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

                <Button
                  type="submit"
                  className="w-full bg-primary text-black hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check className="h-5 w-5" /> Place Order
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
                {totalItems} {totalItems === 1 ? "item" : "items"} in your request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.length > 0 ? (
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center pb-2 border-b">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Your cart is empty</p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <span className="font-semibold">Total Items:</span>
              <span className="font-semibold">{totalItems}</span>
            </CardFooter>
          </Card>

          <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Important Note:</h3>
            <p className="text-sm text-blue-700">
              Your order will be reviewed by staff and prepared for pickup. You'll be notified when it's ready. Please
              bring your student ID when you come to collect your items.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
