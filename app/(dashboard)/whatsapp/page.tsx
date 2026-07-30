// app/(dashboard)/whatsapp/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWhatsApp, useEvents, useGuests } from '@/hooks/useFirebase';
import { Loader2, Send, MessageSquare, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WhatsAppPage() {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [messageType, setMessageType] = useState<'invitation' | 'reminder' | 'thankyou'>('invitation');
  const [messageContent, setMessageContent] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const { templates, loading: templatesLoading, saveTemplate, logMessage } = useWhatsApp();
  const { events, loading: eventsLoading } = useEvents();
  const { guests, loading: guestsLoading, fetchGuests } = useGuests(selectedEvent);

  const messageTemplates = {
    invitation: 'Dear {{name}}, you\'re invited to {{event}} on {{date}} at {{venue}}. We look forward to seeing you!',
    reminder: 'Dear {{name}}, please confirm your attendance for {{event}} by replying to this message.',
    thankyou: 'Dear {{name}}, thank you for attending {{event}}. We hope you had a wonderful time!',
  };

  const handleSelectAll = () => {
    if (selectedGuests.length === guests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(guests.map((g: any) => g.id));
    }
  };

  const handleSendMessages = async () => {
    if (selectedGuests.length === 0) {
      toast.error('Please select at least one guest');
      return;
    }

    if (!messageContent) {
      toast.error('Please enter message content');
      return;
    }

    setIsSending(true);
    try {
      const selectedGuestData = guests.filter((g: any) => selectedGuests.includes(g.id));
      
      for (const guest of selectedGuestData) {
        // Replace placeholders
        const personalizedMessage = messageContent
          .replace(/{{name}}/g, guest.name || 'Guest')
          .replace(/{{event}}/g, events.find((e: any) => e.id === selectedEvent)?.eventName || 'Event')
          .replace(/{{date}}/g, events.find((e: any) => e.id === selectedEvent)?.eventDate || '')
          .replace(/{{venue}}/g, events.find((e: any) => e.id === selectedEvent)?.venue || '');

        // Log message
        await logMessage({
          guestId: guest.id,
          eventId: selectedEvent,
          type: messageType,
          content: personalizedMessage,
          phoneNumber: guest.mobile,
          status: 'Sent',
        });

        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast.success(`Messages sent to ${selectedGuests.length} guests!`);
      setSelectedGuests([]);
    } catch (error) {
      toast.error('Error sending messages');
    } finally {
      setIsSending(false);
    }
  };

  const loadTemplate = (type: 'invitation' | 'reminder' | 'thankyou') => {
    setMessageType(type);
    setMessageContent(messageTemplates[type]);
  };

  const saveCurrentTemplate = async () => {
    if (!messageContent) {
      toast.error('Please enter message content');
      return;
    }

    try {
      await saveTemplate({
        name: `${messageType.charAt(0).toUpperCase() + messageType.slice(1)} Template`,
        type: messageType,
        content: messageContent,
        eventId: selectedEvent || 'general',
      });
      toast.success('Template saved successfully!');
    } catch (error) {
      toast.error('Error saving template');
    }
  };

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">WhatsApp Automation</h1>
        <Button onClick={saveCurrentTemplate} variant="outline">
          Save Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Message Composer */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select Event</label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => {
                      setSelectedEvent(e.target.value);
                      fetchGuests();
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="">Select Event</option>
                    {events.map((event: any) => (
                      <option key={event.id} value={event.id}>
                        {event.eventName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => loadTemplate('invitation')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        messageType === 'invitation'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Send className="h-5 w-5 mx-auto text-blue-500" />
                      <span className="text-xs mt-1 block">Invitation</span>
                    </button>
                    <button
                      onClick={() => loadTemplate('reminder')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        messageType === 'reminder'
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Clock className="h-5 w-5 mx-auto text-yellow-500" />
                      <span className="text-xs mt-1 block">Reminder</span>
                    </button>
                    <button
                      onClick={() => loadTemplate('thankyou')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        messageType === 'thankyou'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <MessageSquare className="h-5 w-5 mx-auto text-green-500" />
                      <span className="text-xs mt-1 block">Thank You</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message Content</label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none"
                    placeholder="Type your message here... Use {{name}}, {{event}}, {{date}}, {{venue}} as placeholders"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available placeholders: {'{{name}}'}, {'{{event}}'}, {'{{date}}'}, {'{{venue}}'}
                  </p>
                </div>

                <Button 
                  onClick={handleSendMessages} 
                  disabled={isSending || selectedGuests.length === 0}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send to {selectedGuests.length} Guests
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Saved Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {templates.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No saved templates</p>
                ) : (
                  templates.map((template: any) => (
                    <div
                      key={template.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setMessageContent(template.content)}
                    >
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500 truncate">{template.content}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Guest Selection */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Guests
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedGuests.length === guests.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <p className="text-sm text-gray-500">{guests.length} guests available</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {guestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : guests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No guests found for this event</p>
              ) : (
                guests.map((guest: any) => (
                  <div
                    key={guest.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      selectedGuests.includes(guest.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{guest.name}</p>
                      <p className="text-sm text-gray-500">{guest.mobile}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{guest.guests || 0} guests</span>
                      <input
                        type="checkbox"
                        checked={selectedGuests.includes(guest.id)}
                        onChange={() => {
                          if (selectedGuests.includes(guest.id)) {
                            setSelectedGuests(selectedGuests.filter(id => id !== guest.id));
                          } else {
                            setSelectedGuests([...selectedGuests, guest.id]);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}