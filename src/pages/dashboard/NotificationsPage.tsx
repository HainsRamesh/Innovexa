import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { Bell, CheckCheck, Trash2, Filter, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, GroupedNotification, getNotificationMeta } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'comments', label: 'Comments' },
  { id: 'investments', label: 'Investments' },
];

const NotificationsPage = () => {
  const navigate = useNavigate();
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

  // Group notifications by date
  const groupByDate = (notifications: GroupedNotification[]) => {
    const groups: { [key: string]: GroupedNotification[] } = {};
    
    notifications.forEach(notif => {
      const date = new Date(notif.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = format(date, 'MMMM d, yyyy');
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notif);
    });
    
    return groups;
  };

  const groupedByDate = groupByDate(filteredNotifications);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-primary/20 text-primary text-sm font-medium px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-6">
          <TabsList className="w-full md:w-auto bg-muted/50">
            {FILTER_TABS.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-background"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Notifications list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              You're all caught up! 🎉
            </h3>
            <p className="text-muted-foreground">
              No notifications to show
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, notifications]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                  {date}
                </h3>
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  {notifications.map((notification, index) => {
                    const meta = getNotificationMeta(notification.type);
                    
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "group flex items-start gap-4 p-4 cursor-pointer transition-all",
                          "hover:bg-muted/50",
                          index !== notifications.length - 1 && "border-b border-border/50",
                          !notification.is_read && "bg-primary/5"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Unread indicator */}
                        {!notification.is_read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-3 animate-pulse" />
                        )}
                        
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {notification.actor_avatar_url ? (
                            <Avatar className="h-12 w-12 border border-border/50">
                              <AvatarImage src={notification.actor_avatar_url} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {notification.actor_name?.charAt(0).toUpperCase() || meta.icon}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xl">
                              {meta.icon}
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm mb-1",
                            !notification.is_read ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
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
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
