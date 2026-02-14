import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  priority: number;
  group_key: string | null;
  related_id: string | null;
  related_type: string | null;
  actor_id: string | null;
  actor_name: string | null;
  actor_avatar_url: string | null;
  created_at: string;
  read_at: string | null;
}

export interface GroupedNotification extends Notification {
  count?: number;
  latestActors?: { name: string; avatar: string | null }[];
}

export const NOTIFICATION_TYPES = {
  solution_submitted: { icon: '🧠', category: 'solutions', label: 'New Solution' },
  solution_approved: { icon: '✅', category: 'approvals', label: 'Approved' },
  solution_rejected: { icon: '❌', category: 'approvals', label: 'Rejected' },
  like: { icon: '👍', category: 'likes', label: 'Like' },
  interest: { icon: '✨', category: 'likes', label: 'Interest' },
  bookmark: { icon: '📌', category: 'bookmarks', label: 'Bookmarked' },
  investor_interest: { icon: '💰', category: 'investments', label: 'Investment' },
  comment: { icon: '💬', category: 'comments', label: 'Comment' },
  mention: { icon: '🏷️', category: 'mentions', label: 'Mention' },
  status_update: { icon: '🔔', category: 'updates', label: 'Update' },
  video_available: { icon: '🎥', category: 'videos', label: 'Video' },
  announcement: { icon: '📢', category: 'announcements', label: 'Announcement' },
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

export const getNotificationMeta = (type: string) => {
  return NOTIFICATION_TYPES[type as NotificationType] || { icon: '🔔', category: 'other', label: 'Notification' };
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 10) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      console.log('[Notifications] Fetching for user:', user.id);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[Notifications] Fetch error:', error);
        throw error;
      }

      let notifs = (data || []) as Notification[];

      // Enrich notifications that have actor_id but missing/placeholder actor_name
      const needsEnrichment = notifs.filter(
        n => n.actor_id && (!n.actor_name || n.actor_name === 'Someone')
      );

      if (needsEnrichment.length > 0) {
        const uniqueActorIds = [...new Set(needsEnrichment.map(n => n.actor_id!))];
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .in('id', uniqueActorIds);

        if (profiles && profiles.length > 0) {
          const profileMap = new Map(profiles.map(p => [p.id, p]));
          notifs = notifs.map(n => {
            if (n.actor_id && (!n.actor_name || n.actor_name === 'Someone')) {
              const profile = profileMap.get(n.actor_id);
              if (profile?.full_name) {
                // Update message to replace "Someone" with actual name
                const updatedMessage = n.message.replace(/^Someone/, profile.full_name);
                return {
                  ...n,
                  actor_name: profile.full_name,
                  actor_avatar_url: n.actor_avatar_url || profile.avatar_url,
                  message: updatedMessage,
                };
              }
            }
            return n;
          });
        }
      }

      console.log('[Notifications] Fetched count:', notifs.length, 'unread:', notifs.filter(n => !n.is_read).length);
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    // Optimistic update
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user || unreadCount === 0) return;

    // Optimistic update
    const prevNotifications = [...notifications];
    const prevUnreadCount = unreadCount;
    
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      const { error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: user.id
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert on error
      setNotifications(prevNotifications);
      setUnreadCount(prevUnreadCount);
    }
  }, [user, notifications, unreadCount]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    const targetNotif = notifications.find(n => n.id === notificationId);
    
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (targetNotif && !targetNotif.is_read) {
      setUnreadCount(c => Math.max(0, c - 1));
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      fetchNotifications();
    }
  }, [user, notifications, fetchNotifications]);

  // Group similar notifications
  const groupedNotifications = useCallback((): GroupedNotification[] => {
    const groups = new Map<string, GroupedNotification>();
    const ungrouped: GroupedNotification[] = [];

    // Sort by created_at first
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    sorted.forEach(notif => {
      if (notif.group_key && !notif.is_read) {
        const existing = groups.get(notif.group_key);
        if (existing) {
          existing.count = (existing.count || 1) + 1;
          if (notif.actor_name) {
            existing.latestActors = existing.latestActors || [];
            if (!existing.latestActors.find(a => a.name === notif.actor_name) && existing.latestActors.length < 3) {
              existing.latestActors.push({
                name: notif.actor_name,
                avatar: notif.actor_avatar_url
              });
            }
          }
          // Keep the most recent timestamp
          if (new Date(notif.created_at) > new Date(existing.created_at)) {
            existing.created_at = notif.created_at;
          }
        } else {
          groups.set(notif.group_key, {
            ...notif,
            count: 1,
            latestActors: notif.actor_name ? [{ name: notif.actor_name, avatar: notif.actor_avatar_url }] : []
          });
        }
      } else {
        ungrouped.push({ ...notif, count: 1 });
      }
    });

    // Combine and sort by priority and date
    const combined = [...groups.values(), ...ungrouped];
    return combined.sort((a, b) => {
      // Unread first
      if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
      // Priority second (higher = more important)
      if (a.priority !== b.priority) return b.priority - a.priority;
      // Then by date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notifications]);

  // Filter notifications by category
  const filterByCategory = useCallback((category: string | null): GroupedNotification[] => {
    const grouped = groupedNotifications();
    if (!category || category === 'all') return grouped;
    
    return grouped.filter(n => {
      const meta = getNotificationMeta(n.type);
      return meta.category === category;
    });
  }, [groupedNotifications]);

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to new notifications
    channelRef.current = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Notifications] Realtime INSERT received:', payload.new);
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          setHasNewNotification(true);
          
          // Reset animation flag after a delay
          setTimeout(() => setHasNewNotification(false), 1500);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setNotifications(prev => prev.filter(n => n.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, fetchNotifications]);

  return {
    notifications,
    groupedNotifications: groupedNotifications(),
    filterByCategory,
    unreadCount,
    isLoading,
    hasNewNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications
  };
};
