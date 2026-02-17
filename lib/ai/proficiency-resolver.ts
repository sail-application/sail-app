/**
 * lib/ai/proficiency-resolver.ts
 *
 * Resolves the appropriate proficiency level for a given user + methodology set.
 * Queries user_methodology_preferences to find the lowest proficiency across
 * the selected methodologies (better to over-explain than under-explain).
 * Falls back to 'beginner' if no rows are found.
 */

import { createAdminClient } from '@/lib/supabase/admin';

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

const LEVEL_ORDER: Record<ProficiencyLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

/**
 * Returns the lowest proficiency level the user has across the selected methodologies.
 * This ensures the AI doesn't assume knowledge the user hasn't demonstrated.
 *
 * @param userId - The authenticated user's ID
 * @param methodologyIds - The methodology IDs active in the current session
 * @returns The resolved proficiency level (defaults to 'beginner' on any error)
 */
export async function resolveProficiencyLevel(
  userId: string,
  methodologyIds: string[],
): Promise<ProficiencyLevel> {
  if (!userId || methodologyIds.length === 0) return 'beginner';

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('user_methodology_preferences')
      .select('proficiency_level')
      .eq('user_id', userId)
      .in('methodology_id', methodologyIds)
      .eq('is_enabled', true);

    if (error || !data || data.length === 0) return 'beginner';

    // Return the lowest proficiency level found across selected methodologies
    const levels = data
      .map((row) => row.proficiency_level as ProficiencyLevel)
      .filter((l): l is ProficiencyLevel => l in LEVEL_ORDER);

    if (levels.length === 0) return 'beginner';

    return levels.reduce((lowest, current) =>
      LEVEL_ORDER[current] < LEVEL_ORDER[lowest] ? current : lowest,
    );
  } catch {
    return 'beginner';
  }
}
