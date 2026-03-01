import InfoPageLayout from '@/components/info-page-layout';

export default function CancellationPage() {
  return (
    <InfoPageLayout title="Cancellation Options">
      <p>
        We understand that plans change. WanderLeaf offers flexible cancellation options to help you
        book with confidence.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Flexible Cancellation</h2>
      <p>
        Many listings offer free cancellation up to 24 or 48 hours before check-in. Check the
        cancellation policy on each property before booking.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Moderate Policy</h2>
      <p>
        Full refund if you cancel at least 5 days before check-in. If you cancel within 5 days of
        check-in, you get a 50% refund for the first 7 nights.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Strict Policy</h2>
      <p>
        Full refund if you cancel at least 14 days before check-in. If you cancel within 14 days,
        you get a 50% refund for the first 7 nights.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Need Help?</h2>
      <p>
        If you have extenuating circumstances, contact our support team. We review each case
        individually and may offer refunds or rescheduling options when appropriate.
      </p>
    </InfoPageLayout>
  );
}
