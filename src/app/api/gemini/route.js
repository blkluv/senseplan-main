// pages/api/mcp-action.js
import { GoogleGenAI, FunctionCallingConfigMode , mcpToTool } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const API_KEY = process.env.GEMINI_API_KEY; // Make sure this is set in your .env.local
const brightdata_api_key = process.env.BRIGHTDATA_API_KEY;
const ai = new GoogleGenAI({apiKey: API_KEY});

// The system prompt text from above


export async function POST(req) {
  const { user_info, query } = await req.json();

  if (!user_info || !query) {
    return new Response(JSON.stringify({ message: 'empty prompt? :(' }), { status: 400 });
  }

  let brightdata_client;
  try {
    const searchServer = new StdioClientTransport({
      command: "npx",
      args: ["-y", "@brightdata/mcp"],
      env: {
        "API_TOKEN": brightdata_api_key
      }
    });
    brightdata_client = new Client({ name: "brightdata-search", version: "1.0.0" });
    await brightdata_client.connect(searchServer);

    const tools = [mcpToTool(brightdata_client)];
    const systemPrompt = `You are Senseplan, an automated scheduling and task-execution assistant. Your purpose is to understand user requests and directly execute actions by interfacing with external tools.

You have access to the following tools:
- A 'brightdata-search' tool to find information.
- A 'make_call' tool to initiate phone calls to businesses or services.

Based on the user's prompt, determine the necessary actions, and use the provided tools to accomplish the goal. 
For example, if a user asks to 'Find a barber near (location) and book an appointment for me', you should first use the 'search' tool to find barbers and their contact information, and then use the 'make_call' tool to contact one to schedule an appointment.

User's context: <user_info>${user_info}</user_info>
User's request: <user_request>${query}</user_request>

Your final output MUST be a JSON object with the following structure. do not include markdown formatting such as backticks "\`\`\`" in your response:
{
  "business_name": "string",
  "business_address": "string",
  "notes": "string",
  "phone_number": "string" // 11-digit format, +1 by default
}
`;

    // Await the model call!
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
      config: { tools }
    });
    console.debug(result.text);
    // Use result.response.text() if available
    try {
      const parsedResult = JSON.parse(result.text);
      return new Response(JSON.stringify(parsedResult), { status: 200 });
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      return new Response(JSON.stringify({ message: `AI response was not valid JSON: ${result.text}` }), { status: 500 });
    }

  } catch (error) {
    console.error('error in api route:', error);
    return new Response(JSON.stringify({ message: `yo, something went sideways. check the server logs, bucko. details: ${error.message}` }), { status: 500 });
  } finally {
    if (brightdata_client) {
      await brightdata_client.close();
    }
  }
}