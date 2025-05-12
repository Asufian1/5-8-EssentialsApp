import { getSupabaseClient } from "./supabase"

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
    // Initialize Supabase client
    const supabase = getSupabaseClient()

    // Get existing inventory items to check for matches
    const { data: existingItems, error: fetchError } = await supabase.from("inventory_items").select("*").order("name")

    if (fetchError) {
      throw new Error(`Failed to fetch existing items: ${fetchError.message}`)
    }

    console.log("Existing items:", existingItems?.length || 0)

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
        const existingItem = existingItems?.find(
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
          console.log(`Updating existing item: ${existingItem.name}, ID: ${existingItem.id}`)

          // Update the item directly in Supabase
          const { error: updateError } = await supabase
            .from("inventory_items")
            .update({
              quantity: Number(existingItem.quantity) + quantity,
              cost: price,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingItem.id)

          if (updateError) {
            throw new Error(`Failed to update item: ${updateError.message}`)
          }

          // Add transaction record
          const { error: txError } = await supabase.from("transactions").insert({
            id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: "in",
            item_id: existingItem.id,
            item_name: existingItem.name,
            quantity: quantity,
            user_id: "admin",
            timestamp: new Date().toISOString(),
            unit: unit,
            cost: price,
            total_cost: price * quantity,
          })

          if (txError) {
            console.warn("Could not add transaction record:", txError)
          }

          result.updated++
        } else {
          console.log(`Adding new item: ${item.product}`)

          // Generate a unique ID
          const newItemId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`

          // Insert the new item directly in Supabase
          const { error: insertError } = await supabase.from("inventory_items").insert({
            id: newItemId,
            name: item.product,
            category_id: "other", // Default category for imported items
            quantity: quantity,
            student_limit: 1,
            limit_duration: 7,
            limit_duration_minutes: 0,
            unit: unit,
            is_weighed: isWeighed,
            has_limit: true,
            cost: price,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) {
            throw new Error(`Failed to add item: ${insertError.message}`)
          }

          // Add transaction record
          const { error: txError } = await supabase.from("transactions").insert({
            id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: "in",
            item_id: newItemId,
            item_name: item.product,
            quantity: quantity,
            user_id: "admin",
            timestamp: new Date().toISOString(),
            unit: unit,
            cost: price,
            total_cost: price * quantity,
          })

          if (txError) {
            console.warn("Could not add transaction record:", txError)
          }

          result.added++
        }
      } catch (error) {
        console.error(`Error processing item "${item.product}":`, error)
        result.failed++
        result.errors.push(`Error processing item "${item.product}": ${(error as Error).message}`)
      }
    }

    if (result.failed > 0) {
      result.success = false
    }

    return result
  } catch (error) {
    console.error("General import error:", error)
    return {
      success: false,
      updated: result.updated,
      added: result.added,
      failed: result.failed + (items.length - result.updated - result.added),
      errors: [...result.errors, `General import error: ${(error as Error).message}`],
    }
  }
}
