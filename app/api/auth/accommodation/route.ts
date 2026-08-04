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
      collection(db, 'accommodations'),
      where('eventId', '==', eventId),
      where('userId', '==', session.user.id),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const accommodations = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    return NextResponse.json(accommodations);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accommodations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    if (!data.eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const accommodationData = {
      ...data,
      userId: session.user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: data.status || 'available',
    };

    const docRef = await addDoc(collection(db, 'accommodations'), accommodationData);
    
    return NextResponse.json(
      { id: docRef.id, ...accommodationData }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding accommodation:', error);
    return NextResponse.json(
      { error: 'Failed to add accommodation' },
      { status: 500 }
    );
  }
}

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
        { error: 'Accommodation ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const docRef = doc(db, 'accommodations', id);
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Accommodation not found' },
        { status: 404 }
      );
    }
    
    const docData = docSnap.data();
    if (docData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this accommodation' },
        { status: 403 }
      );
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });

    const updatedDoc = await getDoc(docRef);
    return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error updating accommodation:', error);
    return NextResponse.json(
      { error: 'Failed to update accommodation' },
      { status: 500 }
    );
  }
}

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
        { error: 'Accommodation ID is required' },
        { status: 400 }
      );
    }

    const docRef = doc(db, 'accommodations', id);
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Accommodation not found' },
        { status: 404 }
      );
    }
    
    const docData = docSnap.data();
    if (docData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this accommodation' },
        { status: 403 }
      );
    }

    await deleteDoc(docRef);
    return NextResponse.json({ 
      success: true, 
      message: 'Accommodation deleted successfully',
      id 
    });
  } catch (error) {
    console.error('Error deleting accommodation:', error);
    return NextResponse.json(
      { error: 'Failed to delete accommodation' },
      { status: 500 }
    );
  }
}