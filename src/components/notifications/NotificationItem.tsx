import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GroupedNotification, getNotificationMeta } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: GroupedNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const NotificationItem = memo(({
  notification,
  onMarkAsRead,
  onDelete,
  onClose
}: NotificationItemProps) => {
  const navigate = useNavigate();
  const meta = getNotificationMeta(notification.type);
  
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const getNavigationPath = (): string | null => {
    const { related_type, related_id, data } = notification;
    
    if (related_type === 'solution' && related_id) {
      const problemId = (data as { problem_id?: string })?.problem_id;
      if (problemId) {
        return `/dashboard/problems/${problemId}/solutions/${related_id}`;
      }
    }
    
    if (related_type === 'problem' && related_id) {
      return `/dashboard/problems/${related_id}`;
    }
    
    if (related_type === 'innovation' && related_id) {
      return `/innovations/${related_id}`;
    }

    return null;
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    
    const path = getNavigationPath();
    if (path) {
      navigate(path);
      onClose();
    }
  };

  const getDisplayMessage = () => {
    if (notification.count && notification.count > 1 && notification.latestActors) {
      const actors = notification.latestActors;
      if (actors.length === 1) {
        return notification.message;
      }
      if (actors.length === 2) {
        return `${actors[0].name} and ${actors[1].name} ${getActionText(notification.type)}`;
      }
      return `${actors[0].name} and ${notification.count - 1} others ${getActionText(notification.type)}`;
    }
    return notification.message;
  };

  const getActionText = (type: string): string => {
    switch (type) {
      case 'like':
        return 'liked your post';
      case 'bookmark':
        return 'bookmarked your problem';
      case 'solution_submitted':
        return 'submitted solutions';
      default:
        return 'interacted with your content';
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-3 cursor-pointer transition-all duration-200",
        "hover:bg-muted/50 border-b border-border/30 last:border-b-0",
        !notification.is_read && "bg-primary/5"
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}

      {/* Avatar or Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {notification.actor_avatar_url ? (
          <Avatar className="h-10 w-10 border border-border/50">
            <AvatarImage src={notification.actor_avatar_url} alt={notification.actor_name || ''} />
            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
              {notification.actor_name?.charAt(0).toUpperCase() || meta.icon}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
            {meta.icon}
          </div>
        )}
        
        {/* Count badge for grouped notifications */}
        {notification.count && notification.count > 1 && (
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {notification.count > 99 ? '99+' : notification.count}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={cn(
          "text-sm line-clamp-2",
          !notification.is_read ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          {getDisplayMessage()}
        </p>
        <p className="text-xs text-muted-foreground/70">
          {timeAgo}
        </p>
      </div>

      {/* Hover actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          title="Remove"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';
