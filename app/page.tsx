import FluidArtExperience from "@/components/halftone-waves"
import AppWrapper from "@/components/AppWrapper"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fluid Art Background */}
      <div className="fixed inset-0 z-0">
        <FluidArtExperience />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10">
        <AppWrapper />
      </div>
    </main>
  )
}