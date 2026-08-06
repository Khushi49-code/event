// app/(dashboard)/events/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Plus, Edit, Trash2, Eye, Search, Loader2, RefreshCw, Calendar, MapPin, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEvents } from '@/hooks/useFirebase';
import toast from 'react-hot-toast';

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { events, loading, error, deleteEvent, refreshEvents } = useEvents();

  const handleDelete = async (id: string, eventName: string) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"?`)) {
      return;
    }

    setDeletingId(id);
    const loadingToast = toast.loading(`Deleting "${eventName}"...`);
    
    try {
      await deleteEvent(id);
      toast.success(`"${eventName}" deleted successfully!`, { 
        id: loadingToast,
        duration: 3000
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete event. Please try again.', { 
        id: loadingToast,
        duration: 4000
      });
      
      // Refresh to ensure data consistency
      await refreshEvents();
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = async () => {
    const refreshToast = toast.loading('Refreshing events...');
    try {
      await refreshEvents();
      toast.success(`Events refreshed successfully`, { 
        id: refreshToast,
        duration: 2000
      });
    } catch (error) {
      toast.error('Failed to refresh events', { 
        id: refreshToast,
        duration: 3000
      });
    }
  };

  // Filter events based on search
  const filteredEvents = events.filter((event) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      event.eventName?.toLowerCase().includes(searchLower) ||
      event.eventType?.toLowerCase().includes(searchLower) ||
      event.venue?.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300';
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 px-3 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Events</h1>
          <Button onClick={handleRefresh} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <p className="text-lg font-semibold">Error Loading Events</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Events</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage and organize your events
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/events/create" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </Link>
        </div>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <CardTitle className="text-base sm:text-lg">
              All Events
              {!loading && (
                <span className="block sm:inline text-xs sm:text-sm font-normal text-gray-500 sm:ml-2">
                  ({filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'})
                </span>
              )}
            </CardTitle>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-2 text-gray-500">Loading events...</p>
            </div>
          ) : (
            <>
              {currentEvents.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-center">
                    {searchTerm ? 'No events match your search' : 'No events found'}
                  </p>
                  {!searchTerm && (
                    <Link href="/events/create">
                      <Button variant="link" className="mt-2">
                        Create your first event
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {/* Mobile: stacked cards */}
                  <div className="space-y-3 md:hidden">
                    {currentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{event.eventName}</p>
                            {event.description && (
                              <p className="text-xs text-gray-500 truncate">{event.description}</p>
                            )}
                          </div>
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs ${getStatusColor(event.status)}`}>
                            {event.status || 'Active'}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span>{event.eventType || 'General'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{event.eventDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-1 border-t border-gray-100 dark:border-gray-800 pt-2">
                          <Link href={`/events/${event.id}`}>
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/events/edit/${event.id}`}>
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDelete(event.id, event.eventName)}
                            disabled={deletingId === event.id}
                          >
                            {deletingId === event.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop / tablet: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Venue</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentEvents.map((event) => (
                          <TableRow key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <TableCell>
                              <div className="font-medium">{event.eventName}</div>
                              {event.description && (
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {event.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center gap-1 w-fit">
                                <Tag className="h-3 w-3" />
                                {event.eventType || 'General'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {event.eventDate}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                {event.venue}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(event.status)}`}>
                                {event.status || 'Active'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1">
                                <Link href={`/events/${event.id}`}>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link href={`/events/edit/${event.id}`}>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => handleDelete(event.id, event.eventName)}
                                  disabled={deletingId === event.id}
                                >
                                  {deletingId === event.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {/* Pagination Controls */}
              {filteredEvents.length > 0 && (
                <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-500">
                    <span>
                      {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length}
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