// ai-engine.ts - AI conversation engine for BizChatAssist
import axios from 'axios';

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Default model - can be changed to any model supported by OpenRouter
const DEFAULT_MODEL = process.env.AI_MODEL || 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free';

// List of available models for reference
const AVAILABLE_MODELS = [
  'anthropic/claude-3-opus',
  'anthropic/claude-3-sonnet',
  'anthropic/claude-3-haiku',
  'openai/gpt-4-turbo',
  'openai/gpt-4o',
  'google/gemini-pro',
  'mistralai/mistral-large',
  'meta-llama/llama-3-70b-instruct',
  'nvidia/llama-3.1-nemotron-ultra-253b-v1:free'
  // Add others as needed
];

// Message history cache - in production, this would be stored in a database
const conversationCache = new Map<string, Array<{ role: string; content: string }>>();

interface AIResponseOptions {
  businessId: string;
  conversationId: string;
  message: string;
  customerContext?: any;
  businessContext?: any;
}

export async function getAIResponse({
  businessId,
  conversationId,
  message,
  customerContext,
  businessContext
}: AIResponseOptions) {
  try {
    // Create a unique key for this conversation
    const cacheKey = `${businessId}:${conversationId}`;
    
    // Get or initialize conversation history
    if (!conversationCache.has(cacheKey)) {
      conversationCache.set(cacheKey, []);
    }
    const history = conversationCache.get(cacheKey) || [];
    
    // Add system prompt with business information if it's a new conversation
    if (history.length === 0 && businessContext) {
      const systemPrompt = createSystemPrompt(businessContext);
      history.push({ role: 'system', content: systemPrompt });
    }
    
    // Add the user's message to history
    history.push({ role: 'user', content: message });
    
    // Limit conversation history to last 10 messages to manage context length
    const recentHistory = history.slice(-10);
    
    // Call OpenRouter API
    if (!OPENROUTER_API_KEY) {
      console.warn('OpenRouter API key not found. Using fallback response.');
      return createFallbackResponse(message);
    }
    
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: DEFAULT_MODEL,
        messages: recentHistory,
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://BizChatAssist.com',  // Required by OpenRouter
          'X-Title': 'BizChatAssist'                   // Helps with API tracking
        }
      }
    );
    
    const aiMessage = response.data.choices[0].message.content;
    
    // Add the AI response to history
    history.push({ role: 'assistant', content: aiMessage });
    conversationCache.set(cacheKey, history);
    
    return {
      reply: aiMessage,
      conversationId,
      messageHistory: history.length
    };
  } catch (error: any) {
    console.error('AI Engine error:', error.message);
    return createFallbackResponse(message);
  }
}

// Create system prompt with business context
function createSystemPrompt(businessContext: any) {
  return `You are an AI assistant for ${businessContext.name}, a business in the ${businessContext.type} industry. 
Your job is to help customers with their inquiries about products, services, and appointments.

Business information:
- Name: ${businessContext.name}
- Type: ${businessContext.type}
- Description: ${businessContext.description || 'Not provided'}
- Business hours: ${businessContext.businessHours || 'Not provided'}

Your responses should be helpful, concise, and in a tone that matches the business. For appointment requests, collect necessary information like date, time, service type, and contact details. For product inquiries, provide accurate information about availability, features, and pricing.`;
}

// Fallback response when OpenAI API is unavailable
function createFallbackResponse(message: string) {
  return {
    reply: `Thank you for your message: "${message}". Our AI is currently being updated. A team member will respond to you shortly.`,
    fallback: true
  };
}

// Clear conversation history - used for testing or when conversation ends
export function clearConversation(businessId: string, conversationId: string) {
  const cacheKey = `${businessId}:${conversationId}`;
  conversationCache.delete(cacheKey);
  return { success: true };
}
