// src/lib/reminders.ts
import { supabase } from "./supabase";

export type NotificationPrefs = {
  email_enabled: boolean;
  reminder_30_days: boolean;
  reminder_7_days: boolean;
  reminder_1_day: boolean;
  email_time: string; // 'HH:mm'
};

const DEFAULTS: NotificationPrefs = {
  email_enabled: true,
  reminder_30_days: true,
  reminder_7_days: true,
  reminder_1_day: true,
  email_time: "09:00",
};

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("email_enabled, reminder_30_days, reminder_7_days, reminder_1_day, email_time")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    // create default row once
    const { error: insErr } = await supabase.from("notification_preferences").insert({
      user_id: session.user.id,
      ...DEFAULTS,
      email_time: DEFAULTS.email_time + ":00",
    });
    if (insErr) throw insErr;
    return DEFAULTS;
  }

  return {
    email_enabled: data.email_enabled,
    reminder_30_days: data.reminder_30_days,
    reminder_7_days: data.reminder_7_days,
    reminder_1_day: data.reminder_1_day,
    email_time: (data.email_time as string).slice(0, 5),
  };
}

export async function saveNotificationPrefs(prefs: NotificationPrefs) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not signed in");

  const payload = {
    user_id: session.user.id,
    email_enabled: prefs.email_enabled,
    reminder_30_days: prefs.reminder_30_days,
    reminder_7_days: prefs.reminder_7_days,
    reminder_1_day: prefs.reminder_1_day,
    email_time: prefs.email_time + ":00",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(payload);
  if (error) throw error;
}
