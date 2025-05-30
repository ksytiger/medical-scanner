import Navbar from "@/components/navbar"
import HeroSection from "@/components/hero-section"
import InfoCallout from "@/components/info-callout"
import DatabaseSection from "@/components/database-section"
import Footer from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <InfoCallout />
        <DatabaseSection />
      </main>
      <Footer />
    </div>
  )
}
