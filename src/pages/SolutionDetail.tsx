import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import SolutionDetailPage from "@/pages/dashboard/SolutionDetailPage";

const SolutionDetail = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <SolutionDetailPage />
      </main>
      <Footer />
    </div>
  );
};

export default SolutionDetail;
