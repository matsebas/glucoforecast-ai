"use client";

import { User } from "lucide-react";
import { useSession } from "next-auth/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function UserProfile() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 p-2">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const { name, email } = session.user;
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
      <Avatar>
        <AvatarFallback className="bg-sidebar">
          {initials ? initials : <User className="size-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col overflow-hidden">
        {name ? <p className="font-medium text-sm truncate">{name}</p> : null}
        {email ? <p className="text-xs text-muted-foreground truncate">{email}</p> : null}
      </div>
    </div>
  );
}
