// app/(dashboard)/events/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useEvents, useGuests, useRSVP, useAccommodations } from '@/hooks/useFirebase';
import { Loader2, Calendar, MapPin, Users, Hotel, Mail, Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<any>(null);
  const { getEventById, loading: eventLoading } = useEvents();
  const { guests, loading: guestsLoading } = useGuests(eventId);
  const { rsvps, loading: rsvpLoading } = useRSVP(eventId);
  const { accommodations, loading: accLoading } = useAccommodations(eventId);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventById(eventId);
        setEvent(data);
      } catch (error) {
        toast.error('Error fetching event details');
      }
    };
    fetchEvent();
  }, [eventId, getEventById]);

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Event not found</p>
        <Button onClick={() => router.push('/events')} className="mt-4">
          Back to Events
        </Button>
      </div>
    );
  }

  const stats = [
    { label: 'Total Guests', value: guests.length, icon: Users, color: 'bg-blue-500' },
    { label: 'RSVP Confirmed', value: rsvps.filter((r: any) => r.status === 'Confirmed').length, icon: Mail, color: 'bg-green-500' },
    { label: 'Hotel Bookings', value: accommodations.length, icon: Hotel, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{event.eventName}</h1>
        </div>
        <Link href={`/events/edit/${eventId}`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Event
          </Button>
        </Link>
      </div>

      {/* Event Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{new Date(event.eventDate).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Venue</p>
                <p className="font-medium">{event.venue}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Host</p>
                <p className="font-medium">{event.hostNames}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Address */}
      {event.address && (
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">{event.address}</p>
            {event.googleMaps && (
              <a
                href={event.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Open in Google Maps →
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href={`/guests?event=${eventId}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="font-medium">Manage Guests</p>
              <p className="text-sm text-gray-500">{guests.length} guests</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/rsvp?event=${eventId}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="font-medium">View RSVPs</p>
              <p className="text-sm text-gray-500">{rsvps.length} responses</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/accommodation?event=${eventId}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Hotel className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <p className="font-medium">Accommodation</p>
              <p className="text-sm text-gray-500">{accommodations.length} bookings</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/invitations?event=${eventId}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <p className="font-medium">Invitations</p>
              <p className="text-sm text-gray-500">Create invitation</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}