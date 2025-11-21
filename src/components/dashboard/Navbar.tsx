import { LogOut, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  userEmail?: string;
}

/**
 * Navbar component
 * Top navigation bar with logo and user actions
 */
export function Navbar({ userEmail }: NavbarProps) {
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <MapPin className="size-6 text-primary" />
          <span className="text-xl">Tripper</span>
        </a>

        <div className="flex items-center gap-4">
          {userEmail && <span className="hidden text-sm text-muted-foreground md:inline">{userEmail}</span>}
          <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Wyloguj się">
            <LogOut className="size-4 md:mr-2" />
            <span className="hidden md:inline">Wyloguj</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
