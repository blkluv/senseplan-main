import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, mcpToTool } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Arcade } from "@arcadeai/arcadejs";

const API_KEY = process.env.GEMINI_API_KEY;
const brightdata_api_key = process.env.BRIGHTDATA_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const ai = new GoogleGenAI({apiKey: API_KEY});
const arcadeClient = new Arcade(); // Automatically finds the `ARCADE_API_KEY` env variable

type RequestBody = {
  user_info: string;
  query: string;
};

type ResponseData = {
  message?: string;
  business_name?: string;
  business_address?: string;
  notes?: string;
  phone_number?: string;
};

// Arcade tool wrapper function
async function callArcadeTool(toolName: string, toolInput: any, userId: string) {
  try {
    // Execute the tool directly - simplified for now
    const response = await arcadeClient.tools.execute({
      tool_name: toolName,
      inputs: toolInput,
      user_id: userId,
    });

    return response;
  } catch (error) {
    console.error('Arcade tool error:', error);
    return { error: `Failed to execute Arcade tool: ${error}` };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ResponseData>> {
  try {
    const body: RequestBody = await request.json();
    const { user_info, query } = body;

    if (!user_info || !query) {
      return NextResponse.json(
        { message: 'empty prompt? :(' },
        { status: 400 }
      );
    }

    if (!brightdata_api_key) {
      return NextResponse.json(
        { message: 'BRIGHTDATA_API_KEY is not set' },
        { status: 500 }
      );
    }

    let brightdata_client: Client | undefined;
    
    try {
      // Set up BrightData MCP client
      const searchServer = new StdioClientTransport({
        command: "npx",
        args: ["-y", "@brightdata/mcp"],
        env: {
          "API_TOKEN": brightdata_api_key
        }
      });
      
      brightdata_client = new Client({ name: "brightdata-search", version: "1.0.0" });
      await brightdata_client.connect(searchServer);

      // Set up Arcade tool wrapper
      const arcadeToolWrapper: any = {
        type: "function",
        function: {
          name: "arcade_execute_tool",
          description: "Execute an Arcade tool on behalf of the user",
          parameters: {
            type: "object",
            properties: {
              tool_name: { type: "string", description: "The name of the Arcade tool to call" },
              tool_input: { type: "object", description: "JSON object containing the tool's input parameters" },
              user_id: { type: "string", description: "The Arcade user ID for whom to execute the tool" },
            },
            required: ["tool_name", "tool_input", "user_id"],
          },
        },
        call: async ({ tool_name, tool_input, user_id }: { tool_name: string; tool_input: any; user_id: string }) => {
          return await callArcadeTool(tool_name, tool_input, user_id);
        },
      };

      const tools = [mcpToTool(brightdata_client)];
      
      const systemPrompt = `You are Senseplan, an automated scheduling and task-execution assistant. Your purpose is to understand user requests and directly execute actions by interfacing with external tools.

You have access to the following tools:
- A 'brightdata-search' tool to find information.
- A 'arcade_execute_tool' tool to execute Arcade tools.

Based on the user's prompt, determine the necessary actions, and use the provided tools to accomplish the goal. 
For example, if a user asks to 'Find a barber near (location) and book an appointment for me', you should first use the 'search' tool to find barbers and their contact information, and then use the 'make_call' tool to contact one to schedule an appointment.

User's context: <user_info>${user_info}</user_info>
User's request: <user_request>${query}</user_request>

Your final output MUST be a JSON object with the following structure. Do not include markdown formatting such as backticks "\`\`\`" in your response. The "businesses" field should be an array containing up to five businesses, each with the following properties:
{
  "businesses": [
    {
      "business_name": "string",
      "business_address": "string",
      "notes": "string",
      "phone_number": "string" // 11-digit format, +1 by default
    }
    // ...up to 5 businesses
  ]
}
`;

      // Call Gemini AI with tools
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt,
        config: { tools }
      });
      
      const text = result.text;
      console.debug('Gemini response:', text);

      if (text) {
        try {
          const parsedResult = JSON.parse(text);
          return NextResponse.json(parsedResult);
        } catch (parseError) {
          console.error('Error parsing AI response as JSON:', parseError);
          return NextResponse.json(
            { message: `AI response was not valid JSON: ${text}` },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { message: 'AI response was empty.' },
          { status: 500 }
        );
      }

    } finally {
      if (brightdata_client) {
        await brightdata_client.close();
      }
    }

  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { message: `Something went wrong. Details: ${error.message}` },
      { status: 500 }
    );
  }
} 