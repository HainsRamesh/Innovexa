import { memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GroupedNotification, getNotificationMeta, formatRelativeTime } from '@/hooks/useNotifications';
import { useChat } from '@/contexts/ChatContext';

interface NotificationItemProps {
  notification: GroupedNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  compact?: boolean;
}

export const NotificationItem = memo(({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
  compact = false
}: NotificationItemProps) => {
  const navigate = useNavigate();
  const { openChat } = useChat();
  const meta = getNotificationMeta(notification.type);
  const timeAgo = formatRelativeTime(notification.created_at);

  const isInterestNotification = notification.type === 'interest';

  const getNavigationPath = (): string | null => {
    const { related_type, related_id, data, type } = notification;
    
    // Handle solution-related notifications
    if (related_type === 'solution' && related_id) {
      const problemId = (data as { problem_id?: string })?.problem_id;
      if (problemId) {
        return `/dashboard/problems/${problemId}`;
      }
      return `/dashboard/solutions/${related_id}`;
    }
    
    // Handle problem-related notifications  
    if (related_type === 'problem' && related_id) {
      return `/explore/${related_id}`;
    }
    
    // Handle innovation-related notifications
    if (related_type === 'innovation' && related_id) {
      return `/dashboard/innovations/${related_id}`;
    }

    // Handle specific notification types that may not have related_type set
    if (type === 'investor_interest' && related_id) {
      const innovationId = (data as { innovation_id?: string })?.innovation_id;
      const problemId = (data as { problem_id?: string })?.problem_id;
      if (innovationId) return `/dashboard/innovations/${innovationId}`;
      if (problemId) return `/explore/${problemId}`;
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
      const otherCount = notification.count - 1;
      
      if (actors.length === 1) {
        return formatGroupedMessage(actors[0].name, otherCount, notification.type);
      }
      if (actors.length >= 2) {
        return formatGroupedMessage(`${actors[0].name} and ${actors[1].name}`, otherCount - 1, notification.type);
      }
    }
    return notification.message;
  };

  const formatGroupedMessage = (names: string, otherCount: number, type: string): string => {
    const suffix = otherCount > 0 ? ` and ${otherCount} other${otherCount > 1 ? 's' : ''}` : '';
    
    switch (type) {
      case 'like':
        return `${names}${suffix} liked your post`;
      case 'bookmark':
        return `${names}${suffix} bookmarked your problem`;
      case 'solution_submitted':
        return `${names}${suffix} submitted solutions`;
      case 'comment':
        return `${names}${suffix} commented`;
      default:
        return notification.message;
    }
  };

  // Parse the message to make actor name bold
  const renderMessage = () => {
    const message = getDisplayMessage();
    const actorName = notification.actor_name;
    const actorId = notification.actor_id;
    
    if (actorName && message.startsWith(actorName)) {
      const restOfMessage = message.substring(actorName.length);
      return (
        <>
          {actorId ? (
            <Link
              to={`/users/${actorId}`}
              className="font-semibold text-foreground hover:underline focus:underline focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              {actorName}
            </Link>
          ) : (
            <span className="font-semibold text-foreground">{actorName}</span>
          )}
          <span className={notification.is_read ? "text-muted-foreground" : "text-foreground/90"}>
            {restOfMessage}
          </span>
        </>
      );
    }
    
    return <span className={notification.is_read ? "text-muted-foreground" : "text-foreground"}>{message}</span>;
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 cursor-pointer transition-all duration-200 overflow-hidden",
        "hover:bg-muted/60 border-b border-border/20 last:border-b-0",
        compact ? "px-3 py-2.5" : "px-3 sm:px-4 py-3",
        !notification.is_read && "bg-primary/[0.08]"
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Unread indicator dot */}
      {!notification.is_read && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
      )}

      {/* Avatar or Icon */}
      <div className="relative flex-shrink-0">
        {notification.actor_avatar_url ? (
          <Avatar className={cn("border border-border/50", compact ? "h-9 w-9" : "h-10 w-10")}>
            <AvatarImage src={notification.actor_avatar_url} alt={notification.actor_name || ''} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
              {notification.actor_name?.charAt(0).toUpperCase() || meta.icon}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn(
            "rounded-full bg-muted flex items-center justify-center",
            compact ? "h-9 w-9 text-base" : "h-10 w-10 text-lg"
          )}>
            {meta.icon}
          </div>
        )}
        
        {/* Grouped count badge */}
        {notification.count && notification.count > 1 && (
          <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 shadow-sm">
            {notification.count > 99 ? '99+' : notification.count}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5 overflow-hidden">
        <p className={cn("text-sm line-clamp-2 leading-snug break-words [overflow-wrap:anywhere]", compact && "text-[13px]")}>
          {renderMessage()}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground/60">
            {timeAgo}
          </p>
          {isInterestNotification && notification.actor_id && (
            <Button
              variant="outline"
              size="sm"
              className="h-5 px-2 text-[10px] gap-1"
              onClick={(e) => {
                e.stopPropagation();
                openChat({
                  userId: notification.actor_id!,
                  userName: notification.actor_name || "User",
                  userAvatar: notification.actor_avatar_url,
                });
                onClose();
              }}
            >
              <MessageCircle className="h-3 w-3" />
              Message
            </Button>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          title="Remove"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';
