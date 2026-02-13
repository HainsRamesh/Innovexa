import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AvatarCropModal } from '@/components/ui/AvatarCropModal';
import { AvatarOptionsSheet } from '@/components/ui/AvatarOptionsSheet';
import { AvatarViewDialog } from '@/components/ui/AvatarViewDialog';
import { useToast } from '@/hooks/use-toast';
import { Save, Camera, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const AccountSettings = () => {
  const { profile, user, updateProfile, role } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [optionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    organization_name: '',
    organization_type: '',
    bio: '',
    website: '',
  });

  const [initialFormData, setInitialFormData] = useState(formData);

  useEffect(() => {
    if (profile) {
      const data = {
        full_name: profile.full_name || '',
        organization_name: profile.organization_name || '',
        organization_type: profile.organization_type || '',
        bio: profile.bio || '',
        website: profile.website || '',
      };
      setFormData(data);
      setInitialFormData(data);
    }
  }, [profile]);

  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasChanges(changed);
  }, [formData, initialFormData]);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'innovator': return 'default';
      case 'investor': return 'secondary';
      case 'enterprise': return 'outline';
      case 'admin': return 'destructive';
      default: return 'default';
    }
  };

  const handleAvatarClick = () => setOptionsSheetOpen(true);

  const handleFileSelect = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please select an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image smaller than 5MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    handleFileSelect(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const previewUrl = URL.createObjectURL(croppedBlob);
      setAvatarPreview(previewUrl);
      const fileName = `${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, croppedBlob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;
      setCropModalOpen(false);
      setSelectedImageSrc(null);
      toast({ title: 'Profile photo updated' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setAvatarPreview(null);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropModalClose = () => {
    if (!isUploading) {
      setCropModalOpen(false);
      setSelectedImageSrc(null);
    }
  };

  const handleViewPhoto = () => setViewDialogOpen(true);
  const handleTakePhoto = () => cameraInputRef.current?.click();
  const handleChooseFromGallery = () => fileInputRef.current?.click();
  const handleEditPhoto = () => {
    const currentAvatarUrl = avatarPreview || profile?.avatar_url;
    if (currentAvatarUrl) {
      setSelectedImageSrc(currentAvatarUrl);
      setCropModalOpen(true);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setIsUploading(true);
    try {
      const { error: updateError } = await updateProfile({ avatar_url: null });
      if (updateError) throw updateError;
      setAvatarPreview(null);
      toast({ title: 'Profile photo removed' });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove profile photo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;
      setInitialFormData(formData);
      setHasChanges(false);
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const displayAvatarUrl = avatarPreview || profile?.avatar_url || '';
  const hasAvatar = Boolean(displayAvatarUrl);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {hasChanges && (
        <Alert className="bg-primary/10 border-primary/20">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            You have unsaved changes
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Photo */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Profile Photo</CardTitle>
          <CardDescription>Click to change your profile picture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-border cursor-pointer" onClick={handleAvatarClick}>
                <AvatarImage src={displayAvatarUrl} />
                <AvatarFallback className="bg-secondary text-foreground text-2xl">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleAvatarClick}
              >
                {isUploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileChange} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">{profile?.full_name || 'User'}</p>
              <p className="text-sm text-muted-foreground mb-2">{user?.email}</p>
              {role && (
                <Badge variant={getRoleBadgeVariant(role)} className="capitalize">
                  {role}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organization Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organization_name">Organization Name</Label>
            <Input
              id="organization_name"
              value={formData.organization_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, organization_name: e.target.value }))}
              placeholder="Your company name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization_type">Organization Type</Label>
            <Input
              id="organization_type"
              value={formData.organization_type}
              onChange={(e) => setFormData((prev) => ({ ...prev, organization_type: e.target.value }))}
              placeholder="e.g., Startup, Enterprise, Non-profit"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Modals */}
      <AvatarOptionsSheet
        open={optionsSheetOpen}
        onClose={() => setOptionsSheetOpen(false)}
        hasAvatar={hasAvatar}
        onViewPhoto={handleViewPhoto}
        onTakePhoto={handleTakePhoto}
        onChooseFromGallery={handleChooseFromGallery}
        onEditPhoto={handleEditPhoto}
        onRemovePhoto={handleRemovePhoto}
      />
      <AvatarViewDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        avatarUrl={displayAvatarUrl}
        fallbackText={getInitials(profile?.full_name)}
      />
      {selectedImageSrc && (
        <AvatarCropModal
          open={cropModalOpen}
          onClose={handleCropModalClose}
          imageSrc={selectedImageSrc}
          onCropComplete={handleCropComplete}
          isUploading={isUploading}
        />
      )}
    </form>
  );
};
