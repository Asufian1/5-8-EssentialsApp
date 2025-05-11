"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BrowserMultiFormatReader, type Result } from "@zxing/library"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Initialize the barcode reader
    const codeReader = new BrowserMultiFormatReader()
    readerRef.current = codeReader

    // Start the camera
    const startScanning = async () => {
      try {
        // Get video devices
        const videoInputDevices = await codeReader.listVideoInputDevices()

        if (videoInputDevices.length === 0) {
          setError("No camera found")
          return
        }

        // Use the first camera
        const selectedDeviceId = videoInputDevices[0].deviceId

        if (!videoRef.current) return

        // Start decoding from the video element
        codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result: Result | null, error: Error | undefined) => {
            if (result) {
              const barcode = result.getText()
              onScan(barcode)
            }
            if (error && !(error instanceof TypeError)) {
              // Ignore TypeError as it's often thrown when scanning is working normally
              console.error("Scanning error:", error)
            }
          },
        )
      } catch (err) {
        console.error("Error starting camera:", err)
        setError("Failed to access camera. Please ensure camera permissions are granted.")
      }
    }

    startScanning()

    // Cleanup function
    return () => {
      if (readerRef.current) {
        try {
          readerRef.current.reset()
        } catch (err) {
          console.error("Error resetting reader:", err)
        }
      }

      // Ensure we stop all tracks on the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [onScan])

  const handleClose = () => {
    // Clean up resources
    if (readerRef.current) {
      try {
        readerRef.current.reset()
      } catch (err) {
        console.error("Error resetting reader:", err)
      }
    }

    // Ensure we stop all tracks on the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    // Call the onClose callback
    onClose()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Scan Barcode</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="p-4 bg-red-100 text-red-800 rounded-md">{error}</div>
        ) : (
          <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-0 border-2 border-yellow-400 opacity-50 pointer-events-none"></div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleClose} className="w-full">
          Cancel
        </Button>
      </CardFooter>
    </Card>
  )
}
