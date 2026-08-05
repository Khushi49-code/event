// app/(dashboard)/guests/page.tsx
"use client";

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useEvents, useGuests } from '@/hooks/useFirebase';
import { guestServices } from '@/lib/services';
import { 
  Loader2, 
  UserPlus, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function GuestsPage() {
  const [selectedEvent, setSelectedEvent] = useState('');
  const { events, loading: eventsLoading } = useEvents();
  const { guests, loading: guestsLoading, fetchGuests } = useGuests(selectedEvent);

  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    guests: 1,
    adults: 1,
    children: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      fetchGuests();
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

  // Download template
  const downloadTemplate = () => {
    const template = [
      ['Name*', 'Email', 'Phone*', 'Guests', 'Adults', 'Children'],
      ['John Doe', 'john@example.com', '+91 98765 43210', '2', '1', '1'],
      ['Jane Smith', 'jane@example.com', '+91 98765 43211', '3', '2', '1'],
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(template);
    
    ws['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Guests');
    XLSX.writeFile(wb, 'guest_template.xlsx');
    toast.success('Template downloaded!');
  };

  // Handle file import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedEvent) {
      toast.error('Please select an event first');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setImporting(true);
    const loadingToast = toast.loading('Reading file...');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert to JSON with headers
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      console.log('Raw JSON data:', jsonData);

      if (jsonData.length === 0) {
        toast.error('No data found in the file', { id: loadingToast });
        return;
      }

      // Get headers from the first row
      const firstRow = jsonData[0];
      const headers = Object.keys(firstRow || {});
      console.log('Headers found:', headers);

      // Normalize headers for matching
      const normalizeHeader = (str: string) => str.trim().toLowerCase().replace(/[*\s]/g, '');
      
      // Find column names (case insensitive, ignore * and spaces)
      const nameKey = headers.find(h => normalizeHeader(h) === 'name') || 
                      headers.find(h => normalizeHeader(h).includes('name'));
      const phoneKey = headers.find(h => normalizeHeader(h) === 'phone') || 
                       headers.find(h => normalizeHeader(h).includes('phone'));
      const emailKey = headers.find(h => normalizeHeader(h) === 'email') || 
                       headers.find(h => normalizeHeader(h).includes('email'));
      const guestsKey = headers.find(h => normalizeHeader(h) === 'guests') || 
                        headers.find(h => normalizeHeader(h).includes('guests'));
      const adultsKey = headers.find(h => normalizeHeader(h) === 'adults') || 
                        headers.find(h => normalizeHeader(h).includes('adults'));
      const childrenKey = headers.find(h => normalizeHeader(h) === 'children') || 
                          headers.find(h => normalizeHeader(h).includes('children'));

      console.log('Mapped keys:', { nameKey, phoneKey, emailKey, guestsKey, adultsKey, childrenKey });

      // Validate required columns
      if (!nameKey || !phoneKey) {
        toast.error('Required columns "Name" and "Phone" not found. Please use the template.', { 
          id: loadingToast,
          duration: 4000
        });
        return;
      }

      // Parse and validate data
      const guestsToAdd = jsonData.map((row: any) => {
        const name = String(row[nameKey] || '').trim();
        const phone = String(row[phoneKey] || '').trim();
        const email = emailKey ? String(row[emailKey] || '').trim() : '';
        
        const guestsValue = guestsKey ? row[guestsKey] : 1;
        const adultsValue = adultsKey ? row[adultsKey] : 1;
        const childrenValue = childrenKey ? row[childrenKey] : 0;
        
        const guests = parseInt(String(guestsValue || '1')) || 1;
        const adults = parseInt(String(adultsValue || '1')) || 1;
        const children = parseInt(String(childrenValue || '0')) || 0;

        return {
          name,
          phone,
          email,
          guests: Math.max(1, guests),
          adults: Math.max(0, adults),
          children: Math.max(0, children),
        };
      });

      console.log('Parsed guests:', guestsToAdd);

      // Filter valid guests (must have name and phone)
      const validGuests = guestsToAdd.filter(g => g.name && g.phone);
      const invalidRows = guestsToAdd.filter(g => !g.name || !g.phone);

      if (invalidRows.length > 0) {
        toast.error(`${invalidRows.length} row(s) missing required fields (Name or Phone). These will be skipped.`, {
          id: loadingToast,
          duration: 4000,
          icon: '⚠️'
        });
      }
      
      if (validGuests.length === 0) {
        toast.error('No valid guests found in the file. Please check the template.', {
          id: loadingToast,
          duration: 4000
        });
        return;
      }

      // Confirm import
      if (!confirm(`Import ${validGuests.length} guest(s)? ${invalidRows.length > 0 ? `(${invalidRows.length} invalid rows will be skipped)` : ''}`)) {
        toast.dismiss(loadingToast);
        return;
      }

      toast.loading(`Importing ${validGuests.length} guest(s)...`, { id: loadingToast });

      // Add guests one by one
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const guest of validGuests) {
        try {
          await guestServices.addGuest({
            eventId: selectedEvent,
            name: guest.name,
            email: guest.email || '',
            phone: guest.phone,
            guests: guest.guests,
            adults: guest.adults,
            children: guest.children,
            status: 'Pending',
          });
          successCount++;
        } catch (err: any) {
          errorCount++;
          errors.push(`${guest.name}: ${err.message || 'Unknown error'}`);
          console.error('Error adding guest:', guest.name, err);
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} guest(s)! ${errorCount > 0 ? `Failed: ${errorCount}` : ''}`, {
          id: loadingToast,
          duration: 4000
        });
        if (errors.length > 0) {
          console.error('Import errors:', errors);
          toast.error(`Failed to import ${errors.length} guest(s). Check console for details.`, {
            duration: 5000
          });
        }
        fetchGuests();
      } else {
        toast.error('Failed to import any guests. Please check the file format.', {
          id: loadingToast,
          duration: 4000
        });
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setShowImport(false);

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error?.message || 'Failed to import file', {
        id: loadingToast,
        duration: 4000
      });
    } finally {
      setImporting(false);
    }
  };

  // Filter guests based on search
  const filteredGuests = guests.filter((guest: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      guest.name?.toLowerCase().includes(searchLower) ||
      guest.email?.toLowerCase().includes(searchLower) ||
      guest.phone?.toLowerCase().includes(searchLower) ||
      guest.mobile?.toLowerCase().includes(searchLower) ||
      guest.status?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentGuests = filteredGuests.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset pagination when event changes
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEvent(e.target.value);
    setShowForm(false);
    setShowImport(false);
    setSearchTerm('');
    setCurrentPage(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Template
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowImport(true)}
            disabled={!selectedEvent}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
          <Button 
            onClick={() => setShowForm((s) => !s)} 
            disabled={!selectedEvent}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Guest
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedEvent}
              onChange={handleEventChange}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="">Choose an event...</option>
              {events.map((event: any) => (
                <option key={event.id} value={event.id}>
                  {event.eventName}
                </option>
              ))}
            </select>
          </div>
          {!selectedEvent && (
            <p className="text-sm text-amber-600 mt-2">Select an event above to add or view guests.</p>
          )}
        </CardContent>
      </Card>

      {/* Import Excel Section */}
      {selectedEvent && showImport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Import Guests from Excel
              </CardTitle>
              <button 
                onClick={() => {
                  setShowImport(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Instructions:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Download the template using the "Template" button above</li>
                    <li>Fill in your guest data (Name and Phone are required)</li>
                    <li>Upload the file using the button below</li>
                    <li>Maximum 1000 guests per import</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                disabled={importing}
                className="flex-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
              />
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                className="gap-2 w-full sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>

            {importing && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Importing guests...</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImport(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={importing}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>
                Guest List ({filteredGuests.length})
                {!guestsLoading && filteredGuests.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Showing {startIndex + 1}-{Math.min(endIndex, filteredGuests.length)})
                  </span>
                )}
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search guests..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {guestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
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
                      {currentGuests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            {searchTerm 
                              ? 'No guests match your search' 
                              : 'No guests added yet for this event. Click "Add Guest" to add your first one.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentGuests.map((guest: any) => (
                          <TableRow key={guest.id}>
                            <TableCell className="font-medium">{guest.name || 'N/A'}</TableCell>
                            <TableCell>{guest.email || 'N/A'}</TableCell>
                            <TableCell>{guest.phone || guest.mobile || 'N/A'}</TableCell>
                            <TableCell>{guest.guests || 0}</TableCell>
                            <TableCell>{guest.adults || 0}</TableCell>
                            <TableCell>{guest.children || 0}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                guest.status?.toLowerCase() === 'confirmed' 
                                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                  : guest.status?.toLowerCase() === 'cancelled'
                                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                              }`}>
                                {guest.status || 'Pending'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => handleDeleteGuest(guest.id, guest.name)}
                                className="text-red-500 hover:text-red-700 transition-colors"
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
                </div>

                {/* Pagination Controls */}
                {filteredGuests.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredGuests.length)} of {filteredGuests.length} guests
                      </span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {(() => {
                          const pages = [];
                          const maxVisible = 5;
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
                                className="min-w-[32px]"
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
                                className="min-w-[32px]"
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
                                className="min-w-[32px]"
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
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}