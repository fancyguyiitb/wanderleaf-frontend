import InfoPageLayout from '@/components/info-page-layout';

export default function TermsPage() {
  return (
    <InfoPageLayout title="Terms of Service">
      <p>
        Welcome to WanderLeaf. By using our platform, you agree to these Terms of Service. Please
        read them carefully.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
      <p>
        By accessing or using WanderLeaf, you agree to be bound by these terms. If you do not agree,
        please do not use our services.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Use of the Platform</h2>
      <p>
        You agree to use WanderLeaf only for lawful purposes. You may not use the platform to
        post fraudulent listings, harass others, or violate any applicable laws.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Bookings and Payments</h2>
      <p>
        All bookings are subject to the cancellation policy of the listing. Payments are processed
        securely through our platform. Never pay outside the platform.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Host Responsibilities</h2>
      <p>
        Hosts are responsible for accurate listings, maintaining their properties, and complying
        with local regulations. Hosts must respond to inquiries and bookings in a timely manner.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Contact</h2>
      <p>
        For questions about these terms, contact us at legal@wanderleaf.com.
      </p>
    </InfoPageLayout>
  );
}
