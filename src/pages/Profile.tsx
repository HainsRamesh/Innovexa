import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarCropModal } from '@/components/ui/AvatarCropModal';
import { AvatarOptionsSheet } from '@/components/ui/AvatarOptionsSheet';
import { AvatarViewDialog } from '@/components/ui/AvatarViewDialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Camera, Loader2 } from 'lucide-react';

const Profile = () => {
  const { profile, user, updateProfile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [optionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    organization_name: profile?.organization_name || '',
    organization_type: profile?.organization_type || '',
    bio: profile?.bio || '',
    website: profile?.website || '',
  });

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarClick = () => {
    setOptionsSheetOpen(true);
  };

  const handleFileSelect = async (file: File) => {
    if (!user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB for original, will be compressed after crop)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Read file and open crop modal
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

    // Reset file input so same file can be selected again
    e.target.value = '';
    handleFileSelect(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setIsUploading(true);
    try {
      // Create preview from cropped blob
      const previewUrl = URL.createObjectURL(croppedBlob);
      setAvatarPreview(previewUrl);

      // Upload cropped image to storage
      const fileName = `${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, { 
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;

      setCropModalOpen(false);
      setSelectedImageSrc(null);

      toast({
        title: 'Profile photo updated',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setAvatarPreview(null);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
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

  const handleViewPhoto = () => {
    setViewDialogOpen(true);
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleChooseFromGallery = () => {
    fileInputRef.current?.click();
  };

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
      // Update profile to remove avatar URL
      const { error: updateError } = await updateProfile({ avatar_url: null });
      if (updateError) throw updateError;

      setAvatarPreview(null);

      toast({
        title: 'Profile photo removed',
        description: 'Your profile picture has been removed.',
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove profile photo. Please try again.',
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

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayAvatarUrl = avatarPreview || profile?.avatar_url || '';
  const hasAvatar = Boolean(displayAvatarUrl);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Profile Settings</h1>
              <p className="text-muted-foreground">Manage your account information</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Picture</CardTitle>
                <CardDescription>Click on your avatar to manage your picture</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-20 w-20 border-2 border-border cursor-pointer" onClick={handleAvatarClick}>
                    <AvatarImage src={displayAvatarUrl} />
                    <AvatarFallback className="bg-secondary text-foreground text-xl">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                  {/* Hidden file inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                  >
                    Change Picture
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Avatar Options Sheet */}
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

            {/* Avatar View Dialog */}
            <AvatarViewDialog
              open={viewDialogOpen}
              onClose={() => setViewDialogOpen(false)}
              avatarUrl={displayAvatarUrl}
              fallbackText={getInitials(profile?.full_name)}
            />

            {/* Avatar Crop Modal */}
            {selectedImageSrc && (
              <AvatarCropModal
                open={cropModalOpen}
                onClose={handleCropModalClose}
                imageSrc={selectedImageSrc}
                onCropComplete={handleCropComplete}
                isUploading={isUploading}
              />
            )}

            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organization</CardTitle>
                <CardDescription>Your company or organization details</CardDescription>
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

            {/* Submit */}
            <div className="flex justify-end">
              <Button type="submit" variant="default" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
