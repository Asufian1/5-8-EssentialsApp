"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function CsvDownloadSample() {
  const handleDownload = () => {
    // Create sample CSV content
    const csvContent = `Product,Weight/amount (for 1),Price (per unit),Order Quantities
Rice,1 kg,$1.99,20
Beans,1 lb,$0.99,30
Pasta,1 lb,$1.29,25
Canned Soup,1 item,$1.49,15
Cereal,1 item,$3.99,10
Milk,1 item,$2.49,12
Bread,1 item,$2.29,15
Eggs,1 item,$3.49,10
Apples,1 item,$0.59,40
Potatoes,1 kg,$0.89,30`

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "sample-inventory-import.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button variant="outline" onClick={handleDownload}>
      <Download className="mr-2 h-4 w-4" />
      Download Sample CSV
    </Button>
  )
}
