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
  const cleanedValue = quantityString.replace(/[^0-9.]/g, "")
  const quantity = Number.parseFloat(cleanedValue)
  return isNaN(quantity) ? 0 : quantity
}

// Parse weight from string (e.g., "1 lb", "500g", "2kg", "20lb")
export function parseWeight(weightString: string): { value: number; unit: string } {
  if (!weightString || typeof weightString !== "string") {
    return { value: 1, unit: "item" }
  }

  // Convert to lowercase for easier matching
  const str = weightString.toLowerCase().trim()

  // Check if this is a weighted item
  const isWeighted =
    str.includes("kg") ||
    str.includes("kilo") ||
    str.includes("lb") ||
    str.includes("pound") ||
    str.includes("g") ||
    str.includes("oz")

  if (!isWeighted) {
    return { value: 1, unit: "item" }
  }

  // Extract numeric value - improved regex to better capture the number
  // This regex will find one or more digits, optionally followed by a decimal point and more digits
  const numericMatch = str.match(/(\d+\.?\d*)/)
  const value = numericMatch ? Number.parseFloat(numericMatch[1]) : 1

  // Determine unit
  let unit = "item"
  if (str.includes("kg") || str.includes("kilo")) {
    unit = "kg"
  } else if (str.includes("lb") || str.includes("pound")) {
    unit = "lb"
  } else if (str.includes("g") && !str.includes("kg")) {
    unit = "g"
  } else if (str.includes("oz")) {
    unit = "oz"
  }

  return { value: isNaN(value) ? 1 : value, unit }
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
        const orderQuantity =
          typeof item.orderQuantities === "number" ? item.orderQuantities : parseQuantity(String(item.orderQuantities))

        console.log(`Processing item: ${item.product}, Price: ${price}, Order Quantity: ${orderQuantity}`)

        if (orderQuantity <= 0) {
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

        // Parse the weight value and unit
        const { value: weightValue, unit } = parseWeight(item.weightAmount)

        // Calculate the total quantity to add based on weight and order quantity
        // For weighted items, multiply the weight by the order quantity
        const quantityToAdd = isWeighed ? weightValue * orderQuantity : orderQuantity

        console.log(
          `Item ${item.product} is ${isWeighed ? "weighed" : "not weighed"}, Weight: ${weightValue} ${unit}, Total quantity to add: ${quantityToAdd}`,
        )

        if (existingItem) {
          console.log(`Updating existing item: ${existingItem.name}, ID: ${existingItem.id}`)

          // Update the item directly in Supabase
          const { error: updateError } = await supabase
            .from("inventory_items")
            .update({
              quantity: Number(existingItem.quantity) + quantityToAdd,
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
            quantity: quantityToAdd,
            user_id: "admin",
            timestamp: new Date().toISOString(),
            unit: unit,
            cost: price,
            total_cost: price * orderQuantity, // Total cost is based on order quantity, not the weight-adjusted quantity
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
            quantity: quantityToAdd,
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
            quantity: quantityToAdd,
            user_id: "admin",
            timestamp: new Date().toISOString(),
            unit: unit,
            cost: price,
            total_cost: price * orderQuantity, // Total cost is based on order quantity, not the weight-adjusted quantity
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
