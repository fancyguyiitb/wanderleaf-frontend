import InfoPageLayout from '@/components/info-page-layout';

export default function BlogPage() {
  return (
    <InfoPageLayout title="WanderLeaf Blog">
      <p>
        Travel tips, destination guides, and stories from the WanderLeaf community. Stay tuned for
        inspiring content to help you plan your next adventure.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Coming Soon</h2>
      <p>
        We&apos;re working on bringing you curated travel content, host spotlights, and destination
        guides. Check back soon for our first posts!
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Want to Contribute?</h2>
      <p>
        If you have a travel story or destination guide you&apos;d like to share, reach out to our
        team at blog@wanderleaf.com.
      </p>
    </InfoPageLayout>
  );
}
