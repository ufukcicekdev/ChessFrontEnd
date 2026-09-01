import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · fianchess",
  description: "How fianchess collects, uses and protects your data.",
};

const EFFECTIVE = "September 1, 2026";
const CONTACT = "ufukcicek199@gmail.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
      <div className="text-sm text-gray-300 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-hero pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-1">Privacy <span className="gradient-text">Policy</span></h1>
        <p className="text-xs text-gray-500">Effective {EFFECTIVE}</p>

        <div className="card mt-6 p-6">
          <p className="text-sm text-gray-300 leading-relaxed">
            fianchess (&quot;we&quot;, &quot;us&quot;) is an online chess platform. This policy explains
            what information we collect, how we use it, and the choices you have. By creating an
            account or using the app you agree to this policy.
          </p>

          <Section title="Information we collect">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information</strong> — the username and email address you provide, and a securely hashed password.</li>
              <li><strong>Profile data</strong> — an optional avatar image you upload, your Elo rating, title and game history.</li>
              <li><strong>Gameplay data</strong> — the moves, results and timing of the games you play, used for ratings, replays and live spectating.</li>
              <li><strong>Notification tokens</strong> — a device push token (via Firebase Cloud Messaging) so we can send challenge, rematch and tournament notifications. You can disable these in your device settings.</li>
              <li><strong>Technical data</strong> — basic log data such as IP address, device type and app version, used for security and reliability.</li>
            </ul>
          </Section>

          <Section title="How we use your information">
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and operate the service: matchmaking, challenges, tournaments, ratings, leaderboards and live games.</li>
              <li>Send you notifications you have opted into (e.g. an opponent&apos;s challenge or your tournament match).</li>
              <li>Maintain security, prevent abuse and fix problems.</li>
            </ul>
          </Section>

          <Section title="Sharing of information">
            <p>
              We do not sell your personal information. We share data only with service providers that
              help us run the app — for example our cloud hosting provider and Google Firebase for push
              notifications — and only as needed to provide the service, or where required by law.
            </p>
          </Section>

          <Section title="Data retention and deletion">
            <p>
              We keep your account data while your account is active. You may request deletion of your
              account and associated personal data at any time by contacting us at{" "}
              <a className="text-amber-400 underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>. Completed
              game records may be retained in anonymized form.
            </p>
          </Section>

          <Section title="Children">
            <p>
              fianchess is not directed to children under 13, and we do not knowingly collect personal
              information from children under 13. If you believe a child has provided us data, contact us
              and we will remove it.
            </p>
          </Section>

          <Section title="Security">
            <p>
              We use industry-standard measures to protect your data, including encrypted connections
              (HTTPS) and hashed passwords. No method of transmission or storage is 100% secure, but we
              work to protect your information.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy from time to time. Material changes will be reflected by updating
              the effective date at the top of this page.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about this policy? Email us at{" "}
              <a className="text-amber-400 underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
