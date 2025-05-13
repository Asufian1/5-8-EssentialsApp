"use client"

import { useState, useCallback } from "react"

type ToastProps = {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

type Toast = ToastProps & {
  id: string
}

export function toast(props: ToastProps) {
  // In a real implementation, this would be more sophisticated
  // For now, we'll just use alert for simplicity
  alert(`${props.title}\n${props.description || ""}`)
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...props, id }])
    // Also show an alert for simplicity
    alert(`${props.title}\n${props.description || ""}`)
    return id
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    toast: addToast,
    dismiss: dismissToast,
    dismissAll,
  }
}
