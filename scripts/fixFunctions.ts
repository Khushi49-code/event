// scripts/fixFunctions.ts - Run this once to fix your data
import { db } from '@/lib/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export async function fixEventFunctions() {
  try {
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventId = eventDoc.id;
      const data = eventDoc.data();
      
      // Check if functions exist and is an array
      if (data.functions && Array.isArray(data.functions)) {
        // Fix the functions array - ensure each item has proper structure
        const fixedFunctions = data.functions.map((fn: any) => {
          // If fn is an object with name, date, time, venue
          if (typeof fn === 'object' && fn !== null) {
            return {
              name: fn.name || '',
              date: fn.date || '',
              time: fn.time || '',
              venue: fn.venue || ''
            };
          }
          return null;
        }).filter(Boolean);
        
        // Update the document with fixed functions
        await updateDoc(doc(db, 'events', eventId), {
          functions: fixedFunctions
        });
        
        console.log(`✅ Fixed functions for event ${eventId}:`, fixedFunctions);
      }
    }
    
    console.log('✅ All events fixed!');
  } catch (error) {
    console.error('Error fixing events:', error);
  }
}

// Call this function from your browser console or a test page