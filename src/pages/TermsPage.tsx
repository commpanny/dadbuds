export default function TermsPage() {
  return (
    <section className="section-shell py-10">
      <div className="max-w-3xl">
        <p className="text-sm font-bold text-moss">Spokane pilot</p>
        <h1 className="mt-2 text-4xl font-black">Terms</h1>
        <p className="mt-4 leading-7 text-ink/72">
          DadBuds helps dads coordinate informal local plans. The pilot is
          intentionally manual and lightweight.
        </p>
      </div>

      <div className="mt-8 grid gap-5">
        <TermsSection title="Pilot scope">
          DadBuds suggests and tracks informal social plans. It does not sell
          tickets, take payments, run escrow, provide transportation, provide
          childcare, or guarantee attendance.
        </TermsSection>
        <TermsSection title="Your responsibility">
          Use judgment before meeting people, sharing personal information, or
          attending a plan. You are responsible for your own safety, your
          children, transportation, costs, and conduct.
        </TermsSection>
        <TermsSection title="Plans can change">
          Pilot plans may be edited, cancelled, under-attended, or manually
          adjusted. RSVP counts are coordination signals, not guarantees.
        </TermsSection>
        <TermsSection title="Admin operations">
          Admins can review profiles, availability, RSVPs, plan drafts, and
          message drafts to operate the Spokane pilot.
        </TermsSection>
        <TermsSection title="SMS consent">
          SMS consent is optional. During the MVP it records your preference
          only. If real SMS is enabled, messages will be limited to pilot
          coordination and opt-out instructions.
        </TermsSection>
      </div>
    </section>
  );
}

function TermsSection({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <section className="card">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-3 leading-7 text-ink/72">{children}</p>
    </section>
  );
}
