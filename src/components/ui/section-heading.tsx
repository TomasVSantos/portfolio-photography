import { cn } from "@/lib/utils";

export function SectionHeading({
  children,
  className,
}: {
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <h2 className="font-serif text-4xl leading-[1.05] font-normal tracking-[-0.035em] sm:text-5xl lg:text-6xl">
        {children}
      </h2>
    </div>
  );
}
