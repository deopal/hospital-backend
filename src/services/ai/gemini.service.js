/**
 * Gemini AI Service
 * Handles interactions with Google's Gemini AI for symptom analysis
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// System prompt for the symptom checker
const SYSTEM_PROMPT = `You are a helpful medical assistant AI for HealOrbit, a healthcare platform. Your role is to:

1. Ask clarifying questions about the patient's symptoms (one or two at a time)
2. Gather information about symptom duration, severity, and any related factors
3. After collecting enough information (usually 3-5 exchanges), provide:
   - A list of possible conditions that match the symptoms (be clear these are possibilities, not diagnoses)
   - A recommendation for which type of specialist to consult
   - An assessment of urgency (low, medium, high)

IMPORTANT GUIDELINES:
- Never provide a definitive diagnosis - always recommend consulting a healthcare professional
- Be empathetic and reassuring in your responses
- If symptoms suggest an emergency (chest pain, difficulty breathing, severe bleeding, etc.), immediately recommend seeking emergency care
- Keep responses concise but informative
- Ask about:
  * Main symptoms and their duration
  * Severity (1-10 scale)
  * Any triggers or patterns
  * Existing medical conditions
  * Current medications
  * Recent changes in lifestyle

When you have gathered enough information, include a JSON block at the end of your response in this format:
\`\`\`json
{
  "suggestedConditions": ["condition1", "condition2"],
  "recommendedSpecialist": "Specialist type",
  "severity": "low|medium|high",
  "symptoms": ["symptom1", "symptom2"],
  "isComplete": true
}
\`\`\`

Only include the JSON block when you have enough information to make recommendations.`;

/**
 * Check if Gemini API is configured
 */
export const isGeminiConfigured = () => {
  return !!GEMINI_API_KEY;
};

/**
 * Build conversation history for Gemini
 */
const buildConversationHistory = (conversation) => {
  const contents = [];

  // Add system prompt as first user message
  contents.push({
    role: 'user',
    parts: [{ text: `System Instructions: ${SYSTEM_PROMPT}\n\nPlease acknowledge and begin.` }]
  });

  contents.push({
    role: 'model',
    parts: [{ text: 'I understand. I\'m here to help you understand your symptoms better. I\'ll ask you some questions and then suggest what type of specialist might be best for you to consult. Please remember that I cannot diagnose conditions - only a healthcare professional can do that after a proper examination.\n\nWhat symptoms are you experiencing today?' }]
  });

  // Add conversation history
  for (const msg of conversation) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  }

  return contents;
};

/**
 * Parse analysis from AI response
 */
const parseAnalysis = (response) => {
  const analysis = {
    suggestedConditions: [],
    recommendedSpecialist: null,
    severity: null,
    symptoms: [],
    isComplete: false
  };

  // Try to extract JSON from response
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.suggestedConditions) analysis.suggestedConditions = parsed.suggestedConditions;
      if (parsed.recommendedSpecialist) analysis.recommendedSpecialist = parsed.recommendedSpecialist;
      if (parsed.severity) analysis.severity = parsed.severity;
      if (parsed.symptoms) analysis.symptoms = parsed.symptoms;
      if (parsed.isComplete) analysis.isComplete = parsed.isComplete;
    } catch (e) {
      console.error('[Gemini] Failed to parse analysis JSON:', e);
    }
  }

  return analysis;
};

/**
 * Clean response text (remove JSON block for display)
 */
const cleanResponse = (response) => {
  return response.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
};

/**
 * Send message to Gemini and get response
 */
export const chat = async (conversation, userMessage) => {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY environment variable.');
  }

  // Build conversation with new message
  const conversationWithNewMessage = [
    ...conversation,
    { role: 'user', content: userMessage }
  ];

  const contents = buildConversationHistory(conversationWithNewMessage);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Gemini] API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to get response from Gemini');
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    const analysis = parseAnalysis(aiResponse);
    const cleanedResponse = cleanResponse(aiResponse);

    return {
      response: cleanedResponse,
      analysis
    };
  } catch (error) {
    console.error('[Gemini] Chat error:', error);
    throw error;
  }
};

/**
 * Get initial greeting message
 */
export const getInitialMessage = () => {
  return `Hello! I'm your AI health assistant. I'll help you understand your symptoms better and suggest what type of specialist might be best for you to consult.

Please note that I cannot provide medical diagnoses - only a healthcare professional can do that after a proper examination.

What symptoms are you experiencing today?`;
};

export default {
  isGeminiConfigured,
  chat,
  getInitialMessage
};
