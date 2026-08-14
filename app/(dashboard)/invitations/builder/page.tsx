// app/(dashboard)/invitations/builder/page.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { useEvents } from '@/hooks/useFirebase';
import { useFileUpload } from '@/hooks/useFileUpload';
import InvitationCard from '@/components/InvitationCard';
import {
  Loader2,
  X,
  Image as ImageIcon,
  Palette,
  Type,
  Eye,
  Download,
  Share2,
  Printer,
  Sparkles,
  Camera,
  ImagePlus,
  Calendar,
  Clock,
  MapPin,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const templates = [
  { id: 'wedding', name: 'Wedding', icon: '💒', description: 'Elegant wedding invitation', bgColor: '#FFF5F5' },
  { id: 'royal', name: 'Royal Navy & Gold', icon: '👑', description: 'Navy & gold elegant wedding invitation', bgColor: '#1B2340' },
  { id: 'anniversary', name: 'Anniversary', icon: '💝', description: 'Romantic anniversary celebration', bgColor: '#FFF0F6' },
  { id: 'birthday', name: 'Birthday', icon: '🎂', description: 'Fun birthday party invitation', bgColor: '#FFF8E1' },
  { id: 'corporate', name: 'Corporate', icon: '🏢', description: 'Professional corporate event', bgColor: '#F0F4FF' },
  { id: 'bni', name: 'BNI Event', icon: '🤝', description: 'BNI networking event', bgColor: '#E8F5E9' },
  { id: 'custom', name: 'Custom', icon: '✨', description: 'Custom design your invitation', bgColor: '#F3E5F5' },
];

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Poppins', label: 'Poppins' },
];

const colorPalettes = [
  { name: 'Romantic', colors: ['#FF6B6B', '#FF8E8E', '#FFB4B4', '#FFD4D4'] },
  { name: 'Elegant', colors: ['#2D4059', '#EA5455', '#F07B6C', '#F3C5B6'] },
  { name: 'Modern', colors: ['#1A1A2E', '#16213E', '#0F3460', '#533483'] },
  { name: 'Nature', colors: ['#2D6A4F', '#40916C', '#52B788', '#95D5B2'] },
  { name: 'Sunset', colors: ['#FF6B35', '#F79327', '#F15A24', '#FF9F45'] },
  { name: 'Pastel', colors: ['#FFB5C2', '#B5EAD7', '#C7CEEA', '#FFDAC1'] },
  {
    name: 'Royal Navy & Gold',
    colors: ['#D4AF37', '#D4AF37', '#D4AF37', '#1B2340'],
    background: '#1B2340',
    text: '#F3E7C9',
  },
];

interface WeddingFunction {
  name: string;
  date: string;
  time: string;
  venue: string;
}

export default function InvitationBuilderPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState('wedding');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedFunction, setSelectedFunction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedInvitationId, setSavedInvitationId] = useState<string | null>(null);

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const [colors, setColors] = useState({
    primary: '#D4AF37',
    secondary: '#D4AF37',
    background: '#14101C',
    text: '#F3EAD3',
    accent: '#D4AF37',
  });

  const [fonts, setFonts] = useState({
    heading: 'Playfair Display',
    body: 'Inter',
    accent: 'Montserrat',
  });

  const [content, setContent] = useState({
    title: "You're Invited!",
    subtitle: "Join us for a celebration",
    eventName: '',
    date: '',
    time: '',
    venue: '',
    address: '',
    googleMapsUrl: '',
    host: '',
    message: '',
    rsvpText: 'Please RSVP by',
    rsvpDate: '',
    allFunctions: [] as WeddingFunction[],
  });

  const { events, loading: eventsLoading } = useEvents();
  const { uploadFile, uploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const selectedEventData = events.find((e: any) => e.id === selectedEvent);

  // 🔥 FIX: Single source of truth for functions — always read from `content.allFunctions`,
  // which is now kept in sync (see useEffect below) instead of a second, independently
  // computed variable that could drift out of sync with what Preview actually renders.
  const eventFunctions: WeddingFunction[] = content.allFunctions || [];
  const isWeddingWithFunctions =
    selectedEventData?.eventType === 'Wedding' && eventFunctions.length > 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return dateStr;
      return dt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const dt = new Date(`2000-01-01T${timeStr}`);
      if (isNaN(dt.getTime())) return timeStr;
      return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'gallery' | 'logo' | 'cover') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image size should be less than 5MB');
          continue;
        }

        const path = `invitations/${Date.now()}_${file.name}`;
        const url = await uploadFile(file, path);

        if (type === 'gallery') {
          setUploadedImages(prev => [...prev, url]);
        } else if (type === 'logo') {
          setUploadedLogo(url);
        } else if (type === 'cover') {
          setCoverImage(url);
        }
      }
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Error uploading image');
    } finally {
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeLogo = () => setUploadedLogo(null);
  const removeCover = () => setCoverImage(null);

  // Called when the user picks an event from the dropdown.
  // Kept for the eventName/venue/host fields, but functions themselves
  // are now synced by the useEffect below so they don't depend on this
  // firing at exactly the right moment.
  const handleEventSelect = (eventId: string) => {
    setSelectedEvent(eventId);
    setSelectedFunction('');
    const event = events.find((e: any) => e.id === eventId);
    if (event) {
      setContent(prev => ({
        ...prev,
        eventName: event.eventName || '',
        date: event.eventDate ? new Date(event.eventDate).toLocaleDateString() : '',
        time: event.eventDate ? new Date(event.eventDate).toLocaleTimeString() : '',
        venue: event.venue || '',
        address: event.address || '',
        host: event.hostNames || '',
        googleMapsUrl: event.googleMapsUrl || event.googleMaps || '',
      }));
    } else {
      setContent(prev => ({
        ...prev,
        eventName: '',
        date: '',
        time: '',
        venue: '',
        address: '',
        host: '',
        googleMapsUrl: '',
        allFunctions: [],
      }));
    }
  };

  // 🔥 FIX: This is the actual bug fix.
  // Previously `content.allFunctions` was ONLY set inside handleEventSelect's onChange
  // handler. If `events` (from the Firestore onSnapshot listener in useEvents) was still
  // loading — or updated later — at the moment the user picked an event, `selectedEventData`
  // could be stale/undefined and `allFunctions` would silently stay `[]`, which made
  // InvitationCard fall back to the plain single-date "WHEN / WHERE" layout instead of
  // the per-function list, even though the data existed in Firestore all along.
  //
  // This effect re-derives `allFunctions` any time `selectedEvent` OR the underlying
  // `events` array changes, so it always reflects the latest Firestore data — regardless
  // of load timing, reselection, or live updates.
  useEffect(() => {
    if (!selectedEvent) return;
    const event = events.find((e: any) => e.id === selectedEvent);
    if (!event) return;

    const functions: WeddingFunction[] = Array.isArray(event.functions) ? event.functions : [];

    setContent(prev => {
      // Avoid unnecessary re-renders if nothing actually changed
      const same =
        prev.allFunctions.length === functions.length &&
        JSON.stringify(prev.allFunctions) === JSON.stringify(functions);
      if (same) return prev;
      return { ...prev, allFunctions: functions };
    });
  }, [selectedEvent, events]);

  const handleFunctionSelect = (functionName: string) => {
    setSelectedFunction(functionName);
  };

  const handlePreview = () => {
    setActiveTab('preview');
  };

  const generateInvitation = async () => {
    if (!selectedEvent) {
      toast.error('Please select an event');
      return;
    }

    setIsGenerating(true);
    try {
      // 🔥 Direct fetch from Firestore to guarantee the very latest functions,
      // in case the event doc changed after it was loaded into `events`.
      const eventDoc = await getDoc(doc(db, 'events', selectedEvent));
      let allFunctions: WeddingFunction[] = [];

      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        allFunctions = Array.isArray(eventData.functions) ? eventData.functions : [];
        console.log('🔥🔥🔥 Functions from event (direct fetch):', allFunctions);
      }

      // Keep local preview state in sync with what we're about to save,
      // so the Preview tab immediately reflects the freshly-fetched data too.
      setContent(prev => ({ ...prev, allFunctions }));

      const invitationContent = {
        ...content,
        allFunctions,
      };

      const invitationData = {
        eventId: selectedEvent,
        template: selectedTemplate,
        colors,
        fonts,
        content: invitationContent,
        images: {
          gallery: uploadedImages,
          logo: uploadedLogo,
          cover: coverImage,
        },
        isWedding: eventDoc.exists() && eventDoc.data()?.eventType === 'Wedding' && allFunctions.length > 0,
        selectedFunction: selectedFunction || null,
        createdAt: serverTimestamp(),
      };

      console.log('🔥🔥🔥 INVITATION DATA BEING SAVED:', JSON.stringify(invitationData, null, 2));

      const docRef = await addDoc(collection(db, 'invitations'), invitationData);
      setSavedInvitationId(docRef.id);
      toast.success('Invitation generated successfully!');
      setActiveTab('preview');

      try {
        await updateDoc(doc(db, 'events', selectedEvent), {
          invitationId: docRef.id,
        });
      } catch (linkError) {
        console.error('Invitation saved, but failed to link it to the event:', linkError);
      }
    } catch (error: any) {
      console.error('Error generating invitation:', error);
      toast.error(`Error: ${error?.message || 'Could not generate invitation.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!savedInvitationId) {
      toast.error('Generate the invitation first');
      return;
    }
    toast.success('Downloading invitation...');
  };

  const handleShare = () => {
    if (!savedInvitationId) {
      toast.error('Generate the invitation first');
      return;
    }
    const shareUrl = `${window.location.origin}/invitations/view/${savedInvitationId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const selectedFunctionDetails = eventFunctions.find(f => f.name === selectedFunction);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Invitation Builder</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Design and customize your digital invitations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={generateInvitation} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Invitation
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="template">Templates</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="fonts">Fonts</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Choose a Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      const goldByTemplate: Record<string, string> = {
                        wedding: '#D4AF37',
                        royal: '#D4AF37',
                        anniversary: '#D4AF37',
                        birthday: '#F0B429',
                        corporate: '#C9A227',
                        bni: '#C9A227',
                        custom: '#D4AF37',
                      };
                      const bgByTemplate: Record<string, string> = {
                        wedding: '#241019',
                        royal: '#131C33',
                        anniversary: '#20101F',
                        birthday: '#1F160A',
                        corporate: '#0E1526',
                        bni: '#0D1F17',
                        custom: '#170F26',
                      };
                      const gold = goldByTemplate[template.id] || '#D4AF37';
                      setColors({
                        primary: gold,
                        secondary: gold,
                        accent: gold,
                        background: bgByTemplate[template.id] || '#14101C',
                        text: '#F3EAD3',
                      });
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-4xl mb-2">{template.icon}</div>
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    {selectedTemplate === template.id && (
                      <Badge className="mt-2" variant="success">Selected</Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Event Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Event</Label>
                <select
                  value={selectedEvent}
                  onChange={(e) => handleEventSelect(e.target.value)}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">Choose an event...</option>
                  {events.map((event: any) => (
                    <option key={event.id} value={event.id}>
                      {event.eventName} {event.eventType === 'Wedding' ? '💒' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {isWeddingWithFunctions && (
                <div>
                  <Label>Select Function (for highlighting)</Label>
                  <select
                    value={selectedFunction}
                    onChange={(e) => handleFunctionSelect(e.target.value)}
                    className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="">All Functions</option>
                    {eventFunctions.map((fn, idx) => (
                      <option key={idx} value={fn.name}>
                        {fn.name || `Function ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Select a function to highlight it in the preview. All functions will be shown.
                  </p>
                </div>
              )}

              {selectedFunction && selectedFunctionDetails && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Selected Function Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    {selectedFunctionDetails.date && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span>{formatDate(selectedFunctionDetails.date)}</span>
                      </div>
                    )}
                    {selectedFunctionDetails.time && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span>{formatTime(selectedFunctionDetails.time)}</span>
                      </div>
                    )}
                    {selectedFunctionDetails.venue && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span>{selectedFunctionDetails.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isWeddingWithFunctions && eventFunctions.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    All Wedding Functions ({eventFunctions.length})
                  </Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {eventFunctions.map((fn, idx) => {
                      return (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            selectedFunction === fn.name 
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-500' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {fn.name || `Function ${idx + 1}`}
                          </div>
                          <div className="mt-1 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            {fn.date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(fn.date)}</span>
                              </div>
                            )}
                            {fn.time && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(fn.time)}</span>
                              </div>
                            )}
                            {fn.venue && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{fn.venue}</span>
                              </div>
                            )}
                          </div>
                          {selectedFunction === fn.name && (
                            <Badge className="mt-2" variant="success">Selected</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={content.title}
                    onChange={(e) => setContent({ ...content, title: e.target.value })}
                    placeholder="You're Invited!"
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={content.subtitle}
                    onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                    placeholder="Join us for a celebration"
                  />
                </div>
                <div>
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input
                    id="eventName"
                    value={content.eventName}
                    onChange={(e) => setContent({ ...content, eventName: e.target.value })}
                    placeholder="Event name"
                  />
                </div>
                <div>
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    value={content.host}
                    onChange={(e) => setContent({ ...content, host: e.target.value })}
                    placeholder="Host name"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={content.address}
                    onChange={(e) => setContent({ ...content, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="googleMapsUrl">Google Maps Link (optional)</Label>
                  <Input
                    id="googleMapsUrl"
                    value={content.googleMapsUrl}
                    onChange={(e) => setContent({ ...content, googleMapsUrl: e.target.value })}
                    placeholder="Paste a Google Maps share link"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Leave blank to auto-generate from venue/address
                  </p>
                </div>
                <div>
                  <Label htmlFor="rsvpDate">RSVP Date</Label>
                  <Input
                    id="rsvpDate"
                    type="date"
                    value={content.rsvpDate}
                    onChange={(e) => setContent({ ...content, rsvpDate: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    rows={4}
                    value={content.message}
                    onChange={(e) => setContent({ ...content, message: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="Add a personal message..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Images & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Cover Image</Label>
                <div className="mt-2 relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  {coverImage ? (
                    <div className="relative inline-block z-10">
                      <img src={coverImage} alt="Cover" className="max-h-48 rounded-lg" />
                      <button
                        onClick={removeCover}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-20"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Upload a cover image</p>
                      <p className="text-xs text-gray-400">Recommended: 1200x630px</p>
                    </>
                  )}
                  {!coverImage && (
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'cover')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/40 rounded-lg">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Logo</Label>
                <div className="mt-2 relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  {uploadedLogo ? (
                    <div className="relative inline-block z-10">
                      <img src={uploadedLogo} alt="Logo" className="max-h-24 object-contain" />
                      <button
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-20"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Upload your logo</p>
                      <p className="text-xs text-gray-400">PNG with transparent background</p>
                    </>
                  )}
                  {!uploadedLogo && (
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'logo')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  )}
                </div>
              </div>

              <div>
                <Label>Gallery Images</Label>
                <div className="mt-2 relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <ImagePlus className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Upload photos for the gallery</p>
                  <p className="text-xs text-gray-400">Up to 10 images, 5MB each</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, 'gallery')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {uploadedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Customization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Color Palettes</Label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {colorPalettes.map((palette) => (
                    <button
                      key={palette.name}
                      onClick={() => {
                        setColors({
                          primary: palette.colors[0],
                          secondary: palette.colors[1],
                          accent: palette.colors[2],
                          background: (palette as any).background || '#FFFFFF',
                          text: (palette as any).text || '#1F2937',
                        });
                        if (palette.name === 'Royal Navy & Gold') {
                          setSelectedTemplate('royal');
                        }
                      }}
                      className="p-3 border rounded-lg hover:border-blue-500 transition-colors"
                    >
                      <div className="flex gap-1 mb-2">
                        {palette.colors.map((color, i) => (
                          <div
                            key={i}
                            className="h-6 flex-1 rounded"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="text-sm font-medium">{palette.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(colors).map(([key, value]) => (
                  <div key={key}>
                    <Label className="capitalize">{key}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                        className="w-16 h-10 p-1 border rounded cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Font Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(fonts).map(([key, value]) => (
                <div key={key}>
                  <Label className="capitalize">{key} Font</Label>
                  <select
                    value={value}
                    onChange={(e) => setFonts({ ...fonts, [key]: e.target.value })}
                    className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    style={{ fontFamily: value }}
                  >
                    {fontOptions.map((font) => (
                      <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="mt-4 p-4 border rounded-lg">
                <p className="text-sm text-gray-500">Preview</p>
                <div className="space-y-2 mt-2">
                  <p style={{ fontFamily: fonts.heading, fontSize: '24px', color: colors.primary }}>
                    Heading Font Preview
                  </p>
                  <p style={{ fontFamily: fonts.body, fontSize: '16px', color: colors.text }}>
                    Body font preview - This is how your text will look.
                  </p>
                  <p style={{ fontFamily: fonts.accent, fontSize: '14px', color: colors.accent }}>
                    Accent font preview for special text.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Invitation Preview
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center bg-gray-100 dark:bg-gray-950 rounded-xl p-6 md:p-14">
                <InvitationCard
                  template={selectedTemplate}
                  colors={colors}
                  fonts={fonts}
                  content={content}
                  images={{ cover: coverImage, logo: uploadedLogo, gallery: uploadedImages }}
                  selectedFunction={selectedFunction}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}