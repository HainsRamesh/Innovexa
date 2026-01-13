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

const NOTIFICATION_TYPES = {
  solution_submitted: { icon: '🧠', category: 'solutions' },
  solution_approved: { icon: '✅', category: 'approvals' },
  solution_rejected: { icon: '❌', category: 'approvals' },
  like: { icon: '👍', category: 'likes' },
  bookmark: { icon: '📌', category: 'bookmarks' },
  investor_interest: { icon: '💰', category: 'investments' },
  comment: { icon: '💬', category: 'comments' },
  mention: { icon: '🏷️', category: 'mentions' },
  status_update: { icon: '🔔', category: 'updates' },
  video_available: { icon: '🎥', category: 'videos' },
  announcement: { icon: '📢', category: 'announcements' },
} as const;

export const getNotificationMeta = (type: string) => {
  return NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES] || { icon: '🔔', category: 'other' };
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
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifs = (data || []) as Notification[];
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

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: user.id
      });

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev => {
        const removed = prev.find(n => n.id === notificationId);
        if (removed && !removed.is_read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user]);

  // Group similar notifications
  const groupedNotifications = useCallback((): GroupedNotification[] => {
    const groups = new Map<string, GroupedNotification>();
    const ungrouped: GroupedNotification[] = [];

    notifications.forEach(notif => {
      if (notif.group_key && !notif.is_read) {
        const existing = groups.get(notif.group_key);
        if (existing) {
          existing.count = (existing.count || 1) + 1;
          if (notif.actor_name) {
            existing.latestActors = existing.latestActors || [];
            if (!existing.latestActors.find(a => a.name === notif.actor_name)) {
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
      // Priority first (higher = more important)
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
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          setHasNewNotification(true);
          
          // Reset animation flag after a delay
          setTimeout(() => setHasNewNotification(false), 1000);
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
