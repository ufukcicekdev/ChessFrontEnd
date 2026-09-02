import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete Your Account · fianchess",
  description: "How to request deletion of your fianchess account and data.",
};

const CONTACT = "ufukcicek199@gmail.com";
const SUBJECT = encodeURIComponent("Account deletion request");
const BODY = encodeURIComponent(
  "Please delete my fianchess account.\n\nMy username: \nMy account email: "
);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
      <div className="text-sm text-gray-300 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-hero pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-1">Delete Your <span className="gradient-text">Account</span></h1>
        <p className="text-xs text-gray-500">fianchess · account &amp; data deletion</p>

        <div className="card mt-6 p-6">
          <p className="text-sm text-gray-300 leading-relaxed">
            You can request deletion of your fianchess account and its associated
            personal data at any time. This page explains how, and what happens to
            your data.
          </p>

          <Section title="How to request deletion">
            <p>
              Send an email to{" "}
              <a className="text-amber-400 underline" href={`mailto:${CONTACT}?subject=${SUBJECT}&body=${BODY}`}>
                {CONTACT}
              </a>{" "}
              from the email address on your account, with the subject
              &quot;Account deletion request&quot; and your username. We verify the
              request and delete your account, usually within 30 days.
            </p>
            <p>
              <a className="text-amber-400 underline font-semibold" href={`mailto:${CONTACT}?subject=${SUBJECT}&body=${BODY}`}>
                Tap here to email a deletion request →
              </a>
            </p>
          </Section>

          <Section title="What gets deleted">
            <ul className="list-disc pl-5 space-y-1">
              <li>Your account and profile (username, email, password, avatar).</li>
              <li>Your rating, title and personal profile data.</li>
              <li>Your registered notification (push) tokens.</li>
            </ul>
          </Section>

          <Section title="What may be retained">
            <p>
              Completed games are part of other players&apos; match history, so game
              records may be kept in anonymized form (no longer linked to your
              account) for the integrity of those players&apos; histories and ratings.
              We may also retain limited records where required by law.
            </p>
          </Section>

          <Section title="Questions">
            <p>
              For anything related to your data, contact{" "}
              <a className="text-amber-400 underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
              See also our{" "}
              <a className="text-amber-400 underline" href="/privacy">Privacy Policy</a>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
