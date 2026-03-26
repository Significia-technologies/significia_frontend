"use client";

import React from "react";
import { 
  TrendingUp, 
  ShieldCheck, 
  HeartPulse, 
  GraduationCap, 
  ArrowDownCircle, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Download,
  BrainCircuit,
  PieChart as PieChartIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { FinancialAnalysisResult } from "@/core/services/financial-analysis.service";
import { FinancialAnalysisService } from "@/core/services/financial-analysis.service";
import { toast } from "sonner";

interface AnalysisDashboardProps {
  connectorId: string;
  result: FinancialAnalysisResult;
  clientName: string;
}

export function AnalysisDashboard({ connectorId, result, clientName }: AnalysisDashboardProps) {
  const [downloading, setDownloading] = React.useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleDownload = async (format: 'pdf' | 'word') => {
    setDownloading(format);
    try {
      if (format === 'pdf') {
        await FinancialAnalysisService.downloadPDF(connectorId, result.id, clientName);
      } else {
        await FinancialAnalysisService.downloadWord(connectorId, result.id, clientName);
      }
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (error) {
      toast.error(`Failed to download report`);
    } finally {
      setDownloading(null);
    }
  };

  const hlvData = [
    { name: 'Income Method', total: result.hlv_data?.hlv_income_method || 0, additional: result.hlv_data?.additional_life_cover_needed_income || 0 },
    { name: 'Expense Method', total: result.hlv_data?.hlv_expense_method || 0, additional: result.hlv_data?.additional_life_cover_needed_expense || 0 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Analysis Results</h2>
          <p className="text-muted-foreground mt-1">Comprehensive financial roadmap for {clientName}</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2 border-primary/20 bg-background/50"
            onClick={() => handleDownload('pdf')}
            disabled={!!downloading}
          >
            {downloading === 'pdf' ? <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            PDF Report
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 border-primary/20 bg-background/50"
            onClick={() => handleDownload('word')}
            disabled={!!downloading}
          >
            {downloading === 'word' ? <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            Word Report
          </Button>
        </div>
      </div>

      {/* High-Level Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Human Life Value" 
          value={formatCurrency(result.hlv_data?.hlv_income_method || 0)} 
          subtitle="Income replacement method"
          icon={HeartPulse}
          color="blue"
        />
        <MetricCard 
          title="Retirement Corpus" 
          value={formatCurrency(result.calculations?.net_retirement_corpus_needed || 0)} 
          subtitle="Needed at retirement"
          icon={TrendingUp}
          color="green"
        />
        <MetricCard 
          title="Insurance Gap" 
          value={formatCurrency(result.hlv_data?.additional_life_cover_needed_income || 0)} 
          subtitle="Shortfall in life coverage"
          icon={ShieldCheck}
          variant="destructive"
          color="orange"
        />
        <MetricCard 
          title="Medical Corpus" 
          value={formatCurrency(result.medical_data?.balance_needed_at_retirement || 0)} 
          subtitle="Post-retirement healthcare"
          icon={HeartPulse}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Charts & Analysis */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Executive Brief */}
          <Card className="border-primary/20 bg-primary/5 shadow-inner">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BrainCircuit className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>AI Executive Brief</CardTitle>
                <CardDescription>Generated insights for your financial health</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed" 
                   dangerouslySetInnerHTML={{ __html: result.ai_analysis?.executive_brief || "No AI brief available." }}>
              </div>
            </CardContent>
          </Card>

          {/* HLV Chart */}
          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Human Life Value Breakdown</CardTitle>
              <CardDescription>Comparison between Income and Expense replacement methods</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hlvData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`} />
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                  <Legend />
                  <Bar dataKey="total" name="Total HLV Needed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="additional" name="Additional Cover Needed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Goals Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <GoalCard 
                title="Retirement Goal" 
                needed={result.calculations?.retirement_corpus_at_retirement || 1}
                available={result.calculations?.future_value_existing_savings || 0}
                status={(result.calculations?.net_retirement_corpus_needed || 0) <= 0 ? "Achievable" : "Shortfall"}
             />
             <GoalCard 
                title="Education Goal" 
                needed={result.calculations?.education_future_needed || 1}
                available={result.calculations?.fv_allocated_education || 0}
                status={(result.calculations?.education_net_corpus || 0) <= 0 ? "Achievable" : "Shortfall"}
             />
          </div>

        </div>

        {/* Right Column: AI Deep Dive & Metrics */}
        <div className="space-y-8">
           <Card className="border-secondary/20 bg-secondary/5 h-full">
              <CardHeader className="flex flex-row items-center gap-3">
                 <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                    <TrendingUp className="w-5 h-5" />
                 </div>
                 <CardTitle className="text-lg">Detailed AI Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <AnalysisBit 
                    title="Cash Flow Outlook" 
                    content={result.ai_analysis?.cash_flow_comments?.[0]} 
                 />
                 <AnalysisBit 
                    title="Risk Management" 
                    content={result.ai_analysis?.hlv_comments?.[0]} 
                 />
                 <AnalysisBit 
                    title="Retirement Preparedness" 
                    content={result.ai_analysis?.retirement_comments?.[0]} 
                 />
                 <AnalysisBit 
                    title="Investment Allocation" 
                    content={result.ai_analysis?.investment_comments?.[0]} 
                 />
              </CardContent>
           </Card>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color, variant = "default" }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    green: "text-green-600 bg-green-500/10 border-green-500/20",
    orange: "text-orange-600 bg-orange-500/10 border-orange-500/20",
    purple: "text-purple-600 bg-purple-500/10 border-purple-500/20"
  };

  return (
    <Card className="border-primary/10 bg-card/30 overflow-hidden relative group hover:border-primary/30 transition-all duration-300">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
         <Icon className="w-12 h-12" />
      </div>
      <CardHeader className="pb-2">
        <CardDescription className="font-bold flex items-center gap-2 uppercase tracking-widest text-[10px]">
           <div className={`w-2 h-2 rounded-full bg-current ${colors[color]}`} />
           {title}
        </CardDescription>
        <CardTitle className={`text-2xl font-black ${variant === 'destructive' ? 'text-red-500' : 'text-foreground'}`}>
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function GoalCard({ title, needed, available, status }: any) {
  const percent = Math.min(100, Math.max(0, (available / needed) * 100));
  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge className={status === "Achievable" ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
           <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <div className="flex justify-between text-xs font-medium">
           <span className="text-muted-foreground">Needed: ₹{new Intl.NumberFormat('en-IN').format(needed)}</span>
           <span className="text-foreground">{percent.toFixed(1)}% Funded</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisBit({ title, content }: any) {
  if (!content) return null;
  const cleanContent = content.replace(/<[^>]*>/g, '');
  return (
    <div className="space-y-2">
       <h5 className="text-xs font-bold uppercase tracking-widest text-secondary/70">{title}</h5>
       <p className="text-sm text-foreground/80 leading-relaxed italic border-l-2 border-secondary/20 pl-3">
          {cleanContent}
       </p>
    </div>
  );
}
