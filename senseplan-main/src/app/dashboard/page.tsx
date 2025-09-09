"use client"

import { Suspense } from "react"
import DashboardContent from "./DashboardContent"

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
