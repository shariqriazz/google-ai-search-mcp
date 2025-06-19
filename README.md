# Google AI Search MCP

This project implements a Model Context Protocol (MCP) server that provides a comprehensive suite of Google AI-powered search and documentation tools specifically designed to help AI coders overcome LLM knowledge gaps and information limitations.


## Features

*   Provides access to Google AI models (Vertex AI and Gemini API) via specialized MCP tools.
*   Focuses on real-time information retrieval and documentation-based analysis.
*   Supports web search grounding for current information that LLMs lack.
*   Configurable model ID, temperature, streaming behavior, max output tokens, and retry settings via environment variables.
*   Uses streaming API by default for potentially better responsiveness.
*   Includes basic retry logic for transient API errors.
*   Minimal safety filters applied (`BLOCK_NONE`) to reduce potential blocking (use with caution).

## Tools Provided

### Core Search & Documentation Tools
*   `answer_query_websearch`: Developer-focused natural language queries with automatic technical detection, enhanced search methodology, and comprehensive code formatting using Google AI with real-time search results.
*   `explain_topic_with_docs`: Streamlined technical explanations with improved debugging scenarios, synthesizing information from official documentation with reduced verbosity and enhanced troubleshooting guidance.
*   `get_doc_snippets`: Enhanced code snippet retrieval with progressive complexity examples, advanced search patterns, version-specific targeting, and comprehensive context for technical queries from official documentation.
*   `generate_project_guidelines`: Generates comprehensive structured project guidelines documents based on specified technologies, using web search for current best practices and industry standards.

### Advanced Analysis Tools
*   `code_analysis_with_docs`: Evidence-based code analysis with standardized citations, severity categorization, and actionable recommendations by comparing code against official documentation best practices.
*   `technical_comparison`: Enhanced technology comparison with quantitative benchmarks, performance metrics, market adoption statistics, and detailed evidence-based analysis across multiple criteria.
*   `architecture_pattern_recommendation`: Comprehensive architecture guidance with performance metrics, quantitative benefits, detailed implementation roadmaps, and evidence-based pattern recommendations for specific use cases.

*(Note: Input/output schemas for each tool are defined in their respective files within `src/tools/` and exposed via the MCP server.)*

## Prerequisites

*   Node.js (v18+)
*   Bun (`npm install -g bun`)
*   Google Cloud Project with Billing enabled (if using Vertex AI).
*   Vertex AI API enabled in the GCP project (if using Vertex AI).
*   Google Cloud Authentication configured in your environment (Application Default Credentials via `gcloud auth application-default login` is recommended, or a Service Account Key) OR Gemini API key.

## Setup & Installation

1.  **Clone/Place Project:** Ensure the project files are in your desired location.
2.  **Install Dependencies:**
    ```bash
    bun install
    ```
3.  **Configure Environment:**
    *   Create a `.env` file in the project root (copy `.env.example`).
    *   Set the required and optional environment variables as described in `.env.example`.
        *   Set `AI_PROVIDER` to either `"vertex"` or `"gemini"`.
        *   If `AI_PROVIDER="vertex"`, `GOOGLE_CLOUD_PROJECT` is required.
        *   If `AI_PROVIDER="gemini"`, `GEMINI_API_KEY` is required.
4.  **Build the Server:**
    ```bash
    bun run build
    ```
    This compiles the TypeScript code to `build/index.js`.

## Usage (Standalone / NPX)

Once published to npm, you can run this server directly using `npx`:

```bash
# Ensure required environment variables are set (e.g., GOOGLE_CLOUD_PROJECT or GEMINI_API_KEY)
bunx google-ai-search-mcp
```

Alternatively, install it globally:

```bash
bun install -g google-ai-search-mcp
# Then run:
google-ai-search-mcp
```

**Note:** Running standalone requires setting necessary environment variables (like `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `GEMINI_API_KEY`, authentication credentials if not using ADC) in your shell environment before executing the command.

## Running with Cline

1.  **Configure MCP Settings:** Add/update the configuration in your Cline MCP settings file (e.g., `.roo/mcp.json`). You have two primary ways to configure the command:

    **Option A: Using Node (Direct Path - Recommended for Development)**

    This method uses `node` to run the compiled script directly. It's useful during development when you have the code cloned locally.

    ```json
    {
      "mcpServers": {
        "google-ai-search-mcp": {
          "command": "node",
          "args": [
            "/full/path/to/your/google-ai-search-mcp/build/index.js" // Use absolute path or ensure it's relative to where Cline runs node
          ],
          "env": {
            // --- General AI Configuration ---
            "AI_PROVIDER": "vertex", // "vertex" or "gemini"
            // --- Required (Conditional) ---
            "GOOGLE_CLOUD_PROJECT": "YOUR_GCP_PROJECT_ID", // Required if AI_PROVIDER="vertex"
            // "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY", // Required if AI_PROVIDER="gemini"
            // --- Optional Model Selection ---
            "VERTEX_MODEL_ID": "gemini-2.5-pro", // If AI_PROVIDER="vertex" (Example override)
            "GEMINI_MODEL_ID": "gemini-2.5-pro", // If AI_PROVIDER="gemini"
            // --- Optional AI Parameters ---
            "GOOGLE_CLOUD_LOCATION": "us-central1", // Specific to Vertex AI
            "AI_TEMPERATURE": "0.0",
            "AI_USE_STREAMING": "true",
            "AI_MAX_OUTPUT_TOKENS": "65536", // Default from .env.example
            "AI_MAX_RETRIES": "3",
            "AI_RETRY_DELAY_MS": "1000",
            // --- Optional Vertex Authentication ---
            // "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/your/service-account-key.json" // If using Service Account Key for Vertex
          },
          "disabled": false,
          "alwaysAllow": [
             // Add tool names here if you don't want confirmation prompts
             // e.g., "answer_query_websearch"
          ],
          "timeout": 3600 // Optional: Timeout in seconds
        }
        // Add other servers here...
      }
    }
    ```
    *   **Important:** Ensure the `args` path points correctly to the `build/index.js` file. Using an absolute path might be more reliable.

    **Option B: Using NPX (Requires Package Published to npm)**

    This method uses `npx` to automatically download and run the server package from the npm registry. This is convenient if you don't want to clone the repository.

    ```json
    {
      "mcpServers": {
        "google-ai-search-mcp": {
          "command": "bunx", // Use bunx
          "args": [
            "-y", // Auto-confirm installation
            "google-ai-search-mcp" // The npm package name
          ],
          "env": {
            // --- General AI Configuration ---
            "AI_PROVIDER": "vertex", // "vertex" or "gemini"
            // --- Required (Conditional) ---
            "GOOGLE_CLOUD_PROJECT": "YOUR_GCP_PROJECT_ID", // Required if AI_PROVIDER="vertex"
            // "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY", // Required if AI_PROVIDER="gemini"
            // --- Optional Model Selection ---
            "VERTEX_MODEL_ID": "gemini-2.5-pro", // If AI_PROVIDER="vertex" (Example override)
            "GEMINI_MODEL_ID": "gemini-2.5-pro", // If AI_PROVIDER="gemini"
            // --- Optional AI Parameters ---
            "GOOGLE_CLOUD_LOCATION": "us-central1", // Specific to Vertex AI
            "AI_TEMPERATURE": "0.0",
            "AI_USE_STREAMING": "true",
            "AI_MAX_OUTPUT_TOKENS": "65536", // Default from .env.example
            "AI_MAX_RETRIES": "3",
            "AI_RETRY_DELAY_MS": "1000",
            // --- Optional Vertex Authentication ---
            // "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/your/service-account-key.json" // If using Service Account Key for Vertex
          },
          "disabled": false,
          "alwaysAllow": [
             // Add tool names here if you don't want confirmation prompts
             // e.g., "answer_query_websearch"
          ],
          "timeout": 3600 // Optional: Timeout in seconds
        }
        // Add other servers here...
      }
    }
    ```
    *   Ensure the environment variables in the `env` block are correctly set, either matching `.env` or explicitly defined here. Remove comments from the actual JSON file.

2.  **Restart/Reload Cline:** Cline should detect the configuration change and start the server.

3.  **Use Tools:** You can now use the comprehensive list of Google AI-powered search and documentation tools via Cline.

## Development

*   **Watch Mode:** `bun run watch`
*   **Build:** `bun run build`
*   **Inspector:** `bun run inspector`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
