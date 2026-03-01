import InfoPageLayout from '@/components/info-page-layout';

export default function AboutPage() {
  return (
    <InfoPageLayout title="About WanderLeaf">
      <p>
        WanderLeaf is a platform for discovering unique, nature-inspired accommodations around the
        world. We connect travelers with hosts who offer authentic stays—from cozy cabins to
        treehouses to seaside retreats.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Our Mission</h2>
      <p>
        We believe travel should feel like a breath of fresh air. Our mission is to help people find
        places that inspire connection—with nature, with local culture, and with each other.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Verified Stays</h2>
      <p>
        Every listing on WanderLeaf goes through a verification process. We work with hosts to
        ensure properties meet our standards for quality, safety, and authenticity.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Contact Us</h2>
      <p>
        Have questions? Reach out at hello@wanderleaf.com. We&apos;re here to help you find your
        perfect getaway.
      </p>
    </InfoPageLayout>
  );
}
