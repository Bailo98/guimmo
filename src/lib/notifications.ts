import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

/**
 * Insert a notification for a user.
 * Silent — never throws; logs error to console only.
 */
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    data: params.data ?? null,
    read: false,
  });
  if (error) {
    // Silently ignore — table may not exist yet in all environments
    console.error("[createNotification] error:", error.message);
  }
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllRead(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}
