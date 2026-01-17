import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';
import { useChat } from '@/contexts/ChatContext';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { closeDrawer: closeMessenger, isDrawerOpen: isMessengerOpen } = useChat();
  const {
    unreadCount,
    hasNewNotification,
    groupedNotifications,
    filterByCategory,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Listen for close event from MessagesBell
  useEffect(() => {
    const handleCloseNotifications = () => {
      setIsOpen(false);
    };

    window.addEventListener('closeNotifications', handleCloseNotifications);
    return () => {
      window.removeEventListener('closeNotifications', handleCloseNotifications);
    };
  }, []);

  const handleClick = () => {
    // Close messenger drawer if open
    if (isMessengerOpen) {
      closeMessenger();
    }
    setIsOpen(!isOpen);
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-9 w-9 rounded-full transition-all duration-200",
          "hover:bg-muted/80",
          isOpen && "bg-muted",
          hasNewNotification && "animate-wiggle"
        )}
        onClick={handleClick}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className={cn(
          "h-[18px] w-[18px] transition-colors",
          unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
        )} />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span 
            className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1",
              "flex items-center justify-center",
              "text-[10px] font-bold text-primary-foreground",
              "bg-primary rounded-full",
              "shadow-[0_0_6px_hsl(var(--primary)/0.4)]",
              "animate-in fade-in zoom-in duration-200"
            )}
          >
            {displayCount}
          </span>
        )}
        
        {/* Pulse animation for new notifications */}
        {hasNewNotification && (
          <span className="absolute inset-0 rounded-full bg-primary/25 animate-ping" />
        )}
      </Button>

      {/* Dropdown */}
      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={groupedNotifications}
        filterByCategory={filterByCategory}
        isLoading={isLoading}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={deleteNotification}
      />
    </div>
  );
};
