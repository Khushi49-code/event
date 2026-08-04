// components/InvitationCard.tsx
// Single source of truth for how an invitation *card* looks.
// Used by:
//   - app/(dashboard)/invitations/builder/page.tsx  (live preview while editing)
//   - app/invitations/view/[id]/page.tsx             (public guest-facing page)
//
// Only pass data in — this component has no Firebase/router/tab logic in it,
// so it's safe to reuse anywhere a card needs to be rendered (builder, public
// view, future "download as image" flow, email preview, etc).

export type InvitationColors = {
  primary: string;
  secondary?: string;
  background: string;
  text: string;
  accent: string;
};

export type InvitationFonts = {
  heading: string;
  body: string;
  accent: string;
};

export type InvitationContent = {
  title?: string;
  subtitle?: string;
  eventName?: string;
  date?: string;
  time?: string;
  venue?: string;
  address?: string;
  googleMapsUrl?: string;
  host?: string;
  message?: string;
  rsvpText?: string;
  rsvpDate?: string;
};

export type InvitationImages = {
  cover?: string | null;
  logo?: string | null;
  gallery?: string[];
};

export interface InvitationCardProps {
  template: string;
  colors: InvitationColors;
  fonts: InvitationFonts;
  content: InvitationContent;
  images?: InvitationImages;
  /** Optional personalized greeting, e.g. "Dear Priya," — used on the public view page */
  guestName?: string | null;
  /** Optional fallback Google Maps link (e.g. saved on the linked event) if content.googleMapsUrl is empty */
  fallbackMapsUrl?: string | null;
  /** Extra classes on the outer wrapper, e.g. to control max-width per context */
  className?: string;
}

// Display name shown as the small eyebrow label on the card
const TEMPLATE_NAMES: Record<string, string> = {
  wedding: 'Wedding',
  royal: 'Royal Navy & Gold',
  anniversary: 'Anniversary',
  birthday: 'Birthday',
  corporate: 'Corporate',
  bni: 'BNI Event',
  custom: 'Custom',
};

// Cover photo shape per template — birthday gets a big circle photo,
// wedding/royal get a full-width square, others get a wide rectangle.
const PHOTO_SHAPES: Record<string, 'circle' | 'square' | 'wide'> = {
  wedding: 'square',
  royal: 'square',
  anniversary: 'wide',
  birthday: 'circle',
  corporate: 'wide',
  bni: 'wide',
  custom: 'wide',
};

// A single hairline divider, optionally with a small centered diamond.
// This is the only "decoration" on the card — real premium invitations
// (Minted / Paperless Post style) rely on whitespace and typography,
// not ornaments, to look expensive.
function Divider({ color, withMark = false }: { color: string; withMark?: boolean }) {
  if (!withMark) {
    return <div className="h-px w-full" style={{ backgroundColor: `${color}35` }} />;
  }
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="h-px flex-1" style={{ backgroundColor: `${color}35` }} />
      <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: color, opacity: 0.7 }} />
      <div className="h-px flex-1" style={{ backgroundColor: `${color}35` }} />
    </div>
  );
}

export default function InvitationCard({
  template,
  colors,
  fonts,
  content,
  images,
  guestName,
  fallbackMapsUrl,
  className = '',
}: InvitationCardProps) {
  const coverImage = images?.cover || null;
  const uploadedLogo = images?.logo || null;
  const uploadedImages = images?.gallery || [];
  const photoShape = PHOTO_SHAPES[template] || 'wide';
  const templateName = TEMPLATE_NAMES[template] || 'Custom';

  const mapsUrl =
    content?.googleMapsUrl ||
    fallbackMapsUrl ||
    (content?.venue || content?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [content?.venue, content?.address].filter(Boolean).join(', ')
        )}`
      : null);

  return (
    <div
      className={`w-full max-w-[420px] ${className}`}
      style={{
        background: colors.background,
        boxShadow: '0 30px 70px -25px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.18)',
      }}
    >
      {/* Single clean inset border — restrained, not double-framed or ornamented */}
      <div
        className="m-4 md:m-5 px-8 py-11 md:px-10 md:py-14"
        style={{ border: `1px solid ${colors.primary}45`, fontFamily: fonts.body }}
      >
        {/* Cover photo or logo */}
        {coverImage ? (
          <div
            className={
              photoShape === 'circle'
                ? 'w-28 h-28 mx-auto rounded-full overflow-hidden mb-8'
                : 'w-full aspect-[4/3] overflow-hidden mb-8'
            }
          >
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          </div>
        ) : (
          uploadedLogo && (
            <div className="flex justify-center mb-8">
              <img src={uploadedLogo} alt="Logo" className="h-11 object-contain" />
            </div>
          )
        )}

        {/* Personalized greeting (public view page only, when a guest name is present) */}
        {guestName && (
          <p
            className="text-center text-sm mb-3"
            style={{ color: colors.text, opacity: 0.8, fontFamily: fonts.accent }}
          >
            Dear {guestName},
          </p>
        )}

        {/* Eyebrow label */}
        <p
          className="text-center text-[0.62rem] tracking-[0.3em] uppercase mb-6"
          style={{ color: colors.accent, fontFamily: fonts.accent, opacity: 0.8 }}
        >
          {templateName}
        </p>

        {/* Title */}
        <h1
          className="text-center leading-[1.15]"
          style={{
            fontFamily: fonts.heading,
            color: colors.primary,
            fontSize: 'clamp(1.9rem, 7vw, 2.5rem)',
            letterSpacing: '0.01em',
          }}
        >
          {content?.title}
        </h1>
        {content?.subtitle && (
          <p
            className="text-center mt-3 text-sm"
            style={{ color: colors.text, opacity: 0.65, fontFamily: fonts.accent }}
          >
            {content.subtitle}
          </p>
        )}

        <div className="my-8">
          <Divider color={colors.primary} withMark />
        </div>

        {/* Event name */}
        {content?.eventName && (
          <p
            className="text-center mb-7"
            style={{
              color: colors.text,
              fontFamily: fonts.heading,
              fontSize: '1.25rem',
              letterSpacing: '0.01em',
            }}
          >
            {content.eventName}
          </p>
        )}

        {/* Details */}
        <div className="text-center space-y-5 text-sm" style={{ color: colors.text }}>
          {(content?.date || content?.time) && (
            <div>
              <p
                className="uppercase tracking-[0.2em] text-[0.6rem] mb-1.5 font-medium"
                style={{ color: colors.accent, opacity: 0.85 }}
              >
                When
              </p>
              <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>
                {[content?.date, content?.time].filter(Boolean).join(' at ')}
              </p>
            </div>
          )}
          {(content?.venue || content?.address) && (
            <div>
              <p
                className="uppercase tracking-[0.2em] text-[0.6rem] mb-1.5 font-medium"
                style={{ color: colors.accent, opacity: 0.85 }}
              >
                Where
              </p>
              {content?.venue && <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>{content.venue}</p>}
              {content?.address && (
                <p style={{ opacity: 0.55, fontSize: '0.82rem', marginTop: '2px' }}>{content.address}</p>
              )}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs underline underline-offset-4"
                  style={{ color: colors.accent }}
                >
                  Get Directions
                </a>
              )}
            </div>
          )}
          {content?.host && (
            <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
              Hosted by{' '}
              <span style={{ fontFamily: fonts.heading, opacity: 1 }}>{content.host}</span>
            </p>
          )}
        </div>

        {content?.message && (
          <p
            className="text-center italic text-sm mt-8 leading-relaxed px-1"
            style={{ color: colors.text, opacity: 0.65, fontFamily: fonts.accent }}
          >
            “{content.message}”
          </p>
        )}

        {(content?.rsvpText || content?.rsvpDate) && (
          <>
            <div className="my-8">
              <Divider color={colors.primary} />
            </div>
            <div className="text-center">
              <p
                className="text-[0.62rem] uppercase tracking-[0.25em] mb-1.5"
                style={{ color: colors.accent, opacity: 0.85 }}
              >
                {content?.rsvpText}
              </p>
              <p style={{ color: colors.text, fontFamily: fonts.heading, fontSize: '1rem' }}>
                {content?.rsvpDate}
              </p>
            </div>
          </>
        )}

        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-8">
            {uploadedImages.slice(0, 3).map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-16 object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}