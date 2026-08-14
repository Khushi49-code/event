// app/(dashboard)/events/create/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useEvents } from '@/hooks/useFirebase';
import { useFileUpload } from '@/hooks/useFileUpload';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Loader2, 
  X, 
  Image as ImageIcon, 
  AlertCircle, 
  CreditCard, 
  Info,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

interface WeddingFunction {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
}

const DEFAULT_WEDDING_FUNCTIONS: Omit<WeddingFunction, 'id'>[] = [
  { name: 'Haldi', date: '', time: '', venue: '' },
  { name: 'Sangeet', date: '', time: '', venue: '' },
  { name: 'Fera', date: '', time: '', venue: '' },
  { name: 'Reception', date: '', time: '', venue: '' },
];

export default function CreateEventPage() {
  const router = useRouter();
  // ✅ AuthContext's User type only has `id` (set from firebaseUser.uid) —
  // there is no `uid` field on it. Use `user.id` everywhere below.
  const { user, loading: authLoading } = useAuth();
  const { createEvent } = useEvents();
  const { uploadFile, uploading, progress, error: uploadError, resetUpload } = useFileUpload();
  const { 
    canCreateEvent, 
    remainingEvents, 
    loading: planLoading, 
    userPlan, 
    incrementEventCount,
    refreshPlan
  } = usePaymentPlans();
  
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showPlanInfo, setShowPlanInfo] = useState(false);
  const [functions, setFunctions] = useState<WeddingFunction[]>([]);
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    eventName: '',
    eventType: '',
    eventDate: '',
    venue: '',
    address: '',
    googleMaps: '',
    hostNames: '',
    coupleNames: '',
    themeColor: '#3B82F6',
    description: '',
    imageUrl: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      toast.error('Please sign in to create an event');
      router.push('/auth/signin');
    }
  }, [mounted, authLoading, user, router]);

  useEffect(() => {
    if (mounted && !planLoading && user && !canCreateEvent()) {
      toast.error('You need an active plan to create events');
    }
  }, [mounted, planLoading, canCreateEvent, user]);

  useEffect(() => {
    if (formData.eventType === 'Wedding' && functions.length === 0) {
      setFunctions(
        DEFAULT_WEDDING_FUNCTIONS.map((f) => ({
          ...f,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        }))
      );
    } else if (formData.eventType !== 'Wedding') {
      setFunctions([]);
    }
  }, [formData.eventType]);

  const addFunction = () => {
    setFunctions((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: '',
        date: '',
        time: '',
        venue: '',
      },
    ]);
  };

  const removeFunction = (id: string) => {
    setFunctions((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFunction = (id: string, field: keyof Omit<WeddingFunction, 'id'>, value: string) => {
    setFunctions((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    resetUpload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create an event');
      router.push('/auth/signin');
      return;
    }
    
    if (!formData.eventName || !formData.eventType || !formData.eventDate || 
        !formData.venue || !formData.address || !formData.hostNames) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.eventType === 'Wedding') {
      const hasEmptyFunction = functions.some((f) => !f.name.trim());
      if (hasEmptyFunction) {
        toast.error('Please name every function, or remove the empty one');
        return;
      }
    }

    if (!canCreateEvent()) {
      toast.error('You have reached your event limit. Please upgrade your plan.');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Creating event...');

    try {
      let imageUrl = '';
      
      if (selectedImage) {
        try {
          const path = `events/${user.id}/${Date.now()}_${selectedImage.name}`;
          imageUrl = await uploadFile(selectedImage, path);
          toast.success('Image uploaded successfully');
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          toast.error(uploadError.message || 'Failed to upload image');
          setLoading(false);
          toast.dismiss(loadingToast);
          return;
        }
      }

      // 🔥🔥🔥 STORE FUNCTIONS AS ARRAY OF OBJECTS
      const functionsArray = formData.eventType === 'Wedding'
        ? functions.map(({ id, ...rest }) => rest)
        : [];

      const eventData = {
        ...formData,
        imageUrl: imageUrl || formData.imageUrl || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email,
        eventId: `EVT-${Date.now().toString().slice(-8)}`,
        functions: functionsArray,
      };

      console.log('🔥🔥🔥 SAVING EVENT WITH FUNCTIONS:', JSON.stringify(eventData.functions, null, 2));

      const eventId = await createEvent(eventData);
      
      if (!eventId) {
        throw new Error('Failed to create event');
      }
      
      await incrementEventCount();
      await refreshPlan();

      const remaining = remainingEvents() - 1;
      toast.success(
        remaining > 0 
          ? `Event created successfully! ${remaining} events remaining`
          : 'Event created successfully! You\'ve used all your events.',
        { id: loadingToast, duration: 4000 }
      );
      
      router.push('/events');
      
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error(
        error.message || 'Error creating event. Please try again.', 
        { id: loadingToast, duration: 4000 }
      );
    } finally {
      setLoading(false);
    }
  };

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
      </div>
    );
  }

  // Loading states
  if (authLoading || planLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">
            {authLoading ? 'Loading...' : 'Loading plan information...'}
          </p>
        </div>
      </div>
    );
  }

  // If no user (should not happen if AuthProvider works)
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 max-w-lg w-full text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Please Sign In</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You need to be signed in to create an event.
            </p>
            <Link href="/auth/signin">
              <Button className="w-full">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!planLoading && user && !canCreateEvent()) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 max-w-lg w-full">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-100 dark:bg-yellow-800/30 p-3 rounded-full">
                <AlertCircle className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-center text-gray-900 dark:text-gray-100">
              Event Limit Reached
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              You have used all your available events ({userPlan?.eventsCreated} of {userPlan?.maxEvents}). 
              Purchase a new event credit or renew your plan to continue creating.
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Events Created</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {userPlan?.eventsCreated || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Events</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {userPlan?.maxEvents || 0}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Plan Tier</span>
                <span className="text-lg font-semibold capitalize text-blue-600 dark:text-blue-400">
                  {userPlan?.tier || 'Free'}
                </span>
              </div>
            </div>

            <Link href="/settings/billing">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                <CreditCard className="mr-2 h-5 w-5" />
                Purchase or Renew Plan
              </Button>
            </Link>
            
            <button
              onClick={() => router.push('/events')}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              Return to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="max-w-4xl mx-auto pb-28 sm:pb-8 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Create New Event</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {remainingEvents()} events remaining
            </p>
            <button
              type="button"
              onClick={() => setShowPlanInfo(!showPlanInfo)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          {showPlanInfo && (
            <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
              <p className="text-blue-700 dark:text-blue-300">
                Each event uses 1 credit from your plan. 
                You have {remainingEvents()} credits remaining.
              </p>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/events')}
          disabled={loading || uploading}
          className="hidden sm:inline-flex"
        >
          Cancel
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} id="create-event-form">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                  placeholder="Enter event name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                >
                  <option value="">Select Type</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Corporate">Corporate</option>
                  <option value="BNI Event">BNI Event</option>
                  <option value="Conference">Conference</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Party">Party</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Event Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Venue <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                  placeholder="Venue name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                  placeholder="Full address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Google Maps URL</label>
              <input
                type="url"
                value={formData.googleMaps}
                onChange={(e) => setFormData({ ...formData, googleMaps: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Host Names <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.hostNames}
                onChange={(e) => setFormData({ ...formData, hostNames: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                placeholder="Host 1, Host 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Couple Names (if applicable)</label>
              <input
                type="text"
                value={formData.coupleNames}
                onChange={(e) => setFormData({ ...formData, coupleNames: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                placeholder="Name 1 & Name 2"
              />
            </div>

            {/* 🔥 WEDDING FUNCTIONS SECTION */}
            {formData.eventType === 'Wedding' && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium">
                      Wedding Functions
                    </label>
                    <span className="text-xs text-gray-500">
                      These will appear as separate events in the invitation
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFunction}
                    className="gap-1 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Function</span>
                  </Button>
                </div>

                {functions.length === 0 && (
                  <p className="text-sm text-gray-500 py-4 text-center">No functions added yet. Click "Add Function" to add.</p>
                )}

                <div className="space-y-3">
                  {functions.map((fn, index) => (
                    <div
                      key={fn.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono">#{index + 1}</span>
                          <input
                            type="text"
                            value={fn.name}
                            onChange={(e) => updateFunction(fn.id, 'name', e.target.value)}
                            placeholder="Function name (e.g., Haldi, Sangeet, Fera)"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFunction(fn.id)}
                          className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 shrink-0"
                          disabled={functions.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Date
                          </label>
                          <input
                            type="date"
                            value={fn.date}
                            onChange={(e) => updateFunction(fn.id, 'date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Time
                          </label>
                          <input
                            type="time"
                            value={fn.time}
                            onChange={(e) => updateFunction(fn.id, 'time', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Venue
                          </label>
                          <input
                            type="text"
                            value={fn.venue}
                            onChange={(e) => updateFunction(fn.id, 'venue', e.target.value)}
                            placeholder="Venue (or leave blank for main venue)"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {functions.length > 0 && (
                  <p className="text-xs text-gray-400 mt-3">
                    💡 All functions will be stored as an array in the event document
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Theme Color</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.themeColor}
                  onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                  className="w-14 h-11 sm:w-16 sm:h-12 p-1 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer shrink-0"
                />
                <span className="text-sm text-gray-500">{formData.themeColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Event Image</label>
              <div className="relative">
                <div className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-6 text-center hover:border-blue-500 transition-colors ${
                  imagePreview ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                }`}>
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="max-h-56 sm:max-h-64 mx-auto rounded-lg object-contain"
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="text-center text-white">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p className="text-sm">Uploading... {Math.round(progress)}%</p>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={removeImage}
                        disabled={uploading}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center">
                        <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3" />
                        <p className="text-sm text-gray-500">
                          Tap to upload a photo
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, JPEG (Max 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading || loading}
                      />
                    </>
                  )}
                </div>
                {uploadError && (
                  <p className="text-red-500 text-sm mt-2">{uploadError}</p>
                )}
              </div>
            </div>

            <div className="hidden sm:flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/events')}
                disabled={loading || uploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || uploading || !canCreateEvent()}
                className="min-w-[140px]"
              >
                {loading || uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploading ? `Uploading ${Math.round(progress)}%` : 'Creating...'}
                  </>
                ) : (
                  `Create Event (${remainingEvents()} left)`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex gap-3 z-10">
        <button
          type="button"
          onClick={() => router.push('/events')}
          disabled={loading || uploading}
          className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="create-event-form"
          disabled={loading || uploading || !canCreateEvent()}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading || uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploading ? `${Math.round(progress)}%` : 'Creating...'}
            </>
          ) : (
            `Create (${remainingEvents()} left)`
          )}
        </button>
      </div>
    </div>
  );
}