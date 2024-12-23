// src/services/claude.ts
import { Anthropic } from '@anthropic-ai/sdk'

export type ClaudeModel =
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

export const sendMessage = async (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  model: ClaudeModel
) => {
  try {
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 1000,
      messages: messages,
    })

    // Handle different types of content blocks
    const textContent = response.content.find((block) => block.type === 'text')
    if (textContent && 'text' in textContent) {
      return textContent.text
    }

    throw new Error('No text content found in response')
  } catch (error) {
    console.error('Error sending message to Claude:', error)
    throw error
  }
}
