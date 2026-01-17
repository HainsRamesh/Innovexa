import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User,
  Shield,
  Bell,
  Lock,
  MessageSquare,
  UserX,
  HelpCircle,
  Info,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

export type SettingsSection = 
  | 'account'
  | 'privacy'
  | 'notifications'
  | 'security'
  | 'messaging'
  | 'blocked'
  | 'help'
  | 'about';

interface SettingsMenuItem {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const menuItems: SettingsMenuItem[] = [
  { id: 'account', label: 'Account', icon: User, description: 'Profile, photo, personal info' },
  { id: 'privacy', label: 'Privacy', icon: Shield, description: 'Profile visibility, messaging' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Push, email, in-app' },
  { id: 'security', label: 'Security', icon: Lock, description: 'Password, sessions, 2FA' },
  { id: 'messaging', label: 'Messaging', icon: MessageSquare, description: 'Message requests, receipts' },
  { id: 'blocked', label: 'Blocked Accounts', icon: UserX, description: 'Manage blocked users' },
  { id: 'help', label: 'Help & Support', icon: HelpCircle, description: 'FAQ, contact, report bug' },
  { id: 'about', label: 'About', icon: Info, description: 'App info, terms, privacy' },
];

interface SettingsLayoutProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  children: React.ReactNode;
  sectionTitle?: string;
}

export const SettingsLayout = ({
  activeSection,
  onSectionChange,
  children,
  sectionTitle,
}: SettingsLayoutProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showPanel, setShowPanel] = useState(!isMobile);

  useEffect(() => {
    if (!isMobile) {
      setShowPanel(true);
    }
  }, [isMobile]);

  const handleSectionClick = (section: SettingsSection) => {
    onSectionChange(section);
    if (isMobile) {
      setShowPanel(true);
    }
  };

  const handleBack = () => {
    if (isMobile) {
      setShowPanel(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  // Mobile: show either menu or panel
  if (isMobile) {
    if (showPanel) {
      return (
        <div className="min-h-[calc(100vh-80px)]">
          {/* Mobile Panel Header */}
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">
              {sectionTitle || menuItems.find(m => m.id === activeSection)?.label}
            </h2>
          </div>
          <div className="p-4">
            {children}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[calc(100vh-80px)]">
        {/* Mobile Menu Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="py-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSectionClick(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors',
                  activeSection === item.id && 'bg-muted/30'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    <item.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-4 hover:bg-destructive/10 transition-colors text-destructive"
            >
              <div className="p-2 rounded-full bg-destructive/10">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="font-medium">Log Out</span>
            </button>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Desktop: side-by-side layout
  return (
    <div className="flex min-h-[calc(100vh-80px)] max-w-6xl mx-auto">
      {/* Left Sidebar Menu */}
      <aside className="w-80 border-r border-border shrink-0">
        <div className="sticky top-0 p-6">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left',
                  activeSection === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted/50 text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="font-medium">Log Out</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Right Content Panel */}
      <main className="flex-1 p-8">
        <div className="max-w-2xl">
          {sectionTitle && (
            <h2 className="text-xl font-semibold mb-6">{sectionTitle}</h2>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};
