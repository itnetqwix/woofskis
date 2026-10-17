/**
 * Official category name, or "Other: {label}".
 * Rows saved before video categories existed have neither field. Their
 * contest category or first tag is display-only and is not a new association.
 */
export function displaySubmissionCategory(input: {
  videoCategory?: { name: string } | null;
  otherCategoryLabel?: string | null;
  contestCategoryName?: string | null;
  tags?: string[] | null;
}): string {
  const other = input.otherCategoryLabel?.trim();
  if (other) return `Other: ${other}`;
  if (input.videoCategory?.name) return input.videoCategory.name;
  return input.contestCategoryName || input.tags?.[0] || '';
}
