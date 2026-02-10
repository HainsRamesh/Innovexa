import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import MessagesPage from "@/pages/dashboard/MessagesPage";

const Messages = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 px-2 sm:px-4 lg:px-8 py-4">
        <MessagesPage />
      </main>
    </div>
  );
};

export default Messages;
