import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, Filter, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { GroupedNotification } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

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

  return (
    <div 
      className={cn(
        "absolute right-0 top-full mt-2 z-50",
        "w-[380px] max-w-[calc(100vw-2rem)]",
        "bg-popover border border-border rounded-lg shadow-elevated",
        "animate-in fade-in slide-in-from-top-2 duration-200"
      )}
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({unreadCount} unread)
            </span>
          )}
        </div>
        
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-primary hover:text-primary/80 h-7 px-2"
            onClick={onMarkAllAsRead}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="px-2 py-2 border-b border-border/50">
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="w-full h-8 bg-muted/50 p-0.5">
            {FILTER_TABS.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 text-xs h-7 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Notification list */}
      <ScrollArea className="max-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredNotifications().length === 0 ? (
          <EmptyState />
        ) : (
          <div className="py-1">
            {filteredNotifications().map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/30">
        <Link
          to="/dashboard/notifications"
          className="block text-center text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
          onClick={onClose}
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Bell className="h-8 w-8 text-muted-foreground/50" />
    </div>
    <h4 className="text-sm font-medium text-foreground mb-1">
      You're all caught up 🎉
    </h4>
    <p className="text-xs text-muted-foreground">
      No new notifications at the moment
    </p>
  </div>
);
