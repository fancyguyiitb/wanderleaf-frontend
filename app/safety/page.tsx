import InfoPageLayout from '@/components/info-page-layout';

export default function SafetyPage() {
  return (
    <InfoPageLayout title="Safety Info">
      <p>
        Your safety is our top priority at WanderLeaf. We work closely with hosts and guests to ensure
        every stay is secure and enjoyable.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Verified Hosts</h2>
      <p>
        All hosts undergo verification. We verify identity and encourage hosts to provide
        comprehensive descriptions and photos of their properties.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Secure Payments</h2>
      <p>
        All payments are processed securely. Never pay outside the platform. If you&apos;re asked to
        pay via wire transfer or other methods, it may be a scam.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">24/7 Support</h2>
      <p>
        Our support team is available around the clock to assist with any safety concerns or
        emergencies during your stay.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Report Concerns</h2>
      <p>
        If you notice anything suspicious or have concerns about a listing or host, please report it
        through our Report Concern page. We take all reports seriously.
      </p>
    </InfoPageLayout>
  );
}
