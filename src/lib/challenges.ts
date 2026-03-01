import { supabase } from './supabase';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  criteria: Record<string, any>;
  pointsReward: number;
  startDate: string;
  endDate: string;
  scope: 'global' | 'group';
  groupId: string | null;
}

export async function fetchActiveChallenges(userGroupIds: string[]): Promise<Challenge[]> {
  const now = new Date().toISOString();

  // Global challenges
  const { data: global, error: ge } = await supabase
    .from('challenges')
    .select('*')
    .eq('scope', 'global')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('end_date');

  if (ge) throw ge;

  let group: any[] = [];
  if (userGroupIds.length > 0) {
    const { data, error: gre } = await supabase
      .from('challenges')
      .select('*')
      .eq('scope', 'group')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .in('group_id', userGroupIds)
      .order('end_date');
    if (gre) throw gre;
    group = data ?? [];
  }

  return [...(global ?? []), ...group].map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    criteria: c.criteria,
    pointsReward: c.points_reward,
    startDate: c.start_date,
    endDate: c.end_date,
    scope: c.scope,
    groupId: c.group_id,
  }));
}
