import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Update the formatNumber function to handle decimal places consistently
export function formatNumber(num: number): string {
  // Always display with 1 decimal place for consistency
  return num.toFixed(1)
}

// Add a new function specifically for weight formatting
export function formatWeight(weight: number): string {
  // First round to 1 decimal place to avoid floating point precision issues
  const rounded = Math.round(weight * 10) / 10
  // Then ensure it always displays with 1 decimal place
  return rounded.toFixed(1)
}
