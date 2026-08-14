// app/(dashboard)/events/ai-create/page.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useEvents } from '@/hooks/useFirebase';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const GREETING =
  "Hi! Tell me about the event you'd like to create — name, type, date, time, venue, and who's hosting. I'll ask for anything that's missing.";

export default function AiCreateEventPage() {
  const router = useRouter();
  const { createEvent } = useEvents();
  const { canCreateEvent, incrementEventCount, refreshPlan } = usePaymentPlans();

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'greeting', role: 'assistant', text: GREETING },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [created, setCreated] = useState<{ eventName: string; eventDate: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || created) return;

    if (!canCreateEvent()) {
      toast.error('You have reached your event limit. Please upgrade your plan.');
      return;
    }

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      // Convert our chat history into the Anthropic messages format
      const apiMessages = nextMessages.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch('/api/event-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.type === 'ready') {
        // Agent has everything it needs — create the event now.
        const eventData = data.eventData;
        const functionsArray = eventData.eventType === 'Wedding' && Array.isArray(eventData.functions)
          ? eventData.functions
          : [];

        const eventId = await createEvent({
          eventName: eventData.eventName,
          eventType: eventData.eventType,
          eventDate: eventData.eventDate,
          venue: eventData.venue,
          address: eventData.address,
          hostNames: eventData.hostNames,
          coupleNames: eventData.coupleNames || '',
          description: eventData.description || '',
          themeColor: '#3B82F6',
          googleMaps: '',
          imageUrl: '',
          functions: functionsArray,
        });

        if (!eventId) throw new Error('Failed to create event');

        await incrementEventCount();
        await refreshPlan();

        setCreated({ eventName: eventData.eventName, eventDate: eventData.eventDate });
        setMessages((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            role: 'assistant',
            text: `Done! I've created "${eventData.eventName}". You can view and edit it from the Events page.`,
          },
        ]);
        toast.success('Event created!');
      } else {
        setMessages((prev) => [
          ...prev,
          { id: `b-${Date.now()}`, role: 'assistant', text: data.text },
        ]);
      }
    } catch (err: any) {
      console.error('AI event creation error:', err);
      toast.error(err.message || 'Something went wrong');
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: 'assistant',
          text: "Sorry, something went wrong on my end. Could you try again?",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          Create Event with AI
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Describe your event in your own words — I'll fill in the details and create it for you.
        </p>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 flex flex-col h-[65vh]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            </div>
          )}
          {created && (
            <div className="flex items-center gap-2 justify-center pt-2">
              <button
                onClick={() => router.push('/events')}
                className="flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-4 py-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Go to Events
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={created ? 'Event created — go to Events to make another' : 'e.g. Sangeet on 20th Aug, 6 PM, at Grand Palace...'}
            disabled={sending || !!created}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim() || !!created}
            className="p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}