import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-6">
        <Film className="size-8" />
      </div>
      <h1 className="text-8xl font-extrabold tracking-tighter text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Page not found</h2>
      <p className="mt-2 max-w-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild><Link to="/">Go home</Link></Button>
        <Button variant="secondary" asChild><Link to="/browse">Browse titles</Link></Button>
      </div>
    </div>
  );
}
