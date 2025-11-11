import NormalHeader from "@/components/NormalHeader";
import Hero from "@/components/HomePage/Hero";
import Probelm from "@/components/HomePage/Problem";
import Solution from "@/components/HomePage/Solution";
import CTA from "@/components/HomePage/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center">
      <NormalHeader />
      <Hero />
      <Probelm />
      <Solution />
      <CTA />
      <Footer />
    </div>
  )
}