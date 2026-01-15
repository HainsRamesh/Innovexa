import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, UserX, UserCheck } from 'lucide-react';

interface BlockedUser {
  id: string;
  blocked_user_id: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const BlockedAccountsSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<BlockedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const fetchBlockedUsers = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: blocks, error } = await supabase
        .from('user_blocks')
        .select('id, blocked_user_id, created_at')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (blocks && blocks.length > 0) {
        // Fetch profiles for blocked users
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .in('id', blocks.map(b => b.blocked_user_id));

        const usersWithProfiles = blocks.map(block => ({
          ...block,
          profile: profiles?.find(p => p.id === block.blocked_user_id) || null,
        }));

        setBlockedUsers(usersWithProfiles);
        setFilteredUsers(usersWithProfiles);
      } else {
        setBlockedUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      toast({ title: 'Error', description: 'Failed to load blocked users', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(blockedUsers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        blockedUsers.filter(u =>
          u.profile?.full_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, blockedUsers]);

  const handleUnblock = async (blockId: string, userName: string | null) => {
    setUnblockingId(blockId);
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      setBlockedUsers(prev => prev.filter(b => b.id !== blockId));
      toast({ title: 'Unblocked', description: `${userName || 'User'} has been unblocked.` });
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({ title: 'Error', description: 'Failed to unblock user', variant: 'destructive' });
    } finally {
      setUnblockingId(null);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <UserX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg">Blocked Accounts</CardTitle>
              <CardDescription>
                {blockedUsers.length === 0
                  ? "You haven't blocked anyone yet"
                  : `${blockedUsers.length} blocked account${blockedUsers.length === 1 ? '' : 's'}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {blockedUsers.length > 0 && (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search blocked users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* List */}
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {filteredUsers.map((blockedUser) => (
                    <div
                      key={blockedUser.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={blockedUser.profile?.avatar_url || ''} />
                          <AvatarFallback className="bg-secondary text-foreground">
                            {getInitials(blockedUser.profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {blockedUser.profile?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Blocked {new Date(blockedUser.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(blockedUser.id, blockedUser.profile?.full_name)}
                        disabled={unblockingId === blockedUser.id}
                      >
                        {unblockingId === blockedUser.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Unblock
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {filteredUsers.length === 0 && searchQuery && (
                <p className="text-center text-muted-foreground py-8">
                  No blocked users match your search
                </p>
              )}
            </>
          )}

          {blockedUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                <UserX className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                When you block someone, they won't be able to find your profile, message you, or see your content.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
