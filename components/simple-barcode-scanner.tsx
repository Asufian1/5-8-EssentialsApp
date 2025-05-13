"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, X } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function SimpleBarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = "barcode-scanner-container"

  useEffect(() => {
    let mounted = true

    const startScanner = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Create scanner instance
        const scanner = new Html5Qrcode(scannerContainerId)
        scannerRef.current = scanner

        // Start scanning
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            console.log("Barcode detected:", decodedText)

            // Stop scanner after successful scan
            scanner
              .stop()
              .then(() => {
                console.log("Scanner stopped after successful scan")
                if (mounted) {
                  onScan(decodedText)
                }
              })
              .catch((err) => {
                console.error("Error stopping scanner:", err)
              })
          },
          (errorMessage) => {
            // Ignore errors during scanning - these are normal when no barcode is detected
            // console.error("QR Code scanning error:", errorMessage)
          },
        )

        if (mounted) {
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Error starting scanner:", err)
        if (mounted) {
          setError(`Error starting scanner: ${err instanceof Error ? err.message : String(err)}`)
          setIsLoading(false)
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      if (scannerRef.current) {
        console.log("Stopping scanner on unmount")
        scannerRef.current
          .stop()
          .then(() => {
            console.log("Scanner stopped successfully")
          })
          .catch((err) => {
            console.error("Error stopping scanner:", err)
          })
      }
    }
  }, [onScan])

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          console.log("Scanner stopped on close")
          onClose()
        })
        .catch((err) => {
          console.error("Error stopping scanner:", err)
          onClose()
        })
    } else {
      onClose()
    }
  }

  return (
    <Card className="w-full mb-6">
      <CardContent className="p-4">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="ml-2 text-white">Accessing camera...</span>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="text-white text-center p-4">
                  <p className="text-red-400 mb-2">Error</p>
                  <p>{error}</p>
                  <Button className="mt-4" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              </div>
            )}

            <div id={scannerContainerId} className="w-full h-full"></div>

            <div className="absolute inset-0 border-2 border-dashed border-white/50 pointer-events-none"></div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Position the barcode within the frame to scan</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
