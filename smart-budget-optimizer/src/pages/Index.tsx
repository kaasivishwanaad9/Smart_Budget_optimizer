import { useMemo, useState } from "react";
import { Expense, optimize, OptimizeResponse, Priority } from "@/lib/optimizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResultCard } from "@/components/ResultCard";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Wallet, Zap, BrainCircuit, Github } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 9);

const SAMPLE: Expense[] = [
  { id: uid(), name: "Rent", cost: 1200, priority: "High" },
  { id: uid(), name: "Groceries", cost: 350, priority: "High" },
  { id: uid(), name: "Internet", cost: 60, priority: "Medium" },
  { id: uid(), name: "Gym", cost: 45, priority: "Low" },
  { id: uid(), name: "Streaming", cost: 25, priority: "Low" },
  { id: uid(), name: "Transit Pass", cost: 110, priority: "Medium" },
];

const Index = () => {
  const [budget, setBudget] = useState<string>("1500");
  const [expenses, setExpenses] = useState<Expense[]>(SAMPLE);
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const totalRequested = useMemo(
    () => expenses.reduce((s, e) => s + (Number(e.cost) || 0), 0),
    [expenses]
  );

  const updateExpense = (id: string, patch: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const addExpense = () =>
    setExpenses((p) => [...p, { id: uid(), name: "", cost: 0, priority: "Medium" }]);

  const removeExpense = (id: string) =>
    setExpenses((p) => p.filter((e) => e.id !== id));

  const handleOptimize = () => {
    const b = Number(budget);
    if (!Number.isFinite(b) || b <= 0) {
      toast({ title: "Invalid budget", description: "Budget must be greater than 0.", variant: "destructive" });
      return;
    }
    if (expenses.length === 0) {
      toast({ title: "No expenses", description: "Add at least one expense.", variant: "destructive" });
      return;
    }
    for (const e of expenses) {
      if (!e.name.trim()) {
        toast({ title: "Missing name", description: "Every expense needs a name.", variant: "destructive" });
        return;
      }
      if (!Number.isFinite(e.cost) || e.cost <= 0) {
        toast({ title: "Invalid cost", description: `"${e.name || "Expense"}" must have a cost > 0.`, variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    // Simulate async API for nicer UX; logic runs on the client.
    setTimeout(() => {
      const res = optimize(expenses, b);
      setResult(res);
      setLoading(false);
      const diff = res.dp.priorityScore - res.greedy.priorityScore;
      toast({
        title: res.greedyIsOptimal ? "Greedy was optimal ✨" : "DP found a better mix",
        description: res.greedyIsOptimal
          ? `Both algorithms scored ${res.dp.priorityScore}.`
          : `Dynamic Programming beat greedy by ${diff} priority point${diff > 1 ? "s" : ""}.`,
      });
      setTimeout(
        () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    }, 250);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" aria-hidden />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/20 blur-3xl" aria-hidden />

        <div className="container relative py-16 md:py-24 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 backdrop-blur border border-border mb-6">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Greedy · Knapsack DP · In-browser
            </span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight max-w-4xl">
            Smart Budget <span className="text-gradient">Optimizer</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Drop in your budget and expenses. Two algorithms race to pick the
            optimal mix by priority — see which one wins.
          </p>
        </div>
      </header>

      <main className="container py-12 space-y-12">
        {/* Inputs */}
        <section className="grid lg:grid-cols-[380px_1fr] gap-6">
          <Card className="p-6 bg-gradient-card border-2 h-fit lg:sticky lg:top-6 shadow-soft">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-xl font-bold">Budget</h2>
            </div>

            <Label htmlFor="budget" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Total available
            </Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-display font-bold text-muted-foreground">₹</span>
              <Input
                id="budget"
                type="number"
                min={0}
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="pl-8 h-14 text-2xl font-display font-bold tabular-nums"
              />
            </div>

            <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-2">
              <Row label="Expenses" value={expenses.length.toString()} />
              <Row label="Total requested" value={`₹${totalRequested.toFixed(2)}`} />
              <Row
                label="Over budget by"
                value={
                  totalRequested > Number(budget)
                    ? `₹${(totalRequested - Number(budget)).toFixed(2)}`
                    : "—"
                }
                tone={totalRequested > Number(budget) ? "warn" : "muted"}
              />
            </div>

            <Button
              onClick={handleOptimize}
              disabled={loading}
              className="w-full mt-6 h-12 text-base font-semibold bg-gradient-primary hover:opacity-90 transition-smooth shadow-elegant border-0"
            >
              {loading ? "Optimizing…" : "Optimize Budget"}
            </Button>
          </Card>

          {/* Expenses */}
          <Card className="p-6 bg-gradient-card border-2 shadow-soft">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-success">
                  <Plus className="h-5 w-5 text-success-foreground" />
                </div>
                <h2 className="font-display text-xl font-bold">Expenses</h2>
              </div>
              <Button onClick={addExpense} variant="outline" size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>

            <div className="hidden md:grid grid-cols-[1fr_140px_140px_40px] gap-3 px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>Name</span>
              <span>Cost</span>
              <span>Priority</span>
              <span />
            </div>

            <div className="space-y-2">
              {expenses.map((e, i) => (
                <div
                  key={e.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_40px] gap-2 md:gap-3 p-3 rounded-xl bg-secondary/40 border border-border/50 animate-fade-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <Input
                    placeholder="e.g. Rent"
                    value={e.name}
                    onChange={(ev) => updateExpense(e.id, { name: ev.target.value })}
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={e.cost || ""}
                    onChange={(ev) =>
                      updateExpense(e.id, { cost: parseFloat(ev.target.value) || 0 })
                    }
                    className="font-mono tabular-nums"
                  />
                  <Select
                    value={e.priority}
                    onValueChange={(v) => updateExpense(e.id, { priority: v as Priority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">🔴 High (3)</SelectItem>
                      <SelectItem value="Medium">🟡 Medium (2)</SelectItem>
                      <SelectItem value="Low">🔵 Low (1)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExpense(e.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove expense"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No expenses yet. Click <strong>Add</strong> to start.
                </p>
              )}
            </div>
          </Card>
        </section>

        {/* Results */}
        {result && (
          <section id="results" className="space-y-6 animate-fade-up">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Comparison
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">
                  Greedy <span className="text-muted-foreground">vs</span>{" "}
                  <span className="text-gradient">Dynamic Programming</span>
                </h2>
              </div>
              <Card
                className={`px-5 py-3 border-2 ${
                  result.greedyIsOptimal
                    ? "border-success/40 bg-success/5"
                    : "border-primary/40 bg-primary/5"
                }`}
              >
                <p className="text-sm">
                  {result.greedyIsOptimal ? (
                    <>
                      <strong className="text-success">Greedy is optimal</strong> —
                      same priority score as DP.
                    </>
                  ) : (
                    <>
                      <strong className="text-primary">DP wins</strong> by{" "}
                      <span className="font-mono">
                        {result.dp.priorityScore - result.greedy.priorityScore}
                      </span>{" "}
                      priority point(s).
                    </>
                  )}
                </p>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3 text-sm font-mono uppercase tracking-widest text-muted-foreground">
                  <Zap className="h-4 w-4 text-accent" /> Fast & approximate
                </div>
                <ResultCard
                  title="Greedy"
                  subtitle="Value / Cost ratio"
                  result={result.greedy}
                  budget={result.budget}
                  accent="accent"
                  highlight={result.greedyIsOptimal}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3 text-sm font-mono uppercase tracking-widest text-muted-foreground">
                  <BrainCircuit className="h-4 w-4 text-primary" /> Provably optimal
                </div>
                <ResultCard
                  title="Dynamic Programming"
                  subtitle="0/1 Knapsack"
                  result={result.dp}
                  budget={result.budget}
                  accent="primary"
                  highlight={!result.greedyIsOptimal}
                />
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border mt-12 py-8">
        <div className="container flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            Built with React · TypeScript · Tailwind. Algorithms run client-side
            for instant results.
          </p>
          <a
            href="https://en.wikipedia.org/wiki/Knapsack_problem"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-smooth"
          >
            <Github className="h-4 w-4" /> Knapsack reference
          </a>
        </div>
      </footer>
    </div>
  );
};

const Row = ({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "warn";
}) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span
      className={`font-mono tabular-nums ${
        tone === "warn" ? "text-warning font-semibold" : "text-foreground"
      }`}
    >
      {value}
    </span>
  </div>
);

export default Index;
