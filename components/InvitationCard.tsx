// components/InvitationCard.tsx
"use client";

import React from 'react';
import { Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';

interface WeddingFunction {
  name: string;
  date: string;
  time: string;
  venue: string;
}

interface InvitationCardProps {
  template: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
    accent: string;
  };
  content: {
    title: string;
    subtitle: string;
    eventName: string;
    date: string;
    time: string;
    venue: string;
    address: string;
    googleMapsUrl: string;
    host: string;
    message: string;
    rsvpText: string;
    rsvpDate: string;
    allFunctions?: WeddingFunction[];
  };
  images: {
    cover: string | null;
    logo: string | null;
    gallery: string[];
  };
  guestName?: string | null;
  fallbackMapsUrl?: string | null;
  selectedFunction?: string;
}

export default function InvitationCard({
  template,
  colors,
  fonts,
  content,
  images,
  guestName,
  fallbackMapsUrl,
  selectedFunction,
}: InvitationCardProps) {
  const hasFunctions = content.allFunctions && content.allFunctions.length > 0;

  console.log('🔥 InvitationCard Debug:', {
    hasFunctions,
    allFunctions: content.allFunctions,
    functionsCount: content.allFunctions?.length || 0,
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return dateStr;
      return dt.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const dt = new Date(`2000-01-01T${timeStr}`);
      if (isNaN(dt.getTime())) return timeStr;
      return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const getMapsUrl = () => {
    if (content.googleMapsUrl && content.googleMapsUrl.trim() !== '') {
      return content.googleMapsUrl;
    }
    if (fallbackMapsUrl && fallbackMapsUrl.trim() !== '') {
      return fallbackMapsUrl;
    }
    if (content.venue || content.address) {
      const query = encodeURIComponent(`${content.venue} ${content.address}`.trim());
      return `https://www.google.com/maps/search/?api=1&query=${query}`;
    }
    return null;
  };

  const mapsUrl = getMapsUrl();
  const showDirections = mapsUrl !== null;

  return (
    <div 
      className="relative w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl transition-all mx-auto"
      style={{ 
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: fonts.body 
      }}
    >
      {images.cover && (
        <div className="relative w-full overflow-hidden" style={{ backgroundColor: colors.background }}>
          <img 
            src={images.cover} 
            alt="Cover" 
            className="w-full h-auto max-h-80 object-contain mx-auto"
            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
          />
        </div>
      )}

      {images.logo && (
        <div className="flex justify-center -mt-10 relative z-10">
          <img 
            src={images.logo} 
            alt="Logo" 
            className="w-20 h-20 rounded-full border-4 shadow-lg object-cover"
            style={{ borderColor: colors.background }}
            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
          />
        </div>
      )}

      <div className="p-6 text-center">
        {hasFunctions && (
          <div 
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ backgroundColor: colors.primary, color: colors.background }}
          >
            💒 Wedding
          </div>
        )}

        {content.title && (
          <h1 
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: fonts.heading, color: colors.primary }}
          >
            {content.title}
          </h1>
        )}

        {content.subtitle && (
          <p className="text-sm mb-4 opacity-80" style={{ fontFamily: fonts.accent }}>
            {content.subtitle}
          </p>
        )}

        {content.eventName && (
          <h2 
            className="text-xl font-semibold mb-4"
            style={{ fontFamily: fonts.heading, color: colors.secondary || colors.primary }}
          >
            {content.eventName}
          </h2>
        )}

        {guestName && (
          <p className="text-sm mb-4 italic opacity-75">For {guestName}</p>
        )}

        {/* 🔥🔥🔥 DISPLAY FUNCTIONS — 2-column grid so several functions
            (4, 6, ...) sit side by side instead of stacking into a very
            tall single column. */}
        {hasFunctions ? (
          <div className="grid grid-cols-2 gap-3 text-left mb-6">
            {content.allFunctions!.map((fn: WeddingFunction, index: number) => {
              const isSelected = selectedFunction === fn.name;
              if (!fn.name && !fn.date && !fn.time && !fn.venue) return null;
              
              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border-l-4 transition-all min-w-0`}
                  style={{ 
                    borderColor: isSelected ? colors.primary : `${colors.primary}40`,
                    backgroundColor: isSelected ? `${colors.primary}10` : 'transparent'
                  }}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <h3 
                      className="font-semibold text-sm truncate"
                      style={{ color: isSelected ? colors.primary : colors.text, fontFamily: fonts.heading }}
                    >
                      {fn.name || `Function ${index + 1}`}
                    </h3>
                    {isSelected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ 
                        backgroundColor: colors.primary, color: colors.background 
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                    {fn.date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 flex-shrink-0" style={{ color: colors.primary }} />
                        <span className="truncate">{formatDate(fn.date)}</span>
                      </div>
                    )}
                    {fn.time && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 flex-shrink-0" style={{ color: colors.primary }} />
                        <span className="truncate">{formatTime(fn.time)}</span>
                      </div>
                    )}
                    {fn.venue && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: colors.primary }} />
                        <span className="line-clamp-2">{fn.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3 text-left mb-6">
            {(content.date || content.time) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-60" style={{ fontFamily: fonts.accent }}>
                  <Calendar className="h-3 w-3 inline mr-1" /> When
                </p>
                <p className="text-sm">
                  {content.date && <span>{formatDate(content.date)}</span>}
                  {content.date && content.time && <span> at </span>}
                  {content.time && <span>{formatTime(content.time)}</span>}
                </p>
              </div>
            )}

            {(content.venue || content.address) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-60" style={{ fontFamily: fonts.accent }}>
                  <MapPin className="h-3 w-3 inline mr-1" /> Where
                </p>
                {content.venue && <p className="text-sm">{content.venue}</p>}
                {content.address && <p className="text-xs opacity-60 mt-1">{content.address}</p>}
              </div>
            )}
          </div>
        )}

        {showDirections && (
          <div className="mt-2 mb-4 text-center">
            <a 
              href={mapsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-4 py-2 rounded-full transition-all hover:scale-105"
              style={{ backgroundColor: colors.primary, color: colors.background, fontFamily: fonts.accent }}
            >
              <ExternalLink className="h-3 w-3" /> Get Directions
            </a>
          </div>
        )}

        {content.host && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: `${colors.primary}30` }}>
            <p className="text-sm">
              Hosted by <span style={{ fontFamily: fonts.accent, color: colors.primary }}>{content.host}</span>
            </p>
          </div>
        )}

        {content.message && (
          <div className="mt-3">
            <p className="text-sm italic opacity-80">"{content.message}"</p>
          </div>
        )}

        {(content.rsvpDate || content.rsvpText) && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: `${colors.primary}30` }}>
            <p className="text-xs uppercase tracking-wider opacity-60" style={{ fontFamily: fonts.accent }}>
              {content.rsvpText || "Please RSVP by"}
            </p>
            {content.rsvpDate && (
              <p className="text-sm font-semibold mt-1" style={{ color: colors.primary }}>
                {new Date(content.rsvpDate).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}