
import fetch from 'node-fetch';

const VAPI_PRIVATE_KEY = 'aa5523f3-3649-4447-a67e-7adece350189'; 

async function waitForCallEnd(callId) {
  console.log(`Starting to monitor call ${callId}...`);
  let attempts = 0;
  while (true) {
    attempts++;
    console.log(`Checking call status (attempt ${attempts})...`);
    const statusResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`
      }
    });
    if (!statusResponse.ok) {
      const errorData = await statusResponse.text();
      console.error(`Failed to check call status: ${errorData}`);
      throw new Error(`Failed to check call status: ${errorData}`);
    }
    const statusData = await statusResponse.json();
    console.log(`Current call status: ${statusData.status}`);
    if (statusData.status === 'ended' || statusData.status === 'failed') {
      console.log('Call has ended. Final status:', statusData.status);
      if (statusData.analysis) {
        console.log('Call summary:', statusData.analysis.summary);
      }
      if (statusData.transcript) {
        console.log('Transcript available');
      }
      return statusData;
    }
    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = await request.json();
    const { retailer, queryId } = body;
    if (!retailer || !retailer.phone_number) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing retailer phone number' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // FOR TESTING: Always call the user's number instead of the retailer's actual number
    const userTestNumber = '+15109497606'; // Your number for testing
    console.log(`Initiating TEST call for ${retailer.name} - calling USER number ${userTestNumber} instead of retailer (query ${queryId})`);
    const formattedNumber = userTestNumber;
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId: 'e77ba05d-115b-4edd-aeaf-2529a6fc8114',
        customer: {
          number: formattedNumber
        },
        phoneNumberId: 'babd43f2-9da6-4c45-b9be-f143d5f58e10'
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to initiate call:', errorData);
      throw new Error(`Failed to initiate call: ${errorData}`);
    }
    const callData = await response.json();
    console.log('Call initiated successfully. Call ID:', callData.id);
    // Wait for the call to end and get the final data
    const finalData = await waitForCallEnd(callData.id);
    return new Response(JSON.stringify({
      success: true,
      status: finalData.status,
      summary: finalData.analysis?.summary,
      transcript: finalData.transcript
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error making outbound call:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}