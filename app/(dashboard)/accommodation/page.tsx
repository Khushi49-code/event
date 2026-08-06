"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useAccommodations, useEvents, useGuests } from '@/hooks/useFirebase';
import { Loader2, Hotel, Plus, X, Save, ChevronLeft, ChevronRight, Search, Calendar, BedDouble } from 'lucide-react';
import toast from 'react-hot-toast';

// Simple inline WhatsApp glyph (lucide-react has no brand icon for it)
function WhatsAppIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.876.518 3.63 1.417 5.13L2 22l4.998-1.396A9.953 9.953 0 0 0 12.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.03a8 8 0 0 1-4.29-1.24l-.307-.186-3.11.868.856-3.08-.202-.316A7.996 7.996 0 1 1 20 12a8.005 8.005 0 0 1-7.999 8.03z" />
    </svg>
  );
}

export default function AccommodationPage() {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { accommodations, loading, updateRoomAssignment, addAccommodation } = useAccommodations(selectedEvent);
  const { events, loading: eventsLoading } = useEvents();
  const { guests, loading: guestsLoading } = useGuests(selectedEvent);

  // Only guests whose RSVP is Confirmed (set from the RSVP page) show up here —
  // accommodation is for guests who've actually confirmed they're coming.
  const confirmedGuests = guests.filter((g: any) => g.status === 'Confirmed');

  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    checkIn: '',
    checkOut: '',
    roomType: 'Single',
    hotelName: '',
    roomNumber: '',
  });

  const [roomInputs, setRoomInputs] = useState<Record<string, string>>({});
  // Inline "fix missing phone" inputs, keyed by accommodation doc id
  const [phoneFixInputs, setPhoneFixInputs] = useState<Record<string, string>>({});
  const [fixingPhone, setFixingPhone] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedGuestId('');
    setFormData({
      guestName: '',
      guestPhone: '',
      checkIn: '',
      checkOut: '',
      roomType: 'Single',
      hotelName: '',
      roomNumber: '',
    });
  };

  const handleGuestPick = (guestId: string) => {
    setSelectedGuestId(guestId);
    if (guestId === '__custom__') {
      setFormData((prev) => ({ ...prev, guestName: '', guestPhone: '' }));
      return;
    }
    const guest = confirmedGuests.find((g: any) => g.id === guestId);
    if (guest) {
      setFormData((prev) => ({
        ...prev,
        guestName: guest.name || '',
        guestPhone: guest.phone || guest.mobile || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) {
      toast.error('Please select an event first');
      return;
    }
    if (!formData.guestName.trim()) {
      toast.error('Guest name is required');
      return;
    }
    if (!formData.checkIn || !formData.checkOut) {
      toast.error('Check-in and check-out dates are required');
      return;
    }
    if (new Date(formData.checkOut) < new Date(formData.checkIn)) {
      toast.error('Check-out date cannot be before check-in date');
      return;
    }

    setSaving(true);
    try {
      await addAccommodation({
        ...formData,
        eventId: selectedEvent,
        status: 'Confirmed',
      });
      setShowAddForm(false);
      resetForm();
      toast.success('Accommodation added successfully!');
    } catch (error) {
      console.error('Error adding accommodation:', error);
      toast.error('Error adding accommodation');
    } finally {
      setSaving(false);
    }
  };

  const handleRoomAssign = async (id: string) => {
    const roomNumber = roomInputs[id];
    if (!roomNumber || !roomNumber.trim()) {
      toast.error('Enter a room number first');
      return;
    }
    try {
      await updateRoomAssignment(id, { roomNumber: roomNumber.trim() });
      toast.success('Room assigned successfully!');
      setRoomInputs((prev) => ({ ...prev, [id]: '' }));
    } catch (error) {
      console.error('Error assigning room:', error);
      toast.error('Error assigning room');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateRoomAssignment(id, { status });
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  // Fixes an existing booking that's missing a phone number (e.g. saved
  // before this field existed, or added via manual entry without one).
  const handleFixPhone = async (id: string) => {
    const phone = phoneFixInputs[id];
    if (!phone || !phone.trim()) {
      toast.error('Enter a phone number first');
      return;
    }
    setFixingPhone(id);
    try {
      await updateRoomAssignment(id, { guestPhone: phone.trim() });
      toast.success('Phone number saved — you can now send via WhatsApp');
      setPhoneFixInputs((prev) => ({ ...prev, [id]: '' }));
    } catch (error) {
      console.error('Error saving phone:', error);
      toast.error('Failed to save phone number');
    } finally {
      setFixingPhone(null);
    }
  };

  const handleSendWhatsApp = (acc: any) => {
    const phone = acc.guestPhone;
    if (!phone) {
      toast.error('This booking has no phone number saved. Enter one below and save it first.');
      return;
    }
    const eventName = events.find((e: any) => e.id === selectedEvent)?.eventName || 'the event';
    const lines = [
      `Hi ${acc.guestName || 'there'}! Here are your stay details for ${eventName}:`,
      acc.hotelName ? `🏨 Hotel: ${acc.hotelName}` : null,
      acc.roomType ? `🛏️ Room Type: ${acc.roomType}` : null,
      acc.roomNumber ? `🔑 Room Number: ${acc.roomNumber}` : `🔑 Room Number: to be assigned soon`,
      acc.checkIn ? `📅 Check-in: ${acc.checkIn}` : null,
      acc.checkOut ? `📅 Check-out: ${acc.checkOut}` : null,
      `\nLooking forward to hosting you!`,
    ].filter(Boolean);

    const message = lines.join('\n');
    const cleanPhone = String(phone).replace(/[^\d+]/g, '').replace('+', '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Filter accommodations based on search
  const filteredAccommodations = accommodations.filter((acc: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      acc.guestName?.toLowerCase().includes(searchLower) ||
      acc.hotelName?.toLowerCase().includes(searchLower) ||
      acc.roomType?.toLowerCase().includes(searchLower) ||
      acc.roomNumber?.toLowerCase().includes(searchLower) ||
      acc.status?.toLowerCase().includes(searchLower) ||
      acc.checkIn?.toLowerCase().includes(searchLower) ||
      acc.checkOut?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAccommodations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAccommodations = filteredAccommodations.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEvent(e.target.value);
    setShowAddForm(false);
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Accommodation Management</h1>
        <Button
          onClick={() => setShowAddForm(true)}
          disabled={!selectedEvent}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Booking
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col gap-3">
              <CardTitle className="text-base sm:text-lg">
                Accommodation Bookings
                {!loading && selectedEvent && (
                  <span className="block sm:inline text-xs sm:text-sm font-normal text-gray-500 sm:ml-2">
                    ({filteredAccommodations.length} {filteredAccommodations.length === 1 ? 'booking' : 'bookings'})
                  </span>
                )}
              </CardTitle>
              <select
                value={selectedEvent}
                onChange={handleEventChange}
                className="px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 w-full sm:w-auto text-sm"
              >
                <option value="">Select Event</option>
                {events.map((event: any) => (
                  <option key={event.id} value={event.id}>
                    {event.eventName}
                  </option>
                ))}
              </select>
            </div>
            {selectedEvent && (
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedEvent && (
            <p className="text-sm text-amber-600 mb-4">
              Select an event above to view or add accommodation bookings.
            </p>
          )}

          {selectedEvent && !guestsLoading && confirmedGuests.length === 0 && (
            <p className="text-sm text-amber-600 mb-4">
              No guests have confirmed their RSVP yet for this event — go to the RSVP page and mark guests as
              "Confirmed" first, then they'll show up here for room booking.
            </p>
          )}

          {showAddForm && selectedEvent && (
            <div className="mb-6 p-3 sm:p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm sm:text-base">Add New Booking</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="guestPick">Confirmed Guest *</Label>
                  <select
                    id="guestPick"
                    value={selectedGuestId}
                    onChange={(e) => handleGuestPick(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 border rounded bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">Choose from confirmed RSVPs...</option>
                    {confirmedGuests.map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.name} {g.phone ? `(${g.phone})` : ''}
                      </option>
                    ))}
                    <option value="__custom__">Other (not in RSVP list)</option>
                  </select>
                  {formData.guestName && selectedGuestId && selectedGuestId !== '__custom__' && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Phone auto-filled: {formData.guestPhone || 'none on file'}
                    </p>
                  )}
                </div>

                {selectedGuestId === '__custom__' && (
                  <>
                    <div>
                      <Label htmlFor="guestName">Guest Name *</Label>
                      <Input
                        id="guestName"
                        placeholder="Guest name"
                        value={formData.guestName}
                        onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestPhone">Phone (for WhatsApp)</Label>
                      <Input
                        id="guestPhone"
                        placeholder="+91 98765 43210"
                        value={formData.guestPhone}
                        onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="hotelName">Hotel Name</Label>
                  <Input
                    id="hotelName"
                    placeholder="Hotel Name"
                    value={formData.hotelName}
                    onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="roomType">Room Type</Label>
                  <select
                    id="roomType"
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 border rounded bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Suite">Suite</option>
                    <option value="Deluxe">Deluxe</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="checkIn">Check-in *</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="checkOut">Check-out *</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="roomNumber">Room Number (if known)</Label>
                  <Input
                    id="roomNumber"
                    placeholder="e.g. 204"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-2">
                  <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Booking'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setShowAddForm(false); resetForm(); }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {currentAccommodations.length === 0 ? (
                <p className="text-center py-8 text-gray-500 text-sm">
                  {!selectedEvent
                    ? 'Select an event to see bookings.'
                    : searchTerm
                    ? 'No bookings match your search'
                    : 'No accommodation bookings found for this event yet.'}
                </p>
              ) : (
                <>
                  {/* Mobile: stacked cards */}
                  <div className="space-y-3 md:hidden">
                    {currentAccommodations.map((acc: any) => (
                      <div
                        key={acc.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{acc.guestName}</p>
                            <p className="text-sm text-gray-500 truncate">{acc.hotelName || 'No hotel set'}</p>
                          </div>
                          {acc.guestPhone ? (
                            <button
                              onClick={() => handleSendWhatsApp(acc)}
                              title="Send hotel details via WhatsApp"
                              className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900 text-green-600 shrink-0"
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span>{acc.roomType} &middot; {acc.roomNumber || 'Room not assigned'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span>{acc.checkIn || '—'} → {acc.checkOut || '—'}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <select
                            value={acc.status || 'Confirmed'}
                            onChange={(e) => handleStatusChange(acc.id, e.target.value)}
                            className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
                          >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Pending">Pending</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Checked-in">Checked-in</option>
                            <option value="Checked-out">Checked-out</option>
                          </select>
                        </div>

                        <div className="mt-2 flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Room #"
                            value={roomInputs[acc.id] ?? ''}
                            onChange={(e) => setRoomInputs((prev) => ({ ...prev, [acc.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRoomAssign(acc.id);
                            }}
                            className="flex-1 min-w-0 px-2 py-2 border rounded text-sm"
                          />
                          <button
                            onClick={() => handleRoomAssign(acc.id)}
                            title="Save room number"
                            className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 shrink-0"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        </div>

                        {!acc.guestPhone && (
                          <div className="mt-2 flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Add phone for WhatsApp"
                              value={phoneFixInputs[acc.id] ?? ''}
                              onChange={(e) => setPhoneFixInputs((prev) => ({ ...prev, [acc.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFixPhone(acc.id);
                              }}
                              className="flex-1 min-w-0 px-2 py-2 border rounded text-sm"
                            />
                            <button
                              onClick={() => handleFixPhone(acc.id)}
                              title="Save phone number"
                              className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 shrink-0"
                              disabled={fixingPhone === acc.id}
                            >
                              {fixingPhone === acc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop / tablet: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Guest Name</TableHead>
                          <TableHead>Hotel</TableHead>
                          <TableHead>Room Type</TableHead>
                          <TableHead>Room Number</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assign Room</TableHead>
                          <TableHead>Notify</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentAccommodations.map((acc: any) => (
                          <TableRow key={acc.id}>
                            <TableCell className="font-medium">{acc.guestName}</TableCell>
                            <TableCell>{acc.hotelName || 'N/A'}</TableCell>
                            <TableCell>{acc.roomType}</TableCell>
                            <TableCell>{acc.roomNumber || 'Not assigned'}</TableCell>
                            <TableCell>{acc.checkIn}</TableCell>
                            <TableCell>{acc.checkOut}</TableCell>
                            <TableCell>
                              <select
                                value={acc.status || 'Confirmed'}
                                onChange={(e) => handleStatusChange(acc.id, e.target.value)}
                                className="px-2 py-1 border rounded text-xs bg-white dark:bg-gray-800"
                              >
                                <option value="Confirmed">Confirmed</option>
                                <option value="Pending">Pending</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Checked-in">Checked-in</option>
                                <option value="Checked-out">Checked-out</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="Room #"
                                  value={roomInputs[acc.id] ?? ''}
                                  onChange={(e) => setRoomInputs((prev) => ({ ...prev, [acc.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRoomAssign(acc.id);
                                  }}
                                  className="w-20 px-2 py-1 border rounded text-sm"
                                />
                                <button
                                  onClick={() => handleRoomAssign(acc.id)}
                                  title="Save room number"
                                  className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>
                              {acc.guestPhone ? (
                                <button
                                  onClick={() => handleSendWhatsApp(acc)}
                                  title="Send hotel details via WhatsApp"
                                  className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900 text-green-600"
                                >
                                  <WhatsAppIcon className="h-4 w-4" />
                                </button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    placeholder="Add phone"
                                    value={phoneFixInputs[acc.id] ?? ''}
                                    onChange={(e) => setPhoneFixInputs((prev) => ({ ...prev, [acc.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleFixPhone(acc.id);
                                    }}
                                    className="w-24 px-2 py-1 border rounded text-xs"
                                  />
                                  <button
                                    onClick={() => handleFixPhone(acc.id)}
                                    title="Save phone number"
                                    className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600"
                                    disabled={fixingPhone === acc.id}
                                  >
                                    {fixingPhone === acc.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {/* Pagination Controls */}
              {filteredAccommodations.length > 0 && selectedEvent && (
                <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-500">
                    <span>
                      {startIndex + 1}-{Math.min(endIndex, filteredAccommodations.length)} of {filteredAccommodations.length}
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5}>5 / page</option>
                      <option value={10}>10 / page</option>
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="gap-1 px-2 sm:px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>

                    <div className="flex items-center gap-1 overflow-x-auto">
                      {(() => {
                        const pages = [];
                        const maxVisible = 3;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                        
                        if (endPage - startPage + 1 < maxVisible) {
                          startPage = Math.max(1, endPage - maxVisible + 1);
                        }
                        
                        if (startPage > 1) {
                          pages.push(
                            <Button
                              key={1}
                              variant="outline"
                              size="sm"
                              onClick={() => goToPage(1)}
                              className="min-w-[32px] px-2"
                            >
                              1
                            </Button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="ellipsis1" className="px-1 text-gray-400">
                                …
                              </span>
                            );
                          }
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(i)}
                              className="min-w-[32px] px-2"
                            >
                              {i}
                            </Button>
                          );
                        }
                        
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="ellipsis2" className="px-1 text-gray-400">
                                …
                              </span>
                            );
                          }
                          pages.push(
                            <Button
                              key={totalPages}
                              variant="outline"
                              size="sm"
                              onClick={() => goToPage(totalPages)}
                              className="min-w-[32px] px-2"
                            >
                              {totalPages}
                            </Button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="gap-1 px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}