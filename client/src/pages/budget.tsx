import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartBudgetAdvisor } from "@/components/ai/SmartBudgetAdvisor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfMonth, endOfMonth, parseISO, subMonths, eachMonthOfInterval } from "date-fns";
import { 
  Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, 
  PieChart, BarChart3, Calendar, Target, Activity
} from "lucide-react";
import { 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BudgetCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  budgetLimit?: number;
  color: string;
  description?: string;
  userId: string;
  familyId?: string;
  createdAt: Date;
}

interface BudgetTransaction {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
  userId: string;
  familyId?: string;
  createdAt: Date;
}

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  type: z.enum(['income', 'expense']),
  budgetLimit: z.number().positive().optional(),
  color: z.string().min(1, "Color is required"),
  description: z.string().optional(),
  familyId: z.string().optional(),
});

const transactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(['income', 'expense']).default('expense'),
  familyId: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;
type TransactionForm = z.infer<typeof transactionSchema>;

const defaultCategories = [
  { name: "Salary", type: "income" as const, color: "#10b981" },
  { name: "Freelance", type: "income" as const, color: "#06b6d4" },
  { name: "Groceries", type: "expense" as const, color: "#f59e0b" },
  { name: "Transportation", type: "expense" as const, color: "#ef4444" },
  { name: "Entertainment", type: "expense" as const, color: "#8b5cf6" },
  { name: "Bills", type: "expense" as const, color: "#6b7280" },
];

export default function Budget() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<BudgetTransaction | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categoryForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "expense",
      budgetLimit: undefined,
      color: "#f59e0b",
      description: "",
      familyId: user?.familyId || undefined,
    },
  });

  const transactionForm = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      description: "",
      categoryId: "",
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'expense' as const,
      familyId: user?.familyId || undefined,
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<BudgetCategory[]>({
    queryKey: ['/api/budget/categories'],
    enabled: !!user,
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery<BudgetTransaction[]>({
    queryKey: ['/api/budget/transactions'],
    enabled: !!user,
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      return await apiRequest("POST", "/api/budget/categories", {
        ...data,
        userId: user?.id,
        familyId: data.familyId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget/categories'] });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
      toast({ title: "Success", description: "Category created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionForm) => {
      // Find selected category to determine transaction type
      const selectedCategory = categories.find(c => c.id === data.categoryId);
      return await apiRequest("POST", "/api/budget/transactions", {
        ...data,
        amount: String(data.amount), // Convert to string for API
        type: selectedCategory?.type || 'expense',
        userId: user?.id,
        familyId: data.familyId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget/transactions'] });
      setIsTransactionDialogOpen(false);
      transactionForm.reset();
      toast({ title: "Success", description: "Transaction added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/budget/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget/categories'] });
      toast({ title: "Success", description: "Category deleted successfully" });
    },
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/budget/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget/transactions'] });
      toast({ title: "Success", description: "Transaction deleted successfully" });
    },
  });

  // Calculate monthly summaries
  // Enhanced analytics data
  const analyticsData = useMemo(() => {
    // Get last 6 months data for trends
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      return subMonths(currentMonth, 5 - i);
    });

    const monthlyTrends = last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = transactions.filter(transaction => {
        const transactionDate = parseISO(transaction.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => {
          const category = categories.find(c => c.id === t.categoryId);
          return category?.type === 'income';
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => {
          const category = categories.find(c => c.id === t.categoryId);
          return category?.type === 'expense';
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(month, 'MMM yy'),
        monthFull: format(month, 'MMMM yyyy'),
        income,
        expenses,
        net: income - expenses,
        savings: Math.max(0, income - expenses),
      };
    });

    // Category analysis for pie chart
    const categoryAnalysis = categories
      .filter(c => c.type === 'expense')
      .map(category => {
        const spent = transactions
          .filter(t => {
            const transactionDate = parseISO(t.date);
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);
            return t.categoryId === category.id && 
                   transactionDate >= monthStart && 
                   transactionDate <= monthEnd;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        
        return {
          name: category.name,
          value: spent,
          color: category.color,
          percentage: 0, // Will be calculated below
        };
      })
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);

    // Calculate percentages
    const totalSpending = categoryAnalysis.reduce((sum, c) => sum + c.value, 0);
    categoryAnalysis.forEach(category => {
      category.percentage = totalSpending > 0 ? (category.value / totalSpending) * 100 : 0;
    });

    // Daily spending trend for current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const currentMonthTransactions = transactions.filter(transaction => {
      const transactionDate = parseISO(transaction.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    // Group by day for daily spending
    const dailySpending = currentMonthTransactions
      .filter(t => {
        const category = categories.find(c => c.id === t.categoryId);
        return category?.type === 'expense';
      })
      .reduce((acc, transaction) => {
        const day = format(parseISO(transaction.date), 'dd');
        acc[day] = (acc[day] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    const dailyData = Object.entries(dailySpending)
      .map(([day, amount]) => ({
        day: parseInt(day),
        amount,
        formattedDay: `${day}`,
      }))
      .sort((a, b) => a.day - b.day);

    return {
      monthlyTrends,
      categoryAnalysis,
      dailyData,
      totalCategories: categories.length,
      totalTransactions: transactions.length,
      averageMonthlyIncome: monthlyTrends.length > 0 
        ? monthlyTrends.reduce((sum, m) => sum + m.income, 0) / monthlyTrends.length 
        : 0,
      averageMonthlyExpenses: monthlyTrends.length > 0 
        ? monthlyTrends.reduce((sum, m) => sum + m.expenses, 0) / monthlyTrends.length 
        : 0,
    };
  }, [transactions, categories, currentMonth]);

  const monthlyData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = parseISO(transaction.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    const totalIncome = monthlyTransactions
      .filter(t => {
        const category = categories.find(c => c.id === t.categoryId);
        return category?.type === 'income';
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthlyTransactions
      .filter(t => {
        const category = categories.find(c => c.id === t.categoryId);
        return category?.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const categorySpending = categories
      .filter(c => c.type === 'expense')
      .map(category => {
        const spent = monthlyTransactions
          .filter(t => t.categoryId === category.id)
          .reduce((sum, t) => sum + t.amount, 0);
        
        return {
          ...category,
          spent,
          percentage: totalExpenses > 0 ? (spent / totalExpenses) * 100 : 0,
          overBudget: category.budgetLimit ? spent > category.budgetLimit : false,
        };
      })
      .sort((a, b) => b.spent - a.spent);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      categorySpending,
      transactions: monthlyTransactions,
    };
  }, [transactions, categories, currentMonth]);

  const onSubmitCategory = (data: CategoryForm) => {
    createCategoryMutation.mutate(data);
  };

  const onSubmitTransaction = (data: TransactionForm) => {
    createTransactionMutation.mutate(data);
  };

  const openCategoryDialog = (category?: BudgetCategory) => {
    if (category) {
      setEditingCategory(category);
      categoryForm.reset({
        name: category.name,
        type: category.type,
        budgetLimit: category.budgetLimit,
        color: category.color,
        description: category.description || "",
        familyId: category.familyId || undefined,
      });
    } else {
      setEditingCategory(null);
      categoryForm.reset();
    }
    setIsCategoryDialogOpen(true);
  };

  const openTransactionDialog = (transaction?: BudgetTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      transactionForm.reset({
        amount: transaction.amount,
        description: transaction.description,
        categoryId: transaction.categoryId,
        date: transaction.date,
        familyId: transaction.familyId || undefined,
      });
    } else {
      setEditingTransaction(null);
      transactionForm.reset();
    }
    setIsTransactionDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* AI Budget Advisor */}
      <div className="mb-8">
        <SmartBudgetAdvisor />
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budget</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            data-testid="button-new-category"
            onClick={() => {
              console.log("Budget Category button clicked!");
              openCategoryDialog();
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Button>
          
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </DialogTitle>
              </DialogHeader>
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Category name" 
                            {...field} 
                            data-testid="input-category-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={categoryForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={categoryForm.control}
                    name="budgetLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Limit (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-budget-limit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={categoryForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input 
                            type="color" 
                            {...field} 
                            data-testid="input-category-color"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={categoryForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Category description" 
                            {...field} 
                            data-testid="input-category-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createCategoryMutation.isPending}
                      data-testid="button-save-category"
                    >
                      {createCategoryMutation.isPending ? "Saving..." : "Save Category"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCategoryDialogOpen(false)}
                      data-testid="button-cancel-category"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Button 
            data-testid="button-new-transaction"
            onClick={() => {
              console.log("Budget Transaction button clicked!");
              openTransactionDialog();
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
          
          <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                </DialogTitle>
              </DialogHeader>
              <Form {...transactionForm}>
                <form onSubmit={transactionForm.handleSubmit(onSubmitTransaction)} className="space-y-4">
                  <FormField
                    control={transactionForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Transaction description" 
                            {...field} 
                            data-testid="input-transaction-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={transactionForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-transaction-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={transactionForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              data-testid="input-transaction-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={transactionForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-transaction-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                  {category.type === 'income' ? 
                                    <TrendingUp className="w-3 h-3 text-green-500" /> : 
                                    <TrendingDown className="w-3 h-3 text-red-500" />
                                  }
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createTransactionMutation.isPending}
                      data-testid="button-save-transaction"
                    >
                      {createTransactionMutation.isPending ? "Saving..." : "Save Transaction"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsTransactionDialogOpen(false)}
                      data-testid="button-cancel-transaction"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Month Navigation */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Monthly Summary</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    data-testid="button-prev-month"
                  >
                    ←
                  </Button>
                  <span className="font-medium">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    data-testid="button-next-month"
                  >
                    →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">Total Income</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900" data-testid="total-income">
                    ${monthlyData.totalIncome.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <TrendingDown className="w-5 h-5" />
                    <span className="font-medium">Total Expenses</span>
                  </div>
                  <div className="text-2xl font-bold text-red-900" data-testid="total-expenses">
                    ${monthlyData.totalExpenses.toFixed(2)}
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${monthlyData.netIncome >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <div className="flex items-center gap-2 text-blue-700">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">Net Income</span>
                  </div>
                  <div className={`text-2xl font-bold ${monthlyData.netIncome >= 0 ? 'text-blue-900' : 'text-orange-900'}`} data-testid="net-income">
                    ${monthlyData.netIncome.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Spending */}
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.categorySpending.map(category => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                        {category.overBudget && (
                          <Badge variant="destructive">Over Budget</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${category.spent.toFixed(2)}</div>
                        {category.budgetLimit && (
                          <div className="text-sm text-gray-500">
                            of ${category.budgetLimit.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(category.percentage, 100)}%`,
                          backgroundColor: category.overBudget ? '#ef4444' : category.color
                        }}
                      />
                    </div>
                  </div>
                ))}
                
                {monthlyData.categorySpending.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No expenses this month
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyData.transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(transaction => {
                    const category = categories.find(c => c.id === transaction.categoryId);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category?.color || '#6b7280' }}
                          />
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                              <span>•</span>
                              {category?.name || 'Unknown Category'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`font-bold ${category?.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {category?.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openTransactionDialog(transaction)}
                            data-testid={`button-edit-transaction-${transaction.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                            data-testid={`button-delete-transaction-${transaction.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                
                {monthlyData.transactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No transactions this month
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(category => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                        <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                          {category.type}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openCategoryDialog(category)}
                          data-testid={`button-edit-category-${category.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                          data-testid={`button-delete-category-${category.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {category.description && (
                      <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                    )}
                    
                    {category.budgetLimit && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-3 h-3" />
                        <span>Budget: ${category.budgetLimit.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {categories.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No categories yet</p>
                    <p className="text-sm">Create your first category to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Activity className="w-5 h-5" />
                  <span className="font-medium">Avg Monthly Income</span>
                </div>
                <div className="text-2xl font-bold text-blue-900" data-testid="avg-income">
                  ${analyticsData.averageMonthlyIncome.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="w-5 h-5" />
                  <span className="font-medium">Avg Monthly Expenses</span>
                </div>
                <div className="text-2xl font-bold text-red-900" data-testid="avg-expenses">
                  ${analyticsData.averageMonthlyExpenses.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Target className="w-5 h-5" />
                  <span className="font-medium">Total Categories</span>
                </div>
                <div className="text-2xl font-bold text-green-900" data-testid="total-categories">
                  {analyticsData.totalCategories}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-purple-600">
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">Total Transactions</span>
                </div>
                <div className="text-2xl font-bold text-purple-900" data-testid="total-transactions">
                  {analyticsData.totalTransactions}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 6-Month Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>6-Month Financial Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `$${value.toFixed(2)}`, 
                        name === 'income' ? 'Income' : 
                        name === 'expenses' ? 'Expenses' : 
                        name === 'net' ? 'Net Income' : name
                      ]}
                      labelFormatter={(label) => {
                        const monthData = analyticsData.monthlyTrends.find(m => m.month === label);
                        return monthData?.monthFull || label;
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                      name="Income"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stackId="2"
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.6}
                      name="Expenses"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                      name="Net Income"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Spending Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <p className="text-sm text-gray-600">
                  Current month: {format(currentMonth, 'MMMM yyyy')}
                </p>
              </CardHeader>
              <CardContent>
                {analyticsData.categoryAnalysis.length > 0 ? (
                  <div className="space-y-4">
                    <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={analyticsData.categoryAnalysis}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => 
                              percentage > 5 ? `${name} ${percentage.toFixed(1)}%` : ''
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analyticsData.categoryAnalysis.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Category Legend */}
                    <div className="grid grid-cols-1 gap-2">
                      {analyticsData.categoryAnalysis.slice(0, 6).map((category) => (
                        <div key={category.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span>{category.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">${category.value.toFixed(2)}</span>
                            <span className="text-gray-500">({category.percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No spending data for this month</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Comparison Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income vs Expenses</CardTitle>
                <p className="text-sm text-gray-600">Last 6 months comparison</p>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `$${value.toFixed(2)}`, 
                          name === 'income' ? 'Income' : 'Expenses'
                        ]}
                        labelFormatter={(label) => {
                          const monthData = analyticsData.monthlyTrends.find(m => m.month === label);
                          return monthData?.monthFull || label;
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="income" 
                        fill="#10b981" 
                        name="Income"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="expenses" 
                        fill="#ef4444" 
                        name="Expenses"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Spending Trend */}
          {analyticsData.dailyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Spending Pattern</CardTitle>
                <p className="text-sm text-gray-600">
                  Daily expenses for {format(currentMonth, 'MMMM yyyy')}
                </p>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="formattedDay" 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount Spent']}
                        labelFormatter={(label) => `Day ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Savings Rate Indicator */}
          <Card>
            <CardHeader>
              <CardTitle>Savings Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analyticsData.monthlyTrends.slice(-3).map((month, index) => {
                  const savingsRate = month.income > 0 ? (month.savings / month.income) * 100 : 0;
                  return (
                    <div key={month.month} className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-bold text-gray-700">{month.monthFull}</div>
                      <div className="text-2xl font-bold mt-2" 
                           style={{ 
                             color: savingsRate >= 20 ? '#10b981' : 
                                    savingsRate >= 10 ? '#f59e0b' : '#ef4444' 
                           }}>
                        {savingsRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Savings Rate</div>
                      <div className="text-sm text-gray-600 mt-1">
                        ${month.savings.toFixed(2)} saved
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Savings Rate Guide:</strong></p>
                <p>• <span style={{ color: '#10b981' }}>Green (20%+)</span>: Excellent savings rate</p>
                <p>• <span style={{ color: '#f59e0b' }}>Yellow (10-20%)</span>: Good savings rate</p>
                <p>• <span style={{ color: '#ef4444' }}>Red (&lt;10%)</span>: Consider reducing expenses</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}