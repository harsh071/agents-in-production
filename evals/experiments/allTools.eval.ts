import { runLLM } from "../../src/llm";
import { dadJokeToolDefinition } from "../../src/tools/dadJoke";
import { generateImageToolDefinition } from "../../src/tools/generateImage";
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

const allTools = [
  dadJokeToolDefinition,
  generateImageToolDefinition,
  redditToolDefinition,
]

runEval('allTools', {
  task: (input) =>
    runLLM({
      messages: [
        {
          role: 'user',
          content: input
        }
      ],
      tools: allTools
    }),
  data: [
    {
      input: 'Tell me a funny dad joke',
      expected: createToolCallMessage(dadJokeToolDefinition.name)
    },
    {
      input: 'Take a photo of a cat',
      expected: createToolCallMessage(generateImageToolDefinition.name)
    },
    {
      input: 'Find me something interesting on reddit',
      expected: createToolCallMessage(redditToolDefinition.name)
    },
  ],
  scorers: [ToolCallMatch]
})