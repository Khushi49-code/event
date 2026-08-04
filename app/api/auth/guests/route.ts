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

// GET: Fetch guests for an event
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

    const q = query(
      collection(db, 'guests'),
      where('eventId', '==', eventId),
      where('userId', '==', session.user.id),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const guests = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    return NextResponse.json(guests);
  } catch (error) {
    console.error('Error fetching guests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guests' },
      { status: 500 }
    );
  }
}

// POST: Add a new guest
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    if (!data.name || !data.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if guest already exists with same email for this event
    const existingQuery = query(
      collection(db, 'guests'),
      where('eventId', '==', data.eventId),
      where('email', '==', data.email)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { error: 'Guest with this email already exists for this event' },
        { status: 409 }
      );
    }

    const guestData = {
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      status: data.status || 'pending',
      eventId: data.eventId,
      userId: session.user.id,
      notes: data.notes || '',
      dietary: data.dietary || '',
      plusOne: data.plusOne || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'guests'), guestData);
    
    return NextResponse.json(
      { id: docRef.id, ...guestData }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding guest:', error);
    return NextResponse.json(
      { error: 'Failed to add guest' },
      { status: 500 }
    );
  }
}

// PUT: Update guest status or details
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
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const docRef = doc(db, 'guests', id);
    
    // Check if document exists and belongs to user
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }
    
    const docData = docSnap.data();
    if (docData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this guest' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    // Only update fields that are provided
    if (data.status) updateData.status = data.status;
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.dietary !== undefined) updateData.dietary = data.dietary;
    if (data.plusOne !== undefined) updateData.plusOne = data.plusOne;

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error updating guest:', error);
    return NextResponse.json(
      { error: 'Failed to update guest' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a guest
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
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    const docRef = doc(db, 'guests', id);
    
    // Check if document exists and belongs to user
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }
    
    const docData = docSnap.data();
    if (docData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this guest' },
        { status: 403 }
      );
    }

    await deleteDoc(docRef);
    return NextResponse.json({ 
      success: true, 
      message: 'Guest deleted successfully',
      id 
    });
  } catch (error) {
    console.error('Error deleting guest:', error);
    return NextResponse.json(
      { error: 'Failed to delete guest' },
      { status: 500 }
    );
  }
}

// PATCH: Bulk update guests (optional)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { ids, status } = data;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Guest IDs array is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const id of ids) {
      try {
        const docRef = doc(db, 'guests', id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          errors.push({ id, error: 'Guest not found' });
          continue;
        }
        
        const docData = docSnap.data();
        if (docData.userId !== session.user.id) {
          errors.push({ id, error: 'Unauthorized' });
          continue;
        }

        await updateDoc(docRef, {
          status: status,
          updatedAt: serverTimestamp()
        });

        results.push({ id, success: true });
      } catch (error) {
        errors.push({ id, error: 'Failed to update' });
      }
    }

    return NextResponse.json({ 
      success: true,
      updated: results.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk updating guests:', error);
    return NextResponse.json(
      { error: 'Failed to update guests' },
      { status: 500 }
    );
  }
}