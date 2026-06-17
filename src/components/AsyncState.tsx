import type { ReactNode } from "react";

type AsyncStateProps = {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
};

export default function AsyncState({
  loading,
  error,
  empty,
  emptyMessage = "Nothing here yet.",
  children,
}: AsyncStateProps) {
  if (loading) {
    return <p className="rounded-md bg-cream px-4 py-3 text-sm">Loading...</p>;
  }

  if (error) {
    return (
      <p className="rounded-md border border-brick/30 bg-brick/10 px-4 py-3 text-sm font-semibold text-brick">
        {error}
      </p>
    );
  }

  if (empty) {
    return (
      <p className="rounded-md border border-dashed border-ink/20 bg-cream px-4 py-5 text-sm text-ink/70">
        {emptyMessage}
      </p>
    );
  }

  return <>{children}</>;
}
