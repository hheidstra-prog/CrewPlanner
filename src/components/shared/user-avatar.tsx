import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  imageUrl?: string;
  initials: string;
  fullName?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export function UserAvatar({ imageUrl, initials, fullName, size = "md" }: UserAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size])}>
      {imageUrl && <AvatarImage src={imageUrl} alt={fullName ?? ""} />}
      <AvatarFallback className="bg-navy text-white font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
