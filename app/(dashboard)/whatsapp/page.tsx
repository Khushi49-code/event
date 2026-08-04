// app/(dashboard)/whatsapp/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWhatsApp, useEvents, useGuests, useRSVP } from '@/hooks/useFirebase';
import { 
  Loader2, 
  Send, 
  MessageSquare, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Save,
  Edit,
  Eye,
  EyeOff,
  Phone,
  Calendar,
  MapPin,
  User,
  UserPlus,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Guest {
  id: string;
  name?: string;
  mobile?: string;
  email?: string;
  phone?: string;
  guests?: number;
  adults?: number;
  children?: number;
  rsvpStatus?: string;
  status?: string;
  [key: string]: any;
}

interface Event {
  id: string;
  eventName: string;
  eventDate: string;
  venue: string;
  [key: string]: any;
}

interface Template {
  id: string;
  name?: string;
  type?: string;
  content?: string;
  eventId?: string;
  [key: string]: any;
}

export default function WhatsAppPage() {
  // State
  const [selectedEvent, setSelectedEvent] = useState('');
  const [messageType, setMessageType] = useState<'invitation' | 'reminder' | 'thankyou' | 'custom'>('invitation');
  const [messageContent, setMessageContent] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'declined'>('all');

  // Hooks
  const { templates, loading: templatesLoading, saveTemplate, logMessage } = useWhatsApp();
  const { events, loading: eventsLoading } = useEvents();
  const { guests, loading: guestsLoading, fetchGuests } = useGuests(selectedEvent);
  
  // Use RSVP hook to get RSVP data
  const { rsvps, loading: rsvpsLoading, updateRSVP } = useRSVP(selectedEvent);

  // Message templates
  const messageTemplates = {
    invitation: 'Dear {{name}},\n\nYou\'re invited to {{event}} on {{date}} at {{venue}}.\n\nWe look forward to seeing you! 🎉',
    reminder: 'Dear {{name}},\n\nThis is a reminder for {{event}} on {{date}} at {{venue}}.\n\nPlease confirm your attendance.',
    thankyou: 'Dear {{name}},\n\nThank you for attending {{event}}.\n\nWe hope you had a wonderful time! 🙏',
    custom: '',
  };

  // Get current event details
  const currentEvent = useMemo(() => {
    return events.find((e: Event) => e.id === selectedEvent);
  }, [events, selectedEvent]);

  // Combine guests from both sources
  const allGuests = useMemo(() => {
    // Create a map to deduplicate guests
    const guestMap = new Map();
    
    // Add guests from useGuests
    guests.forEach((guest: Guest) => {
      guestMap.set(guest.id, {
        ...guest,
        source: 'guests'
      });
    });
    
    // Add guests from RSVP
    rsvps.forEach((rsvp: Guest) => {
      if (guestMap.has(rsvp.id)) {
        // Update existing guest with RSVP data
        const existing = guestMap.get(rsvp.id);
        guestMap.set(rsvp.id, {
          ...existing,
          ...rsvp,
          rsvpStatus: rsvp.status || rsvp.rsvpStatus || 'pending',
          guests: rsvp.adults || rsvp.guests || existing.guests || 0,
          source: 'both'
        });
      } else {
        // Add new RSVP guest
        guestMap.set(rsvp.id, {
          ...rsvp,
          name: rsvp.name || 'Guest',
          mobile: rsvp.phone || rsvp.mobile,
          rsvpStatus: rsvp.status || rsvp.rsvpStatus || 'pending',
          guests: rsvp.adults || rsvp.guests || 0,
          source: 'rsvp'
        });
      }
    });
    
    return Array.from(guestMap.values());
  }, [guests, rsvps]);

  // Filter guests based on search and status
  const filteredGuests = useMemo(() => {
    let filtered = allGuests;
    
    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((guest: Guest) => 
        guest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.mobile?.includes(searchTerm) ||
        guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.phone?.includes(searchTerm)
      );
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((guest: Guest) => 
        (guest.rsvpStatus || guest.status || 'pending') === filterStatus
      );
    }
    
    return filtered;
  }, [allGuests, searchTerm, filterStatus]);

  // Load template
  const loadTemplate = (type: 'invitation' | 'reminder' | 'thankyou' | 'custom') => {
    setMessageType(type);
    if (type === 'custom') {
      setMessageContent('');
    } else {
      setMessageContent(messageTemplates[type]);
    }
  };

  // Load saved template
  const loadSavedTemplate = (template: Template) => {
    setMessageContent(template.content || '');
    setMessageType((template.type as any) || 'custom');
    setEditingTemplateId(template.id);
  };

  // Save current template
  const saveCurrentTemplate = async () => {
    if (!messageContent.trim()) {
      toast.error('Please enter message content');
      return;
    }

    if (!selectedEvent) {
      toast.error('Please select an event to save template');
      return;
    }

    const templateName = customTemplateName.trim() || `${messageType.charAt(0).toUpperCase() + messageType.slice(1)} Template`;

    try {
      await saveTemplate({
        name: templateName,
        type: messageType,
        content: messageContent,
        eventId: selectedEvent,
        createdAt: new Date().toISOString(),
      });
      toast.success('✅ Template saved successfully!');
      setCustomTemplateName('');
      setEditingTemplateId(null);
    } catch (error) {
      toast.error('Error saving template');
      console.error(error);
    }
  };

  // Open WhatsApp with pre-filled message
  const openWhatsApp = (phoneNumber: string, message: string) => {
    // Remove any non-numeric characters from phone number
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Check if number is valid
    if (!cleanNumber || cleanNumber.length < 10) {
      toast.error('Invalid phone number');
      return false;
    }

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    
    // Open in new tab/window
    window.open(whatsappUrl, '_blank');
    
    return true;
  };

  // Send messages - Open WhatsApp for each selected guest
  const handleSendMessages = async () => {
    if (selectedGuests.length === 0) {
      toast.error('Please select at least one guest');
      return;
    }

    if (!messageContent.trim()) {
      toast.error('Please enter message content');
      return;
    }

    if (!selectedEvent) {
      toast.error('Please select an event');
      return;
    }

    setIsSending(true);
    try {
      const selectedGuestData = allGuests.filter((g: Guest) => selectedGuests.includes(g.id));
      
      let openedCount = 0;
      let failedCount = 0;
      let noPhoneCount = 0;

      for (const guest of selectedGuestData) {
        try {
          // Check if guest has a phone number
          const phoneNumber = guest.mobile || guest.phone;
          if (!phoneNumber) {
            noPhoneCount++;
            failedCount++;
            continue;
          }

          // Replace placeholders
          const personalizedMessage = messageContent
            .replace(/{{name}}/g, guest.name || 'Guest')
            .replace(/{{event}}/g, currentEvent?.eventName || 'Event')
            .replace(/{{date}}/g, currentEvent?.eventDate || '')
            .replace(/{{venue}}/g, currentEvent?.venue || '')
            .replace(/{{guests}}/g, String(guest.guests || guest.adults || 0));

          // Log message to Firebase
          await logMessage({
            guestId: guest.id,
            eventId: selectedEvent,
            type: messageType,
            content: personalizedMessage,
            phoneNumber: phoneNumber,
            status: 'Opened',
            recipientName: guest.name || 'Unknown',
            messageType: messageType,
            openedAt: new Date().toISOString(),
            source: guest.source || 'unknown'
          });

          // Open WhatsApp for this guest
          const success = openWhatsApp(phoneNumber, personalizedMessage);
          
          if (success) {
            openedCount++;
            // Add a small delay between opens to prevent browser blocking
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error(`Error processing ${guest.name}:`, error);
          failedCount++;
        }
      }

      // Show appropriate toast messages
      if (openedCount > 0 && failedCount === 0) {
        toast.success(`✅ WhatsApp opened for ${openedCount} guests!`);
      } else if (openedCount > 0 && failedCount > 0) {
        toast.error(`⚠️ Opened for ${openedCount} guests, failed for ${failedCount} guests`);
        if (noPhoneCount > 0) {
          toast.error(`📱 ${noPhoneCount} guests have no phone number`);
        }
      } else if (openedCount === 0 && failedCount > 0) {
        toast.error(`❌ Failed to open WhatsApp for any guests`);
        if (noPhoneCount > 0) {
          toast.error(`📱 ${noPhoneCount} guests have no phone number`);
        }
      }
      
      setSelectedGuests([]);
    } catch (error) {
      toast.error('Error processing messages');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  // Open WhatsApp for a single guest
  const handleOpenSingle = (guest: Guest) => {
    const phoneNumber = guest.mobile || guest.phone;
    if (!phoneNumber) {
      toast.error('No phone number available for this guest');
      return;
    }

    if (!messageContent.trim()) {
      toast.error('Please compose a message first');
      return;
    }

    const personalizedMessage = messageContent
      .replace(/{{name}}/g, guest.name || 'Guest')
      .replace(/{{event}}/g, currentEvent?.eventName || 'Event')
      .replace(/{{date}}/g, currentEvent?.eventDate || '')
      .replace(/{{venue}}/g, currentEvent?.venue || '')
      .replace(/{{guests}}/g, String(guest.guests || guest.adults || 0));

    // Log the message
    logMessage({
      guestId: guest.id,
      eventId: selectedEvent,
      type: messageType,
      content: personalizedMessage,
      phoneNumber: phoneNumber,
      status: 'Opened (Single)',
      recipientName: guest.name || 'Unknown',
      messageType: messageType,
      openedAt: new Date().toISOString(),
      source: guest.source || 'unknown'
    }).catch(console.error);

    const success = openWhatsApp(phoneNumber, personalizedMessage);
    if (success) {
      toast.success(`📱 WhatsApp opened for ${guest.name}`);
    }
  };

  // Select/Deselect all guests
  const handleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredGuests.map((g: Guest) => g.id));
    }
  };

  // Get preview of message with first guest
  const getPreviewMessage = () => {
    const firstGuest = allGuests[0];
    if (!firstGuest || !messageContent) return messageContent;
    
    return messageContent
      .replace(/{{name}}/g, firstGuest.name || 'Guest')
      .replace(/{{event}}/g, currentEvent?.eventName || 'Event')
      .replace(/{{date}}/g, currentEvent?.eventDate || '')
      .replace(/{{venue}}/g, currentEvent?.venue || '')
      .replace(/{{guests}}/g, String(firstGuest.guests || firstGuest.adults || 0));
  };

  // Get selected guests count
  const selectedCount = selectedGuests.length;

  // Get stats
  const stats = useMemo(() => {
    const total = allGuests.length;
    const confirmed = allGuests.filter((g: Guest) => 
      (g.rsvpStatus || g.status || 'pending') === 'confirmed'
    ).length;
    const pending = allGuests.filter((g: Guest) => 
      (g.rsvpStatus || g.status || 'pending') === 'pending'
    ).length;
    const declined = allGuests.filter((g: Guest) => 
      (g.rsvpStatus || g.status || 'pending') === 'declined'
    ).length;
    const additionalGuests = allGuests.reduce((acc: number, g: Guest) => 
      acc + (g.guests || g.adults || 0), 0
    );
    
    return { total, confirmed, pending, declined, additionalGuests };
  }, [allGuests]);

  if (eventsLoading || rsvpsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            WhatsApp Automation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Send personalized WhatsApp messages to your event guests from RSVP data
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={saveCurrentTemplate} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Message Composer */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                Compose Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Event Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    Select Event
                  </label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => {
                      setSelectedEvent(e.target.value);
                      setSelectedGuests([]);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                  >
                    <option value="">Select Event</option>
                    {events.map((event: Event) => (
                      <option key={event.id} value={event.id}>
                        {event.eventName} - {event.eventDate || 'No date'}
                      </option>
                    ))}
                  </select>
                  {currentEvent && (
                    <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {currentEvent.venue}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {currentEvent.eventDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {allGuests.length} guests (RSVP)
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Message Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => loadTemplate('invitation')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        messageType === 'invitation'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <Send className="h-5 w-5 mx-auto text-green-500" />
                      <span className="text-xs mt-1 block">Invitation</span>
                    </button>
                    <button
                      onClick={() => loadTemplate('reminder')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        messageType === 'reminder'
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <Clock className="h-5 w-5 mx-auto text-yellow-500" />
                      <span className="text-xs mt-1 block">Reminder</span>
                    </button>
                    <button
                      onClick={() => loadTemplate('thankyou')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        messageType === 'thankyou'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <MessageSquare className="h-5 w-5 mx-auto text-blue-500" />
                      <span className="text-xs mt-1 block">Thank You</span>
                    </button>
                    <button
                      onClick={() => loadTemplate('custom')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        messageType === 'custom'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <Edit className="h-5 w-5 mx-auto text-purple-500" />
                      <span className="text-xs mt-1 block">Custom</span>
                    </button>
                  </div>
                </div>

                {/* Message Content */}
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center justify-between">
                    <span>Message Content</span>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-xs text-green-500 hover:text-green-700 flex items-center gap-1"
                    >
                      {showPreview ? (
                        <>
                          <EyeOff className="h-3 w-3" /> Hide Preview
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" /> Show Preview
                        </>
                      )}
                    </button>
                  </label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow font-mono text-sm"
                    placeholder="Type your message here... Use {{name}}, {{event}}, {{date}}, {{venue}}, {{guests}} as placeholders"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">Available placeholders:</span>
                    {['{{name}}', '{{event}}', '{{date}}', '{{venue}}', '{{guests}}'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setMessageContent(prev => prev + p)}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {showPreview && messageContent && allGuests.length > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Preview (first guest):</p>
                    <p className="text-sm whitespace-pre-wrap">{getPreviewMessage()}</p>
                  </div>
                )}

                {/* Custom Template Name (when saving) */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Template name (optional)"
                    value={customTemplateName}
                    onChange={(e) => setCustomTemplateName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Send Button */}
                <Button 
                  onClick={handleSendMessages} 
                  disabled={isSending || selectedGuests.length === 0 || !selectedEvent || !messageContent.trim()}
                  className="w-full relative overflow-hidden group bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening WhatsApp...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                      Open WhatsApp for {selectedCount} {selectedCount === 1 ? 'Guest' : 'Guests'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  ⚡ WhatsApp will open in new tabs for each selected guest
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Saved Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-green-500" />
                Saved Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {templatesLoading ? (
                  <div className="col-span-2 flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  </div>
                ) : templates.length === 0 ? (
                  <p className="col-span-2 text-sm text-gray-500 text-center py-8">
                    No saved templates. Create and save your first template!
                  </p>
                ) : (
                  templates.map((template: Template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg hover:shadow-md transition-all cursor-pointer ${
                        editingTemplateId === template.id
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                      onClick={() => loadSavedTemplate(template)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{template.name || 'Untitled'}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{template.content}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full whitespace-nowrap ml-2">
                          {template.type || 'custom'}
                        </span>
                      </div>
                      {template.eventId === selectedEvent && (
                        <p className="text-xs text-green-500 mt-1">✓ Matches current event</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Guest Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Select Guests (RSVP)
                </CardTitle>
                {selectedEvent && (
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedGuests.length === filteredGuests.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </div>
              {selectedEvent && (
                <div className="mt-2 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search guests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Status</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  {selectedEvent ? `${filteredGuests.length} RSVP guests` : 'Select an event'}
                </p>
                {selectedCount > 0 && (
                  <span className="text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                    {selectedCount} selected
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {guestsLoading || rsvpsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  </div>
                ) : !selectedEvent ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Select an event to load RSVP guests</p>
                  </div>
                ) : filteredGuests.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No RSVP guests found</p>
                    <p className="text-sm text-gray-400">RSVP responses will appear here</p>
                  </div>
                ) : (
                  filteredGuests.map((guest: Guest) => (
                    <div
                      key={guest.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all group ${
                        selectedGuests.includes(guest.id)
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <p className="font-medium truncate">{guest.name || 'Unnamed'}</p>
                          {guest.source === 'rsvp' && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              RSVP
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {guest.mobile || guest.phone || 'No phone'}
                          </span>
                          {(guest.guests || guest.adults) && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              +{guest.guests || guest.adults || 0}
                            </span>
                          )}
                          {guest.rsvpStatus || guest.status ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              (guest.rsvpStatus || guest.status) === 'confirmed' ? 'bg-green-100 text-green-700' :
                              (guest.rsvpStatus || guest.status) === 'declined' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {guest.rsvpStatus || guest.status}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Single guest WhatsApp button */}
                        {(guest.mobile || guest.phone) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSingle(guest);
                            }}
                            className="p-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors opacity-0 group-hover:opacity-100"
                            title="Open WhatsApp for this guest"
                          >
                            <Phone className="h-4 w-4 text-green-600" />
                          </button>
                        )}
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
                          className="ml-1 w-4 h-4 text-green-600 rounded focus:ring-green-500 flex-shrink-0"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {selectedEvent && allGuests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">RSVP Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total RSVPs</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                    <p className="text-xs text-gray-500">Confirmed</p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.additionalGuests}</p>
                    <p className="text-xs text-gray-500">Additional Guests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}