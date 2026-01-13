import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { GroupedNotification } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { NotificationSkeleton } from './NotificationSkeleton';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: GroupedNotification[];
  filterByCategory: (category: string | null) => GroupedNotification[];
  isLoading: boolean;
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'comments', label: 'Comments' },
  { id: 'likes', label: 'Likes' },
];

export const NotificationDropdown = ({
  isOpen,
  onClose,
  notifications,
  filterByCategory,
  isLoading,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete
}: NotificationDropdownProps) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredNotifications = useCallback(() => {
    if (activeFilter === 'all') return notifications;
    return filterByCategory(activeFilter);
  }, [activeFilter, notifications, filterByCategory]);

  if (!isOpen) return null;

  const filtered = filteredNotifications();

  return (
    <div 
      className={cn(
        "absolute right-0 top-full mt-2 z-50",
        "w-[360px] max-w-[calc(100vw-1rem)]",
        "bg-popover border border-border/80 rounded-xl shadow-elevated overflow-hidden",
        "animate-in fade-in slide-in-from-top-2 duration-200"
      )}
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-[11px] text-primary bg-primary/15 px-1.5 py-0.5 rounded-full font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
        
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-primary h-7 px-2"
            onClick={onMarkAllAsRead}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Sticky filter tabs */}
      <div className="px-2 py-1.5 border-b border-border/30 bg-muted/30 sticky top-0 z-10">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                activeFilter === tab.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification list */}
      <ScrollArea className="max-h-[380px]">
        {isLoading ? (
          <NotificationSkeleton count={4} compact />
        ) : filtered.length === 0 ? (
          <EmptyState activeFilter={activeFilter} />
        ) : (
          <div>
            {filtered.map((notification, index) => (
              <div
                key={notification.id}
                className={cn(
                  "animate-in fade-in slide-in-from-top-1",
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                  onClose={onClose}
                  compact
                />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/20">
        <Link
          to="/dashboard/notifications"
          className="block text-center text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
          onClick={onClose}
        >
          View all notifications →
        </Link>
      </div>
    </div>
  );
};

const EmptyState = ({ activeFilter }: { activeFilter: string }) => (
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
      <Bell className="h-5 w-5 text-muted-foreground/40" />
    </div>
    <p className="text-sm font-medium text-foreground mb-0.5">
      {activeFilter === 'all' ? "You're all caught up! 🎉" : `No ${activeFilter} notifications`}
    </p>
    <p className="text-xs text-muted-foreground">
      {activeFilter === 'all' ? 'Check back later for updates' : 'Try checking "All" notifications'}
    </p>
  </div>
);
