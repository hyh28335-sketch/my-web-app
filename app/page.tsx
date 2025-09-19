import FluidArtExperience from "@/components/halftone-waves"
import Navbar from "@/components/Navbar"
import MainContent from "@/components/MainContent"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fluid Art Background */}
      <div className="fixed inset-0 z-0">
        <FluidArtExperience />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10">
        <Navbar />
        <MainContent />
      </div>
    </main>
  )
}