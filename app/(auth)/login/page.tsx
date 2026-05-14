import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Se connecter</CardTitle>
          <CardDescription>
            Connectez-vous à votre cockpit PINKEVO. Auth Supabase arrive en Phase 1.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" variant="outline" disabled>
            Continuer avec Google
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="vous@pinkevo.com" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" disabled />
          </div>
          <Button className="w-full" disabled>
            Se connecter
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Pas de compte ?{" "}
            <Link href="/signup" className="font-medium text-brand-600 hover:underline">
              Demander un accès
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
