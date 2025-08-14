import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Plus, DollarSign, TrendingUp, TrendingDown, 
  PieChart, Calendar, Users, User, Edit, Trash2
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { BudgetCategory, BudgetTransaction } from "@shared/schema";

export default function Budget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "categories" | "transactions">("overview");

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/budget/categories'],
    enabled: !!user?.familyId,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/budget/transactions'],
    enabled: !!user?.familyId,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      monthlyLimit?: number;
      color?: string;
      familyId?: string;
    }) => {
      return apiRequest('POST', '/api/budget/categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget/categories'] });
      setShowCategoryForm(false);
      toast({ title: "Success", description: "Category created successfully" });
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: {
      categoryId: string;
      amount: number;
      description: string;
      date: string;
      type: string;
      familyId?: string;
    }) => {
      return apiRequest('POST', '/api/budget/transactions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget/transactions'] });
      setShowTransactionForm(false);
      toast({ title: "Success", description: "Transaction added successfully" });
    },
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    monthlyLimit: "",
    color: "#3b82f6",
    isShared: false,
  });

  const [transactionForm, setTransactionForm] = useState({
    categoryId: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    type: "expense",
    isShared: false,
  });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    createCategoryMutation.mutate({
      name: categoryForm.name.trim(),
      monthlyLimit: categoryForm.monthlyLimit ? parseFloat(categoryForm.monthlyLimit) : undefined,
      color: categoryForm.color,
      familyId: categoryForm.isShared && user?.familyId ? user.familyId : undefined,
    });

    setCategoryForm({ name: "", monthlyLimit: "", color: "#3b82f6", isShared: false });
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionForm.categoryId || !transactionForm.amount || !transactionForm.description) return;

    createTransactionMutation.mutate({
      categoryId: transactionForm.categoryId,
      amount: parseFloat(transactionForm.amount),
      description: transactionForm.description.trim(),
      date: new Date(transactionForm.date).toISOString(),
      type: transactionForm.type,
      familyId: transactionForm.isShared && user?.familyId ? user.familyId : undefined,
    });

    setTransactionForm({
      categoryId: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      type: "expense",
      isShared: false,
    });
  };

  // Calculate budget stats
  const totalBudget = categories?.reduce((sum, cat) => sum + parseFloat(cat.monthlyLimit || '0'), 0) || 0;
  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const budgetUsed = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

  const getCategorySpent = (categoryId: string) => {
    return transactions?.filter(t => t.categoryId === categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  };

  const colors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", 
    "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"
  ];

  if (categoriesLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
            <p className="mt-1 text-sm text-gray-600">Track your family's income and expenses</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setShowCategoryForm(true)}
              data-testid="button-create-category"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
            <Button 
              onClick={() => setShowTransactionForm(true)}
              data-testid="button-create-transaction"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Expense
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-budget">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">${totalBudget.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Monthly Budget</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-income">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">${totalIncome.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Total Income</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-expenses">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-budget-used">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <PieChart className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{budgetUsed}%</p>
                  <p className="text-sm text-gray-600">Budget Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "overview", label: "Overview" },
                { id: "categories", label: "Categories" },
                { id: "transactions", label: "Transactions" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-budget-overview">
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Total Spent</span>
                    <span className="text-sm font-bold text-gray-900">
                      ${totalExpenses.toFixed(2)} / ${totalBudget.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={budgetUsed} className="h-3" />
                </div>
                
                <div className="space-y-3">
                  {categories?.slice(0, 5).map((category, index) => {
                    const spent = getCategorySpent(category.id);
                    const limit = parseFloat(category.monthlyLimit || '0');
                    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                    
                    return (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: category.color || colors[index % colors.length] }}
                          ></div>
                          <span className="text-sm text-gray-700">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900">
                            ${spent.toFixed(2)}
                          </span>
                          {limit > 0 && (
                            <div className="text-xs text-gray-500">
                              {percentage}% of ${limit.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }) || (
                    <div className="text-center py-4 text-gray-500">
                      <p>No budget categories yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-recent-transactions">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions?.slice(0, 5).map(transaction => {
                    const category = categories?.find(c => c.id === transaction.categoryId);
                    return (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`transaction-${transaction.id}`}
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: category?.color || "#6b7280" }}
                          ></div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {transaction.description}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {category?.name} • {formatDate(transaction.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-medium",
                            transaction.type === 'income' ? "text-green-600" : "text-red-600"
                          )}>
                            {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {transaction.familyId ? 'Shared' : 'Private'}
                          </Badge>
                        </div>
                      </div>
                    );
                  }) || (
                    <div className="text-center py-8 text-gray-500">
                      <p>No transactions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <Card data-testid="card-categories-list">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Budget Categories</CardTitle>
                <Button onClick={() => setShowCategoryForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {categories?.length === 0 ? (
                <div className="text-center py-12">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                  <p className="text-gray-500 mb-4">Create budget categories to start tracking expenses</p>
                  <Button onClick={() => setShowCategoryForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories?.map((category, index) => {
                    const spent = getCategorySpent(category.id);
                    const limit = parseFloat(category.monthlyLimit || '0');
                    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                    
                    return (
                      <div 
                        key={category.id}
                        className="p-4 border rounded-lg hover:bg-gray-50"
                        data-testid={`category-${category.id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-3"
                              style={{ backgroundColor: category.color || colors[index % colors.length] }}
                            ></div>
                            <h4 className="font-medium text-gray-900">{category.name}</h4>
                          </div>
                          <Badge variant="outline">
                            {category.familyId ? 'Shared' : 'Private'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Spent:</span>
                            <span className="font-medium">${spent.toFixed(2)}</span>
                          </div>
                          {limit > 0 && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Budget:</span>
                                <span className="font-medium">${limit.toFixed(2)}</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                              <div className="text-center text-xs text-gray-500">
                                {percentage}% used
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <Card data-testid="card-transactions-list">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Transactions</CardTitle>
                <Button onClick={() => setShowTransactionForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transactions?.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-500 mb-4">Start tracking your income and expenses</p>
                  <Button onClick={() => setShowTransactionForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions?.map(transaction => {
                    const category = categories?.find(c => c.id === transaction.categoryId);
                    return (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        data-testid={`transaction-item-${transaction.id}`}
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-4"
                            style={{ backgroundColor: category?.color || "#6b7280" }}
                          ></div>
                          <div>
                            <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                              <span>{category?.name}</span>
                              <span>•</span>
                              <span>{formatDate(transaction.date)}</span>
                              <Badge variant="outline" className="text-xs">
                                {transaction.familyId ? (
                                  <><Users className="h-3 w-3 mr-1" />Shared</>
                                ) : (
                                  <><User className="h-3 w-3 mr-1" />Private</>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-lg font-semibold",
                            transaction.type === 'income' ? "text-green-600" : "text-red-600"
                          )}>
                            {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{transaction.type}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Create Category Modal */}
      <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
        <DialogContent data-testid="modal-create-category">
          <DialogHeader>
            <DialogTitle>Create Budget Category</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Groceries, Utilities, Entertainment"
                data-testid="input-category-name"
              />
            </div>
            
            <div>
              <Label htmlFor="monthlyLimit">Monthly Budget Limit (optional)</Label>
              <Input
                id="monthlyLimit"
                type="number"
                step="0.01"
                value={categoryForm.monthlyLimit}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, monthlyLimit: e.target.value }))}
                placeholder="0.00"
                data-testid="input-monthly-limit"
              />
            </div>
            
            <div>
              <Label htmlFor="categoryColor">Color</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  id="categoryColor"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-10"
                  data-testid="input-category-color"
                />
                <span className="text-sm text-gray-500">Choose category color</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">Share with family</span>
                <p className="text-xs text-gray-500">Make this category visible to all family members</p>
              </div>
              <Switch
                checked={categoryForm.isShared}
                onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, isShared: checked }))}
                data-testid="switch-category-shared"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCategoryForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCategoryMutation.isPending}
                data-testid="button-create-category-submit"
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Transaction Modal */}
      <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
        <DialogContent data-testid="modal-create-transaction">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateTransaction} className="space-y-4">
            <div>
              <Label htmlFor="transactionCategory">Category</Label>
              <Select value={transactionForm.categoryId} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, categoryId: value }))}>
                <SelectTrigger data-testid="select-transaction-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transactionType">Type</Label>
                <Select value={transactionForm.type} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger data-testid="select-transaction-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="transactionAmount">Amount</Label>
                <Input
                  id="transactionAmount"
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  data-testid="input-transaction-amount"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="transactionDescription">Description</Label>
              <Input
                id="transactionDescription"
                value={transactionForm.description}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter transaction description"
                data-testid="input-transaction-description"
              />
            </div>
            
            <div>
              <Label htmlFor="transactionDate">Date</Label>
              <Input
                id="transactionDate"
                type="date"
                value={transactionForm.date}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                data-testid="input-transaction-date"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">Share with family</span>
                <p className="text-xs text-gray-500">Make this transaction visible to all family members</p>
              </div>
              <Switch
                checked={transactionForm.isShared}
                onCheckedChange={(checked) => setTransactionForm(prev => ({ ...prev, isShared: checked }))}
                data-testid="switch-transaction-shared"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowTransactionForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTransactionMutation.isPending}
                data-testid="button-create-transaction-submit"
              >
                {createTransactionMutation.isPending ? "Adding..." : "Add Transaction"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
