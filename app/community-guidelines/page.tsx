import InfoPageLayout from '@/components/info-page-layout';

export default function CommunityGuidelinesPage() {
  return (
    <InfoPageLayout title="Community Guidelines">
      <p>
        WanderLeaf is built on trust and respect. We expect all members of our community—guests and
        hosts—to treat each other with kindness and fairness.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Treat Everyone With Respect</h2>
      <p>
        Discrimination, harassment, or disrespectful behavior is not tolerated. We welcome people of
        all backgrounds and expect everyone to be treated fairly.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Be Honest</h2>
      <p>
        Provide accurate information in your profile and listings. Don&apos;t misrepresent yourself
        or your property. Honest reviews help others make informed decisions.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Respect Property</h2>
      <p>
        Guests should treat properties as they would their own. Hosts should maintain their spaces as
        described and provide a welcoming environment.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Follow the Rules</h2>
      <p>
        Adhere to our Terms of Service and any house rules set by hosts. Violations may result in
        account suspension or removal from the platform.
      </p>
    </InfoPageLayout>
  );
}
