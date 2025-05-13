import { CsvUpload } from "@/components/csv-upload"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Import CSV - Retriever's Essentials",
  description: "Import inventory items from CSV files",
}

export default function ImportPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Import Inventory</h1>
      <CsvUpload />
    </div>
  )
}
