import { useState } from 'react';
import {
  SettingsLayout,
  SettingsSection,
  AccountSettings,
  PrivacySettings,
  NotificationSettings,
  SecuritySettings,
  MessagingSettings,
  BlockedAccountsSettings,
  HelpSettings,
  AboutSettings,
} from '@/components/settings';
import { useAuth } from '@/contexts/AuthContext';

const sectionTitles: Record<SettingsSection, string> = {
  account: 'Account',
  privacy: 'Privacy',
  notifications: 'Notifications',
  security: 'Security',
  messaging: 'Messaging',
  blocked: 'Blocked Accounts',
  help: 'Help & Support',
  about: 'About',
};

const SettingsPage = () => {
  const { isLoading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return <AccountSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'messaging':
        return <MessagingSettings />;
      case 'blocked':
        return <BlockedAccountsSettings />;
      case 'help':
        return <HelpSettings />;
      case 'about':
        return <AboutSettings />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <SettingsLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      sectionTitle={sectionTitles[activeSection]}
    >
      {renderSection()}
    </SettingsLayout>
  );
};

export default SettingsPage;
