import { NextRequest, NextResponse } from 'next/server'
import { VapiClient } from '@vapi-ai/server-sdk'

const VAPI_API_TOKEN = process.env.VAPI_API_TOKEN
if (!VAPI_API_TOKEN) {
  throw new Error('VAPI_API_TOKEN is not set')
}

const JSONBIN_ID = process.env.JSONBIN_ID
const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY

if (!JSONBIN_ID || !JSONBIN_MASTER_KEY) {
  throw new Error('JSONBIN_ID and JSONBIN_MASTER_KEY must be set')
}

const vapi = new VapiClient({
  token: VAPI_API_TOKEN
})

// inline sleep helper
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

export async function POST(request: NextRequest) {
  try {
    const {
      businessNumber,
      serviceDesc,
      timeWindow,
      name,
      email,
      callbackNumber,
      outgoingNumberId
    } = await request.json()

    // basic validation
    if (!businessNumber || !serviceDesc || !timeWindow) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Received form data:', { name, serviceDesc, timeWindow, callbackNumber, email })

    // 1) First, update JSONBin with user information
    const payload = {
      name,
      activity: serviceDesc,
      availability: timeWindow,
      phone_number: callbackNumber,
      email
    }
    console.log('Payload to JSONBin:', payload)

    const jsonBinRes = await fetch(
      `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_MASTER_KEY
        } as HeadersInit,
        body: JSON.stringify(payload)
      }
    )
    console.log('JSONBin HTTP status:', jsonBinRes.status)

    const jsonBinData = await jsonBinRes.json()
    console.log('JSONBin response body:', jsonBinData)

    // If JSONBin update failed, return the error
    if (!jsonBinRes.ok) {
      console.error('JSONBin write failed:', jsonBinData)
      return NextResponse.json(
        { success: false, error: 'Failed to update user information', details: jsonBinData },
        { status: jsonBinRes.status }
      )
    }

    console.log('JSONBin write succeeded.')

    // 2) Now proceed with the Vapi call
    const phoneNumberId =
      outgoingNumberId || process.env.VAPI_PHONE_NUMBER_ID

    if (!phoneNumberId) {
      return NextResponse.json(
        { error: 'No outgoing phone number configured' },
        { status: 400 }
      )
    }

    const call: any = await vapi.calls.create({
      assistantId: process.env.VAPI_ASSISTANT_ID,
      phoneNumberId,
      customer: { number: businessNumber },
      assistantOverrides: {
        variableValues: {
          serviceDesc,
          timeWindow,
          name,
          email,
          callbackNumber
        }
      }
    })

    let finalStatus: any = call
    while (true) {
      finalStatus = await vapi.calls.get(call.id)
      if (['ended', 'failed'].includes(finalStatus.status || '')) break
      await sleep(3000)  // wait 3s before retry
    }

    // Extract the summary and transcript
    const summary = finalStatus.analysis?.summary
    const transcript = finalStatus.artifact?.transcript // Transcript is within artifact object

    return NextResponse.json(
      {
        success: true,
        callId: call.id,
        summary,
        transcript,
        binResponse: jsonBinData
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('VAPI route error:', error)
    return NextResponse.json(
      { error: (error instanceof Error) ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 