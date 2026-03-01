import InfoPageLayout from '@/components/info-page-layout';

export default function ResponsibleHostingPage() {
  return (
    <InfoPageLayout title="Responsible Hosting">
      <p>
        Hosting on WanderLeaf comes with responsibility. We expect all hosts to provide safe,
        accurate, and welcoming experiences for all guests.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Accurate Listings</h2>
      <p>
        Ensure your listing description, photos, and amenities accurately reflect your property.
        Misleading listings harm trust and may result in removal from the platform.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Safety Standards</h2>
      <p>
        All properties must meet minimum safety requirements including working smoke detectors, fire
        extinguishers where applicable, and emergency contact information.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Guest Communication</h2>
      <p>
        Respond to inquiries promptly and professionally. Clear communication before and during stays
        helps ensure smooth experiences for everyone.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Local Regulations</h2>
      <p>
        Hosts are responsible for complying with local laws, including obtaining any required
        permits or licenses for short-term rentals in their area.
      </p>
    </InfoPageLayout>
  );
}
