import { runLLM } from "../../src/llm";
import { dadJokeToolDefinition } from "../../src/tools/dadJoke";
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

runEval('dadjoke', {
  task: (input) =>
    runLLM({
      messages: [
        {
          role: 'user',
          content: input
        }
      ],
      tools: [dadJokeToolDefinition]
    }),
  data: [
    {
      input: 'Tell me a funny dad joke',
      expected: createToolCallMessage(dadJokeToolDefinition.name)
    },
  ],
  scorers: [ToolCallMatch]
})