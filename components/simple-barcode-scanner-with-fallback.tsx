"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Camera, Keyboard } from "lucide-react"
import { SimpleBarcodeScanner } from "./simple-barcode-scanner"

interface BarcodeScannerWithFallbackProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function SimpleBarcodeScannerWithFallback({ onScan, onClose }: BarcodeScannerWithFallbackProps) {
  const [useCamera, setUseCamera] = useState(true)
  const [manualBarcode, setManualBarcode] = useState("")

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualBarcode) {
      onScan(manualBarcode)
    }
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{useCamera ? "Camera Scanner" : "Manual Entry"}</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseCamera(!useCamera)}
            title={useCamera ? "Switch to manual entry" : "Switch to camera"}
          >
            {useCamera ? <Keyboard className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {useCamera ? (
          <SimpleBarcodeScanner onScan={onScan} onClose={onClose} />
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter barcode manually"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!manualBarcode}>
                Submit
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
