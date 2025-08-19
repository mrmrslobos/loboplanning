import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, Calendar, TrendingUp, AlertTriangle, 
  CheckCircle, Clock, Target, Lightbulb, 
  Zap, BarChart3, PiggyBank
} from "lucide-react";

interface BudgetRecommendation {
  type: 'warning' | 'opportunity' | 'insight' | 'action';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'this_week' | 'this_month' | 'long_term';
  suggestedActions: string[];
  potentialSavings?: number;
  calendarContext?: string;
}

interface CashFlowAnalysis {
  nextWeekOutflow: number;
  nextMonthOutflow: number;
  riskLevel: 'low' | 'medium' | 'high';
  bufferDays: number;
}

export function SmartBudgetAdvisor() {
  const { data: budgetAnalysis, isLoading } = useQuery({
    queryKey: ['/api/ai/budget-analysis'],
    refetchOnWindowFocus: false,
  });

  const { data: budgetAlerts } = useQuery({
    queryKey: ['/api/ai/budget-alerts'],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            <span>AI Budget Advisor</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendations: BudgetRecommendation[] = budgetAnalysis?.recommendations || [];
  const cashFlow: CashFlowAnalysis = budgetAnalysis?.cashFlowAnalysis || {};
  const spendingInsights = budgetAnalysis?.spendingInsights || {};
  const calendarTips = budgetAnalysis?.calendarBudgetTips || [];
  const alerts = budgetAlerts || [];

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'opportunity': return <Target className="h-4 w-4 text-green-500" />;
      case 'insight': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'action': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            <span>AI Budget Advisor</span>
          </CardTitle>
          <CardDescription>
            Smart financial insights with calendar integration and spending analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Cash Flow Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${cashFlow.nextWeekOutflow?.toFixed(2) || '0.00'}
              </div>
              <div className="text-xs text-blue-700">Next Week Outflow</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ${cashFlow.nextMonthOutflow?.toFixed(2) || '0.00'}
              </div>
              <div className="text-xs text-purple-700">Next Month Outflow</div>
            </div>
            <div className={`text-center p-4 border rounded-lg ${getRiskColor(cashFlow.riskLevel)}`}>
              <div className="text-2xl font-bold capitalize">
                {cashFlow.riskLevel || 'Unknown'}
              </div>
              <div className="text-xs">Cash Flow Risk</div>
            </div>
          </div>

          {/* Buffer Days */}
          {cashFlow.bufferDays !== undefined && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg mb-4">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                You have <strong>{cashFlow.bufferDays} days</strong> of financial buffer at current spending rate
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Urgent Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert, idx) => (
                <Alert key={idx} className={`${alert.urgency === 'high' ? 'border-red-200 bg-red-50' : alert.urgency === 'medium' ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm">{alert.message}</div>
                      {alert.suggestedAction && (
                        <div className="text-xs text-muted-foreground">
                          💡 {alert.suggestedAction}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Smart Recommendations</span>
            </CardTitle>
            <CardDescription>
              AI-powered financial insights and action items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.slice(0, 6).map((rec, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {getRecommendationIcon(rec.type)}
                      <div>
                        <h4 className="font-medium">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded text-xs border ${getImpactColor(rec.impact)}`}>
                        {rec.impact} impact
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {rec.timeframe.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {rec.calendarContext && (
                    <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                      📅 {rec.calendarContext}
                    </div>
                  )}

                  {rec.potentialSavings && (
                    <div className="text-xs text-green-600 font-medium">
                      💰 Potential savings: ${rec.potentialSavings.toFixed(2)}
                    </div>
                  )}

                  {rec.suggestedActions.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium text-gray-700">Action items:</span>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5 text-gray-600">
                        {rec.suggestedActions.slice(0, 3).map((action, actionIdx) => (
                          <li key={actionIdx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Budget Tips */}
      {calendarTips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span>Calendar Budget Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calendarTips.slice(0, 4).map((tip, idx) => (
                <div key={idx} className="border-l-4 border-blue-400 pl-4 py-2">
                  <div className="font-medium text-sm">{tip.eventTitle}</div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {new Date(tip.eventDate).toDateString()}
                  </div>
                  <div className="text-xs text-blue-600">{tip.budgetImpact}</div>
                  {tip.suggestions.length > 0 && (
                    <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                      {tip.suggestions.slice(0, 2).map((suggestion, suggestionIdx) => (
                        <li key={suggestionIdx}>• {suggestion}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending Insights */}
      {(spendingInsights.trends?.length > 0 || spendingInsights.patterns?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {spendingInsights.trends?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Spending Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {spendingInsights.trends.slice(0, 4).map((trend, idx) => (
                    <li key={idx} className="text-sm flex items-start">
                      <TrendingUp className="h-3 w-3 mr-2 mt-1 text-green-500 flex-shrink-0" />
                      <span>{trend}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {spendingInsights.optimizations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <PiggyBank className="h-5 w-5 text-pink-500" />
                  <span>Optimizations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {spendingInsights.optimizations.slice(0, 4).map((optimization, idx) => (
                    <li key={idx} className="text-sm flex items-start">
                      <CheckCircle className="h-3 w-3 mr-2 mt-1 text-pink-500 flex-shrink-0" />
                      <span>{optimization}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}