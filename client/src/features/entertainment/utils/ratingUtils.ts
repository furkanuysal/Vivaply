export const getRatingClasses = (rating: number) => {
  if (rating === 0)
    return "bg-skin-rating-none/20 text-skin-rating-none border-skin-rating-none/50 hover:bg-skin-rating-none/30";
  if (rating >= 9.5)
    return "bg-skin-rating-95/20 text-skin-rating-95 border-skin-rating-95/50 hover:bg-skin-rating-95/30";
  if (rating >= 9.0)
    return "bg-skin-rating-90/20 text-skin-rating-90 border-skin-rating-90/50 hover:bg-skin-rating-90/30";
  if (rating >= 8.0)
    return "bg-skin-rating-80/20 text-skin-rating-80 border-skin-rating-80/50 hover:bg-skin-rating-80/30";
  if (rating >= 7.0)
    return "bg-skin-rating-70/20 text-skin-rating-70 border-skin-rating-70/50 hover:bg-skin-rating-70/30";
  if (rating >= 6.0)
    return "bg-skin-rating-60/20 text-skin-rating-60 border-skin-rating-60/50 hover:bg-skin-rating-60/30";
  if (rating >= 4.5)
    return "bg-skin-rating-45/20 text-skin-rating-45 border-skin-rating-45/50 hover:bg-skin-rating-45/30";
  // Default or bad
  return "bg-skin-rating-bad/20 text-skin-rating-bad border-skin-rating-bad/50 hover:bg-skin-rating-bad/30";
};
