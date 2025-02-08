import { runLLM } from "../../src/llm";
import { generateImageToolDefinition } from "../../src/tools/generateImage";
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

runEval('generateImage', {
  task: (input) =>
    runLLM({
      messages: [
        {
          role: 'user',
          content: input
        }
      ],
      tools: [generateImageToolDefinition]
    }),
  data: [
    {
      input: 'Generate an image of a cat',
      expected: createToolCallMessage(generateImageToolDefinition.name)
    },
    {
      input: 'take a photo of a dog',
      expected: createToolCallMessage(generateImageToolDefinition.name)
    }
  ],
  scorers: [ToolCallMatch]
})