// lib/services/supportService.ts
import { db } from '@/lib/config';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';

// === TYPES ===
export interface SupportFormData {
  subject: string;
  category: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface SupportRequest extends SupportFormData {
  id?: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  status: 'pending' | 'in-progress' | 'resolved' | 'closed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
  assignedTo?: string;
  notes?: string[];
}

export interface SupportResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// === CONSTANTS ===
const SUPPORT_COLLECTION = 'supportRequests';

// === HELPER FUNCTIONS ===
const convertToSupportRequest = (doc: QueryDocumentSnapshot<DocumentData>): SupportRequest => {
  const data = doc.data();
  return {
    id: doc.id,
    subject: data.subject || '',
    category: data.category || '',
    message: data.message || '',
    priority: data.priority || 'medium',
    userId: data.userId || null,
    userEmail: data.userEmail || null,
    userName: data.userName || null,
    status: data.status || 'pending',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    resolvedAt: data.resolvedAt,
    assignedTo: data.assignedTo,
    notes: data.notes || [],
  };
};

// === MAIN FUNCTIONS ===

// Submit a new support request
export const submitSupportRequest = async (
  formData: SupportFormData,
  user: User | null
): Promise<SupportResponse> => {
  try {
    console.log('🔵 Starting support request submission...');
    console.log('📝 Form Data:', formData);
    console.log('👤 User:', user);
    
    if (!user) {
      console.error('❌ No user found');
      return { 
        success: false, 
        error: 'User must be logged in to submit a support request' 
      };
    }

    const supportData = {
      ...formData,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notes: [],
    };

    console.log('📤 Sending data to Firebase:', supportData);

    const docRef = await addDoc(collection(db, SUPPORT_COLLECTION), supportData);
    
    console.log('✅ Document written with ID:', docRef.id);
    
    return { 
      success: true, 
      id: docRef.id 
    };
  } catch (error) {
    console.error('❌ Error submitting support request:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Get support requests for a specific user (without index requirement)
export const getUserSupportRequests = async (
  userId: string,
  limitCount: number = 50
): Promise<SupportRequest[]> => {
  try {
    console.log('🔵 Fetching support history for user:', userId);
    
    // Query without orderBy to avoid index requirement
    const q = query(
      collection(db, SUPPORT_COLLECTION),
      where('userId', '==', userId),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const requests: SupportRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      requests.push(convertToSupportRequest(doc));
    });
    
    // Sort client-side by createdAt (newest first)
    requests.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });
    
    console.log(`✅ Found ${requests.length} support requests`);
    return requests;
  } catch (error) {
    console.error('❌ Error fetching user support requests:', error);
    throw error;
  }
};

// Get all support requests (admin only)
export const getAllSupportRequests = async (
  limitCount: number = 100
): Promise<SupportRequest[]> => {
  try {
    const q = query(
      collection(db, SUPPORT_COLLECTION),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const requests: SupportRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      requests.push(convertToSupportRequest(doc));
    });
    
    // Sort client-side
    requests.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });
    
    return requests;
  } catch (error) {
    console.error('Error fetching all support requests:', error);
    throw error;
  }
};

// Get a single support request by ID
export const getSupportRequestById = async (
  requestId: string
): Promise<SupportRequest | null> => {
  try {
    const docRef = doc(db, SUPPORT_COLLECTION, requestId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return convertToSupportRequest(docSnap as QueryDocumentSnapshot<DocumentData>);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching support request:', error);
    throw error;
  }
};

// Update support request status
export const updateSupportRequestStatus = async (
  requestId: string,
  status: 'pending' | 'in-progress' | 'resolved' | 'closed'
): Promise<boolean> => {
  try {
    const docRef = doc(db, SUPPORT_COLLECTION, requestId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
      ...(status === 'resolved' ? { resolvedAt: serverTimestamp() } : {})
    });
    return true;
  } catch (error) {
    console.error('Error updating support request status:', error);
    return false;
  }
};

// Test Firebase connection
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔵 Testing Firebase connection...');
    
    const testRef = await addDoc(collection(db, 'test_connection'), {
      message: 'Test connection',
      timestamp: serverTimestamp(),
      testId: Date.now().toString()
    });
    
    console.log('✅ Test document written with ID:', testRef.id);
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};