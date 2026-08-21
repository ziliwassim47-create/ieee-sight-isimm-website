"use client"

import { Toaster } from "sonner"

export function AdminToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "bg-white border border-gray-200 shadow-lg text-gray-900",
          success: "border-green-200 bg-green-50/95",
          error: "border-red-200 bg-red-50/95 text-red-800",
          title: "font-semibold",
          description: "text-gray-600",
        },
      }}
    />
  )
}
