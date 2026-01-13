import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface NotificationPreferences {
  likes_enabled: boolean;
  comments_enabled: boolean;
  mentions_enabled: boolean;
  messages_enabled: boolean;
  solutions_enabled: boolean;
  system_enabled: boolean;
  investor_interest_enabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  likes_enabled: true,
  comments_enabled: true,
  mentions_enabled: true,
  messages_enabled: true,
  solutions_enabled: true,
  system_enabled: true,
  investor_interest_enabled: true,
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Table may not exist in types yet - use any
      const { data } = await (supabase as any)
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setPreferences({
          likes_enabled: data.likes_enabled ?? true,
          comments_enabled: data.comments_enabled ?? true,
          mentions_enabled: data.mentions_enabled ?? true,
          messages_enabled: data.messages_enabled ?? true,
          solutions_enabled: data.solutions_enabled ?? true,
          system_enabled: data.system_enabled ?? true,
          investor_interest_enabled: data.investor_interest_enabled ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user?.id) return;

    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          ...newPrefs,
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast({ title: "Preferences updated" });
    } catch (error) {
      console.error("Error updating preferences:", error);
      setPreferences(preferences);
      toast({ title: "Error", description: "Failed to update preferences.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return { preferences, isLoading, isSaving, updatePreference };
};
