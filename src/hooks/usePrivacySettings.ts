import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type PrivacyOption = "everyone" | "connections" | "none";

export interface PrivacySettings {
  who_can_message: PrivacyOption;
  who_can_view_profile: PrivacyOption;
  who_can_comment: PrivacyOption;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  who_can_message: "everyone",
  who_can_view_profile: "everyone",
  who_can_comment: "everyone",
};

export const usePrivacySettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await (supabase as any)
        .from("privacy_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setSettings({
          who_can_message: data.who_can_message || "everyone",
          who_can_view_profile: data.who_can_view_profile || "everyone",
          who_can_comment: data.who_can_comment || "everyone",
        });
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key: keyof PrivacySettings, value: PrivacyOption) => {
    if (!user?.id) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("privacy_settings")
        .upsert({ user_id: user.id, ...newSettings }, { onConflict: "user_id" });

      if (error) throw error;
      toast({ title: "Privacy settings updated" });
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      setSettings(settings);
      toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return { settings, isLoading, isSaving, updateSetting };
};
