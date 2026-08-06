// app/(dashboard)/rsvp/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useRSVP, useEvents } from '@/hooks/useFirebase';
import { Loader2, Filter, Download, Link as LinkIcon, Copy, ChevronLeft, ChevronRight, Search, Mail, Phone, Users } from 'lucide-react';
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

export default function RSVPPage() {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { rsvps, loading, updateRSVP } = useRSVP(selectedEvent);
  const { events, loading: eventsLoading } = useEvents();

  // Look up whichever invitation card exists for the selected event, directly
  // from the 'invitations' collection (every invitation doc has an `eventId`
  // field pointing back to its event) — no dependency on the event doc itself.
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [invitationLoading, setInvitationLoading] = useState(false);

  useEffect(() => {
    if (!selectedEvent) {
      setInvitationId(null);
      return;
    }
    setInvitationLoading(true);
    setInvitationId(null);

    const fetchInvitation = async () => {
      try {
        const q = query(
          collection(db, 'invitations'),
          where('eventId', '==', selectedEvent),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        setInvitationId(snap.empty ? null : snap.docs[0].id);
      } catch (err) {
        console.error('Error looking up invitation for this event:', err);
        setInvitationId(null);
      } finally {
        setInvitationLoading(false);
      }
    };
    fetchInvitation();
  }, [selectedEvent]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateRSVP(id, { status });
      toast.success('RSVP status updated');
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  // Builds a personalized invitation link for a single guest, pointing at
  // the actual invitation card found above for this event.
  const buildGuestLink = (rsvp: any) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      guest: rsvp.name || 'Guest',
      rsvpId: rsvp.id,
    });
    return `${base}/invitations/view/${invitationId}?${params.toString()}`;
  };

  const handleCopyLink = (rsvp: any) => {
    const link = buildGuestLink(rsvp);
    navigator.clipboard.writeText(link);
    toast.success(`Link copied for ${rsvp.name || 'guest'}`);
  };

  const handleSendWhatsApp = (rsvp: any) => {
    if (!rsvp.phone) {
      toast.error('No phone number on file for this guest');
      return;
    }
    const eventName = events.find((e: any) => e.id === selectedEvent)?.eventName || 'our event';
    const link = buildGuestLink(rsvp);
    const message = `Hi ${rsvp.name || 'there'}! You're invited to ${eventName} 🎉\nHere's your personal invitation:\n${link}`;

    // Normalize phone: strip spaces/dashes/parentheses, keep leading +
    const cleanPhone = rsvp.phone.replace(/[^\d+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendWhatsAppAll = () => {
    const withPhone = filteredRSVPs.filter((r: any) => r.phone);
    if (withPhone.length === 0) {
      toast.error('No guests with a phone number in the current list');
      return;
    }
    if (!invitationId) {
      toast.error('Generate the invitation card first (Invitation Builder → Generate Invitation)');
      return;
    }

    toast.success(`Opening WhatsApp for ${withPhone.length} guest(s)... allow pop-ups if your browser blocks them.`);

    // wa.me only supports one chat at a time (no true bulk-send without the
    // WhatsApp Business API), so we open each guest's pre-filled chat with a
    // short stagger to avoid the browser blocking a burst of popups.
    withPhone.forEach((rsvp: any, i: number) => {
      setTimeout(() => handleSendWhatsApp(rsvp), i * 700);
    });
  };

  const exportData = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Guests', 'Adults', 'Children', 'Status', 'Personal Link'],
      ...filteredRSVPs.map((r: any) => [
        r.name || 'N/A',
        r.email || 'N/A',
        r.phone || 'N/A',
        r.guests || 0,
        r.adults || 0,
        r.children || 0,
        r.status || 'Pending',
        selectedEvent ? buildGuestLink(r) : '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rsvp_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };

  // Filter RSVPs based on status and search
  const filteredRSVPs = rsvps.filter((r: any) => {
    const statusMatch = filter === 'All' || r.status === filter;
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = !searchTerm || 
      r.name?.toLowerCase().includes(searchLower) ||
      r.email?.toLowerCase().includes(searchLower) ||
      r.phone?.toLowerCase().includes(searchLower) ||
      r.status?.toLowerCase().includes(searchLower);
    return statusMatch && searchMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRSVPs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRSVPs = filteredRSVPs.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEvent(e.target.value);
    setSearchTerm('');
    setFilter('All');
    setCurrentPage(1);
  };

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const statusClasses = (status?: string) =>
    status === 'Confirmed'
      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
      : status === 'Pending'
      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
      : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">RSVP Management</h1>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button
            onClick={handleSendWhatsAppAll}
            disabled={!selectedEvent || filteredRSVPs.length === 0}
            className="gap-1.5 px-2 sm:px-4 text-xs sm:text-sm"
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Send to All via WhatsApp</span>
            <span className="sm:hidden">Send All</span>
          </Button>
          <Button
            variant="outline"
            onClick={exportData}
            className="gap-1.5 px-2 sm:px-4 text-xs sm:text-sm"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {selectedEvent && invitationLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking for an invitation card...
        </div>
      )}

      {selectedEvent && !invitationLoading && invitationId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300 min-w-0">
            <LinkIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">
              Invitation card is ready — each guest below has their own personal link to it.
            </span>
          </div>
          <a
            href={`${typeof window !== 'undefined' ? window.location.origin : ''}/invitations/view/${invitationId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-green-700 dark:text-green-300 underline shrink-0"
          >
            View card
          </a>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col gap-3">
              <CardTitle className="text-base sm:text-lg">
                RSVP Responses
                {!loading && (
                  <span className="block sm:inline text-xs sm:text-sm font-normal text-gray-500 sm:ml-2">
                    ({filteredRSVPs.length} {filteredRSVPs.length === 1 ? 'response' : 'responses'})
                  </span>
                )}
              </CardTitle>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap w-full sm:w-auto">
                <select
                  value={selectedEvent}
                  onChange={handleEventChange}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">Select Event</option>
                  {events.map((event: any) => (
                    <option key={event.id} value={event.id}>
                      {event.eventName}
                    </option>
                  ))}
                </select>
                <select
                  value={filter}
                  onChange={handleFilterChange}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="All">All</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>
            </div>
            {selectedEvent && (
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search RSVPs..."
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
            <p className="text-sm text-amber-600 mb-3">
              Select an event above to generate personal invitation links for guests.
            </p>
          )}
          {selectedEvent && !invitationLoading && !invitationId && (
            <p className="text-sm text-amber-600 mb-3">
              No invitation card has been generated for this event yet — go to Invitation Builder and click "Generate Invitation" first, otherwise guest links won't open a real card.
            </p>
          )}
          {selectedEvent && (
            <>
              {currentRSVPs.length === 0 ? (
                <p className="text-center py-8 text-gray-500 text-sm">
                  {searchTerm 
                    ? 'No RSVPs match your search' 
                    : filter !== 'All' 
                    ? `No ${filter} RSVPs found` 
                    : 'No RSVP responses found'}
                </p>
              ) : (
                <>
                  {/* Mobile: stacked cards */}
                  <div className="space-y-3 md:hidden">
                    {currentRSVPs.map((rsvp: any) => (
                      <div
                        key={rsvp.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{rsvp.name || 'N/A'}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${statusClasses(rsvp.status)}`}>
                              {rsvp.status || 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleCopyLink(rsvp)}
                              disabled={!invitationId}
                              title="Copy personal invitation link"
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleSendWhatsApp(rsvp)}
                              disabled={!invitationId}
                              title="Send invitation via WhatsApp"
                              className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900 text-green-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{rsvp.phone || 'N/A'}</span>
                          </div>
                          {rsvp.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                              <span className="truncate">{rsvp.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span>
                              {rsvp.guests || 0} total &middot; {rsvp.adults || 0} adults &middot; {rsvp.children || 0} kids
                            </span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <select
                            value={rsvp.status || 'Pending'}
                            onChange={(e) => handleStatusUpdate(rsvp.id, e.target.value)}
                            className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Declined">Declined</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop / tablet: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Total Guests</TableHead>
                          <TableHead>Adults</TableHead>
                          <TableHead>Children</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Invite Link</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentRSVPs.map((rsvp: any) => (
                          <TableRow key={rsvp.id}>
                            <TableCell className="font-medium">{rsvp.name || 'N/A'}</TableCell>
                            <TableCell>{rsvp.email || 'N/A'}</TableCell>
                            <TableCell>{rsvp.phone || 'N/A'}</TableCell>
                            <TableCell>{rsvp.guests || 0}</TableCell>
                            <TableCell>{rsvp.adults || 0}</TableCell>
                            <TableCell>{rsvp.children || 0}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${statusClasses(rsvp.status)}`}>
                                {rsvp.status || 'Pending'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleCopyLink(rsvp)}
                                  disabled={!selectedEvent || !invitationId}
                                  title="Copy personal invitation link"
                                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleSendWhatsApp(rsvp)}
                                  disabled={!selectedEvent || !invitationId}
                                  title="Send invitation via WhatsApp"
                                  className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900 text-green-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <WhatsAppIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <select
                                value={rsvp.status || 'Pending'}
                                onChange={(e) => handleStatusUpdate(rsvp.id, e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm bg-white dark:bg-gray-800"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Declined">Declined</option>
                              </select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {/* Pagination Controls */}
              {filteredRSVPs.length > 0 && (
                <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-500">
                    <span>
                      {startIndex + 1}-{Math.min(endIndex, filteredRSVPs.length)} of {filteredRSVPs.length}
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