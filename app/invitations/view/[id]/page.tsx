// app/invitations/view/[id]/page.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, DocumentReference, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/config';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Loader2, Check, X, Heart, Minus, Plus, Pencil } from 'lucide-react';
import InvitationCard from '@/components/InvitationCard';
import toast from 'react-hot-toast';

type RsvpStatus = 'accepted' | 'declined' | null;

interface FunctionGuestCount {
  adults: number;
  children: number;
}

const POPUP_RETRY_MS = 10000;

// 🔥 Auth ready thay tyaa sudhi wait (max 8 sec). Fakt tyare j vapray je Firestore
// "permission-denied" aape. Normal case ma card turant dekhay, koi wait nathi.
const waitForAuth = () =>
  new Promise<void>((resolve) => {
    if (auth.currentUser) return resolve();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        unsub();
        resolve();
      }
    });
    setTimeout(() => {
      unsub();
      resolve();
    }, 8000);
  });

// getDoc je permission-denied par auth ready thay pachhi ek var retry kare
const safeGetDoc = async (ref: DocumentReference<DocumentData>): Promise<DocumentSnapshot<DocumentData>> => {
  try {
    return await getDoc(ref);
  } catch (e: any) {
    if (e?.code === 'permission-denied') {
      await waitForAuth();
      return await getDoc(ref);
    }
    throw e;
  }
};

export default function InvitationViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invitationId = params?.id as string;
  const guestName = searchParams.get('guest');
  const rsvpId = searchParams.get('rsvpId');

  const [invitation, setInvitation] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(null);
  // Used only when the event has a single function (no per-function picker)
  const [adultsCount, setAdultsCount] = useState<number>(1);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [accommodationNeeded, setAccommodationNeeded] = useState<boolean | null>(null);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  // Per-function headcount, keyed by function name — used when the event
  // has more than one function (the picker is shown).
  const [functionCounts, setFunctionCounts] = useState<Record<string, FunctionGuestCount>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'form' | 'summary'>('form');
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🔥 Anonymous Auth — BACKGROUND ma thay che, card ne block nathi karto.
  // Guest ne koi login/panel nathi dekhatu. onAuthStateChanged no first fire
  // wait kare che jethi host ni restoring session hijack na thay.
  useEffect(() => {
    let signingIn = false;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) return;

      if (!signingIn) {
        signingIn = true;
        signInAnonymously(auth).catch((err) => {
          console.error('Error with anonymous auth:', err);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch Guest RSVP (previous response hoy to). Link ma rsvpId na hoy to pan card dekhase.
  useEffect(() => {
    const fetchGuestRSVP = async () => {
      if (!rsvpId) return;
      try {
        const rsvpSnap = await safeGetDoc(doc(db, 'guests', rsvpId));
        if (rsvpSnap.exists()) {
          const data = rsvpSnap.data();
          if (data.status === 'Confirmed' || data.status === 'Declined') {
            setRsvpStatus(data.status === 'Confirmed' ? 'accepted' : 'declined');
            setSubmitted(true);
            if (data.adults) setAdultsCount(data.adults);
            if (data.children) setChildrenCount(data.children);
            if (data.accommodationNeeded !== undefined) {
              setAccommodationNeeded(data.accommodationNeeded);
            }
            if (Array.isArray(data.attendingFunctions)) {
              setSelectedFunctions(data.attendingFunctions);
            }
            if (data.functionGuests && typeof data.functionGuests === 'object') {
              setFunctionCounts(data.functionGuests);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching guest RSVP:', err);
      }
    };
    fetchGuestRSVP();
  }, [rsvpId]);

  // Fetch Invitation and Event
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!invitationId) {
        setError('No invitation ID provided');
        setLoading(false);
        return;
      }
      try {
        const snap = await safeGetDoc(doc(db, 'invitations', invitationId));
        if (!snap.exists()) {
          setError('This invitation could not be found.');
          setLoading(false);
          return;
        }
        const invitationData = snap.data();

        let allFunctions = invitationData?.content?.allFunctions || [];
        let eventData: any = null;

        if (invitationData?.eventId) {
          try {
            const eventSnap = await safeGetDoc(doc(db, 'events', invitationData.eventId));
            if (eventSnap.exists()) {
              eventData = eventSnap.data();
              if (!allFunctions || allFunctions.length === 0) {
                allFunctions = eventData.functions || [];
                if (invitationData.content) {
                  invitationData.content.allFunctions = allFunctions;
                }
              }
            }
          } catch (evErr) {
            console.error('Error loading event:', evErr);
          }
        }

        setInvitation(invitationData);
        if (eventData) setEvent(eventData);
      } catch (err) {
        console.error('Error loading invitation:', err);
        setError('Something went wrong loading this invitation.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [invitationId]);

  // Popup scheduling — card pehla dekhay, 10 sec pachhi RSVP popup (fakt jo rsvpId hoy)
  useEffect(() => {
    if (loading || error || !invitation || submitted || !rsvpId) return;

    retryTimerRef.current = setTimeout(() => {
      setModalMode('form');
      setShowModal(true);
    }, POPUP_RETRY_MS);

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [loading, error, invitation, submitted, showModal, rsvpId]);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const getFunctionName = (fn: any, idx: number) =>
    fn?.name || fn?.functionName || fn?.title || `Function ${idx + 1}`;

  const toggleFunction = (name: string) => {
    const isSelected = selectedFunctions.includes(name);
    if (isSelected) {
      setSelectedFunctions((prev) => prev.filter((n) => n !== name));
    } else {
      setSelectedFunctions((prev) => [...prev, name]);
      setFunctionCounts((prev) =>
        prev[name] ? prev : { ...prev, [name]: { adults: 1, children: 0 } }
      );
    }
  };

  const updateFunctionCount = (name: string, field: keyof FunctionGuestCount, delta: number) => {
    setFunctionCounts((prev) => {
      const current = prev[name] || { adults: 1, children: 0 };
      const min = field === 'adults' ? 1 : 0;
      const nextVal = Math.max(min, current[field] + delta);
      return { ...prev, [name]: { ...current, [field]: nextVal } };
    });
  };

  const handleSubmit = async () => {
    if (!rsvpStatus) {
      setSubmitError('Please choose whether you can make it.');
      return;
    }
    if (rsvpStatus === 'accepted' && accommodationNeeded === null) {
      setSubmitError('Please let us know if you need accommodation.');
      return;
    }

    const allFunctionsList = invitation?.content?.allFunctions || [];
    const showFunctionPicker = rsvpStatus === 'accepted' && allFunctionsList.length > 1;

    if (rsvpStatus === 'accepted' && allFunctionsList.length > 1 && selectedFunctions.length === 0) {
      setSubmitError('Please select which function(s) you will attend.');
      return;
    }

    if (!rsvpId) {
      setSubmitError('Invalid RSVP link. Please contact the host.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      let adultsToSave = 0;
      let childrenToSave = 0;
      let functionGuestsToSave: Record<string, FunctionGuestCount> | null = null;

      if (rsvpStatus === 'accepted') {
        if (showFunctionPicker) {
          functionGuestsToSave = {};
          for (const name of selectedFunctions) {
            const c = functionCounts[name] || { adults: 1, children: 0 };
            functionGuestsToSave[name] = c;
            adultsToSave += c.adults;
            childrenToSave += c.children;
          }
        } else {
          adultsToSave = adultsCount;
          childrenToSave = childrenCount;
          const singleFunctionName =
            allFunctionsList.length === 1 ? getFunctionName(allFunctionsList[0], 0) : null;
          if (singleFunctionName) {
            functionGuestsToSave = {
              [singleFunctionName]: { adults: adultsCount, children: childrenCount },
            };
          }
        }
      }

      await updateDoc(doc(db, 'guests', rsvpId), {
        status: rsvpStatus === 'accepted' ? 'Confirmed' : 'Declined',
        adults: rsvpStatus === 'accepted' ? adultsToSave : 0,
        children: rsvpStatus === 'accepted' ? childrenToSave : 0,
        guests: rsvpStatus === 'accepted' ? adultsToSave + childrenToSave : 0,
        accommodationNeeded: rsvpStatus === 'accepted' ? accommodationNeeded : null,
        attendingFunctions: rsvpStatus === 'accepted' ? selectedFunctions : [],
        functionGuests: rsvpStatus === 'accepted' ? functionGuestsToSave : null,
        respondedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        respondedAsGuestName: guestName || 'Guest',
      });

      setSubmitted(true);
      setShowModal(false);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

      toast.success('RSVP submitted successfully!');
    } catch (err) {
      console.error('Error saving RSVP:', err);
      setSubmitError('Something went wrong saving your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // 🔥 Fakt invitation load thay tyaa sudhi spinner. Auth/login par koi wait nathi.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF8F3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#7B1E3A]" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF8F3] px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-[#3A2E28]">{error || 'Invitation not found'}</p>
          <p className="text-sm text-[#8A7A6D] mt-2">Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  const { template, colors, fonts, content, images, selectedFunction } = invitation;

  const invitationContent = {
    ...content,
    allFunctions: content?.allFunctions || [],
  };

  const allFunctionsList = invitationContent.allFunctions;
  const functionNames = allFunctionsList.map((fn: any, idx: number) => getFunctionName(fn, idx));
  const showFunctionPicker = rsvpStatus === 'accepted' && allFunctionsList.length > 1;
  const isAllFunctionsSelected =
    functionNames.length > 0 && functionNames.every((n: string) => selectedFunctions.includes(n));

  const selectedFunctionTotals = selectedFunctions.reduce(
    (acc, name) => {
      const c = functionCounts[name] || { adults: 1, children: 0 };
      acc.adults += c.adults;
      acc.children += c.children;
      return acc;
    },
    { adults: 0, children: 0 }
  );

  const SubmittedSummaryBody = (
    <div className="p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3E7D8]">
        <Heart className="h-5 w-5 text-[#7B1E3A]" fill="#7B1E3A" />
      </div>
      <p className="text-base font-medium text-[#3A2E28]">
        {rsvpStatus === 'accepted'
          ? "Thank you — you're marked as attending!"
          : "Thanks for letting us know you can't make it."}
      </p>
      {rsvpStatus === 'accepted' && allFunctionsList.length > 1 && (
        <div className="text-sm text-[#8A7A6D] mt-2 space-y-0.5">
          {selectedFunctions.length > 0 ? (
            selectedFunctions.map((name) => {
              const c = functionCounts[name] || { adults: 1, children: 0 };
              return (
                <p key={name}>
                  {name}: {c.adults} adult{c.adults === 1 ? '' : 's'}
                  {c.children > 0 ? `, ${c.children} child${c.children === 1 ? '' : 'ren'}` : ''}
                  {accommodationNeeded !== null
                    ? ` · Accommodation: ${accommodationNeeded ? 'Requested' : 'Not needed'}`
                    : ''}
                </p>
              );
            })
          ) : (
            <p>Not specified</p>
          )}
        </div>
      )}
      {rsvpStatus === 'accepted' && allFunctionsList.length <= 1 && (
        <p className="text-sm text-[#8A7A6D] mt-2">
          {adultsCount} adult{adultsCount === 1 ? '' : 's'}
          {childrenCount > 0 ? `, ${childrenCount} child${childrenCount === 1 ? '' : 'ren'}` : ''}
          {accommodationNeeded !== null
            ? ` · Accommodation: ${accommodationNeeded ? 'Requested' : 'Not needed'}`
            : ''}
        </p>
      )}
    </div>
  );

  const RsvpFormBody = (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-[#3A2E28] mb-2 tracking-wide">
          Will you be attending?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setRsvpStatus('accepted')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${
              rsvpStatus === 'accepted'
                ? 'bg-[#7B1E3A] border-[#7B1E3A] text-white shadow-sm'
                : 'border-[#E8DCC8] text-[#3A2E28] hover:border-[#C6A05C] hover:bg-[#FBF3E4]'
            }`}
          >
            <Check className="h-4 w-4" />
            Accept
          </button>
          <button
            type="button"
            onClick={() => {
              setRsvpStatus('declined');
              setAccommodationNeeded(null);
              setSelectedFunctions([]);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${
              rsvpStatus === 'declined'
                ? 'bg-[#3A2E28] border-[#3A2E28] text-white shadow-sm'
                : 'border-[#E8DCC8] text-[#3A2E28] hover:border-[#C6A05C] hover:bg-[#FBF3E4]'
            }`}
          >
            <X className="h-4 w-4" />
            Decline
          </button>
        </div>
      </div>

      {rsvpStatus === 'accepted' && (
        <>
          {showFunctionPicker && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[#3A2E28] tracking-wide">
                  Which function(s) will you attend?
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedFunctions(isAllFunctionsSelected ? [] : functionNames)
                  }
                  className="text-xs font-medium text-[#7B1E3A] underline underline-offset-2"
                >
                  {isAllFunctionsSelected ? 'Clear all' : 'Select all'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allFunctionsList.map((fn: any, idx: number) => {
                  const name = getFunctionName(fn, idx);
                  const isSelected = selectedFunctions.includes(name);
                  return (
                    <button
                      key={name + idx}
                      type="button"
                      onClick={() => toggleFunction(name)}
                      className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                        isSelected
                          ? 'bg-[#7B1E3A] border-[#7B1E3A] text-white shadow-sm'
                          : 'border-[#E8DCC8] text-[#3A2E28] hover:border-[#C6A05C] hover:bg-[#FBF3E4]'
                      }`}
                    >
                      <span className="font-medium">{name}</span>
                      {(fn?.date || fn?.venue) && (
                        <span className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#8A7A6D]'}`}>
                          {fn?.date}{fn?.date && fn?.venue ? ' · ' : ''}{fn?.venue}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedFunctions.length > 0 && (
                <div className="mt-3 space-y-3">
                  {selectedFunctions.map((name) => {
                    const count = functionCounts[name] || { adults: 1, children: 0 };
                    return (
                      <div
                        key={name}
                        className="rounded-lg border border-[#E8DCC8] p-3 bg-[#FBF3E4]/40"
                      >
                        <p className="text-sm font-medium text-[#3A2E28] mb-2">{name}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-[#8A7A6D] mb-1">Adults</p>
                            <div className="flex items-center justify-between rounded-lg border border-[#E8DCC8] px-3 py-1.5 bg-white">
                              <button
                                type="button"
                                onClick={() => updateFunctionCount(name, 'adults', -1)}
                                className="text-[#7B1E3A] hover:text-[#5A1529]"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-medium text-[#3A2E28]">{count.adults}</span>
                              <button
                                type="button"
                                onClick={() => updateFunctionCount(name, 'adults', 1)}
                                className="text-[#7B1E3A] hover:text-[#5A1529]"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-[#8A7A6D] mb-1">Children</p>
                            <div className="flex items-center justify-between rounded-lg border border-[#E8DCC8] px-3 py-1.5 bg-white">
                              <button
                                type="button"
                                onClick={() => updateFunctionCount(name, 'children', -1)}
                                className="text-[#7B1E3A] hover:text-[#5A1529]"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-medium text-[#3A2E28]">{count.children}</span>
                              <button
                                type="button"
                                onClick={() => updateFunctionCount(name, 'children', 1)}
                                className="text-[#7B1E3A] hover:text-[#5A1529]"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-[#8A7A6D]">
                    Total across selected functions: {selectedFunctionTotals.adults} adult
                    {selectedFunctionTotals.adults === 1 ? '' : 's'}
                    {selectedFunctionTotals.children > 0
                      ? `, ${selectedFunctionTotals.children} child${selectedFunctionTotals.children === 1 ? '' : 'ren'}`
                      : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {!showFunctionPicker && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium text-[#3A2E28] mb-2 tracking-wide">Adults</p>
                  <div className="flex items-center justify-between rounded-lg border border-[#E8DCC8] px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setAdultsCount((n) => Math.max(1, n - 1))}
                      className="text-[#7B1E3A] hover:text-[#5A1529]"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium text-[#3A2E28]">{adultsCount}</span>
                    <button
                      type="button"
                      onClick={() => setAdultsCount((n) => n + 1)}
                      className="text-[#7B1E3A] hover:text-[#5A1529]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#3A2E28] mb-2 tracking-wide">Children</p>
                  <div className="flex items-center justify-between rounded-lg border border-[#E8DCC8] px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setChildrenCount((n) => Math.max(0, n - 1))}
                      className="text-[#7B1E3A] hover:text-[#5A1529]"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium text-[#3A2E28]">{childrenCount}</span>
                    <button
                      type="button"
                      onClick={() => setChildrenCount((n) => n + 1)}
                      className="text-[#7B1E3A] hover:text-[#5A1529]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#8A7A6D] -mt-2">
                Total members attending: {adultsCount + childrenCount}
              </p>
            </>
          )}

          <div>
            <p className="text-sm font-medium text-[#3A2E28] mb-2 tracking-wide">
              Do you need hotel accommodation?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAccommodationNeeded(true)}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                  accommodationNeeded === true
                    ? 'bg-[#C6A05C] border-[#C6A05C] text-white shadow-sm'
                    : 'border-[#E8DCC8] text-[#3A2E28] hover:border-[#C6A05C] hover:bg-[#FBF3E4]'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setAccommodationNeeded(false)}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                  accommodationNeeded === false
                    ? 'bg-[#C6A05C] border-[#C6A05C] text-white shadow-sm'
                    : 'border-[#E8DCC8] text-[#3A2E28] hover:border-[#C6A05C] hover:bg-[#FBF3E4]'
                }`}
              >
                No
              </button>
            </div>
          </div>
        </>
      )}

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-lg bg-[#7B1E3A] text-white py-2.5 text-sm font-medium hover:bg-[#5A1529] disabled:opacity-60 transition-colors shadow-sm"
      >
        {submitting ? 'Saving...' : 'Submit RSVP'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-4 flex flex-col items-center bg-[#FBF8F3] gap-6">
      <InvitationCard
        template={template || 'custom'}
        colors={colors}
        fonts={fonts}
        content={invitationContent}
        images={images || { cover: null, logo: null, gallery: [] }}
        guestName={guestName}
        fallbackMapsUrl={event?.googleMapsUrl || null}
        selectedFunction={selectedFunction}
      />

      {/* RSVP buttons — fakt jyare link ma rsvpId hoy */}
      {rsvpId && (
        <div className="fixed right-4 bottom-4 z-40 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setModalMode(submitted ? 'summary' : 'form');
              setShowModal(true);
            }}
            aria-label={submitted ? 'View response' : 'RSVP'}
            title={submitted ? 'View response' : 'RSVP'}
            className="flex items-center justify-center rounded-full bg-[#7B1E3A] text-white w-12 h-12 shadow-lg hover:bg-[#5A1529] transition-colors"
          >
            <Heart className="h-5 w-5" fill="white" />
          </button>
          {submitted && (
            <button
              type="button"
              onClick={() => {
                setModalMode('form');
                setShowModal(true);
              }}
              aria-label="Update response"
              title="Update response"
              className="flex items-center justify-center rounded-full bg-[#C6A05C] text-white w-12 h-12 shadow-lg hover:bg-[#B08F4A] transition-colors"
            >
              <Pencil className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-md bg-[#FFFDFA] rounded-2xl shadow-xl border border-[#E8DCC8] overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="h-1 bg-gradient-to-r from-[#7B1E3A] via-[#C6A05C] to-[#7B1E3A]" />
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Close"
              className="absolute right-3 top-4 text-[#8A7A6D] hover:text-[#3A2E28] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6 pt-8">
              {modalMode === 'summary' ? (
                SubmittedSummaryBody
              ) : (
                <>
                  <p className="text-center text-sm text-[#8A7A6D] mb-4">
                    Kindly confirm your RSVP
                  </p>
                  {RsvpFormBody}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}