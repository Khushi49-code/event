// app/api/event-agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, FunctionDeclaration } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are EventFlux's event-creation assistant. Your job is to chat with the user, figure out what event they want to create, and gather all required details through natural conversation.

Required fields:
- eventName (string)
- eventType (one of: Wedding, Anniversary, Birthday, Corporate, BNI Event, Conference, Workshop, Party)
- eventDate (ISO 8601 datetime, e.g. "2026-08-20T18:00")
- venue (string)
- address (string)
- hostNames (string)

Optional:
- coupleNames (only relevant for Wedding)
- description (string)
- functions: an array of {name, date, time, venue}

Wedding-specific behavior:
- If eventType is "Wedding", proactively ask the user whether they'd like to add the individual functions — Haldi, Sangeet, Mehendi, Fera (Wedding ceremony), Reception, or any others — even if the user hasn't mentioned any yet. Don't wait for them to bring it up.
- Ask this once, after you already know it's a Wedding (you don't need eventDate/venue/address confirmed first). For example: "Would you like to add details for the individual functions too — like Haldi, Sangeet, Fera, Reception? If yes, tell me the date, time, and venue for each one you want."
- If they say yes, collect each function's name, date, time, and venue — a couple at a time, not all in one giant question. If a function's venue/time is the same as the main event, that's fine, just confirm it's the same.
- If they say no / they only want the main event, don't push further — proceed with just the required fields.
- For non-wedding events, don't ask about functions at all.

Rules:
- Ask for missing required fields conversationally, one or two at a time — don't interrogate with a long list.
- If the user gives a relative date/time (e.g. "next Saturday evening"), ask them to confirm the exact date, since you must produce a precise ISO datetime.
- Keep your questions short and friendly.
- Once you have ALL required fields (and, for weddings, once the functions question has been asked and resolved — either filled in or declined), call the create_event function with everything you've gathered. Do not ask for confirmation first — call it as soon as everything needed is complete.
- If the user's message is unrelated to creating an event, gently steer them back.
- Respond in whatever language/style the user writes in (English, Gujarati, or Hinglish).`;

// Explicitly typed as FunctionDeclaration so each nested `{ type: SchemaType.X }`
// object is checked against the library's discriminated Schema union
// (StringSchema | ObjectSchema | ArraySchema | ...) using its contextual
// type, instead of being widened to the bare `SchemaType` enum. Without this
// annotation, TS can't tell a StringSchema apart from an ObjectSchema and
// wrongly demands a `properties` field on every entry.
const CREATE_EVENT_FUNCTION: FunctionDeclaration = {
  name: 'create_event',
  description:
    'Call this once all required event details have been gathered from the user. This actually creates the event.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      eventName: { type: SchemaType.STRING },
      eventType: {
        type: SchemaType.STRING,
        format: 'enum',
        enum: ['Wedding', 'Anniversary', 'Birthday', 'Corporate', 'BNI Event', 'Conference', 'Workshop', 'Party'],
      },
      eventDate: { type: SchemaType.STRING, description: 'ISO 8601 datetime, e.g. 2026-08-20T18:00' },
      venue: { type: SchemaType.STRING },
      address: { type: SchemaType.STRING },
      hostNames: { type: SchemaType.STRING },
      coupleNames: { type: SchemaType.STRING },
      description: { type: SchemaType.STRING },
      functions: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            date: { type: SchemaType.STRING },
            time: { type: SchemaType.STRING },
            venue: { type: SchemaType.STRING },
          },
          required: ['name'],
        },
      },
    },
    required: ['eventName', 'eventType', 'eventDate', 'venue', 'address', 'hostNames'],
  },
};

// Our chat history is stored as { role: 'user' | 'assistant', content: string }.
// Gemini expects { role: 'user' | 'model', parts: [{ text }] } and the *last*
// message sent separately via sendMessage — everything before it is "history".
function toGeminiHistory(messages: { role: string; content: string }[]) {
  return messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

// Try the primary model first; if it's overloaded (503) or rate-limited (429),
// retry with backoff, then fall back to a secondary model rather than
// failing the whole request.
const MODEL_CANDIDATES = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-flash'];

function isRetryableError(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  const message = String(err?.message || '');
  return status === 503 || status === 429 || /503|overloaded|high demand|429/i.test(message);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithFallback(
  history: { role: string; parts: { text: string }[] }[],
  lastMessageContent: string
) {
  let lastError: any = null;

  for (const modelName of MODEL_CANDIDATES) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: [CREATE_EVENT_FUNCTION] }],
    });

    // Up to 3 attempts per model with exponential backoff (500ms, 1500ms).
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(lastMessageContent);
        return result.response;
      } catch (err: any) {
        lastError = err;
        if (!isRetryableError(err)) {
          // Non-retryable error (bad request, auth, etc.) — stop immediately.
          throw err;
        }
        if (attempt < maxAttempts - 1) {
          await sleep(500 * Math.pow(3, attempt)); // 500ms, then 1500ms
        }
      }
    }
    // Exhausted retries on this model — move to the next candidate model.
  }

  throw lastError || new Error('All model candidates failed.');
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not set on the server. Add it to .env.local and restart the dev server.' },
        { status: 500 }
      );
    }

    const history = toGeminiHistory(messages);
    const lastMessage = messages[messages.length - 1];

    const response = await sendWithFallback(history, lastMessage.content);

    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      return NextResponse.json({
        type: 'ready',
        eventData: call.args,
      });
    }

    const text = response.text() || "Sorry, I didn't catch that — could you say that again?";

    return NextResponse.json({
      type: 'message',
      text,
    });
  } catch (error: any) {
    console.error('event-agent API error:', error);

    const isRetryable = isRetryableError(error);
    return NextResponse.json(
      {
        error: isRetryable
          ? 'The assistant is experiencing high demand right now. Please try again in a moment.'
          : error?.message || 'Something went wrong talking to the assistant.',
      },
      { status: isRetryable ? 503 : 500 }
    );
  }
}