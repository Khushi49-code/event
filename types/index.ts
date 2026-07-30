// types/index.ts
export interface Event {
  id: string;
  eventName: string;
  eventType: 'Wedding' | 'Anniversary' | 'Birthday' | 'Corporate' | 'BNI Event';
  eventDate: string;
  venue: string;
  address: string;
  googleMaps?: string;
  hostNames: string;
  coupleNames?: string;
  themeColor: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  guests: number;
  adults: number;
  children: number;
  hotel: boolean;
  status: 'Confirmed' | 'Pending' | 'Declined';
  eventId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RSVP {
  id: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  adults: number;
  children: number;
  status: 'Confirmed' | 'Pending' | 'Declined';
  eventId: string;
  submittedAt: string;
  updatedAt: string;
}

export interface Accommodation {
  id: string;
  guestName: string;
  hotelName: string;
  roomType: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  eventId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  type: 'invitation' | 'reminder' | 'thankyou';
  content: string;
  eventId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  totalGuests: number;
  confirmed: number;
  pending: number;
  declined: number;
  hotelGuests: number;
  occupancy: number;
}