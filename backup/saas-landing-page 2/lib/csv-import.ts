import { addInventoryItem, getInventoryItems, updateInventoryItem } from "@/lib/data-db"

export interface CsvImportItem {
  product: string
  weightAmount: string
  pricePerUnit: string
  orderQuantities: number
  totalCost?: number
}

// Parse price from various formats ($1.29, 1.29, etc.)
export function parsePrice(priceString: string): number {
  if (!priceString || typeof priceString !== "string") return 0

  // Remove currency symbols, spaces, and other non-numeric characters except for decimal points
  const cleanedPrice = priceString.replace(/[^0-9.]/g, "")
  const price = Number.parseFloat(cleanedPrice)
  return isNaN(price) ? 0 : price
}

export function parseQuantity(quantityString: string): number {
  if (!quantityString || typeof quantityString !== "string") return 0

  // Remove any non-numeric characters except decimal points
  const cleanedQuantity = quantityString.replace(/[^0-9.]/g, "")
  const quantity = Number.parseFloat(cleanedQuantity)
  return isNaN(quantity) ? 0 : quantity
}

export async function processCsvImport(items: CsvImportItem[]): Promise<{
  success: boolean
  updated: number
  added: number
  failed: number
  errors: string[]
}> {
  const result = {
    success: true,
    updated: 0,
    added: 0,
    failed: 0,
    errors: [] as string[],
  }

  if (!items || items.length === 0) {
    return {
      success: false,
      updated: 0,
      added: 0,
      failed: 0,
      errors: ["No items to import"],
    }
  }

  try {
    // Get existing inventory items to check for matches
    const existingItems = await getInventoryItems()

    for (const item of items) {
      try {
        if (!item.product) {
          throw new Error(`Missing product name for an item`)
        }

        // Parse price and quantity with better error handling
        const price = parsePrice(item.pricePerUnit)
        const quantity =
          typeof item.orderQuantities === "number" ? item.orderQuantities : parseQuantity(String(item.orderQuantities))

        console.log(`Processing item: ${item.product}, Price: ${price}, Quantity: ${quantity}`)

        if (quantity <= 0) {
          throw new Error(`Invalid quantity for item: ${item.product}`)
        }

        // Check if item already exists (by name)
        const existingItem = existingItems.find(
          (existing) => existing.name.toLowerCase() === item.product.toLowerCase(),
        )

        // Parse weight/amount to determine if it's a weighed item
        const weightAmountStr = item.weightAmount.toLowerCase()
        const isWeighed =
          weightAmountStr.includes("kg") ||
          weightAmountStr.includes("g") ||
          weightAmountStr.includes("lb") ||
          weightAmountStr.includes("oz")

        // Determine unit based on weight/amount string
        let unit: "item" | "kg" | "lb" | null = "item"
        if (isWeighed) {
          if (weightAmountStr.includes("kg")) unit = "kg"
          else if (weightAmountStr.includes("lb")) unit = "lb"
        }

        if (existingItem) {
          // Update existing item
          await updateInventoryItem({
            ...existingItem,
            quantity: existingItem.quantity + quantity,
            cost: price,
            lastRestockDate: new Date().toISOString(),
          })
          result.updated++
        } else {
          // Add new item with a unique ID
          const newItemId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`

          await addInventoryItem({
            id: newItemId,
            name: item.product,
            category: "other", // Default category for imported items is now "other"
            quantity: quantity,
            studentLimit: 1,
            limitDuration: 7,
            limitDurationMinutes: 0,
            unit: unit,
            isWeighed: isWeighed,
            hasLimit: true,
            cost: price,
            lastRestockDate: new Date().toISOString(),
          })
          result.added++
        }
      } catch (error) {
        result.failed++
        result.errors.push(`Error processing item "${item.product}": ${(error as Error).message}`)
      }
    }

    if (result.failed > 0) {
      result.success = false
    }

    return result
  } catch (error) {
    return {
      success: false,
      updated: result.updated,
      added: result.added,
      failed: result.failed + (items.length - result.updated - result.added),
      errors: [...result.errors, `General import error: ${(error as Error).message}`],
    }
  }
}
