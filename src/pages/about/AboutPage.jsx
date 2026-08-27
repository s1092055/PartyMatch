import FeatureCards from './components/FeatureCards'
import HowItWorks from './components/HowItWorks'
import CTASection from './components/CTASection'

export default function AboutPage() {
  return (
    <section className="card p-6">
      <div className="space-y-8">
        <FeatureCards />
        <HowItWorks />
        <CTASection />
      </div>
    </section>
  )
}
