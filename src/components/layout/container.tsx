import { cn } from "@/lib/utils";

export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12",
        className,
      )}
      {...props}
    />
  );
}
