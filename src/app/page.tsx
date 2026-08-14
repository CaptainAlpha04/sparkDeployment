export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-10">
      <h1 className="text-4xl font-bold text-primary">SPARK</h1>
      <p className="text-muted-foreground mt-2">Token check.</p>
      <div className="mt-6 h-16 w-full rounded-lg bg-nebula" />
      <div className="mt-2 h-16 w-full rounded-lg bg-ember" />
    </main>
  );
}
