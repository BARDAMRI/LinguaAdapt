import { GoogleGenerativeAI } from '@google/generative-ai';
import { basicSentenceMatch } from './exerciseService';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

const EVAL_MODEL = 'gemini-1.5-flash';
const CHAT_MODEL = 'gemini-1.5-flash';

export type SentenceEvaluation = {
  isCorrect: boolean;
  feedback: string;
  suggestion: string;
};

function fallbackEvaluate(
  userSentence: string,
  targetSentence: string,
): SentenceEvaluation {
  const ok = basicSentenceMatch(userSentence, targetSentence);
  return {
    isCorrect: ok,
    feedback: ok
      ? 'המשפט תואם את התשובה הצפויה (בדיקה מקומית — אין חיבור למורה הדיגיטלי).'
      : 'המשפט אינו תואם בדיוק לתשובה הצפויה. השוו למודל למטה או נסו שוב כשהשירות זמין.',
    suggestion: targetSentence,
  };
}

function stripJsonFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseEvaluationJson(raw: string): SentenceEvaluation | null {
  try {
    const cleaned = stripJsonFence(raw);
    const obj = JSON.parse(cleaned) as Record<string, unknown>;
    return {
      isCorrect: Boolean(obj.isCorrect),
      feedback: typeof obj.feedback === 'string' ? obj.feedback : '',
      suggestion: typeof obj.suggestion === 'string' ? obj.suggestion : '',
    };
  } catch {
    return null;
  }
}

/**
 * Uses Gemini 1.5 Flash to evaluate a learner sentence vs. a target.
 * On network errors, quota, or missing key, falls back to basic string matching.
 */
export async function evaluateSentence(
  userSentence: string,
  targetSentence: string,
  context: string,
): Promise<SentenceEvaluation> {
  if (!apiKey) {
    return fallbackEvaluate(userSentence, targetSentence);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: EVAL_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = `You are an expert English-Hebrew teacher. Compare the user's sentence to the target. If there are minor mistakes (grammar, prepositions), explain them kindly in Hebrew. If it's correct but can be improved, suggest a natural alternative. Return the response in a structured JSON: { "isCorrect": boolean, "feedback": string, "suggestion": string }.

Context for the exercise (instructions / prompt):
${context}

Target sentence (model answer):
${targetSentence}

User sentence:
${userSentence}

Respond with JSON only.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseEvaluationJson(text);
    if (parsed) {
      return parsed;
    }
    return fallbackEvaluate(userSentence, targetSentence);
  } catch {
    return fallbackEvaluate(userSentence, targetSentence);
  }
}

export type ChatMessage = { role: 'user' | 'model'; text: string };

/**
 * Short tutor reply in English; difficult words glossed with Hebrew in parentheses.
 */
export async function conversationReply(
  topic: string,
  history: ChatMessage[],
  userMessage: string,
): Promise<{ text: string; usedFallback: boolean }> {
  const canned =
    "I can't reach the AI tutor right now (check your network or EXPO_PUBLIC_GEMINI_API_KEY). Try asking again in a moment. Practice line: Where is gate B? / איפה שער B?";

  if (!apiKey) {
    return { text: canned, usedFallback: true };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

  const historyText = history
    .map(
      (m) =>
        `${m.role === 'user' ? 'Learner' : 'Tutor'}: ${m.text}`,
    )
    .join('\n');

  const prompt = `You are a friendly English teacher helping Hebrew speakers practice conversation.

Scenario topic: "${topic}".
Keep each reply SHORT (2–4 short sentences max), suitable for language learners.
Reply in English only, but add Hebrew glosses in parentheses for harder or rarer English words (not for very basic words).
Be encouraging and natural.

Prior chat:
${historyText}

Learner: ${userMessage}
Tutor:`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (!text) {
      return { text: canned, usedFallback: true };
    }
    return { text, usedFallback: false };
  } catch {
    return { text: canned, usedFallback: true };
  }
}
