export const MAX_GUESTS_PER_EVENT = 500;

// 0 guest hoy to pan minimum 1 credit (event activate karya pachhi)
export const getCreditsForGuests = (count: number): number => {
  if (count <= 100) return 1;
  if (count <= 200) return 2;
  if (count <= 500) return 3;
  return 3; // 500 thi upar allow j nathi karvu (niche block kariye chhiye)
};