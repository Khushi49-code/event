// app/(dashboard)/invitations/builder/page.tsx
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/config'; // adjusted to match your project's lib/config.ts
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
  ImagePlus
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
    colors: ['#D4AF37', '#D4AF37', '#D4AF37', '#1B2340'], // primary, secondary, accent all gold
    background: '#1B2340',
    text: '#F3E7C9',
  },
];

export default function InvitationBuilderPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState('wedding');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedInvitationId, setSavedInvitationId] = useState<string | null>(null);

  // Images state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // Colors state
  const [colors, setColors] = useState({
    primary: '#D4AF37',
    secondary: '#D4AF37',
    background: '#14101C',
    text: '#F3EAD3',
    accent: '#D4AF37',
  });

  // Fonts state
  const [fonts, setFonts] = useState({
    heading: 'Playfair Display',
    body: 'Inter',
    accent: 'Montserrat',
  });

  // Text content
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
  });

  const { events, loading: eventsLoading } = useEvents();
  const { uploadFile, uploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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
      // reset input so the same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeLogo = () => setUploadedLogo(null);
  const removeCover = () => setCoverImage(null);

  const handleEventSelect = (eventId: string) => {
    setSelectedEvent(eventId);
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
      }));
    }
  };

  // Switches to the Preview tab so the user can see the invitation as built so far
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
      const invitationData = {
        eventId: selectedEvent,
        template: selectedTemplate,
        colors,
        fonts,
        content,
        images: {
          gallery: uploadedImages,
          logo: uploadedLogo,
          cover: coverImage,
        },
        createdAt: serverTimestamp(),
      };

      // Actually persist the invitation to Firestore — this is the core save.
      const docRef = await addDoc(collection(db, 'invitations'), invitationData);
      setSavedInvitationId(docRef.id);
      toast.success('Invitation generated successfully!');
      setActiveTab('preview');

      // Link this invitation back to its event so other pages (RSVP, Guests)
      // can build each guest's personal link pointing at this exact card.
      // Kept separate/non-blocking: if this fails (e.g. Firestore rules don't
      // allow updating the event), the invitation itself still saved fine.
      try {
        await updateDoc(doc(db, 'events', selectedEvent), {
          invitationId: docRef.id,
        });
      } catch (linkError) {
        console.error('Invitation saved, but failed to link it to the event:', linkError);
        toast.error('Invitation saved, but guest links may not work yet (could not update the event record).');
      }
    } catch (error: any) {
      console.error('Error generating invitation:', error);
      toast.error(`Error: ${error?.message || 'Could not generate invitation. Please try again.'}`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="template">Templates</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="fonts">Fonts</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Template Tab */}
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
                      // Each template uses a rich, dark card background by default —
                      // auto-apply a matching gold/cream palette so the card is
                      // legible and looks premium without extra manual steps.
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

        {/* Content Tab */}
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
                      {event.eventName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    value={content.date}
                    onChange={(e) => setContent({ ...content, date: e.target.value })}
                    placeholder="Event date"
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    value={content.time}
                    onChange={(e) => setContent({ ...content, time: e.target.value })}
                    placeholder="Event time"
                  />
                </div>
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={content.venue}
                    onChange={(e) => setContent({ ...content, venue: e.target.value })}
                    placeholder="Venue name"
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
                    placeholder="Paste a Google Maps share link — leave blank to auto-generate from venue/address"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Tip: open the venue in Google Maps, tap Share, copy the link, and paste it here.
                  </p>
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

        {/* Images Tab */}
        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Images & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cover Image */}
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

              {/* Logo */}
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

              {/* Gallery Images */}
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

        {/* Colors Tab */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Customization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Palettes */}
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

              {/* Custom Colors */}
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

        {/* Fonts Tab */}
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

        {/* Preview Tab — styled as an actual printed invitation card */}
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
              {/* Neutral "table" backdrop so the card reads like a physical print.
                  The card itself is the shared InvitationCard component — this is
                  the exact same component the public guest-facing page renders,
                  so what you see here is what guests will see. */}
              <div className="flex justify-center bg-gray-100 dark:bg-gray-950 rounded-xl p-6 md:p-14">
                <InvitationCard
                  template={selectedTemplate}
                  colors={colors}
                  fonts={fonts}
                  content={content}
                  images={{ cover: coverImage, logo: uploadedLogo, gallery: uploadedImages }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}