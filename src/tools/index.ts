import { ToolDefinition } from "./tool_definition.js";
import { answerQueryWebsearchTool } from "./answer_query_websearch.js";
import { explainTopicWithDocsTool } from "./explain_topic_with_docs.js";
import { getDocSnippetsTool } from "./get_doc_snippets.js";
import { generateProjectGuidelinesTool } from "./generate_project_guidelines.js";

// Import new research-oriented tools
import { codeAnalysisWithDocsTool } from "./code_analysis_with_docs.js";
import { technicalComparisonTool } from "./technical_comparison.js";
import { architecturePatternRecommendationTool } from "./architecture_pattern_recommendation.js";


export const allTools: ToolDefinition[] = [
    // Query & Generation Tools
    answerQueryWebsearchTool,
    explainTopicWithDocsTool,
    getDocSnippetsTool,
    generateProjectGuidelinesTool,
    codeAnalysisWithDocsTool,
    technicalComparisonTool,
    architecturePatternRecommendationTool,
];

// Create a map for easy lookup
export const toolMap = new Map<string, ToolDefinition>(
    allTools.map(tool => [tool.name, tool])
);