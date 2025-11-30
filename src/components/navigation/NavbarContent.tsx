import { useState } from "react";
import { MapPin, Menu, Plus, User, LogOut, List, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavbarContentProps {
  userEmail?: string;
  currentPath: string;
}

export function NavbarContent({ userEmail, currentPath }: NavbarContentProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 font-semibold">
          <MapPin className="size-6 text-primary" />
          <span className="text-xl">Tripper</span>
        </a>

        {/* Desktop Navigation - hidden on mobile */}
        <nav className="hidden sm:flex items-center gap-1">
          <a
            href="/"
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              currentPath === "/" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
            aria-current={currentPath === "/" ? "page" : undefined}
          >
            Plany
          </a>
          <a
            href="/preferences"
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              currentPath === "/preferences" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
            aria-current={currentPath === "/preferences" ? "page" : undefined}
          >
            Preferencje
          </a>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Desktop Create Plan Button */}
          <Button asChild className="hidden sm:flex gap-2">
            <a href="/trip-plans/new">
              <Plus className="size-4" />
              <span>Utwórz plan</span>
            </a>
          </Button>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="gap-2"
              aria-label="Menu użytkownika"
              aria-expanded={isUserMenuOpen}
            >
              <User className="size-4" />
              {userEmail && <span className="hidden md:inline text-sm">{userEmail}</span>}
            </Button>

            {isUserMenuOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-56 z-50 rounded-md border bg-popover p-1 shadow-md">
                  {userEmail && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground border-b mb-1">{userEmail}</div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <LogOut className="size-4" />
                    Wyloguj
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu - Sheet Component */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="sm:hidden" aria-label="Menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                {/* Create Plan Button - Prominent */}
                <Button asChild className="w-full justify-start gap-2" size="lg">
                  <a href="/trip-plans/new" onClick={() => setIsMobileMenuOpen(false)}>
                    <Plus className="size-5" />
                    <span className="text-base font-semibold">Utwórz plan</span>
                  </a>
                </Button>

                {/* Navigation Links */}
                <div className="space-y-1">
                  <a
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-md text-base transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      currentPath === "/" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
                    )}
                    aria-current={currentPath === "/" ? "page" : undefined}
                  >
                    <List className="size-5" />
                    Plany
                  </a>
                  <a
                    href="/preferences"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-md text-base transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      currentPath === "/preferences"
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                    aria-current={currentPath === "/preferences" ? "page" : undefined}
                  >
                    <Settings className="size-5" />
                    Preferencje
                  </a>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
