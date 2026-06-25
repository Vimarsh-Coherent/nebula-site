import { cn } from "@/lib/utils";

/** Max-width content container with responsive horizontal padding. */
export default function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-(--container-max) px-6 sm:px-8 lg:px-12",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
