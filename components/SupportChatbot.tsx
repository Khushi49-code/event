// components/SupportChatbot.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Mail } from 'lucide-react';

interface FAQEntry {
  keywords: string[];
  question: string;
  answer: string;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

const FAQS: FAQEntry[] = [
  {
    keywords: ['create event', 'new event', 'add event', 'how to create'],
    question: 'How do I create a new event?',
    answer:
      'Go to Events → Create Event, fill in the name, type, date, venue and host names, then hit Create. If your event type is "Wedding" you can also add functions like Haldi, Sangeet, Fera and Reception.',
  },
  {
    keywords: ['function', 'haldi', 'sangeet', 'fera', 'reception', 'wedding function'],
    question: 'How do wedding functions work?',
    answer:
      "On a Wedding event you can add multiple functions (Haldi, Sangeet, Fera, Reception, or custom ones), each with its own date, time and venue. Guests can then pick which specific functions they'll attend when they RSVP.",
  },
  {
    keywords: ['rsvp', 'guest response', 'attending', 'confirm guest'],
    question: 'How does RSVP work?',
    answer:
      "Once you generate an invitation card, every guest gets a personal link. They tap Accept/Decline, pick which function(s) they're attending (if there are more than one), and enter their headcount. You can track and update all responses from RSVP Management.",
  },
  {
    keywords: ['invitation', 'invite card', 'generate invitation', 'invitation builder'],
    question: 'How do I create an invitation card?',
    answer:
      'Go to Invitations → Invitation Builder, pick your event, customize the design, colors and text, then click Generate Invitation. Once generated, personal guest links become available on the RSVP page.',
  },
  {
    keywords: ['whatsapp', 'send message', 'send invite'],
    question: 'How do I send invites via WhatsApp?',
    answer:
      'From WhatsApp Automation, select your event, pick the "Invitation" message type, select guests, and hit "Open WhatsApp". Each guest gets a personalized message with their details filled in.',
  },
  {
    keywords: ['reminder', 'follow up', 'remind guest', 'send reminder'],
    question: 'How do I send a reminder message?',
    answer:
      'In WhatsApp Automation, select your event, then choose the "Reminder" message type — it loads a ready-made reminder template with {{event}}, {{date}} and {{venue}} placeholders. Select the guests you want to remind and hit "Open WhatsApp".',
  },
  {
    keywords: ['thank you', 'thankyou', 'thanks message', 'post event', 'after event'],
    question: 'How do I send a thank-you message after the event?',
    answer:
      'In WhatsApp Automation, choose the "Thank You" message type — it loads a template thanking guests for attending. Select the guests and hit "Open WhatsApp" to send it, same as invitations and reminders.',
  },
  {
    keywords: ['plan', 'upgrade', 'purchase', 'billing', 'event limit', 'renew'],
    question: 'How many events can I create, and how do I get more?',
    answer:
      "New accounts get 1 free event. Once you've used it, go to Settings → Billing to purchase additional event credits ($100/event) or renew your plan.",
  },
  {
    keywords: ['accommodation', 'hotel', 'room'],
    question: 'How do I manage guest accommodation?',
    answer:
      'Go to Accommodation to see which guests requested a room (from their RSVP), and assign hotels/room numbers to them.',
  },
  {
    keywords: ['password', 'forgot', 'reset', 'login', 'sign in'],
    question: "I forgot my password / can't log in",
    answer:
      'Use the "Forgot password?" link on the login page to reset it. If your account shows as deactivated, you\'ll need to contact your admin to restore access.',
  },
  {
    keywords: ['deactivat', 'blocked', 'admin block'],
    question: "My account says it's blocked/deactivated",
    answer:
      'This means an admin has deactivated your account. Use the "Contact Admin" button on the login screen, or email admin@eventflux.com, to request it be restored.',
  },
];

const GREETING =
  "Hi! I'm the EventFlux help bot. Ask me something, or tap a question below to get started.";

function findAnswer(userText: string): FAQEntry | null {
  const text = userText.toLowerCase();
  let best: FAQEntry | null = null;
  let bestScore = 0;
  for (const entry of FAQS) {
    const score = entry.keywords.filter((k) => text.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore > 0 ? best : null;
}

export default function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'greeting', sender: 'bot', text: GREETING },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const pushMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const askQuestion = (entry: FAQEntry) => {
    pushMessage({ id: `u-${Date.now()}`, sender: 'user', text: entry.question });
    setTimeout(() => {
      pushMessage({ id: `b-${Date.now()}`, sender: 'bot', text: entry.answer });
    }, 300);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    pushMessage({ id: `u-${Date.now()}`, sender: 'user', text });
    setInput('');

    setTimeout(() => {
      const match = findAnswer(text);
      if (match) {
        pushMessage({ id: `b-${Date.now()}`, sender: 'bot', text: match.answer });
      } else {
        pushMessage({
          id: `b-${Date.now()}`,
          sender: 'bot',
          text:
            "I'm not sure about that one. Try one of the topics below, or email admin@eventflux.com and a real person will help.",
        });
      }
    }, 300);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Chat with us"
          className="fixed bottom-24 right-6 z-50 flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 shadow-lg transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium hidden sm:inline">Chat with us</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-sm h-[70vh] max-h-[520px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium text-sm">Help & Support</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-2 pt-2">
              {FAQS.map((entry) => (
                <button
                  key={entry.question}
                  type="button"
                  onClick={() => askQuestion(entry)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  {entry.question}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-2 shrink-0">
            
              <a href="mailto:admin@eventflux.com?subject=Support%20Request"
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-1 pb-2 transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              Still stuck? Email admin@eventflux.com
            </a>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your question..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Send"
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}