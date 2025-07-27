
import { NextResponse } from 'next/server'
import { VapiClient }   from '@vapi-ai/server-sdk'

const VAPI_API_TOKEN = process.env.VAPI_API_TOKEN
if (!VAPI_API_TOKEN) {
  throw new Error('VAPI_API_TOKEN is not set')
}

const vapi = new VapiClient({
  token: VAPI_API_TOKEN
})

// inline sleep helper
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

export async function POST(req: Request) {
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

    const call: any = await vapi.calls.create({
      assistantId:   process.env.VAPI_ASSISTANT_ID,
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
      if (['ended','failed'].includes(finalStatus.status || '')) break
      await sleep(3000)  // wait 3s before retry
    }

    // Extract the summary and transcript
    const summary    = finalStatus.analysis?.summary
    const transcript = finalStatus.artifact?.transcript // Transcript is within artifact object

    return NextResponse.json(
      {
        success:   true,
        callId:    call.id,
        summary,
        transcript
      },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('API /call error:', err)
    return NextResponse.json(
      { error: (err instanceof Error) ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}