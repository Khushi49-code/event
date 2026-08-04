import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/config';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';

// GET: Fetch RSVPs for an event
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this event
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    const eventData = eventSnap.data();
    if (eventData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to view RSVPs for this event' },
        { status: 403 }
      );
    }

    const q = query(
      collection(db, 'rsvp'),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const rsvps = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    return NextResponse.json(rsvps);
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSVPs' },
      { status: 500 }
    );
  }
}

// POST: Submit a new RSVP (Public - no auth required)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    if (!data.guestId && !data.email) {
      return NextResponse.json(
        { error: 'Guest ID or Email is required' },
        { status: 400 }
      );
    }

    if (!data.response) {
      return NextResponse.json(
        { error: 'Response is required (accepted/declined/pending)' },
        { status: 400 }
      );
    }

    // Check if event exists
    const eventRef = doc(db, 'events', data.eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if guest exists for this event
    let guestId = data.guestId;
    if (!guestId && data.email) {
      // Find guest by email for this event
      const guestQuery = query(
        collection(db, 'guests'),
        where('eventId', '==', data.eventId),
        where('email', '==', data.email)
      );
      const guestSnapshot = await getDocs(guestQuery);
      
      if (guestSnapshot.empty) {
        return NextResponse.json(
          { error: 'Guest not found for this event' },
          { status: 404 }
        );
      }
      
      const guestDoc = guestSnapshot.docs[0];
      guestId = guestDoc.id;
      
      // Update guest status based on RSVP response
      const guestRef = doc(db, 'guests', guestDoc.id);
      await updateDoc(guestRef, {
        status: data.response === 'accepted' ? 'confirmed' : 
                data.response === 'declined' ? 'declined' : 'pending',
        updatedAt: serverTimestamp()
      });
    }

    // Check if RSVP already exists for this guest/event
    const existingQuery = query(
      collection(db, 'rsvp'),
      where('eventId', '==', data.eventId),
      where('guestId', '==', guestId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      // Update existing RSVP
      const existingDoc = existingSnapshot.docs[0];
      const docRef = doc(db, 'rsvp', existingDoc.id);
      
      await updateDoc(docRef, {
        response: data.response,
        notes: data.notes || '',
        guests: data.guests || 1,
        updatedAt: serverTimestamp()
      });

      const updatedDoc = await getDoc(docRef);
      return NextResponse.json({ 
        id: updatedDoc.id, 
        ...updatedDoc.data(),
        updated: true 
      });
    }

    // Create new RSVP
    const rsvpData = {
      eventId: data.eventId,
      guestId: guestId,
      email: data.email || '',
      name: data.name || '',
      response: data.response, // 'accepted', 'declined', 'pending'
      guests: data.guests || 1,
      notes: data.notes || '',
      dietary: data.dietary || '',
      phone: data.phone || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'rsvp'), rsvpData);
    
    return NextResponse.json(
      { id: docRef.id, ...rsvpData }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting RSVP:', error);
    return NextResponse.json(
      { error: 'Failed to submit RSVP' },
      { status: 500 }
    );
  }
}

// PUT: Update RSVP status (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'RSVP ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const docRef = doc(db, 'rsvp', id);
    
    // Check if document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'RSVP not found' },
        { status: 404 }
      );
    }

    const rsvpData = docSnap.data();
    
    // Check if user owns the event
    const eventRef = doc(db, 'events', rsvpData.eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = eventSnap.data();
    if (eventData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this RSVP' },
        { status: 403 }
      );
    }

    // Update RSVP
    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (data.response) updateData.response = data.response;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.guests !== undefined) updateData.guests = data.guests;
    if (data.dietary !== undefined) updateData.dietary = data.dietary;

    await updateDoc(docRef, updateData);

    // Update guest status if response changed
    if (data.response && rsvpData.guestId) {
      const guestRef = doc(db, 'guests', rsvpData.guestId);
      await updateDoc(guestRef, {
        status: data.response === 'accepted' ? 'confirmed' : 
                data.response === 'declined' ? 'declined' : 'pending',
        updatedAt: serverTimestamp()
      });
    }

    const updatedDoc = await getDoc(docRef);
    return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json(
      { error: 'Failed to update RSVP' },
      { status: 500 }
    );
  }
}

// DELETE: Delete an RSVP (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'RSVP ID is required' },
        { status: 400 }
      );
    }

    const docRef = doc(db, 'rsvp', id);
    
    // Check if document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'RSVP not found' },
        { status: 404 }
      );
    }

    const rsvpData = docSnap.data();
    
    // Check if user owns the event
    const eventRef = doc(db, 'events', rsvpData.eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = eventSnap.data();
    if (eventData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this RSVP' },
        { status: 403 }
      );
    }

    await deleteDoc(docRef);
    return NextResponse.json({ 
      success: true, 
      message: 'RSVP deleted successfully',
      id 
    });
  } catch (error) {
    console.error('Error deleting RSVP:', error);
    return NextResponse.json(
      { error: 'Failed to delete RSVP' },
      { status: 500 }
    );
  }
}

// GET: Get RSVP statistics for an event
export async function HEAD(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check event ownership
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    const eventData = eventSnap.data();
    if (eventData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const q = query(
      collection(db, 'rsvp'),
      where('eventId', '==', eventId)
    );
    
    const snapshot = await getDocs(q);
    const rsvps = snapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: rsvps.length,
      accepted: rsvps.filter(r => r.response === 'accepted').length,
      declined: rsvps.filter(r => r.response === 'declined').length,
      pending: rsvps.filter(r => r.response === 'pending').length,
      totalGuests: rsvps.reduce((sum, r) => sum + (r.guests || 1), 0),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching RSVP stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSVP stats' },
      { status: 500 }
    );
  }
}