import { GoogleGenAI } from '@google/genai';

// Initialize the Google GenAI client
// In a Vite React application, we use import.meta.env to access environment variables.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Create a singleton instance if the API key is available
const client = apiKey ? new GoogleGenAI({ apiKey }) : null;

if (!client) {
  console.warn("VITE_GEMINI_API_KEY is not defined in your environment variables. AI features may not work.");
}

/**
 * Generates an AI response stream based on the provided input.
 * 
 * @param {string} input - The text input for the AI to process.
 * @param {function(string)} onChunk - Callback triggered when successive text chunks arrive.
 */
export const generateContentStream = async (input, onChunk) => {
  if (!client) {
    throw new Error("AI Client not initialized. Missing API key.");
  }

  const model = "gemini-3-flash-preview";

  // Using the exact configuration requested
  const responseStream = await client.models.generateContentStream({
    model: model,
    contents: [
      {
        role: "user",
        parts: [{ text: input }]
      }
    ],
    config: {
      thinkingConfig: {
        thinkingLevel: "HIGH"
      }
    }
  });

  // Loop over the stream chunks and execute the callback matching the Java for-loop logic
  for await (const chunk of responseStream) {
    if (chunk.text && onChunk) {
      onChunk(chunk.text);
    }
  }
};
