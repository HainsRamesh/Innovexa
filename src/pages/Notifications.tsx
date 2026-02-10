import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import NotificationsPage from "@/pages/dashboard/NotificationsPage";

const Notifications = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 px-2 sm:px-4 lg:px-8 py-4">
        <NotificationsPage />
      </main>
    </div>
  );
};

export default Notifications;
