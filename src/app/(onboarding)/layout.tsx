export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  // dvh (not vh) — iOS Safari toolbar otherwise occludes the footer CTA
  // when the soft keyboard opens on any input-heavy onboarding step.
  // See .claude/rules/ios-pwa-gotchas.md.
  return <div className="min-h-dvh bg-bg">{children}</div>;
}
