"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BrowserMultiFormatReader, type Result } from "@zxing/library"
import { Loader2 } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isMountedRef = useRef(true)
  const hasScannedRef = useRef(false)

  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true
    hasScannedRef.current = false

    // Initialize the barcode reader
    const codeReader = new BrowserMultiFormatReader()
    readerRef.current = codeReader

    // Start the camera
    const startScanning = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get video devices
        const videoInputDevices = await codeReader.listVideoInputDevices()

        if (videoInputDevices.length === 0) {
          setError("No camera found")
          setIsLoading(false)
          return
        }

        // Use the first camera
        const selectedDeviceId = videoInputDevices[0].deviceId

        if (!videoRef.current || !isMountedRef.current) return

        // Start decoding from the video element
        codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result: Result | null, error: Error | undefined) => {
            // Skip if component is unmounted or we've already scanned
            if (!isMountedRef.current || hasScannedRef.current) return

            if (result) {
              console.log("Barcode detected:", result.getText())

              // Mark as scanned to prevent multiple callbacks
              hasScannedRef.current = true

              // Stop the scanner immediately
              stopScanner()

              // Call the onScan callback with the barcode
              if (isMountedRef.current) {
                onScan(result.getText())
              }
            }

            if (error && !(error instanceof TypeError)) {
              // Ignore TypeError as it's often thrown when scanning is working normally
              console.error("Scanning error:", error)
            }
          },
        )

        // Store the media stream for later cleanup
        if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
          streamRef.current = videoRef.current.srcObject
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Error starting camera:", err)
        if (isMountedRef.current) {
          setError("Failed to access camera. Please ensure camera permissions are granted.")
          setIsLoading(false)
        }
      }
    }

    startScanning()

    // Cleanup function
    return () => {
      console.log("BarcodeScanner component unmounting")
      isMountedRef.current = false
      stopScanner()
    }
  }, [onScan])

  const stopScanner = () => {
    console.log("Stopping scanner")

    // Stop the barcode reader
    if (readerRef.current) {
      try {
        readerRef.current.reset()
        console.log("Reader reset")
      } catch (err) {
        console.error("Error resetting reader:", err)
      }
    }

    // Ensure we stop all tracks on the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log("Track stopped:", track.kind, track.readyState)
      })
      streamRef.current = null
    }

    // Also check if there's a stream in the video element
    if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => {
        track.stop()
        console.log("Video track stopped:", track.kind, track.readyState)
      })
      videoRef.current.srcObject = null
    }
  }

  const handleClose = () => {
    stopScanner()
    onClose()
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>Scan Barcode</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="p-4 bg-red-100 text-red-800 rounded-md">{error}</div>
        ) : (
          <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="ml-2 text-white">Accessing camera...</span>
              </div>
            )}
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-0 border-2 border-dashed border-white/50 pointer-events-none"></div>
          </div>
        )}
        <p className="text-sm text-muted-foreground mt-4 text-center">Position the barcode within the frame to scan</p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleClose} className="w-full">
          Cancel
        </Button>
      </CardFooter>
    </Card>
  )
}
