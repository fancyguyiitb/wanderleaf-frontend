import InfoPageLayout from '@/components/info-page-layout';

export default function ReportPage() {
  return (
    <InfoPageLayout title="Report a Concern">
      <p>
        We take reports seriously. If you encounter something that doesn&apos;t feel right—whether
        it&apos;s a safety issue, fraudulent listing, or policy violation—please let us know.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">What to Report</h2>
      <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Safety Concerns</h3>
      <p>
        Property issues, suspicious behavior, or anything that makes you feel unsafe during your
        stay.
      </p>
      <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Fraudulent Listings</h3>
      <p>
        Misleading photos, fake descriptions, or listings that don&apos;t match what was advertised.
      </p>
      <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Policy Violations</h3>
      <p>
        Hosts or guests who violate our community guidelines or terms of service.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">How to Report</h2>
      <p>
        Contact our support team at support@wanderleaf.com with your booking details and a
        description of the concern. We aim to respond within 24 hours and will investigate promptly.
      </p>
    </InfoPageLayout>
  );
}
