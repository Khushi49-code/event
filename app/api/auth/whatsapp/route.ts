// app/api/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { whatsappServices } from '@/lib/firebase/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await whatsappServices.getTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
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
    
    // Check if it's saving a template or sending a message
    if (data.action === 'send') {
      const log = await whatsappServices.logMessage(data);
      return NextResponse.json(log, { status: 201 });
    } else {
      const template = await whatsappServices.saveTemplate(data);
      return NextResponse.json(template, { status: 201 });
    }
  } catch (error) {
    console.error('Error processing WhatsApp action:', error);
    return NextResponse.json(
      { error: 'Failed to process WhatsApp action' },
      { status: 500 }
    );
  }
}