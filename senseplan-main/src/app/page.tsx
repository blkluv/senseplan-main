"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MessageCircle } from "lucide-react"

export default function LandingPage() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      // Navigate to dashboard with the query
      router.push(`/dashboard?query=${encodeURIComponent(query)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">SensePlan</h1>
          <p className="text-slate-600 text-lg">Schedule anything with one search</p>
        </div>

        {/* Main Chat Interface */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-medium text-slate-800 mb-2">What can I help you schedule?</h2>
                <p className="text-slate-500 text-sm">Tell me about your appointment, meeting, or event</p>
              </div>

              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Schedule a dentist appointment for next Tuesday..."
                  className="h-14 text-lg px-6 pr-16 border-2 border-slate-200 focus:border-blue-500 rounded-xl"
                  autoFocus
                />
                <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 rounded-xl"
                disabled={!query.trim()}
              >
                Start Scheduling
              </Button>
            </form>

            
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
