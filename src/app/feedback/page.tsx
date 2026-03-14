import Link from "next/link";

const FEEDBACK_TEMPLATE = `Subject: Workout Builder Feedback

Name:
Use Case:

What worked well:
- 

What should be improved:
- 

Bug report (if any):
- Steps to reproduce:
- Expected behavior:
- Actual behavior:

Anything else:
- `;

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-10">
      <main className="mx-auto w-full max-w-[1080px] space-y-5">
        <section className="swiss-reveal relative overflow-hidden border-2 border-[var(--foreground)] bg-[var(--surface)] p-6 sm:p-8">
          <div
            aria-hidden
            className="absolute right-0 top-0 h-full w-3 bg-[var(--accent)]"
          />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
              Feedback
            </p>
            <Link
              href="/"
              className="inline-flex h-9 items-center justify-center border border-[var(--foreground)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
            >
              Back to Builder
            </Link>
          </div>

          <h1 className="mt-3 max-w-3xl text-3xl font-bold uppercase tracking-[0.06em] text-[var(--foreground)] sm:text-4xl">
            Help Shape This Project
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--foreground)] sm:text-base">
            Send practical feedback, bug reports, and feature ideas. Clear details help prioritize
            improvements quickly.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href="mailto:konstantin.lazarov@hotmail.com?subject=Workout%20Builder%20Feedback"
              className="inline-flex h-10 items-center justify-center border border-[var(--foreground)] bg-[var(--accent)] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:brightness-95"
            >
              Send Feedback Email
            </a>
            <a
              href="mailto:konstantin.lazarov@hotmail.com"
              className="inline-flex h-10 items-center justify-center border border-[var(--line)] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
            >
              Contact
            </a>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section className="swiss-reveal border-2 border-[var(--foreground)] bg-[var(--surface)] p-5 [animation-delay:80ms] sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              About
            </p>
            <h2 className="mt-2 text-xl font-bold uppercase tracking-[0.08em] text-[var(--foreground)]">
              Konstantin Lazarov
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]">
              <span className="block">AI app builder with a passion for cycling.</span>
              <span className="mt-1 block">
                Hates subscriptions, will keep building useful tools in the open.
              </span>
              <span className="mt-1 block">Feel free to connect :)</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="https://www.linkedin.com/in/konstantin-lazarov/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center border border-[var(--foreground)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/KonLaz"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center border border-[var(--foreground)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                GitHub
              </a>
            </div>
          </section>

          <section className="swiss-reveal border-2 border-[var(--foreground)] bg-[var(--surface)] p-5 [animation-delay:120ms] sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Helpful Feedback
            </p>
            <h2 className="mt-2 text-base font-bold uppercase tracking-[0.08em] text-[var(--foreground)]">
              What helps most
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
              <li className="border-l-2 border-[var(--foreground)] pl-2">
                Exact steps when reporting bugs.
              </li>
              <li className="border-l-2 border-[var(--foreground)] pl-2">
                Device model + firmware if import failed.
              </li>
              <li className="border-l-2 border-[var(--foreground)] pl-2">
                Workout examples you want to build faster.
              </li>
              <li className="border-l-2 border-[var(--foreground)] pl-2">
                One suggestion per message for faster triage.
              </li>
            </ul>
          </section>
        </div>

      </main>
    </div>
  );
}
