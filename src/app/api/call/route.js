// src/app/api/call/route.js
import 'dotenv/config'
import { NextResponse } from 'next/server'
import { VapiClient }   from '@vapi-ai/server-sdk'

const vapi = new VapiClient({
  token: process.env.VAPI_API_TOKEN
})

export async function POST(req) {
  try {
    const {
      businessNumber,
      serviceDesc,
      timeWindow,
      name,
      email,
      callbackNumber,
      outgoingNumberId
    } = await req.json()

    // basic validation
    if (!businessNumber || !serviceDesc || !timeWindow) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const phoneNumberId =
      outgoingNumberId || process.env.VAPI_PHONE_NUMBER_ID

    if (!phoneNumberId) {
      return NextResponse.json(
        { error: 'No outgoing phone number configured' },
        { status: 400 }
      )
    }

    const call = await vapi.calls.create({
      assistantId:   process.env.VAPI_ASSISTANT_ID,      // ← top-level
      phoneNumberId,                                     // ← top-level
      customer: { number: businessNumber },              // ← unchanged

      // ↓ new place for your variables
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

    return NextResponse.json(
      { success: true, callId: call.id },
      { status: 200 }
    )
  } catch (err) {
    console.error('API /call error:', err)
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
