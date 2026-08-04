// app/invitations/view/[id]/page.tsx
// Public, guest-facing invitation card. No login required — this is the page
// the personal WhatsApp links (built in the RSVP page) point to.
"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/config'; // ⚠️ same firebase config file used in the builder page
import { Loader2 } from 'lucide-react';
import InvitationCard from '@/components/InvitationCard';

export default function InvitationViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invitationId = params?.id as string;
  const guestName = searchParams.get('guest');

  const [invitation, setInvitation] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!invitationId) {
        setError('No invitation ID provided');
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'invitations', invitationId));
        if (!snap.exists()) {
          setError('This invitation could not be found.');
          setLoading(false);
          return;
        }
        const invitationData = snap.data();
        setInvitation(invitationData);

        if (invitationData?.eventId) {
          try {
            const eventSnap = await getDoc(doc(db, 'events', invitationData.eventId));
            if (eventSnap.exists()) setEvent(eventSnap.data());
          } catch (evErr) {
            console.error('Error loading event for maps link:', evErr);
          }
        }
      } catch (err) {
        console.error('Error loading invitation:', err);
        setError('Something went wrong loading this invitation.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [invitationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">{error || 'Invitation not found'}</p>
          <p className="text-sm text-gray-500 mt-2">Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  const { template, colors, fonts, content, images } = invitation;

  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center" style={{ background: '#F3F4F6' }}>
      {/* Same card component the builder preview uses — guests see exactly
          what was designed, no drift between the two pages. */}
      <InvitationCard
        template={template || 'custom'}
        colors={colors}
        fonts={fonts}
        content={content}
        images={images}
        guestName={guestName}
        fallbackMapsUrl={event?.googleMapsUrl || null}
      />
    </div>
  );
}