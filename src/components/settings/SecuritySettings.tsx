import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Key,
  Shield,
  Smartphone,
  LogOut,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export const SecuritySettings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({ title: 'Error', description: error.message || 'Failed to change password', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast({ title: 'Logged out', description: 'You have been logged out from all devices.' });
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({ title: 'Error', description: 'Failed to log out from all devices', variant: 'destructive' });
    }
  };

  const handleDeleteAccount = async () => {
    // Validate confirmation text
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!accessToken) {
        setDeleteError('Missing session token. Please sign in again.');
        setIsDeleting(false);
        return;
      }

      console.log('Invoking delete-account', { hasToken: !!accessToken, hasAnonKey: !!anonKey });

      // Call the Edge Function to delete the account
      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: anonKey,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        setDeleteError(error.message || 'Failed to delete account. Please try again.');
        toast({ 
          title: 'Error', 
          description: 'Failed to delete account. Please try again.', 
          variant: 'destructive' 
        });
        return;
      }

      if (data?.error) {
        console.error('Delete account error:', data.error);
        setDeleteError(data.error);
        toast({ 
          title: 'Error', 
          description: data.error, 
          variant: 'destructive' 
        });
        return;
      }

      // Success - sign out and redirect
      await signOut();
      
      toast({ 
        title: 'Account deleted', 
        description: 'Your account has been permanently deleted.' 
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setDeleteError(error.message || 'An unexpected error occurred');
      toast({ 
        title: 'Error', 
        description: 'An unexpected error occurred. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setDeleteConfirmText('');
      setDeleteError('');
    }
    setDeleteDialogOpen(open);
  };

  const isDeleteEnabled = deleteConfirmText === 'DELETE';

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>
            <Button type="submit" disabled={isChangingPassword || !passwordForm.newPassword}>
              {isChangingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            <Smartphone className="h-4 w-4 mr-2" />
            Enable 2FA
          </Button>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Active Sessions</CardTitle>
              <CardDescription>Manage your active sessions across devices</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Current Session</p>
                <p className="text-sm text-muted-foreground">This device</p>
              </div>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
          <Separator />
          <Button variant="outline" onClick={handleLogoutAll} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Log Out of All Devices
          </Button>
        </CardContent>
      </Card>

      {/* Download Data */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Download Your Data</CardTitle>
              <CardDescription>Get a copy of your data from ZyNoveXa</CardDescription>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Request Data Download
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="bg-card border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg text-destructive">Delete Account</CardTitle>
              <CardDescription>Permanently delete your account and all data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog - Instagram Style */}
      <Dialog open={deleteDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <DialogTitle className="text-xl">Delete Your Account?</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p className="text-center">
                This action is <span className="font-semibold text-destructive">permanent</span> and cannot be undone.
              </p>
              <div className="text-left space-y-2 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-sm font-medium text-foreground">This will permanently delete:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Your profile and personal information</li>
                  <li>• All your messages and conversations</li>
                  <li>• Your notifications and preferences</li>
                  <li>• Your connections and blocked accounts</li>
                  <li>• All likes, comments, and bookmarks</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm" className="text-sm font-medium">
                Type <span className="font-bold text-destructive">DELETE</span> to confirm
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value.toUpperCase());
                  setDeleteError('');
                }}
                placeholder="Type DELETE here"
                className={deleteError ? 'border-destructive' : ''}
                autoComplete="off"
              />
              {deleteError && (
                <p className="text-sm text-destructive">{deleteError}</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!isDeleteEnabled || isDeleting}
              className="w-full"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Permanently Delete Account
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isDeleting}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
