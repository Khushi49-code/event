// app/invitations/view/[id]/page.tsx
// Public, guest-facing invitation card. No login required — this is the page
// the personal WhatsApp links (built in the RSVP page) point to.
"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/config'; // ⚠️ same firebase config file used in the builder page
import { Loader2 } from 'lucide-react';

const templates = [
  { id: 'wedding', name: 'Wedding', icon: '💒' },
  { id: 'anniversary', name: 'Anniversary', icon: '💝' },
  { id: 'birthday', name: 'Birthday', icon: '🎂' },
  { id: 'corporate', name: 'Corporate', icon: '🏢' },
  { id: 'bni', name: 'BNI Event', icon: '🤝' },
  { id: 'custom', name: 'Custom', icon: '✨' },
];

const templateDecorations: Record<
  string,
  {
    background: string;
    items: { emoji: string; top?: string; bottom?: string; left?: string; right?: string; size: string; rotate?: string; opacity?: number }[];
  }
> = {
  wedding: {
    background: 'radial-gradient(circle at 15% 15%, #FFE4E9 0%, transparent 45%), radial-gradient(circle at 85% 85%, #FFE4E9 0%, transparent 45%), linear-gradient(135deg, #FFF5F5 0%, #FFFDFB 100%)',
    items: [
      { emoji: '🌸', top: '2%', left: '3%', size: '3.5rem', rotate: '-15deg', opacity: 0.85 },
      { emoji: '🌸', top: '4%', right: '4%', size: '2.5rem', rotate: '20deg', opacity: 0.7 },
      { emoji: '🌿', bottom: '3%', left: '5%', size: '3rem', rotate: '10deg', opacity: 0.75 },
      { emoji: '🌸', bottom: '2%', right: '3%', size: '3.5rem', rotate: '-10deg', opacity: 0.85 },
    ],
  },
  anniversary: {
    background: 'radial-gradient(circle at 10% 20%, #FFE0EC 0%, transparent 45%), radial-gradient(circle at 90% 80%, #FFE0EC 0%, transparent 45%), linear-gradient(135deg, #FFF0F6 0%, #FFFAFC 100%)',
    items: [
      { emoji: '💕', top: '3%', left: '4%', size: '3rem', rotate: '-10deg', opacity: 0.8 },
      { emoji: '💐', top: '3%', right: '3%', size: '3.2rem', rotate: '12deg', opacity: 0.8 },
      { emoji: '💕', bottom: '3%', left: '3%', size: '2.6rem', rotate: '8deg', opacity: 0.7 },
      { emoji: '✨', bottom: '4%', right: '5%', size: '2.4rem', rotate: '-8deg', opacity: 0.7 },
    ],
  },
  birthday: {
    background: 'radial-gradient(circle at 12% 18%, #FFECB3 0%, transparent 45%), radial-gradient(circle at 88% 82%, #FFE0B2 0%, transparent 45%), linear-gradient(135deg, #FFF8E1 0%, #FFFDF6 100%)',
    items: [
      { emoji: '🎈', top: '2%', left: '4%', size: '3.5rem', rotate: '-12deg', opacity: 0.9 },
      { emoji: '🎉', top: '3%', right: '4%', size: '3rem', rotate: '10deg', opacity: 0.85 },
      { emoji: '🎈', bottom: '3%', left: '6%', size: '3rem', rotate: '8deg', opacity: 0.85 },
      { emoji: '🎂', bottom: '2%', right: '3%', size: '3.2rem', rotate: '-8deg', opacity: 0.85 },
    ],
  },
  corporate: {
    background: 'radial-gradient(circle at 10% 15%, #E3E9FF 0%, transparent 45%), radial-gradient(circle at 90% 85%, #E3E9FF 0%, transparent 45%), linear-gradient(135deg, #F0F4FF 0%, #FAFBFF 100%)',
    items: [
      { emoji: '📈', top: '3%', left: '4%', size: '2.6rem', rotate: '-6deg', opacity: 0.5 },
      { emoji: '🏢', top: '3%', right: '4%', size: '2.6rem', rotate: '6deg', opacity: 0.5 },
      { emoji: '💼', bottom: '3%', left: '4%', size: '2.4rem', rotate: '4deg', opacity: 0.45 },
      { emoji: '🤝', bottom: '3%', right: '4%', size: '2.4rem', rotate: '-4deg', opacity: 0.5 },
    ],
  },
  bni: {
    background: 'radial-gradient(circle at 12% 18%, #DFF3E3 0%, transparent 45%), radial-gradient(circle at 88% 82%, #DFF3E3 0%, transparent 45%), linear-gradient(135deg, #E8F5E9 0%, #FAFDFB 100%)',
    items: [
      { emoji: '🤝', top: '3%', left: '4%', size: '3rem', rotate: '-8deg', opacity: 0.7 },
      { emoji: '🌐', top: '3%', right: '4%', size: '2.6rem', rotate: '8deg', opacity: 0.6 },
      { emoji: '📊', bottom: '3%', left: '5%', size: '2.4rem', rotate: '6deg', opacity: 0.55 },
      { emoji: '🤝', bottom: '3%', right: '4%', size: '2.8rem', rotate: '-6deg', opacity: 0.65 },
    ],
  },
  custom: {
    background: 'radial-gradient(circle at 15% 15%, #F0E4FF 0%, transparent 45%), radial-gradient(circle at 85% 85%, #F0E4FF 0%, transparent 45%), linear-gradient(135deg, #F3E5F5 0%, #FDFAFE 100%)',
    items: [
      { emoji: '✨', top: '3%', left: '4%', size: '3rem', rotate: '-10deg', opacity: 0.8 },
      { emoji: '🎊', top: '3%', right: '4%', size: '2.8rem', rotate: '10deg', opacity: 0.75 },
      { emoji: '✨', bottom: '3%', left: '5%', size: '2.6rem', rotate: '8deg', opacity: 0.75 },
      { emoji: '🎊', bottom: '3%', right: '3%', size: '2.6rem', rotate: '-8deg', opacity: 0.75 },
    ],
  },
};

const photoShapes: Record<string, 'circle' | 'square' | 'wide'> = {
  wedding: 'square',
  anniversary: 'wide',
  birthday: 'circle',
  corporate: 'wide',
  bni: 'wide',
  custom: 'wide',
};

export default function InvitationViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invitationId = params?.id as string;
  const guestName = searchParams.get('guest');

  const [invitation, setInvitation] = useState<any>(null);
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
        } else {
          setInvitation(snap.data());
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
  const selectedTemplate = template || 'custom';
  const coverImage = images?.cover || null;
  const uploadedLogo = images?.logo || null;
  const uploadedImages = images?.gallery || [];

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#F3F4F6' }}>
      <div
        className="relative overflow-hidden border rounded-lg p-8 md:p-12 max-w-3xl mx-auto"
        style={{ background: templateDecorations[selectedTemplate]?.background || '#F9FAFB' }}
      >
        {/* Decorative template elements */}
        {templateDecorations[selectedTemplate]?.items.map((item, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="absolute select-none pointer-events-none"
            style={{
              top: item.top,
              bottom: item.bottom,
              left: item.left,
              right: item.right,
              fontSize: item.size,
              transform: `rotate(${item.rotate || '0deg'})`,
              opacity: item.opacity ?? 0.8,
              zIndex: 0,
            }}
          >
            {item.emoji}
          </span>
        ))}

        <div className="relative z-10" style={{ color: colors?.text, fontFamily: fonts?.body }}>
          {/* Cover Image */}
          {coverImage ? (
            <div
              className={
                photoShapes[selectedTemplate] === 'circle'
                  ? 'relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden shadow-lg ring-4 ring-white/80 mb-4'
                  : photoShapes[selectedTemplate] === 'square'
                  ? 'relative w-full aspect-square rounded-lg overflow-hidden shadow-lg mb-4'
                  : 'relative w-full h-80 rounded-lg overflow-hidden shadow-lg mb-4'
              }
            >
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              {uploadedLogo && (
                <div className="absolute top-3 left-3">
                  <img src={uploadedLogo} alt="Logo" className="h-14 object-contain" />
                </div>
              )}
            </div>
          ) : (
            uploadedLogo && (
              <div className="flex justify-center mb-2">
                <img src={uploadedLogo} alt="Logo" className="h-16 object-contain" />
              </div>
            )
          )}

          <div className="p-4 md:p-8">
            {/* Personalized greeting */}
            {guestName && (
              <p
                className="text-center text-sm font-medium mb-2"
                style={{ color: colors?.accent, fontFamily: fonts?.accent }}
              >
                Dear {guestName},
              </p>
            )}

            {/* Title */}
            <div className="text-center mb-6">
              <h1 style={{ fontFamily: fonts?.heading, color: colors?.primary, fontSize: '2.5rem' }}>
                {content?.title}
              </h1>
              <p style={{ fontFamily: fonts?.accent, color: colors?.secondary, fontSize: '1.2rem' }}>
                {content?.subtitle}
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ backgroundColor: colors?.primary }} />
              <span style={{ color: colors?.accent }}>✦</span>
              <div className="flex-1 h-px" style={{ backgroundColor: colors?.primary }} />
            </div>

            {/* Event Details */}
            <div className="space-y-3 text-center">
              <h2 style={{ fontFamily: fonts?.heading, color: colors?.primary, fontSize: '1.5rem' }}>
                {content?.eventName}
              </h2>

              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                <div>
                  <p className="text-sm font-medium" style={{ color: colors?.accent }}>Date</p>
                  <p>{content?.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: colors?.accent }}>Time</p>
                  <p>{content?.time}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium" style={{ color: colors?.accent }}>Venue</p>
                <p>{content?.venue}</p>
                <p className="text-sm text-gray-500">{content?.address}</p>
              </div>

              <div>
                <p className="text-sm font-medium" style={{ color: colors?.accent }}>Host</p>
                <p>{content?.host}</p>
              </div>

              {content?.message && (
                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: `${colors?.primary}10` }}>
                  <p className="italic">{content.message}</p>
                </div>
              )}

              <div className="mt-4">
                <p className="text-sm font-medium" style={{ color: colors?.accent }}>{content?.rsvpText}</p>
                <p>{content?.rsvpDate}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ backgroundColor: colors?.primary }} />
              <span style={{ color: colors?.accent }}>❤</span>
              <div className="flex-1 h-px" style={{ backgroundColor: colors?.primary }} />
            </div>

            <div className="text-center text-sm text-gray-400">
              <p>We look forward to celebrating with you!</p>
            </div>

            {/* Gallery */}
            {uploadedImages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-center font-medium mb-2" style={{ color: colors?.primary }}>
                  Gallery
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {uploadedImages.slice(0, 3).map((url: string, index: number) => (
                    <img key={index} src={url} alt={`Gallery ${index + 1}`} className="w-full h-24 object-cover rounded" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}