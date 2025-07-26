// pages/api/mcp-action.js
import { GoogleGenerativeAI } from '@google/generative-ai'; // npm install @google/generative-ai

// !!! IMPORTANT: use environment variables for your API key in a real app !!!
const API_KEY = process.env.GEMINI_API_KEY; // Make sure this is set in your .env.local
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Define your hypothetical MCP tools for Gemini to use
// In a real MCP setup, these would be discovered or registered by your MCP client
const mcpTools = [
  {
    function_declarations: [
      {
        name: "search",
        description: "searches for local businesses (e.g., barbers, restaurants) by type, location, time, and date.",
        parameters: {
          type: "OBJECT",
          properties: {
            business_type: { type: "STRING", description: "the type of business to search for, e.g., 'barber', 'restaurant'." },
            location: { type: "STRING", description: "the location for the search, e.g., 'san francisco', 'nearby'." },
            time: { type: "STRING", description: "the specific time, e.g., '3pm', 'now'." },
            date: { type: "STRING", description: "the specific date, e.g., 'tomorrow', 'july 27th'." }
          },
          required: ["business_type", "location"] // location might be inferred later
        }
      },
      {
        name: "initiate_phone_call",
        description: "makes a phone call to a specified business or contact.",
        parameters: {
          type: "OBJECT",
          properties: {
            target_name: { type: "STRING", description: "the name of the business or person to call, e.g., 'supercuts'." },
            phone_number: { type: "STRING", description: "the phone number to call." },
            context: { type: "STRING", description: "the reason for the call, e.g., 'confirming appointment'." }
          },
          required: ["target_name", "phone_number", "context"]
        }
      }
    ]
  }
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'nah, post requests only. you know the drill.' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'empty prompt? what am i supposed to do with that, a magic trick?' });
  }

  try {
    // Step 1: use gemini to understand intent and suggest tool calls
    // Note: Gemini's function calling is similar to how MCP works with LLMs
    const chat = model.startChat({
      tools: mcpTools,
      // You can add a chat history here if you want multi-turn conversations
      // history: []
    });

    const result = await chat.sendMessage(prompt);
    const call = result.response.functionCalls(); // Get the suggested function calls from Gemini

    if (!call || call.length === 0) {
      // Gemini didn't suggest any tool calls, so it's a general query
      // You could have Gemini generate a text response here instead
      const textResponse = await chat.sendMessage(prompt); // Re-send without tools
      return res.status(200).json({ message: textResponse.response.text() || 'couldn\'t figure out a tool for that, fam. just vibin\'.' });
    }

    let mcpActionResponse = [];

    // Step 2: Act as the MCP client to execute the suggested tool calls
    for (const funcCall of call) {
      const { name, args } = funcCall;
      console.log(`gemini wants to call tool: ${name} with args:`, args);

      // --- This is where you'd actually interact with your *real* MCP servers ---
      // For demonstration, we'll simulate the MCP server responses
      let toolResult;
      if (name === 'search_local_businesses') {
        const { business_type, location, time, date } = args;
        // Hypothetical call to your 'search' MCP server
        // Example: const searchMcpServerResponse = await axios.post('YOUR_SEARCH_MCP_SERVER_URL', { type: business_type, loc: location, time, date });
        toolResult = {
          success: true,
          data: {
            message: `simulating search for: ${business_type} near ${location} for ${date} at ${time}. found 'barber shop pro' (555-1234) and 'fresh fades' (555-5678).`,
            businesses: [
                { name: 'barber shop pro', phone: '555-1234' },
                { name: 'fresh fades', phone: '555-5678' }
            ]
          }
        };
        mcpActionResponse.push(`🤖 search for ${business_type} successful: ${toolResult.data.message}`);

      } else if (name === 'initiate_phone_call') {
        const { target_name, phone_number, context } = args;
        // Hypothetical call to your 'call' MCP server
        // Example: const callMcpServerResponse = await axios.post('YOUR_CALL_MCP_SERVER_URL', { name: target_name, number: phone_number, purpose: context });
        toolResult = {
          success: true,
          data: {
            message: `attempting to call ${target_name} at ${phone_number} to ${context}. you'll hear the dial tone any second now, probably.`,
            callStatus: 'ringing'
          }
        };
        mcpActionResponse.push(`📞 call to ${target_name} initiated: ${toolResult.data.message}`);

      } else {
        mcpActionResponse.push(`🚨 unknown tool requested by gemini: ${name}. that's kinda sus.`);
      }
    }

    // Step 3: Respond to the frontend with the results of the MCP actions
    return res.status(200).json({ message: mcpActionResponse.join('\n') });

  } catch (error) {
    console.error('error in api route:', error);
    res.status(500).json({ message: `yo, something went sideways. check the server logs, bucko. details: ${error.message}` });
  }
}