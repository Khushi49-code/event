// app/api/accommodation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { accommodationServices } from '@/lib/firebase/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
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

    const accommodations = await accommodationServices.getAccommodationsByEvent(eventId);
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
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const accommodation = await accommodationServices.addAccommodation(data);
    return NextResponse.json(accommodation, { status: 201 });
  } catch (error) {
    console.error('Error adding accommodation:', error);
    return NextResponse.json(
      { error: 'Failed to add accommodation' },
      { status: 500 }
    );
  }
}