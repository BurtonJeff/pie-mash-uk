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

export interface GroupChallengeFormData {
  title: string;
  description: string;
  points_reward: string;
  start_date: string;
  end_date: string;
  criteria_type: 'total_checkins' | 'unique_shops' | 'shop_tour';
  criteria_value: string;
  criteria_shops: string[];
}

export async function createGroupChallenge(groupId: string, data: GroupChallengeFormData): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('challenges').insert({
    title: data.title,
    description: data.description,
    points_reward: parseInt(data.points_reward, 10),
    start_date: data.start_date,
    end_date: data.end_date,
    scope: 'group',
    is_active: true,
    group_id: groupId,
    criteria: {
      type: data.criteria_type,
      value: data.criteria_type !== 'shop_tour' ? parseInt(data.criteria_value, 10) : 0,
      shops: data.criteria_type === 'shop_tour' ? data.criteria_shops : [],
    },
    created_by: user?.id,
  });
  if (error) throw error;
}

export async function updateGroupChallenge(challengeId: string, data: GroupChallengeFormData): Promise<void> {
  const { error } = await supabase
    .from('challenges')
    .update({
      title: data.title,
      description: data.description,
      points_reward: parseInt(data.points_reward, 10),
      start_date: data.start_date,
      end_date: data.end_date,
      criteria: {
        type: data.criteria_type,
        value: data.criteria_type !== 'shop_tour' ? parseInt(data.criteria_value, 10) : 0,
        shops: data.criteria_type === 'shop_tour' ? data.criteria_shops : [],
      },
    })
    .eq('id', challengeId);
  if (error) throw error;
}

export async function deleteGroupChallenge(challengeId: string): Promise<void> {
  const { error } = await supabase.from('challenges').delete().eq('id', challengeId);
  if (error) throw error;
}

export interface CompletedChallenge {
  id: string;
  challengeId: string;
  title: string;
  description: string;
  completedAt: string;
}

export async function fetchUserCompletedChallenges(userId: string): Promise<CompletedChallenge[]> {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('id, completed_at, challenges(id, title, description)')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    challengeId: row.challenges?.id ?? '',
    title: row.challenges?.title ?? '',
    description: row.challenges?.description ?? '',
    completedAt: row.completed_at,
  }));
}
