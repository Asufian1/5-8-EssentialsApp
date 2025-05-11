"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download } from "lucide-react"

export function CsvImportGuide() {
  // Function to download the sample CSV
  const downloadSampleCsv = async () => {
    try {
      const response = await fetch(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sample-inventory-import%20%282%29-qxF7cFsvjydp5pchc1lkUYIvjRdUh5.csv",
      )
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "sample-inventory-import.csv"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading sample CSV:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Import Guide</CardTitle>
        <CardDescription>Learn how to properly format your CSV file for importing inventory items.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-lg font-medium">Required Columns</h3>
        <p>Your CSV file must include the following columns:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Product</strong> - The name of the product (e.g., "Maggi Noodles")
          </li>
          <li>
            <strong>Weight/Amount</strong> - The weight or amount for one unit (e.g., "100g", "1kg", "1")
          </li>
          <li>
            <strong>Price (per unit)</strong> - The price per unit (e.g., "$1.29", "2.50")
          </li>
          <li>
            <strong>Order Quantities</strong> - The number of units to add to inventory (e.g., "10", "100")
          </li>
        </ul>

        <h3 className="text-lg font-medium mt-4">Column Name Variations</h3>
        <p>The system recognizes various column names:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Product</strong>: "Product", "Name", "Item", "Product Name"
          </li>
          <li>
            <strong>Weight/Amount</strong>: "Weight", "Amount", "Size", "Weight/Amount"
          </li>
          <li>
            <strong>Price</strong>: "Price", "Cost", "Rate", "Price (per unit)"
          </li>
          <li>
            <strong>Quantity</strong>: "Quantity", "Qty", "Count", "Order Quantities", "Order Quantity"
          </li>
        </ul>

        <h3 className="text-lg font-medium mt-4">Sample CSV Format</h3>
        <div className="bg-muted p-4 rounded-md overflow-x-auto">
          <pre className="text-xs">
            Product,Weight/Amount (for 1),Price (per unit),Order Quantities Maggi Noodles,100g,$1.29,10 Rice,1kg,$3.99,5
            Bread,1,$2.50,20
          </pre>
        </div>

        <Button variant="outline" onClick={downloadSampleCsv} className="mt-4">
          Download Sample CSV
          <Download className="ml-2 h-4 w-4" />
        </Button>

        <h3 className="text-lg font-medium mt-4">Tips for Successful Import</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Make sure your CSV file uses commas as separators</li>
          <li>Include clear column headers that match the expected names</li>
          <li>For prices, you can include or omit currency symbols ($, €, etc.)</li>
          <li>For quantities, use whole numbers without units</li>
          <li>Preview your data before importing to ensure it's parsed correctly</li>
          <li>If you have special characters in product names, ensure the CSV is properly encoded (UTF-8)</li>
        </ul>
      </CardContent>
    </Card>
  )
}
