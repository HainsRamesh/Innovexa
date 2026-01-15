import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  MessageSquare,
  Paperclip,
  CheckCheck,
  UserX,
  Info,
} from 'lucide-react';

interface MessagingPreferences {
  message_requests_enabled: boolean;
  allow_attachments: boolean;
  read_receipts_enabled: boolean;
}

const DEFAULT_PREFERENCES: MessagingPreferences = {
  message_requests_enabled: true,
  allow_attachments: true,
  read_receipts_enabled: true,
};

export const MessagingSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<MessagingPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await (supabase as any)
        .from('messaging_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setPreferences({
          message_requests_enabled: data.message_requests_enabled ?? true,
          allow_attachments: data.allow_attachments ?? true,
          read_receipts_enabled: data.read_receipts_enabled ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching messaging preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (key: keyof MessagingPreferences, value: boolean) => {
    if (!user?.id) return;

    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('messaging_preferences')
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

  return (
    <div className="space-y-6">
      {/* Message Requests */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Message Requests</CardTitle>
              <CardDescription>Control how you receive new message requests</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Allow Message Requests</Label>
              <p className="text-sm text-muted-foreground">Receive messages from people you don't follow</p>
            </div>
            <Switch
              checked={preferences.message_requests_enabled}
              onCheckedChange={(checked) => updatePreference('message_requests_enabled', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Paperclip className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Attachments</CardTitle>
              <CardDescription>Control file sharing in messages</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Allow Attachments</Label>
              <p className="text-sm text-muted-foreground">Receive files, images, and documents in messages</p>
            </div>
            <Switch
              checked={preferences.allow_attachments}
              onCheckedChange={(checked) => updatePreference('allow_attachments', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Read Receipts */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <CheckCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Read Receipts</CardTitle>
              <CardDescription>Control message read status visibility</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Show Read Receipts</Label>
              <p className="text-sm text-muted-foreground">Let others know when you've read their messages</p>
            </div>
            <Switch
              checked={preferences.read_receipts_enabled}
              onCheckedChange={(checked) => updatePreference('read_receipts_enabled', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Blocked Users Info */}
      <Alert className="bg-muted/50 border-border">
        <UserX className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Blocked users</span> cannot send you messages. Manage blocked accounts in the{' '}
          <span className="text-primary font-medium">Blocked Accounts</span> section.
        </AlertDescription>
      </Alert>
    </div>
  );
};
