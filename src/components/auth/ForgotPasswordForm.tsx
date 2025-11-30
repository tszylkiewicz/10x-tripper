import { useState, type FormEvent } from "react";
import { forgotPasswordSchema } from "@/lib/validators/auth.validator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Mail } from "lucide-react";

interface ForgotPasswordFormProps {
  message?: string;
  error?: string;
}

export function ForgotPasswordForm({ message, error: initialError }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation with Zod
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      setLoading(false);
      return;
    }

    try {
      // Call API endpoint
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error.message);
        return;
      }

      // Success - show confirmation message
      setSuccess(true);
    } catch (error) {
      setError("Problem z połączeniem. Spróbuj ponownie");
    } finally {
      setLoading(false);
    }
  };

  // Success state - show email sent confirmation
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Sprawdź swoją skrzynkę</CardTitle>
            <CardDescription className="text-center">
              Jeśli konto z adresem <strong>{email}</strong> istnieje, wysłaliśmy link do resetowania hasła.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                Link będzie aktywny przez 60 minut. Jeśli nie otrzymałeś emaila, sprawdź folder spam.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
            <div>
              Przypomniałeś sobie hasło?{" "}
              <a href="/login" className="text-primary hover:underline">
                Zaloguj się
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Forgot password form
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Zapomniałeś hasła?</CardTitle>
          <CardDescription>Wyślemy Ci link do zresetowania hasła</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Success message (from URL params) */}
          {message && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{getMessageText(message)}</AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adres email</Label>
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Podaj adres email powiązany z Twoim kontem
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Wysyłanie..." : "Wyślij link resetujący"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
          <div>
            Przypomniałeś sobie hasło?{" "}
            <a href="/login" className="text-primary hover:underline">
              Zaloguj się
            </a>
          </div>
          <div>
            Nie masz konta?{" "}
            <a href="/register" className="text-primary hover:underline">
              Zarejestruj się
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Maps URL query message codes to user-friendly Polish messages
 */
function getMessageText(code: string): string {
  const messages: Record<string, string> = {
    "password-expired": "Link do resetowania hasła wygasł. Wygeneruj nowy.",
  };

  return messages[code] || code;
}
