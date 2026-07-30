// app/(dashboard)/events/create/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useEvents } from '@/hooks/useFirebase';
import { useFileUpload } from '@/hooks/useFileUpload'; // Create new file
import toast from 'react-hot-toast';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';

export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useEvents();
  const { uploadFile, uploading, progress, error: uploadError, resetUpload } = useFileUpload();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.size, file.type);

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    // Validate file type
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
    
    // Validate required fields
    if (!formData.eventName || !formData.eventType || !formData.eventDate || 
        !formData.venue || !formData.address || !formData.hostNames) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Creating event...');

    try {
      let imageUrl = '';
      
      // Upload image if selected
      if (selectedImage) {
        try {
          const path = `events/${Date.now()}_${selectedImage.name}`;
          console.log('Uploading to path:', path);
          imageUrl = await uploadFile(selectedImage, path);
          console.log('Upload successful, URL:', imageUrl);
          toast.success('Image uploaded successfully');
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          toast.error(uploadError.message || 'Failed to upload image');
          setLoading(false);
          return;
        }
      }

      // Prepare event data
      const eventData = {
        ...formData,
        imageUrl: imageUrl || formData.imageUrl || '',
        status: 'active',
      };

      console.log('Creating event with data:', eventData);

      // Create event in Firebase
      await createEvent(eventData);
      
      toast.success('Event created successfully!', { 
        id: loadingToast,
        duration: 3000
      });
      
      router.push('/events');
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error(error.message || 'Error creating event. Please try again.', { 
        id: loadingToast,
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create New Event</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Fill in the details to create a new event
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/events')}
          disabled={loading || uploading}
        >
          Cancel
        </Button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Name and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Event Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Venue and Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Venue <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full address"
                />
              </div>
            </div>

            {/* Google Maps URL */}
            <div>
              <label className="block text-sm font-medium mb-1">Google Maps URL</label>
              <input
                type="url"
                value={formData.googleMaps}
                onChange={(e) => setFormData({ ...formData, googleMaps: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://maps.google.com/..."
              />
            </div>

            {/* Host Names */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Host Names <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.hostNames}
                onChange={(e) => setFormData({ ...formData, hostNames: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Host 1, Host 2"
              />
            </div>

            {/* Couple Names */}
            <div>
              <label className="block text-sm font-medium mb-1">Couple Names (if applicable)</label>
              <input
                type="text"
                value={formData.coupleNames}
                onChange={(e) => setFormData({ ...formData, coupleNames: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name 1 & Name 2"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Event description"
                rows={3}
              />
            </div>

            {/* Theme Color */}
            <div>
              <label className="block text-sm font-medium mb-1">Theme Color</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.themeColor}
                  onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                  className="w-16 h-12 p-1 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                />
                <span className="text-sm text-gray-500">{formData.themeColor}</span>
              </div>
            </div>

            {/* Event Image */}
            <div>
              <label className="block text-sm font-medium mb-1">Event Image</label>
              <div className="relative">
                <div className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors ${
                  imagePreview ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                }`}>
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="max-h-64 mx-auto rounded-lg object-contain"
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
                        <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-sm text-gray-500">
                          Click to upload or drag and drop
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

            {/* Form Actions */}
            <div className="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
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
                disabled={loading || uploading}
                className="min-w-[140px]"
              >
                {loading || uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploading ? `Uploading ${Math.round(progress)}%` : 'Creating...'}
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}