import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import InnovationViewPage from "@/pages/dashboard/InnovationViewPage";

const InnovationDetail = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <InnovationViewPage />
      </main>
      <Footer />
    </div>
  );
};

export default InnovationDetail;
