"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useEvents } from '@/hooks/useFirebase';
import { Loader2, ArrowLeft, Save, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const { getEvent, updateEvent, loading } = useEvents();
  const [formLoading, setFormLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: '',
    eventDate: '',
    venue: '',
    address: '',
    description: '',
    hostNames: '',
    googleMaps: '',
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEvent(eventId);
        if (data) {
          setFormData({
            eventName: data.eventName || data.name || '',
            eventType: data.eventType || '',
            eventDate: data.eventDate ? new Date(data.eventDate).toISOString().split('T')[0] : '',
            venue: data.venue || '',
            address: data.address || '',
            description: data.description || '',
            hostNames: data.hostNames || '',
            googleMaps: data.googleMaps || '',
          });
        }
      } catch (error: any) {
        console.error('Error fetching event:', error);
        toast.error(error.message || 'Error fetching event details');
        router.push('/events');
      } finally {
        setFormLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId, getEvent, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.eventName.trim()) {
      toast.error('Event name is required');
      return;
    }

    if (!formData.eventDate) {
      toast.error('Event date is required');
      return;
    }

    setSaving(true);
    try {
      await updateEvent(eventId, formData);
      toast.success('Event updated successfully!');
      router.push(`/events/${eventId}`);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading || formLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex-1 truncate">
          Edit Event
        </h1>
        <button
          type="submit"
          form="edit-event-form"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Save'
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 max-w-3xl mx-auto">
        <form id="edit-event-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Event Name */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <Label htmlFor="eventName" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              Event Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="eventName"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              placeholder="Enter event name"
              required
              className="w-full text-base py-3 px-4 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Event Type & Date */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <Label htmlFor="eventType" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                Event Type
              </Label>
              <select
                id="eventType"
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-base appearance-none"
              >
                <option value="">Select type</option>
                <option value="Wedding">Wedding</option>
                <option value="Conference">Conference</option>
                <option value="Birthday">Birthday</option>
                <option value="Corporate">Corporate</option>
                <option value="Social">Social</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <Label htmlFor="eventDate" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                Event Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="eventDate"
                name="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={handleChange}
                required
                className="w-full text-base py-3 px-4 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Venue */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <Label htmlFor="venue" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              Venue
            </Label>
            <Input
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="Enter venue name"
              className="w-full text-base py-3 px-4 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Address */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              Address
            </Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter full address"
              className="w-full text-base py-3 px-4 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Host & Google Maps */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <Label htmlFor="hostNames" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                Host Name(s)
              </Label>
              <Input
                id="hostNames"
                name="hostNames"
                value={formData.hostNames}
                onChange={handleChange}
                placeholder="Enter host name(s)"
                className="w-full text-base py-3 px-4 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <Label htmlFor="googleMaps" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                Google Maps Link
              </Label>
              <Input
                id="googleMaps"
                name="googleMaps"
                value={formData.googleMaps}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
                className="w-full text-base py-3 px-4 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              Description
            </Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-base resize-y"
              placeholder="Enter event description"
            />
          </div>

          {/* Mobile Bottom Spacing for Save Button */}
          <div className="h-4" />
        </form>
      </div>

      {/* Fixed Bottom Bar for Mobile - Alternative to sticky header save */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="edit-event-form"
          disabled={saving}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Update Event
            </>
          )}
        </button>
      </div>

      {/* Spacer for fixed bottom bar on mobile */}
      <div className="lg:hidden h-20" />
    </div>
  );
}