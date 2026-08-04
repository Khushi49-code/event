"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useEvents } from '@/hooks/useFirebase';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  // FIX: Use getEvent instead of getEventById
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
        // FIX: Use getEvent instead of getEventById
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Event</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name *</Label>
                <Input
                  id="eventName"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  placeholder="Enter event name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
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

              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="Enter venue name"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter full address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostNames">Host Name(s)</Label>
                <Input
                  id="hostNames"
                  name="hostNames"
                  value={formData.hostNames}
                  onChange={handleChange}
                  placeholder="Enter host name(s)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleMaps">Google Maps Link</Label>
                <Input
                  id="googleMaps"
                  name="googleMaps"
                  value={formData.googleMaps}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                  placeholder="Enter event description"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Event
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}