import { File } from 'expo-file-system/next';
import { supabase } from './supabase';

export interface DidYouKnowFact {
  id: string;
  fact: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface LegalContent {
  id: string;
  type: 'privacy_policy' | 'terms_of_service';
  content: string;
  updated_at: string;
}

// ── Public ───────────────────────────────────────────────────────────────────

export async function fetchActiveDidYouKnowFacts(): Promise<DidYouKnowFact[]> {
  const { data, error } = await supabase
    .from('did_you_know')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchActiveFaqItems(): Promise<FaqItem[]> {
  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchLegalContent(
  type: 'privacy_policy' | 'terms_of_service',
): Promise<string> {
  const { data, error } = await supabase
    .from('legal_content')
    .select('content')
    .eq('type', type)
    .single();
  if (error) throw error;
  return data?.content ?? '';
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function fetchAllDidYouKnowFacts(): Promise<DidYouKnowFact[]> {
  const { data, error } = await supabase
    .from('did_you_know')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function upsertDidYouKnowFact(
  payload: Omit<DidYouKnowFact, 'created_at'> | Omit<DidYouKnowFact, 'id' | 'created_at'>,
): Promise<void> {
  const { error } = await supabase.from('did_you_know').upsert(payload);
  if (error) throw error;
}

export async function deleteDidYouKnowFact(id: string): Promise<void> {
  const { error } = await supabase.from('did_you_know').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchAllFaqItems(): Promise<FaqItem[]> {
  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function upsertFaqItem(
  payload: Omit<FaqItem, 'created_at'> | Omit<FaqItem, 'id' | 'created_at'>,
): Promise<void> {
  const { error } = await supabase.from('faq_items').upsert(payload);
  if (error) throw error;
}

export async function deleteFaqItem(id: string): Promise<void> {
  const { error } = await supabase.from('faq_items').delete().eq('id', id);
  if (error) throw error;
}

// ── Onboarding Slides ─────────────────────────────────────────────────────────

export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  emoji: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export async function fetchActiveOnboardingSlides(): Promise<OnboardingSlide[]> {
  const { data, error } = await supabase
    .from('onboarding_slides')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllOnboardingSlides(): Promise<OnboardingSlide[]> {
  const { data, error } = await supabase
    .from('onboarding_slides')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function upsertOnboardingSlide(
  payload: Omit<OnboardingSlide, 'created_at'> | Omit<OnboardingSlide, 'id' | 'created_at'>,
): Promise<void> {
  const { error } = await supabase.from('onboarding_slides').upsert(payload);
  if (error) throw error;
}

export async function deleteOnboardingSlide(id: string): Promise<void> {
  const { error } = await supabase.from('onboarding_slides').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadOnboardingImage(uri: string): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const path = `slides/${Date.now()}.${ext}`;

  const file = new File(uri);
  const bytes = await file.bytes();

  const { error } = await supabase.storage
    .from('onboarding-images')
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from('onboarding-images').getPublicUrl(path);
  return data.publicUrl;
}

// ── Social Links ──────────────────────────────────────────────────────────────

export interface SocialLink {
  id: string;
  label: string;
  url: string;
  icon_name: string;
  icon_color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export async function fetchActiveSocialLinks(): Promise<SocialLink[]> {
  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllSocialLinks(): Promise<SocialLink[]> {
  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function upsertSocialLink(
  payload: Omit<SocialLink, 'created_at'> | Omit<SocialLink, 'id' | 'created_at'>,
): Promise<void> {
  const { error } = await supabase.from('social_links').upsert(payload);
  if (error) throw error;
}

export async function deleteSocialLink(id: string): Promise<void> {
  const { error } = await supabase.from('social_links').delete().eq('id', id);
  if (error) throw error;
}

// ── App Config ────────────────────────────────────────────────────────────────

export async function fetchAppConfig(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', key)
    .single();
  if (error) return null;
  return data?.value ?? null;
}

export async function setAppConfig(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('app_config')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}

export async function saveLegalContent(
  type: 'privacy_policy' | 'terms_of_service',
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from('legal_content')
    .upsert({ type, content, updated_at: new Date().toISOString() }, { onConflict: 'type' });
  if (error) throw error;
}

export interface DidYouKnowLinkConfig {
  url: string;
  text: string;
  bold: string;
}

export async function fetchDidYouKnowLinkConfig(): Promise<DidYouKnowLinkConfig> {
  const keys = ['did_you_know_link_url', 'did_you_know_link_text', 'did_you_know_link_bold'];
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value')
    .in('key', keys);

  if (error) throw error;

  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;

  return {
    url: map['did_you_know_link_url'] ?? '',
    text: map['did_you_know_link_text'] ?? 'Learn more from',
    bold: map['did_you_know_link_bold'] ?? "Norman's Conquest",
  };
}
