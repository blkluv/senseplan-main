"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, Clock, Star, ArrowLeft, PhoneCall, Loader2 } from "lucide-react"
import Link from "next/link"

type BusinessResult = {
  business_name: string;
  business_address: string;
  notes: string;
  phone_number: string;
}

export default function Dashboard() {
  const searchParams = useSearchParams()
  const query = searchParams.get("query") || ""
  const [isCallActive, setIsCallActive] = useState(false)
  const [transcript, setTranscript] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [places, setPlaces] = useState<BusinessResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [callSummary, setCallSummary] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlaces = async () => {
      if (!query) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_info: "User is based in San Francisco, CA. ", // You can customize this or get from user context
            query: query
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        // The API now returns an object with a 'businesses' array
        setPlaces(result.businesses || [])
      } catch (err) {
        console.error('Error fetching places:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch places')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlaces()
  }, [query])

  const startCall = async (place: BusinessResult) => {
    setIsCallActive(true)
    setTranscript([])
    setError(null)
    setCallSummary(null)

    try {
      const response = await fetch('/api/make-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessNumber: "+15109497606",//place.phone_number,
          serviceDesc: "schedule a haircut", // Sample data
          timeWindow: "anytime afternoon", // Sample data
          name: "Devin", // Sample data
          email: "devin@gmail.com", // Sample data
          callbackNumber: "+15109497606", // Sample data
          // outgoingNumberId: "YOUR_OUTGOING_PHONE_NUMBER_ID" // Uncomment and replace if needed
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("Call completed:", result)

      // Set the actual transcript and summary from the API response
      if (result.transcript) {
        // Split transcript into individual lines/messages for display
        const transcriptLines = result.transcript.split('\n').filter((line: string) => line.trim())
        setTranscript(transcriptLines)
      }
      
      if (result.summary) {
        setCallSummary(result.summary)
      }

      setIsCallActive(false)

    } catch (err) {
      console.error('Error starting call:', err)
      setError(err instanceof Error ? err.message : 'Failed to start call')
      setIsCallActive(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Scheduling Dashboard</h1>
              <p className="text-slate-600">Query: "{query}"</p>
            </div>
          </div>
          <Badge variant={isCallActive ? "default" : "secondary"} className="px-3 py-1">
            {isCallActive ? "Call in Progress" : "Ready to Call"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Places Found */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Places Found
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-slate-600 mb-2">🔍 Searching for the perfect places...</p>
                    <p className="text-sm text-slate-500">Hang tight! We're finding the best options for you.</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-4">❌ Oops!</div>
                    <p className="text-slate-600 mb-2">Something went wrong while searching.</p>
                    <p className="text-sm text-slate-500">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => window.location.reload()}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : places.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-slate-400 mb-4">🤷‍♂️</div>
                    <p className="text-slate-600 mb-2">No places found for your search.</p>
                    <p className="text-sm text-slate-500">Try a different search term or location.</p>
                  </div>
                ) : (
                  places.map((place, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-slate-900">{place.business_name}</h3>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">4.5</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {place.business_address}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {place.phone_number}
                        </div>
                        {place.notes && (
                          <div className="flex items-start">
                            <Clock className="h-4 w-4 mr-2 mt-0.5" />
                            <span>{place.notes}</span>
                          </div>
                        )}
                      </div>

                      <Button onClick={() => startCall(place)} className="w-full mt-3" disabled={isCallActive}>
                        <PhoneCall className="h-4 w-4 mr-2" />
                        {isCallActive ? "Calling..." : "Call to Schedule"}
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Call Transcript */}
          <div className="space-y-4">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Call Transcript
                  {isCallActive && (
                    <div className="ml-auto flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-sm text-red-600">In Progress</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCallActive ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-slate-600 mb-2">📞 Call in progress...</p>
                    <p className="text-sm text-slate-500">Please wait while we complete the call.</p>
                  </div>
                ) : transcript.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No call transcript available</p>
                    <p className="text-sm">Click "Call to Schedule" to start a call</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transcript.map((line, index) => (
                      <div key={index} className="text-sm">
                        <div className="p-3 rounded-lg bg-slate-50 border-l-4 border-slate-400">
                          <span>{line}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Call Summary */}
            {callSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Call Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700">{callSummary}</p>
                </CardContent>
              </Card>
            )}

            {/* Call Status */}
            {isCallActive && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Call Status</p>
                      <p className="text-sm text-slate-600">Calling {places[0]?.business_name || "Business"}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setIsCallActive(false)}>
                      Cancel Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
