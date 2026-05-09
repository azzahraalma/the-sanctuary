import "./styles/global.css"

import Navbar from "./component/navbar"
import Hero from "./component/hero"
import Stats from "./component/stats"
import Features from "./component/features"
import Journey from "./component/journey"
import Mentors from "./component/mentors"
import CTA from "./component/cta"
import Footer from "./component/footer"

export default function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Journey />
      <Mentors />
      <CTA />
      <Footer />
    </>
  )
}