import { runLLM } from "../../src/llm";
import { redditToolDefinition } from "../../src/tools/reddit";
import { runEval } from "../evalTools";
import { ToolCallMatch } from "../scorers";
const createToolCallMessage = (toolName: string) => ({
  role: 'assistant',
  tool_calls: [
    {
      function: {
        name: toolName,
      }
    }
  ]
})

runEval('reddit', {
  task: (input) =>
    runLLM({
      messages: [
        {
          role: 'user',
          content: input
        }
      ],
      tools: [redditToolDefinition]
    }),
  data: [
    {
      input: 'Find me something interesting on reddit',
      expected: createToolCallMessage(redditToolDefinition.name)
    },
    {
      input: 'Hii',
      expected: createToolCallMessage(redditToolDefinition.name)
    }
  ],
  scorers: [ToolCallMatch]
})