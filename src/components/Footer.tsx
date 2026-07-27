export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-ivory">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg italic text-crown-400">My Hair My Crown</p>
            <p className="mt-1 text-ivory/60">Crowning every client, every visit.</p>
          </div>
          <div className="text-ivory/60">
            <p>Tue–Fri 9:00–18:00 · Sat 9:00–17:00</p>
            <p>Closed Sun &amp; Mon</p>
          </div>
        </div>
        <p className="mt-8 text-xs text-ivory/40">
          © {new Date().getFullYear()} My Hair My Crown. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
