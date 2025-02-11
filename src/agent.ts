import { addMessages, getMessages, saveToolResponse } from './memory'
import { runApprovalCheck, runLLM } from './llm'
import { showLoader, logMessage } from './ui'
import { runTool } from './toolRunner'
import type { AIMessage } from '../types'
import { generateImageToolDefinition } from './tools/generateImage'

const handleImageApprovalFlow = async (history: AIMessage[], userMessage: string) => {
  const lastMessage  = history.at(-1);
  const toolcall = lastMessage?.tool_calls?.[0];
  if (!toolcall || 
    toolcall.function.name !== generateImageToolDefinition.name
  ) {
    return false;
  }


  const loader = showLoader('loading...');
  const approved = await runApprovalCheck(userMessage);

  if (approved){
    loader.update(`executing tool: ${toolcall.function.name}`)
    
    const toolResponse = await runTool(toolcall, userMessage)

    loader.update(`done: ${toolcall.function.name}`)
    await saveToolResponse(toolcall.id, toolResponse)
  } else { 
    await saveToolResponse(toolcall.id, 'User did not approve the image.');
  }

  loader.stop(); 
  return true;
}

export const runAgent = async ({
  userMessage,
  tools,
}: {
  userMessage: string
  tools: any[]
}) => {
  const history = await getMessages()
  const isApproval = await handleImageApprovalFlow(history, userMessage);

  if (!isApproval) {
    await addMessages([{ role: 'user', content: userMessage }])
  }
  const loader = showLoader('🤔')

  while (true) {
    const history = await getMessages()
    const response = await runLLM({ messages: history, tools })

    await addMessages([response])

    if (response.content) {
      loader.stop()
      logMessage(response)
      return getMessages()
    }

    if (response.tool_calls) {
      const toolCall = response.tool_calls[0]
      logMessage(response)
      loader.update(`executing: ${toolCall.function.name}`)

      if (toolCall.function.name === generateImageToolDefinition.name) {
        loader.update(`waiting for approval...`)
        loader.stop()
        return getMessages()
      }

      const toolResponse = await runTool(toolCall, userMessage)
      await saveToolResponse(toolCall.id, toolResponse)
      loader.update(`done: ${toolCall.function.name}`)
    }
  }
}
