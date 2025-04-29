"use client"

import { Button } from "@/components/ui/button"
import { Store, ArrowRight, ShieldCheck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  const handleTakeItems = () => {
    router.push("/dashboard/take-items")
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Login Button in Corner */}
      <div className="absolute top-4 right-4 z-10">
        <Link href="/login">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Admin</span>
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative h-64 md:h-96 w-full bg-secondary">
        <div className="absolute inset-0 flex items-center justify-center flex-col text-white p-4">
          <div className="bg-black/50 p-6 rounded-lg text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/images/retriever-essentials-logo.png"
                alt="Retriever's Essentials Logo"
                width={200}
                height={100}
                className="object-contain"
              />
            </div>
            <p className="text-xl md:text-2xl">UMBC&apos;s Free Campus Food Store</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-3xl p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="flex justify-center">
              <Store className="h-16 w-16 text-primary" />
            </div>
            <h2 className="mt-4 text-3xl font-bold text-secondary">Welcome to Retriever&apos;s Essentials</h2>
            <p className="mt-2 text-gray-600 text-lg">
              Our mission is to fight food insecurity on campus by providing free food and essential items to UMBC
              students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold mb-3">How It Works</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Browse available items in our inventory</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Select what you need (up to allowed limits)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Provide your name at checkout</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>Pick up your items at the store during open hours</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold mb-3">Store Hours</h3>
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Monday - Friday:</strong> 10:00 AM - 4:00 PM
                </p>
                <p>
                  <strong>Location:</strong> Commons Building, Room 331
                </p>
                <p className="mt-4 text-sm">
                  <em>Note: Hours may vary during holidays and breaks. Check our social media for updates.</em>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleTakeItems}
              size="lg"
              className="bg-primary text-black hover:bg-primary/90 text-lg px-8 py-6 h-auto"
            >
              Browse Available Items
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-secondary text-white py-4 text-center">
        <p className="text-sm">© {new Date().getFullYear()} UMBC Retriever&apos;s Essentials</p>
      </footer>
    </div>
  )
}
