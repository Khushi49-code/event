// app/(dashboard)/guests/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useEvents, useGuests } from '@/hooks/useFirebase';
import { guestServices } from '@/lib/services';
import { Loader2, UserPlus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GuestsPage() {
  const [selectedEvent, setSelectedEvent] = useState('');
  const { events, loading: eventsLoading } = useEvents();
  const { guests, loading: guestsLoading, fetchGuests } = useGuests(selectedEvent);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    guests: 1,
    adults: 1,
    children: 0,
  });

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', guests: 1, adults: 1, children: 0 });
  };

  const handleAddGuest = async () => {
    if (!selectedEvent) {
      toast.error('Please select an event first');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Guest name is required');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('Phone number is required (needed for WhatsApp invites)');
      return;
    }

    setSaving(true);
    try {
      await guestServices.addGuest({
        eventId: selectedEvent,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        guests: Number(form.guests) || 1,
        adults: Number(form.adults) || 1,
        children: Number(form.children) || 0,
        status: 'Pending',
      });
      toast.success('Guest added successfully!');
      resetForm();
      setShowForm(false);
      fetchGuests(); // refresh the list
    } catch (error: any) {
      console.error('Error adding guest:', error);
      toast.error(error?.message || 'Failed to add guest');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGuest = async (id: string, name?: string) => {
    if (!confirm(`Remove ${name || 'this guest'}?`)) return;
    try {
      await guestServices.deleteGuest(id);
      toast.success('Guest removed');
      fetchGuests();
    } catch (error: any) {
      console.error('Error deleting guest:', error);
      toast.error('Failed to remove guest');
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold">Guests</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Add and manage guests for your events</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} disabled={!selectedEvent}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedEvent}
            onChange={(e) => {
              setSelectedEvent(e.target.value);
              setShowForm(false);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">Choose an event...</option>
            {events.map((event: any) => (
              <option key={event.id} value={event.id}>
                {event.eventName}
              </option>
            ))}
          </select>
          {!selectedEvent && (
            <p className="text-sm text-amber-600 mt-2">Select an event above to add or view guests.</p>
          )}
        </CardContent>
      </Card>

      {selectedEvent && showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add New Guest</CardTitle>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Guest full name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone (with country code) *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="guest@email.com"
                />
              </div>
              <div>
                <Label htmlFor="guests">Total Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min={1}
                  value={form.guests}
                  onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="adults">Adults</Label>
                <Input
                  id="adults"
                  type="number"
                  min={0}
                  value={form.adults}
                  onChange={(e) => setForm({ ...form, adults: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="children">Children</Label>
                <Input
                  id="children"
                  type="number"
                  min={0}
                  value={form.children}
                  onChange={(e) => setForm({ ...form, children: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddGuest} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Guest'
                )}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Guest List ({guests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {guestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Adults</TableHead>
                    <TableHead>Children</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No guests added yet for this event. Click "Add Guest" to add your first one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    guests.map((guest: any) => (
                      <TableRow key={guest.id}>
                        <TableCell className="font-medium">{guest.name || 'N/A'}</TableCell>
                        <TableCell>{guest.email || 'N/A'}</TableCell>
                        <TableCell>{guest.phone || guest.mobile || 'N/A'}</TableCell>
                        <TableCell>{guest.guests || 0}</TableCell>
                        <TableCell>{guest.adults || 0}</TableCell>
                        <TableCell>{guest.children || 0}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                            {guest.status || 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleDeleteGuest(guest.id, guest.name)}
                            className="text-red-500 hover:text-red-700"
                            title="Remove guest"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}