import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-primary">SPARK</h1>
        <p className="text-muted-foreground mt-2">
          Foundation scaffold — design tokens and component kit wired up.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
        <Badge>Badge</Badge>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Token check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-10 rounded-md bg-nebula" />
          <div className="h-10 rounded-md bg-ember" />
          <div className="h-10 rounded-md bg-muted" />
        </CardContent>
      </Card>
    </main>
  );
}
