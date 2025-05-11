"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { processCsvImport, parsePrice } from "@/lib/csv-import"
import { AlertCircle, Upload, Download } from "lucide-react"
import type { CsvImportItem } from "@/lib/csv-import"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

export function CsvUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvImportItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAllItems, setShowAllItems] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    updated: number
    added: number
    failed: number
    errors: string[]
  } | null>(null)
  const [columnMapping, setColumnMapping] = useState<{
    productIndex: number
    weightIndex: number
    priceIndex: number
    quantityIndex: number
  } | null>(null)

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseCSV(selectedFile)
    }
  }

  const parseQuantity = (value: string): number => {
    if (!value || typeof value !== "string") return 0
    // Remove any non-numeric characters except decimal points
    const cleanedValue = value.replace(/[^0-9.]/g, "")
    const quantity = Number.parseFloat(cleanedValue)
    return isNaN(quantity) ? 0 : quantity
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split("\n")

        // Extract headers (first line)
        const headers = lines[0].split(",").map((header) => header.trim())

        // Map headers to expected fields with more precise matching
        const productIndex = headers.findIndex(
          (h) =>
            h.toLowerCase() === "product" ||
            h.toLowerCase() === "name" ||
            h.toLowerCase() === "item" ||
            h.toLowerCase().includes("product name"),
        )

        const weightIndex = headers.findIndex(
          (h) =>
            h.toLowerCase().includes("weight") ||
            h.toLowerCase() === "amount" ||
            h.toLowerCase() === "size" ||
            h.toLowerCase().includes("weight/amount"),
        )

        const priceIndex = headers.findIndex(
          (h) =>
            h.toLowerCase().includes("price") ||
            h.toLowerCase() === "cost" ||
            h.toLowerCase() === "rate" ||
            h.toLowerCase().includes("price (per unit)"),
        )

        const quantityIndex = headers.findIndex(
          (h) =>
            h.toLowerCase() === "quantity" ||
            h.toLowerCase() === "qty" ||
            h.toLowerCase() === "count" ||
            h.toLowerCase().includes("order quantities") ||
            h.toLowerCase().includes("order quantity"),
        )

        console.log("CSV Headers:", headers)
        console.log("Column indices:", {
          productIndex,
          weightIndex,
          priceIndex,
          quantityIndex,
        })

        // Save column mapping for later use
        setColumnMapping({
          productIndex,
          weightIndex,
          priceIndex,
          quantityIndex,
        })

        if (productIndex === -1) {
          throw new Error("CSV file must contain a column for product name (e.g., 'Product', 'Name', 'Item')")
        }
        if (priceIndex === -1) {
          throw new Error("CSV file must contain a column for price (e.g., 'Price', 'Cost', 'Price (per unit)')")
        }
        if (quantityIndex === -1) {
          throw new Error("CSV file must contain a column for quantity (e.g., 'Quantity', 'Order Quantities', 'Qty')")
        }

        // Parse data rows (skip header)
        const data: CsvImportItem[] = []
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue // Skip empty lines

          const values = lines[i].split(",").map((value) => value.trim())

          if (values.length >= Math.max(productIndex, priceIndex, quantityIndex) + 1) {
            const item: CsvImportItem = {
              product: values[productIndex],
              weightAmount: weightIndex !== -1 ? values[weightIndex] : "1",
              pricePerUnit: values[priceIndex],
              orderQuantities: parseQuantity(values[quantityIndex]),
            }

            // Calculate total cost
            item.totalCost = parsePrice(item.pricePerUnit) * item.orderQuantities

            data.push(item)
          }
        }

        // Show all items or just the first 5
        setPreview(data)

        if (data.length === 0) {
          setResult({
            success: false,
            updated: 0,
            added: 0,
            failed: 0,
            errors: ["No valid data found in CSV file. Please check the format."],
          })
        } else {
          // Reset result
          setResult(null)
        }
      } catch (error) {
        console.error("Error parsing CSV:", error)
        setResult({
          success: false,
          updated: 0,
          added: 0,
          failed: 0,
          errors: [(error as Error).message],
        })
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!file || !columnMapping) return

    setIsLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string
          const lines = text.split("\n")

          // Extract headers (first line)
          const headers = lines[0].split(",").map((header) => header.trim())

          // Use the saved column mapping
          const { productIndex, weightIndex, priceIndex, quantityIndex } = columnMapping

          // Parse data rows (skip header)
          const data: CsvImportItem[] = []
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue // Skip empty lines

            const values = lines[i].split(",").map((value) => value.trim())

            if (values.length >= Math.max(productIndex, priceIndex, quantityIndex) + 1) {
              const item: CsvImportItem = {
                product: values[productIndex],
                weightAmount: weightIndex !== -1 ? values[weightIndex] : "1",
                pricePerUnit: values[priceIndex],
                orderQuantities: parseQuantity(values[quantityIndex]),
              }

              // Calculate total cost
              const price = parsePrice(item.pricePerUnit)
              item.totalCost = price * item.orderQuantities

              data.push(item)
            }
          }

          console.log("Parsed CSV data:", data)

          // Process the data
          const importResult = await processCsvImport(data)
          setResult(importResult)
        } catch (error) {
          console.error("Error processing CSV:", error)
          setResult({
            success: false,
            updated: 0,
            added: 0,
            failed: 0,
            errors: [(error as Error).message],
          })
        } finally {
          setIsLoading(false)
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error("Error reading file:", error)
      setResult({
        success: false,
        updated: 0,
        added: 0,
        failed: 0,
        errors: [(error as Error).message],
      })
      setIsLoading(false)
    }
  }

  // Function to display preview items
  const displayItems = showAllItems ? preview : preview.slice(0, 5)

  return (
    <Tabs defaultValue="import">
      <TabsList className="mb-4">
        <TabsTrigger value="import">Import CSV</TabsTrigger>
        <TabsTrigger value="guide">Import Guide</TabsTrigger>
      </TabsList>

      <TabsContent value="import">
        <Card>
          <CardHeader>
            <CardTitle>Import Inventory from CSV</CardTitle>
            <CardDescription>
              Upload a CSV file to update your inventory. The file should include columns for product name,
              weight/amount, price per unit, and order quantities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Input type="file" accept=".csv" onChange={handleFileChange} className="max-w-sm" />
              <Button onClick={handleImport} disabled={!file || isLoading} className="whitespace-nowrap">
                {isLoading ? "Importing..." : "Import CSV"}
                <Upload className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={downloadSampleCsv} className="whitespace-nowrap">
                Download Sample CSV
                <Download className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {preview.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Preview {!showAllItems && "(First 5 rows)"}</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showAll"
                      checked={showAllItems}
                      onCheckedChange={(checked) => setShowAllItems(checked as boolean)}
                    />
                    <label htmlFor="showAll" className="text-sm cursor-pointer">
                      Show all items
                    </label>
                  </div>
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Weight/Amount</TableHead>
                        <TableHead>Price (per unit)</TableHead>
                        <TableHead>Order Quantity</TableHead>
                        <TableHead>Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product}</TableCell>
                          <TableCell>{item.weightAmount}</TableCell>
                          <TableCell>{item.pricePerUnit}</TableCell>
                          <TableCell>{item.orderQuantities}</TableCell>
                          <TableCell>${(parsePrice(item.pricePerUnit) * item.orderQuantities).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {preview.length > 5 && !showAllItems && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {preview.length - 5} more items not shown. Check "Show all items" to view all.
                  </p>
                )}
              </div>
            )}

            {/* Debug information - can be removed in production */}
            {preview.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <details>
                  <summary className="cursor-pointer font-medium">Debug Information</summary>
                  <div className="mt-2 text-xs overflow-auto max-h-40">
                    <p>Column Mapping:</p>
                    <pre>{JSON.stringify(columnMapping, null, 2)}</pre>
                    <p>First Item:</p>
                    <pre>{JSON.stringify(preview[0], null, 2)}</pre>
                  </div>
                </details>
              </div>
            )}

            {result && (
              <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{result.success ? "Import Successful" : "Import Completed with Errors"}</AlertTitle>
                <AlertDescription>
                  <p>
                    Added: {result.added} items, Updated: {result.updated} items
                    {result.failed > 0 && `, Failed: ${result.failed} items`}
                  </p>
                  {result.errors.length > 0 && (
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">Need help? Check the Import Guide tab for more information.</p>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="guide">
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
                Product,Weight/Amount (for 1),Price (per unit),Order Quantities Maggi Noodles,100g,$1.29,10
                Rice,1kg,$3.99,5 Bread,1,$2.50,20
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
      </TabsContent>
    </Tabs>
  )
}
