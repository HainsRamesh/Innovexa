import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useNotifications, 
  GroupedNotification, 
  getNotificationMeta,
  formatRelativeTime 
} from '@/hooks/useNotifications';
import { NotificationSkeleton } from '@/components/notifications/NotificationSkeleton';
import { cn } from '@/lib/utils';
import { useChat } from '@/contexts/ChatContext';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'comments', label: 'Comments' },
  { id: 'likes', label: 'Likes' },
  { id: 'investments', label: 'Investments' },
];

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { openChat } = useChat();
  const [activeFilter, setActiveFilter] = useState('all');
  const {
    groupedNotifications,
    filterByCategory,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const filteredNotifications = activeFilter === 'all' 
    ? groupedNotifications 
    : filterByCategory(activeFilter);

  const handleNotificationClick = (notification: GroupedNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    const { related_type, related_id, data } = notification;
    
    if (related_type === 'solution' && related_id) {
      const problemId = (data as { problem_id?: string })?.problem_id;
      if (problemId) {
        navigate(`/dashboard/problems/${problemId}/solutions/${related_id}`);
      }
    } else if (related_type === 'problem' && related_id) {
      navigate(`/dashboard/problems/${related_id}`);
    } else if (related_type === 'innovation' && related_id) {
      navigate(`/innovations/${related_id}`);
    }
  };

  // Parse message to make actor name bold
  const renderMessage = (notification: GroupedNotification) => {
    const actorName = notification.actor_name;
    const actorId = notification.actor_id;
    const message = notification.message;
    
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
    <div className="h-full flex flex-col max-w-3xl mx-auto w-full overflow-x-hidden">
      {/* Action bar */}
      <div className="flex items-center justify-end px-4 py-2">
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="gap-1.5 text-muted-foreground hover:text-primary h-8"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Mark all read</span>
          </Button>
        )}
      </div>

      {/* Sticky filter tabs */}
      <div className="px-4 py-2 border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-[57px] z-10">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                activeFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications feed */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4">
            <NotificationSkeleton count={8} />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Bell className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
              {activeFilter === 'all' ? "You're all caught up! 🎉" : `No ${activeFilter} notifications`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {activeFilter === 'all' 
                ? 'New notifications will appear here' 
                : 'Try checking "All" to see other notifications'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredNotifications.map((notification, index) => {
              const meta = getNotificationMeta(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-all overflow-hidden",
                    "hover:bg-muted/50",
                    !notification.is_read && "bg-primary/[0.06]",
                    "animate-in fade-in slide-in-from-top-1"
                  )}
                  style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {!notification.is_read && (
                    <div className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-primary mt-4" />
                  )}
                  
                  <div className="relative flex-shrink-0">
                    {notification.actor_avatar_url ? (
                      <Avatar className="h-10 w-10 border border-border/50">
                        <AvatarImage src={notification.actor_avatar_url} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                          {notification.actor_name?.charAt(0).toUpperCase() || meta.icon}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
                        {meta.icon}
                      </div>
                    )}
                    
                    {notification.count && notification.count > 1 && (
                      <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                        {notification.count > 99 ? '99+' : notification.count}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 overflow-hidden py-0.5">
                    <p className="text-sm leading-snug line-clamp-2 break-words">
                      {renderMessage(notification)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground/60">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                      {notification.type === 'interest' && notification.actor_id && (
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
                          }}
                        >
                          <MessageCircle className="h-3 w-3" />
                          Message
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="hidden sm:flex flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity items-center gap-1 pt-1">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Mark as read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NotificationsPage;
