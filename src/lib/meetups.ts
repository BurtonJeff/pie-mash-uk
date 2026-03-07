import { supabase } from './supabase';

export interface Meetup {
  id: string;
  groupId: string;
  shopId: string;
  shopName: string;
  shopCity: string;
  proposedBy: string;
  proposedByName: string;
  meetupDate: string;   // YYYY-MM-DD
  meetupTime: string;   // HH:MM
  description: string | null;
  maxAttendees: number | null;
  cancelledAt: string | null;
  createdAt: string;
  rsvpCount: number;
  userRsvpd: boolean;
}

export interface UpcomingMeetup {
  id: string;
  groupId: string;
  groupName: string;
  groupCreatedBy: string;
  shopName: string;
  shopCity: string;
  meetupDate: string;  // YYYY-MM-DD
  meetupTime: string;  // HH:MM
  description: string | null;
}

export async function fetchUpcomingUserMeetups(userId: string): Promise<UpcomingMeetup[]> {
  // Step 1: get meetup IDs the user has RSVP'd to
  const { data: rsvps, error: rsvpError } = await supabase
    .from('meetup_rsvps')
    .select('meetup_id')
    .eq('user_id', userId);

  if (rsvpError) throw rsvpError;
  const meetupIds = (rsvps ?? []).map((r: any) => r.meetup_id);
  if (!meetupIds.length) return [];

  // Step 2: fetch those meetups that are upcoming and not cancelled
  const { data, error } = await supabase
    .from('meetups')
    .select(`
      id, group_id, meetup_date, meetup_time, description,
      shops(name, city),
      groups(name, created_by)
    `)
    .in('id', meetupIds)
    .is('cancelled_at', null)
    .gte('meetup_date', todayIso())
    .order('meetup_date', { ascending: true })
    .order('meetup_time', { ascending: true })
    .limit(3);

  if (error) throw error;

  return (data ?? []).map((m: any) => ({
    id: m.id,
    groupId: m.group_id,
    groupName: m.groups?.name ?? '',
    groupCreatedBy: m.groups?.created_by ?? '',
    shopName: m.shops?.name ?? '',
    shopCity: m.shops?.city ?? '',
    meetupDate: m.meetup_date,
    meetupTime: m.meetup_time.slice(0, 5),
    description: m.description ?? null,
  }));
}

export async function fetchGroupMeetups(groupId: string, userId: string): Promise<Meetup[]> {
  const { data: meetups, error } = await supabase
    .from('meetups')
    .select(`
      id, group_id, shop_id, proposed_by, meetup_date, meetup_time,
      description, max_attendees, cancelled_at, created_at,
      shops(name, city),
      profiles!proposed_by(display_name, username)
    `)
    .eq('group_id', groupId)
    .order('meetup_date', { ascending: true })
    .order('meetup_time', { ascending: true });

  if (error) throw error;
  if (!meetups || meetups.length === 0) return [];

  const meetupIds = meetups.map((m: any) => m.id);

  const { data: rsvps } = await supabase
    .from('meetup_rsvps')
    .select('meetup_id, user_id')
    .in('meetup_id', meetupIds);

  const rsvpList = rsvps ?? [];

  return meetups.map((m: any) => {
    const meetupRsvps = rsvpList.filter((r) => r.meetup_id === m.id);
    return {
      id: m.id,
      groupId: m.group_id,
      shopId: m.shop_id,
      shopName: m.shops?.name ?? '',
      shopCity: m.shops?.city ?? '',
      proposedBy: m.proposed_by,
      proposedByName: m.profiles?.display_name || m.profiles?.username || 'Unknown',
      meetupDate: m.meetup_date,
      meetupTime: m.meetup_time.slice(0, 5), // trim seconds
      description: m.description ?? null,
      maxAttendees: m.max_attendees ?? null,
      cancelledAt: m.cancelled_at ?? null,
      createdAt: m.created_at,
      rsvpCount: meetupRsvps.length,
      userRsvpd: meetupRsvps.some((r) => r.user_id === userId),
    };
  });
}

export async function proposeMeetup(params: {
  groupId: string;
  shopId: string;
  proposedBy: string;
  meetupDate: string;   // YYYY-MM-DD
  meetupTime: string;   // HH:MM
  description?: string;
  maxAttendees?: number;
}): Promise<string> {
  const { data, error } = await supabase
    .from('meetups')
    .insert({
      group_id: params.groupId,
      shop_id: params.shopId,
      proposed_by: params.proposedBy,
      meetup_date: params.meetupDate,
      meetup_time: params.meetupTime,
      description: params.description || null,
      max_attendees: params.maxAttendees ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;

  // Fire-and-forget: notify group members.
  supabase.functions
    .invoke('notify-meetup-proposed', {
      body: { group_id: params.groupId, meetup_id: data.id, proposer_id: params.proposedBy },
    })
    .catch(() => {});

  return data.id;
}

export async function updateMeetup(meetupId: string, params: {
  meetupDate: string;
  meetupTime: string;
  description?: string;
  maxAttendees?: number | null;
}): Promise<void> {
  const { error } = await supabase
    .from('meetups')
    .update({
      meetup_date: params.meetupDate,
      meetup_time: params.meetupTime,
      description: params.description ?? null,
      max_attendees: params.maxAttendees ?? null,
    })
    .eq('id', meetupId);
  if (error) throw error;
}

export interface MeetupAttendee {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

export async function fetchMeetupRsvps(meetupId: string): Promise<MeetupAttendee[]> {
  const { data, error } = await supabase
    .from('meetup_rsvps')
    .select('user_id, profiles(display_name, username, avatar_url)')
    .eq('meetup_id', meetupId);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    userId: r.user_id,
    displayName: r.profiles?.display_name || r.profiles?.username || 'Unknown',
    avatarUrl: r.profiles?.avatar_url ?? null,
  }));
}

export async function cancelMeetup(meetupId: string, cancelledBy: string): Promise<void> {
  const { error } = await supabase
    .from('meetups')
    .update({ cancelled_at: new Date().toISOString(), cancelled_by: cancelledBy })
    .eq('id', meetupId);
  if (error) throw error;
}

export async function rsvpMeetup(meetupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('meetup_rsvps')
    .insert({ meetup_id: meetupId, user_id: userId });
  if (error) throw error;
}

export async function unrsvpMeetup(meetupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('meetup_rsvps')
    .delete()
    .eq('meetup_id', meetupId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Validates a proposed meetup time against the shop's opening hours.
 * Returns an error string, or null if the time is valid.
 */
export function validateMeetupTime(
  openingHours: Record<string, any> | null | undefined,
  dateStr: string,  // YYYY-MM-DD
  timeStr: string,  // HH:MM
): string | null {
  if (!openingHours) return null;

  const date = new Date(`${dateStr}T12:00:00`); // noon to avoid DST issues
  const dayName = DAY_NAMES[date.getDay()];
  const day = openingHours[dayName];

  if (!day || day.closed) {
    const displayDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    return `This shop is closed on ${displayDay}s`;
  }

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const timeMin = toMinutes(timeStr);
  const openMin = toMinutes(day.open);
  const closeMin = toMinutes(day.close);

  if (timeMin < openMin || timeMin >= closeMin) {
    const displayDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    return `${displayDay}s: open ${day.open}–${day.close}`;
  }

  return null;
}

/** Formats a YYYY-MM-DD date string as "Saturday 15 March 2026". */
export function formatMeetupDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** Formats a HH:MM time string as "12:30". */
export function formatMeetupTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

/** Returns YYYY-MM-DD for today. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Parses DD/MM/YYYY input to YYYY-MM-DD. Returns null if invalid or in the past. */
export function parseDateInput(input: string): { iso: string } | { error: string } {
  const match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return { error: 'Enter date as DD/MM/YYYY' };
  const [, dd, mm, yyyy] = match;
  const iso = `${yyyy}-${mm}-${dd}`;
  const date = new Date(`${iso}T12:00:00`);
  if (isNaN(date.getTime())) return { error: 'Invalid date' };
  if (iso < todayIso()) return { error: 'Date must be today or in the future' };
  return { iso };
}

/** Parses HH:MM input. Returns null if invalid. */
export function parseTimeInput(input: string): { time: string } | { error: string } {
  const match = input.match(/^(\d{2}):(\d{2})$/);
  if (!match) return { error: 'Enter time as HH:MM' };
  const [, hh, mm] = match;
  const h = parseInt(hh, 10);
  const m = parseInt(mm, 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return { error: 'Invalid time' };
  return { time: `${hh}:${mm}` };
}
