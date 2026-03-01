import InfoPageLayout from '@/components/info-page-layout';

export default function CareersPage() {
  return (
    <InfoPageLayout title="Careers at WanderLeaf">
      <p>
        Join us in building the future of travel. We&apos;re a team of passionate people who love
        connecting travelers with unique stays around the world.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Why WanderLeaf?</h2>
      <p>
        We offer a collaborative, remote-friendly environment where you can make a real impact. Our
        team values creativity, ownership, and a shared love for travel.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Open Positions</h2>
      <p>
        We&apos;re always looking for talented people. Check back soon for open roles in engineering,
        design, customer support, and more.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Get in Touch</h2>
      <p>
        Interested in joining? Send your resume and a note about why you&apos;d like to work with us
        to careers@wanderleaf.com.
      </p>
    </InfoPageLayout>
  );
}
