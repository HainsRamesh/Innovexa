import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Heart,
  MessageCircle,
  AtSign,
  MessageSquare,
  CheckCircle,
  Megaphone,
  TrendingUp,
  BellOff,
} from 'lucide-react';

interface NotificationPreferences {
  likes_enabled: boolean;
  comments_enabled: boolean;
  mentions_enabled: boolean;
  messages_enabled: boolean;
  solutions_enabled: boolean;
  system_enabled: boolean;
  investor_interest_enabled: boolean;
  mute_all: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  likes_enabled: true,
  comments_enabled: true,
  mentions_enabled: true,
  messages_enabled: true,
  solutions_enabled: true,
  system_enabled: true,
  investor_interest_enabled: true,
  mute_all: false,
};

export const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await (supabase as any)
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
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
          mute_all: data.mute_all ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
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
        .from('notification_preferences')
        .upsert({ user_id: user.id, ...newPrefs }, { onConflict: 'user_id' });

      if (error) throw error;
      toast({ title: 'Preferences updated' });
    } catch (error) {
      console.error('Error updating preferences:', error);
      setPreferences(preferences);
      toast({ title: 'Error', description: 'Failed to update preferences.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const notificationTypes = [
    { key: 'likes_enabled' as const, label: 'Likes', description: 'When someone likes your content', icon: Heart },
    { key: 'comments_enabled' as const, label: 'Comments', description: 'When someone comments on your content', icon: MessageCircle },
    { key: 'mentions_enabled' as const, label: 'Mentions', description: 'When someone mentions you', icon: AtSign },
    { key: 'messages_enabled' as const, label: 'Messages', description: 'When you receive a new message', icon: MessageSquare },
    { key: 'solutions_enabled' as const, label: 'Solutions & Approvals', description: 'Updates on your solutions', icon: CheckCircle },
    { key: 'investor_interest_enabled' as const, label: 'Investor Interest', description: 'When investors show interest', icon: TrendingUp },
    { key: 'system_enabled' as const, label: 'System Announcements', description: 'Platform updates and news', icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      {/* Mute All */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <BellOff className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg">Mute All Notifications</CardTitle>
              <CardDescription>Temporarily disable all notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Mute All</Label>
              <p className="text-sm text-muted-foreground">Turn off all notifications</p>
            </div>
            <Switch
              checked={preferences.mute_all}
              onCheckedChange={(checked) => updatePreference('mute_all', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Individual Notification Types */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Notification Types</CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {notificationTypes.map((type, index) => (
            <div key={type.key}>
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <type.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <Label className="text-base">{type.label}</Label>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences[type.key] && !preferences.mute_all}
                  onCheckedChange={(checked) => updatePreference(type.key, checked)}
                  disabled={isSaving || preferences.mute_all}
                />
              </div>
              {index < notificationTypes.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
