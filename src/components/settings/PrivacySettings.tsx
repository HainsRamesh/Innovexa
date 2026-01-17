import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrivacySettings, PrivacyOption } from '@/hooks/usePrivacySettings';
import { Loader2, Eye, MessageSquare, MessageCircle, Activity, Globe } from 'lucide-react';

export const PrivacySettings = () => {
  const { settings, isLoading, isSaving, updateSetting } = usePrivacySettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const privacyOptions: { value: PrivacyOption; label: string }[] = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'connections', label: 'Connections Only' },
    { value: 'none', label: 'Nobody' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Who Can View My Profile</CardTitle>
              <CardDescription>Control who can see your profile information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.who_can_view_profile}
            onValueChange={(value: PrivacyOption) => updateSetting('who_can_view_profile', value)}
            disabled={isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {privacyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Messaging Privacy */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Who Can Message Me</CardTitle>
              <CardDescription>Control who can send you direct messages</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.who_can_message}
            onValueChange={(value: PrivacyOption) => updateSetting('who_can_message', value)}
            disabled={isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {privacyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Comments Privacy */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Who Can Comment</CardTitle>
              <CardDescription>Control who can comment on your content</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.who_can_comment}
            onValueChange={(value: PrivacyOption) => updateSetting('who_can_comment', value)}
            disabled={isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="connections">Connections Only</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Activity Status */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Activity Status</CardTitle>
              <CardDescription>Show when you're active on the platform</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Show Activity Status</Label>
              <p className="text-sm text-muted-foreground">Let others see when you're online</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Profile Visibility Toggle */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Profile Visibility</CardTitle>
              <CardDescription>Make your profile public or private</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Public Profile</Label>
              <p className="text-sm text-muted-foreground">Allow your profile to appear in search results</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
