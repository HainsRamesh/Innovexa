import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserProfileLinkProps {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  showName?: boolean;
  avatarSize?: "sm" | "md" | "lg";
  className?: string;
  nameClassName?: string;
}

const avatarSizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export function UserProfileLink({
  userId,
  fullName,
  avatarUrl,
  showName = true,
  avatarSize = "md",
  className,
  nameClassName,
}: UserProfileLinkProps) {
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Link
      to={`/users/${userId}`}
      className={cn(
        "inline-flex items-center gap-2 group cursor-pointer",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <Avatar
        className={cn(
          avatarSizes[avatarSize],
          "ring-2 ring-transparent transition-all duration-200",
          "group-hover:ring-primary/50 group-hover:scale-105"
        )}
      >
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="bg-muted text-muted-foreground">
          {getInitials(fullName)}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span
          className={cn(
            "font-semibold transition-colors duration-200",
            "group-hover:text-primary group-hover:underline underline-offset-2",
            nameClassName
          )}
        >
          {fullName || "Anonymous"}
        </span>
      )}
    </Link>
  );
}
