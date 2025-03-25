export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
}

export interface Transaction {
  id: string
  type: "in" | "out"
  itemId: string
  itemName: string
  quantity: number
  user: string
  timestamp: string
}

export interface TakeItemRequest {
  itemId: string
  itemName: string
  quantity: number
  user: string
}

