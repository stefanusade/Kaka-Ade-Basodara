export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <span className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-100">{title}</h2>
      {description && <p className="mt-4 text-slate-600 dark:text-slate-400">{description}</p>}
    </div>
  );
}
