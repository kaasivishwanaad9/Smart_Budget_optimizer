import { Expense, OptimizationResult, priorityValue } from "@/lib/optimizer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
  result: OptimizationResult;
  budget: number;
  highlight?: boolean;
  accent: "primary" | "accent";
}

const priorityClass = (p: Expense["priority"]) =>
  p === "High"
    ? "bg-priority-high/15 text-priority-high border-priority-high/30"
    : p === "Medium"
    ? "bg-priority-medium/15 text-priority-medium border-priority-medium/40"
    : "bg-priority-low/15 text-priority-low border-priority-low/30";

export const ResultCard = ({
  title,
  subtitle,
  result,
  budget,
  highlight,
  accent,
}: Props) => {
  const usedPct = budget > 0 ? Math.min(100, (result.totalCost / budget) * 100) : 0;
  const accentClass =
    accent === "primary"
      ? "from-primary to-primary-glow"
      : "from-accent to-primary-glow";

  return (
    <Card
      className={`relative overflow-hidden p-6 md:p-7 bg-gradient-card border-2 transition-smooth animate-scale-in ${
        highlight
          ? "border-primary/40 shadow-elegant"
          : "border-border hover:border-primary/20"
      }`}
    >
      {highlight && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-gradient-primary text-primary-foreground border-0 gap-1">
            <Sparkles className="h-3 w-3" /> Optimal
          </Badge>
        </div>
      )}

      <div className="mb-5">
        <div className={`inline-block text-xs font-mono uppercase tracking-widest bg-gradient-to-r ${accentClass} bg-clip-text text-transparent`}>
          {subtitle}
        </div>
        <h3 className="font-display text-2xl font-bold mt-1">{title}</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Used" value={`₹${result.totalCost.toFixed(2)}`} />
        <Stat label="Remaining" value={`₹${result.remaining.toFixed(2)}`} />
        <Stat
          label="Score"
          value={result.priorityScore.toString()}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1.5">
          <span>BUDGET USAGE</span>
          <span>{usedPct.toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${accentClass} transition-smooth`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>

      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Selected ({result.selected.length})
        </div>
        {result.selected.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No expenses selected.</p>
        ) : (
          <ul className="space-y-2">
            {result.selected.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/60 border border-border/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="outline" className={`${priorityClass(e.priority)} font-mono text-[10px]`}>
                    {priorityValue(e.priority)}
                  </Badge>
                  <span className="font-medium truncate">{e.name}</span>
                </div>
                <span className="font-mono text-sm tabular-nums">₹{e.cost.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

const Stat = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) => (
  <div className="rounded-xl bg-secondary/50 border border-border/50 p-3">
    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1">
      {icon}
      {label}
    </div>
    <div className="font-display text-lg font-bold tabular-nums mt-0.5">{value}</div>
  </div>
);
