export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-2xl space-y-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          M0 — Bootstrap
        </div>
        <h1 className="text-5xl font-semibold tracking-tight">TPMOS</h1>
        <p className="text-lg text-muted-foreground">
          Technical Program Management Operating System.
        </p>
        <p className="text-sm text-muted-foreground/80">
          Build status:{" "}
          <a
            href="https://github.com/ItssooverWeRsoBack/TPMOS/blob/main/STATUS.md"
            className="underline underline-offset-4 hover:text-foreground"
          >
            STATUS.md
          </a>
        </p>
      </div>
    </main>
  );
}
