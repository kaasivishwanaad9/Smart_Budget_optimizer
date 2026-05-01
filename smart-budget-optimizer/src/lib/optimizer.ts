export type Priority = "High" | "Medium" | "Low";

export interface Expense {
  id: string;
  name: string;
  cost: number;
  priority: Priority;
}

export interface OptimizationResult {
  selected: Expense[];
  totalCost: number;
  remaining: number;
  priorityScore: number;
}

export interface OptimizeResponse {
  budget: number;
  greedy: OptimizationResult;
  dp: OptimizationResult;
  greedyIsOptimal: boolean;
}

export const priorityValue = (p: Priority): number =>
  p === "High" ? 3 : p === "Medium" ? 2 : 1;

/** Greedy: sort by priority/cost ratio descending, take while it fits. */
export function greedyOptimize(
  expenses: Expense[],
  budget: number
): OptimizationResult {
  const sorted = [...expenses].sort((a, b) => {
    const ra = priorityValue(a.priority) / Math.max(a.cost, 1e-9);
    const rb = priorityValue(b.priority) / Math.max(b.cost, 1e-9);
    return rb - ra;
  });

  const selected: Expense[] = [];
  let totalCost = 0;
  let priorityScore = 0;
  for (const e of sorted) {
    if (totalCost + e.cost <= budget) {
      selected.push(e);
      totalCost += e.cost;
      priorityScore += priorityValue(e.priority);
    }
  }
  return {
    selected,
    totalCost,
    remaining: +(budget - totalCost).toFixed(2),
    priorityScore,
  };
}

/** 0/1 Knapsack DP. Costs are scaled to integers (cents) for the table. */
export function dpOptimize(
  expenses: Expense[],
  budget: number
): OptimizationResult {
  const SCALE = 100;
  const W = Math.floor(budget * SCALE);
  const n = expenses.length;
  const weights = expenses.map((e) => Math.floor(e.cost * SCALE));
  const values = expenses.map((e) => priorityValue(e.priority));

  // Guard: if table would be enormous, fall back to greedy.
  if (n * (W + 1) > 5_000_000) {
    return greedyOptimize(expenses, budget);
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(W + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1];
    const v = values[i - 1];
    for (let c = 0; c <= W; c++) {
      dp[i][c] = dp[i - 1][c];
      if (w <= c && dp[i - 1][c - w] + v > dp[i][c]) {
        dp[i][c] = dp[i - 1][c - w] + v;
      }
    }
  }

  // Backtrack
  const selected: Expense[] = [];
  let c = W;
  for (let i = n; i > 0; i--) {
    if (dp[i][c] !== dp[i - 1][c]) {
      selected.push(expenses[i - 1]);
      c -= weights[i - 1];
    }
  }
  selected.reverse();

  const totalCost = selected.reduce((s, e) => s + e.cost, 0);
  const priorityScore = selected.reduce(
    (s, e) => s + priorityValue(e.priority),
    0
  );
  return {
    selected,
    totalCost: +totalCost.toFixed(2),
    remaining: +(budget - totalCost).toFixed(2),
    priorityScore,
  };
}

export function optimize(
  expenses: Expense[],
  budget: number
): OptimizeResponse {
  const greedy = greedyOptimize(expenses, budget);
  const dp = dpOptimize(expenses, budget);
  return {
    budget,
    greedy,
    dp,
    greedyIsOptimal: greedy.priorityScore === dp.priorityScore,
  };
}
