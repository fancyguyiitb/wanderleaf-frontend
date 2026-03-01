import InfoPageLayout from '@/components/info-page-layout';

export default function PrivacyPage() {
  return (
    <InfoPageLayout title="Privacy Policy">
      <p>
        At WanderLeaf, we take your privacy seriously. This policy explains how we collect, use, and
        protect your personal information.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Information We Collect</h2>
      <p>
        We collect information you provide when creating an account, making a booking, or listing a
        property. This may include your name, email, phone number, payment information, and profile
        photos.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">How We Use Your Information</h2>
      <p>
        We use your information to facilitate bookings, communicate with you, improve our services,
        and ensure platform safety. We do not sell your personal information to third parties.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Sharing With Others</h2>
      <p>
        When you book or host, we share relevant information (such as your name and contact details)
        with the other party to complete the transaction. We may share data with service providers
        who assist our operations.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Your Rights</h2>
      <p>
        You can access, update, or delete your account information at any time through your account
        settings. Contact us at privacy@wanderleaf.com for any privacy-related requests.
      </p>
    </InfoPageLayout>
  );
}
