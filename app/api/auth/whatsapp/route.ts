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
  getDoc,
  limit
} from 'firebase/firestore';

// GET: Fetch WhatsApp templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'templates';
    const eventId = searchParams.get('eventId');

    if (type === 'logs') {
      // Fetch WhatsApp logs
      let q;
      if (eventId) {
        q = query(
          collection(db, 'whatsappLogs'),
          where('eventId', '==', eventId),
          where('userId', '==', session.user.id),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      } else {
        q = query(
          collection(db, 'whatsappLogs'),
          where('userId', '==', session.user.id),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      }
      
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      return NextResponse.json(logs);
    } else {
      // Fetch WhatsApp templates
      let q;
      if (eventId) {
        q = query(
          collection(db, 'whatsappTemplates'),
          where('eventId', '==', eventId),
          where('userId', '==', session.user.id),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'whatsappTemplates'),
          where('userId', '==', session.user.id),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      const templates = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      return NextResponse.json(templates);
    }
  } catch (error) {
    console.error('Error fetching WhatsApp data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp data' },
      { status: 500 }
    );
  }
}

// POST: Create template or send message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const action = data.action || 'template';

    if (action === 'send') {
      // Send WhatsApp message
      return await sendWhatsAppMessage(data, session.user.id);
    } else if (action === 'template') {
      // Save WhatsApp template
      return await saveWhatsAppTemplate(data, session.user.id);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "send" or "template"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing WhatsApp action:', error);
    return NextResponse.json(
      { error: 'Failed to process WhatsApp action' },
      { status: 500 }
    );
  }
}

// PUT: Update WhatsApp template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'template';
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const collectionName = type === 'template' ? 'whatsappTemplates' : 'whatsappLogs';
    const docRef = doc(db, collectionName, id);
    
    // Check if document exists and belongs to user
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    const docData = docSnap.data();
    if (docData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this item' },
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
    console.error('Error updating WhatsApp item:', error);
    return NextResponse.json(
      { error: 'Failed to update WhatsApp item' },
      { status: 500 }
    );
  }
}

// DELETE: Delete WhatsApp template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'template';
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const collectionName = type === 'template' ? 'whatsappTemplates' : 'whatsappLogs';
    const docRef = doc(db, collectionName, id);
    
    // Check if document exists and belongs to user
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    const docData = docSnap.data();
    if (docData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this item' },
        { status: 403 }
      );
    }

    await deleteDoc(docRef);
    return NextResponse.json({ 
      success: true, 
      message: 'Item deleted successfully',
      id 
    });
  } catch (error) {
    console.error('Error deleting WhatsApp item:', error);
    return NextResponse.json(
      { error: 'Failed to delete WhatsApp item' },
      { status: 500 }
    );
  }
}

// Helper: Send WhatsApp Message
async function sendWhatsAppMessage(data: any, userId: string) {
  // Validate required fields
  if (!data.templateId && !data.message) {
    return NextResponse.json(
      { error: 'Template ID or message is required' },
      { status: 400 }
    );
  }

  if (!data.recipientNumber) {
    return NextResponse.json(
      { error: 'Recipient number is required' },
      { status: 400 }
    );
  }

  // Check if template exists
  let templateData = null;
  if (data.templateId) {
    const templateRef = doc(db, 'whatsappTemplates', data.templateId);
    const templateSnap = await getDoc(templateRef);
    if (templateSnap.exists()) {
      templateData = templateSnap.data();
    }
  }

  // Prepare message content
  const messageContent = templateData ? templateData.content : data.message;
  const messageSubject = templateData ? templateData.subject : data.subject || 'WhatsApp Message';

  // In production, integrate with WhatsApp Business API
  // This is a placeholder for the actual WhatsApp API call
  const messageLog = {
    eventId: data.eventId || '',
    templateId: data.templateId || '',
    templateName: templateData?.name || '',
    recipientNumber: data.recipientNumber,
    recipientName: data.recipientName || '',
    subject: messageSubject,
    message: messageContent,
    status: 'sent', // 'sent', 'delivered', 'failed'
    type: data.type || 'template',
    userId: userId,
    sentAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    response: data.response || null,
  };

  // Log the message in Firebase
  const docRef = await addDoc(collection(db, 'whatsappLogs'), messageLog);

  return NextResponse.json({
    id: docRef.id,
    ...messageLog,
    success: true,
    message: 'Message sent successfully',
    // In production, you would return actual WhatsApp API response
  }, { status: 201 });
}

// Helper: Save WhatsApp Template
async function saveWhatsAppTemplate(data: any, userId: string) {
  // Validate required fields
  if (!data.name) {
    return NextResponse.json(
      { error: 'Template name is required' },
      { status: 400 }
    );
  }

  if (!data.content) {
    return NextResponse.json(
      { error: 'Template content is required' },
      { status: 400 }
    );
  }

  const templateData = {
    name: data.name,
    content: data.content,
    subject: data.subject || '',
    eventId: data.eventId || '',
    type: data.type || 'message', // 'message', 'invitation', 'reminder', 'custom'
    variables: data.variables || [],
    userId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'whatsappTemplates'), templateData);
  
  return NextResponse.json(
    { id: docRef.id, ...templateData },
    { status: 201 }
  );
}