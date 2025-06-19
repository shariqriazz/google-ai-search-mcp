#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the current working directory (where npx/node is run)
// This ensures it works correctly when run via npx outside the project dir
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
// Removed vertexai Content import as CombinedContent covers it
import { z } from "zod"; // Needed for schema parsing within handler

import { getAIConfig } from './config.js';
// Import CombinedContent along with callGenerativeAI
import { callGenerativeAI, CombinedContent } from './google_ai_client.js';
import { allTools, toolMap } from './tools/index.js';
import { buildInitialContent, getToolsForApi } from './tools/tool_definition.js';

// --- MCP Server Setup ---
const server = new Server(
  { name: "google-ai-search-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// --- Tool Definitions Handler ---
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Use new config function
  const config = getAIConfig();
  return {
      tools: allTools.map(t => ({
          name: t.name,
          // Inject model ID dynamically from new config structure
          description: t.description.replace("${modelId}", config.modelId),
          inputSchema: t.inputSchema
      }))
  };
});

// --- Tool Call Handler ---
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments ?? {};

  const toolDefinition = toolMap.get(toolName);
  if (!toolDefinition) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
  }

  try {
    // --- Generic AI Tool Logic ---
    const config = getAIConfig(); // Use renamed config function
    if (!toolDefinition.buildPrompt) {
      throw new McpError(ErrorCode.MethodNotFound, `Tool ${toolName} is missing required buildPrompt logic.`);
    }
    const { systemInstructionText, userQueryText, useWebSearch, enableFunctionCalling } = toolDefinition.buildPrompt(args, config.modelId);
    const initialContents = buildInitialContent(systemInstructionText, userQueryText) as CombinedContent[]; // Cast
    const toolsForApi = getToolsForApi(enableFunctionCalling, useWebSearch);

    // Call the unified AI function
    const responseText = await callGenerativeAI(
        initialContents,
        toolsForApi
        // Config is implicitly used by callGenerativeAI now
    );

    return {
      content: [{ type: "text", text: responseText }],
    };

  } catch (error) {
     // Centralized error handling
    if (error instanceof z.ZodError) {
        throw new McpError(ErrorCode.InvalidParams, `Invalid arguments for ${toolName}: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    } else if (error instanceof McpError) {
      throw error;
    } else if (error instanceof Error && error.message.includes('ENOENT')) {
         throw new McpError(ErrorCode.InvalidParams, `Path not found for tool ${toolName}: ${error.message}`);
    } else {
      console.error(`[${new Date().toISOString()}] Unexpected error in tool handler (${toolName}):`, error);
      throw new McpError(ErrorCode.InternalError, `Unexpected server error during ${toolName}: ${(error as Error).message || "Unknown"}`);
    }
  }
});

// --- Server Start ---
async function main() {
  const transport = new StdioServerTransport();
  console.error(`[${new Date().toISOString()}] google-ai-search-mcp connecting via stdio...`);
  await server.connect(transport);
  console.error(`[${new Date().toISOString()}] google-ai-search-mcp connected.`);
}

main().catch((error) => {
  console.error(`[${new Date().toISOString()}] Server failed to start:`, error);
  process.exit(1);
});

// --- Graceful Shutdown ---
const shutdown = async (signal: string) => {
    console.error(`[${new Date().toISOString()}] Received ${signal}. Shutting down server...`);
    try {
      await server.close();
      console.error(`[${new Date().toISOString()}] Server shut down gracefully.`);
      process.exit(0);
    } catch (shutdownError) {
      console.error(`[${new Date().toISOString()}] Error during server shutdown:`, shutdownError);
      process.exit(1);
    }
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
