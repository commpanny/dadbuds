export default function PrivacyPage() {
  return (
    <section className="section-shell py-10">
      <div className="max-w-3xl">
        <p className="text-sm font-bold text-moss">Spokane pilot</p>
        <h1 className="mt-2 text-4xl font-black">Privacy notice</h1>
        <p className="mt-4 leading-7 text-ink/72">
          DadBuds is a small manual pilot. We collect only the information
          needed to coordinate low-pressure local plans and learn whether the
          idea is useful.
        </p>
      </div>

      <div className="mt-8 grid gap-5">
        <PolicySection title="What we collect">
          Name, email, phone, neighborhood, age range, kids age range, optional
          Discord username, interests, typical availability, submitted
          availability windows, RSVPs, SMS consent status, and manual admin
          notes or message drafts related to the pilot.
        </PolicySection>
        <PolicySection title="How we use it">
          We use this information to suggest Spokane pilot plans, understand
          availability, manage RSVPs, follow up manually, and improve the pilot.
          Admins can view signup and coordination data.
        </PolicySection>
        <PolicySection title="SMS and Discord">
          SMS and Discord integrations are not live in this MVP. If SMS becomes
          active, we will use it only for pilot plan coordination and opt-out
          handling. Consent is optional.
        </PolicySection>
        <PolicySection title="What we do not do">
          We do not sell personal data, run ads from it, broker payments, or
          claim automated safety screening. DadBuds is not a childcare service,
          ticketing system, or background-check product.
        </PolicySection>
        <PolicySection title="Retention">
          Pilot data is kept only as long as it is useful for operating and
          evaluating the Spokane pilot. You can ask to have your profile removed
          from the pilot records.
        </PolicySection>
      </div>
    </section>
  );
}

function PolicySection({
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
