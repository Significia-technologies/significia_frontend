"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Plus, 
  Trash2, 
  Search, 
  FileText,
  User, 
  TrendingUp, 
  ShieldCheck, 
  Info,
  Loader2,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientCreate } from "@/core/services/master.service";
import { IAMasterService, Employee } from "@/core/services/ia-master.service";
import { ProductMasterService, AnyProduct } from "@/core/services/product-master.service";
import { FinancialAnalysisService } from "@/core/services/financial-analysis.service";
import { InvestmentAdviceService, InvestmentAdviceRecommendation } from "@/core/services/investment-advice.service";
import { AssetAllocationService } from "@/core/services/asset-allocation.service";
import { toast } from "sonner";

interface AdviceNoteFormProps {
  client: ClientCreate;
  onSuccess: (noteId: string) => void;
  onCancel: () => void;
}

const mapIncomeToBand = (income: number): string => {
  if (!income) return "Not Available";
  if (income <= 500000) return "Up to Rs. 5 lakhs";
  if (income <= 1000000) return "Rs. 5 lakhs to Rs. 10 lakhs";
  if (income <= 2500000) return "Rs. 10 lakhs to Rs. 25 lakhs";
  if (income <= 5000000) return "Rs. 25 lakhs to Rs. 50 lakhs";
  if (income <= 10000000) return "Rs. 50 lakhs to Rs. 1 crore";
  if (income <= 50000000) return "Rs. 1 crore to Rs. 5 crore";
  return "Above Rs. 5 crore";
};

export function AdviceNoteForm({ client, onSuccess, onCancel }: AdviceNoteFormProps) {
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [dateOfIssue, setDateOfIssue] = useState<string>(new Date().toISOString().split('T')[0]);
  const [adviceValidity, setAdviceValidity] = useState<string>("60"); // 30, 45, 60, 90, 120, custom
  const [customValidityDays, setCustomValidityDays] = useState<string>("30");
  const [principalOfficerId, setPrincipalOfficerId] = useState<string>("");
  const [adviceCategory, setAdviceCategory] = useState<string>("Comprehensive Advisory");
  
  const [annualIncomeBand, setAnnualIncomeBand] = useState<string>(mapIncomeToBand(client.annual_income || 0));
  const [assetsUnderAdvice, setAssetsUnderAdvice] = useState<string>("");
  const [primaryFinancialGoal, setPrimaryFinancialGoal] = useState<string>("");
  const [feeMode, setFeeMode] = useState<string>("FIXED_FEE"); // FIXED_FEE, PERCENTAGE_AUA
  const [feeAmount, setFeeAmount] = useState<string>("");
  const [dateOfAllocation, setDateOfAllocation] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Recommended Allocation
  const [recEquity, setRecEquity] = useState<string>("60");
  const [recDebt, setRecDebt] = useState<string>("30");
  const [recCommodities, setRecCommodities] = useState<string>("10");

  // Sub-Asset Allocation States
  const [subStocks, setSubStocks] = useState<string>("0");
  const [subMfEquity, setSubMfEquity] = useState<string>("0");
  const [subUlipEquity, setSubUlipEquity] = useState<string>("0");
  const [subEtfEquity, setSubEtfEquity] = useState<string>("0");

  const [subFdBonds, setSubFdBonds] = useState<string>("0");
  const [subMfDebt, setSubMfDebt] = useState<string>("0");
  const [subUlipDebt, setSubUlipDebt] = useState<string>("0");
  const [subEtfDebt, setSubEtfDebt] = useState<string>("0");

  const [subGoldEtf, setSubGoldEtf] = useState<string>("0");
  const [subSilverEtf, setSubSilverEtf] = useState<string>("0");
  const [subEtfCommodity, setSubEtfCommodity] = useState<string>("0");

  // Auto-sync Equity total
  useEffect(() => {
    const sum = (parseFloat(subStocks) || 0) + 
                (parseFloat(subMfEquity) || 0) + 
                (parseFloat(subUlipEquity) || 0) + 
                (parseFloat(subEtfEquity) || 0);
    setRecEquity(String(sum));
  }, [subStocks, subMfEquity, subUlipEquity, subEtfEquity]);

  // Auto-sync Debt total
  useEffect(() => {
    const sum = (parseFloat(subFdBonds) || 0) + 
                (parseFloat(subMfDebt) || 0) + 
                (parseFloat(subUlipDebt) || 0) + 
                (parseFloat(subEtfDebt) || 0);
    setRecDebt(String(sum));
  }, [subFdBonds, subMfDebt, subUlipDebt, subEtfDebt]);

  // Auto-sync Commodities total
  useEffect(() => {
    const sum = (parseFloat(subGoldEtf) || 0) + 
                (parseFloat(subSilverEtf) || 0) + 
                (parseFloat(subEtfCommodity) || 0);
    setRecCommodities(String(sum));
  }, [subGoldEtf, subSilverEtf, subEtfCommodity]);

  const [currentAssetAllocation, setCurrentAssetAllocation] = useState<string>("");
  const [rebalancingRationale, setRebalancingRationale] = useState<string>("");
  
  const [suitabilityChoice, setSuitabilityChoice] = useState<string>("YES");
  const [suitabilityBasis, setSuitabilityBasis] = useState<string>(
    "Financial Goals, Risk profile, income, liabilities, Asset Allocation, Target Portfolio, existing portfolio and investment horizon reviewed"
  );

  // Recommendations
  const [recommendations, setRecommendations] = useState<InvestmentAdviceRecommendation[]>([]);
  
  // Recommendations editor row state
  const [recProductType, setRecProductType] = useState<string>("shares");
  const [recSearchQuery, setRecSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<AnyProduct[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AnyProduct | null>(null);
  
  const [recProductName, setRecProductName] = useState<string>("");
  const [recIsin, setRecIsin] = useState<string>("");
  const [recAction, setRecAction] = useState<"BUY" | "HOLD" | "SELL" | "REVIEW">("BUY");
  const [recAmountUnits, setRecAmountUnits] = useState<string>("");
  const [recPriceNav, setRecPriceNav] = useState<string>("");
  const [recRationale, setRecRationale] = useState<string>("");

  // Disclosures Defaults
  const [conflictText, setConflictText] = useState<string>(
    "Alpha Wealth Advisors Private Limited is a fee-only SEBI Registered Investment Adviser. We receive no commissions, brokerage or trail fees from any product manufacturer, distributor or intermediary. There is no material conflict of interest in this advice note."
  );
  const [noExecutionText, setNoExecutionText] = useState<string>(
    "The Investment Adviser is not authorised to execute trades on behalf of the client without explicit written or digital consent for each individual trade. Execution of the above recommendations shall be done by the client through their registered broker, Demat account or fund platform, as applicable."
  );
  const [aiUsageText, setAiUsageText] = useState<string>(
    "This Investment Advice Note has been partly prepared using AI-assisted analytical tools for portfolio analysis, risk profiling computation and report generation. However, all investment decisions, suitability assessment and final advice are the sole responsibility of the Investment Adviser and Principal Officer. AI tools have been used only as analytical aids; all outputs have been reviewed and validated by the Principal Officer before issuance. Client data has not been processed or stored on any third-party AI platform."
  );

  useEffect(() => {
    // 1. Fetch employees
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const list = await IAMasterService.listEmployees();
        // Filter advisory staff if flagged
        const advisoryList = list.filter(e => e.employee_type === 'advisory' || !e.employee_type);
        setEmployees(advisoryList);
        if (advisoryList.length > 0) {
          setPrincipalOfficerId(advisoryList[0].id || "");
        }
      } catch (error) {
        console.error("Failed to load employees", error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    // 2. Fetch primary goals from latest financial analysis
    const fetchAnalysisGoal = async () => {
      try {
        const analysisData = await FinancialAnalysisService.list();
        const clientAnalyses = analysisData.filter(a => a.client_id === client.id);
        if (clientAnalyses.length > 0) {
          // Get details of the latest
          const latest = clientAnalyses.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          
          if (latest.calculations && typeof latest.calculations === 'object') {
            const goal = (latest.calculations as any).primary_financial_goal || "";
            if (goal) {
              setPrimaryFinancialGoal(goal);
            }
          }
        } else {
          // Fallback to client's registered objectives
          setPrimaryFinancialGoal(client.investment_objectives || "");
        }
      } catch (error) {
        console.error("Failed to fetch client goals", error);
        setPrimaryFinancialGoal(client.investment_objectives || "");
      }
    };

    // 3. Fetch latest asset allocation
    const fetchLatestAllocation = async () => {
      try {
        const allocations = await AssetAllocationService.getAll(client.id);
        if (allocations && allocations.length > 0) {
          // Sort to get the latest
          const latest = allocations.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          
          setRecEquity(String(latest.equities_percentage ?? 60));
          setRecDebt(String(latest.debt_securities_percentage ?? 30));
          setRecCommodities(String(latest.commodities_percentage ?? 10));
          
          if (latest.created_at) {
            setDateOfAllocation(latest.created_at.split('T')[0]);
          }

          // Capture sub-asset percentages
          setSubStocks(String(latest.stocks_percentage ?? 0));
          setSubMfEquity(String(latest.mutual_fund_equity_percentage ?? 0));
          setSubUlipEquity(String(latest.ulip_equity_percentage ?? 0));
          setSubEtfEquity(String(latest.etf_equity_percentage ?? 0));

          setSubFdBonds(String(latest.fixed_deposits_bonds_percentage ?? 0));
          setSubMfDebt(String(latest.mutual_fund_debt_percentage ?? 0));
          setSubUlipDebt(String(latest.ulip_debt_percentage ?? 0));
          setSubEtfDebt(String(latest.etf_debt_percentage ?? 0));

          setSubGoldEtf(String(latest.gold_etf_percentage ?? 0));
          setSubSilverEtf(String(latest.silver_etf_percentage ?? 0));
          setSubEtfCommodity(String(latest.etf_commodity_percentage ?? 0));
        }
      } catch (error) {
        console.error("Failed to fetch client latest asset allocation", error);
      }
    };

    fetchEmployees();
    fetchAnalysisGoal();
    fetchLatestAllocation();
  }, [client]);

  // Handle product searches
  useEffect(() => {
    if (!recSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await ProductMasterService.list(recProductType as any, recSearchQuery);
        setSearchResults(res.items);
      } catch (error) {
        console.error("Product search failed", error);
      } finally {
        setSearchingProducts(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [recSearchQuery, recProductType]);

  const selectProduct = (product: AnyProduct) => {
    setSelectedProduct(product);
    
    // Extract name and code based on product type
    let name = "";
    let code = "";
    
    if (recProductType === "shares") {
      name = (product as any).share_name || "";
      code = (product as any).isin_code || "";
    } else if (recProductType === "mutual-funds") {
      name = (product as any).scheme_name || "";
      code = (product as any).scheme_code || "";
    } else if (recProductType === "etfs") {
      name = (product as any).etf_name || "";
      code = (product as any).isin_code || "";
    } else if (recProductType === "life-insurance" || recProductType === "health-insurance") {
      name = `${(product as any).company_name} - ${(product as any).policy_name}`;
      code = (product as any).uin || "UIN: Pending";
    }

    setRecProductName(name);
    setRecIsin(code);
    setRecSearchQuery("");
    setSearchResults([]);
  };

  const addRecommendation = () => {
    if (!recProductName.trim()) {
      toast.error("Please select or enter a Product Name");
      return;
    }

    const newRec: InvestmentAdviceRecommendation = {
      product_type: recProductType,
      product_id: selectedProduct?.id,
      product_name: recProductName,
      isin_code_scheme_code_uin: recIsin,
      action: recAction,
      amount_units: recAmountUnits || "Review coverage",
      indicative_price_nav: recPriceNav ? parseFloat(recPriceNav) : null,
      rationale: recRationale || "Recommended as suitable according to client's risk profile."
    };

    setRecommendations([...recommendations, newRec]);

    // Clear recommendation row
    setSelectedProduct(null);
    setRecProductName("");
    setRecIsin("");
    setRecAction("BUY");
    setRecAmountUnits("");
    setRecPriceNav("");
    setRecRationale("");
    setRecSearchQuery("");
    toast.success("Recommendation added to draft table.");
  };

  const removeRecommendation = (index: number) => {
    setRecommendations(recommendations.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Resolve Principal Officer name and registration no
      const selectedPO = employees.find(e => e.id === principalOfficerId);
      const poName = selectedPO ? (selectedPO.full_name || selectedPO.name || selectedPO.name_of_employee || "") : "";
      const poReg = selectedPO ? (selectedPO.ia_registration_number || "") : "";

      // 2. Resolve validity days and text
      const valDays = adviceValidity === "custom" ? parseInt(customValidityDays) : parseInt(adviceValidity);
      const valText = `${valDays} calendar days from date of issue`;

      // 3. Asset Allocation dict
      const recAlloc = {
        "Equity": parseInt(recEquity) || 0,
        "Debt": parseInt(recDebt) || 0,
        "Commodities": parseInt(recCommodities) || 0,
        "sub_assets": {
          fixed_deposits_bonds_percentage: parseInt(subFdBonds) || 0,
          mutual_fund_debt_percentage: parseInt(subMfDebt) || 0,
          ulip_debt_percentage: parseInt(subUlipDebt) || 0,
          etf_debt_percentage: parseInt(subEtfDebt) || 0,
          
          stocks_percentage: parseInt(subStocks) || 0,
          mutual_fund_equity_percentage: parseInt(subMfEquity) || 0,
          ulip_equity_percentage: parseInt(subUlipEquity) || 0,
          etf_equity_percentage: parseInt(subEtfEquity) || 0,

          gold_etf_percentage: parseInt(subGoldEtf) || 0,
          silver_etf_percentage: parseInt(subSilverEtf) || 0,
          etf_commodity_percentage: parseInt(subEtfCommodity) || 0,
        }
      };

      const payload = {
        date_of_issue: dateOfIssue,
        advice_validity_days: valDays,
        advice_validity_custom_text: valText,
        principal_officer_id: principalOfficerId || null,
        principal_officer_name: poName,
        principal_officer_reg_no: poReg,
        advice_category: adviceCategory,
        annual_income_band: annualIncomeBand,
        assets_under_advice: assetsUnderAdvice ? parseFloat(assetsUnderAdvice) : 0,
        primary_financial_goal: primaryFinancialGoal,
        fee_mode: feeMode,
        fee_amount: feeAmount ? parseFloat(feeAmount) : 0,
        recommended_asset_allocation: recAlloc,
        date_of_allocation: dateOfAllocation,
        current_asset_allocation: currentAssetAllocation,
        rebalancing_rationale: rebalancingRationale,
        suitability_assessment: suitabilityChoice === "YES" 
          ? "YES — Advice is suitable to the client's risk profile, financial goals and overall financial situation"
          : "NO",
        suitability_basis: suitabilityBasis,
        conflict_of_interest_text: conflictText,
        no_execution_text: noExecutionText,
        ai_usage_text: aiUsageText,
        recommendations: recommendations
      };

      const result = await InvestmentAdviceService.create(client.id!, payload);
      toast.success("Investment Advice Note Draft created successfully!");
      onSuccess(result.id);
    } catch (error) {
      console.error("Create advice note failed", error);
      toast.error("Failed to create Investment Advice Note. Check required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Wizard Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Investment Advice Note</h1>
          <p className="text-sm text-muted-foreground">
            Client: {client.client_name} ({client.client_code})
          </p>
        </div>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center justify-between mb-8 px-2 max-w-xl mx-auto">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s 
                  ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20 ring-4 ring-primary/10" 
                  : step > s 
                    ? "bg-emerald-500 text-white" 
                    : "bg-muted text-muted-foreground"
              }`}>
                {s}
              </div>
              <span className="text-[10px] mt-1.5 font-bold uppercase tracking-wider text-muted-foreground opacity-75">
                {s === 1 && "Adviser Details"}
                {s === 2 && "Suitability"}
                {s === 3 && "Products"}
                {s === 4 && "Disclosures"}
              </span>
            </div>
            {s < 4 && (
              <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                step > s ? "bg-emerald-500" : "bg-muted"
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Steps */}
      <Card className="border-primary/10 shadow-xl overflow-hidden bg-card/60 backdrop-blur-sm">
        <CardContent className="p-6 sm:p-8">
          
          {/* STEP 1: ADVISER & CLIENT DETAILS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-primary/5 pb-2 mb-4">
                <h3 className="font-bold text-lg text-primary">Section A — Investment Adviser & Validity</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date_of_issue">Date of Issue</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-60" />
                    <Input 
                      id="date_of_issue"
                      type="date"
                      className="pl-10"
                      value={dateOfIssue}
                      onChange={(e) => setDateOfIssue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="principal_officer">Principal Officer</Label>
                  {loadingEmployees ? (
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  ) : (
                    <Select value={principalOfficerId} onValueChange={setPrincipalOfficerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Principal Officer" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id!}>
                            {emp.full_name || emp.name || emp.name_of_employee} (Reg: {emp.ia_registration_number || 'N/A'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Advice Category</Label>
                  <Input value={adviceCategory} onChange={(e) => setAdviceCategory(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validity">Advice Validity</Label>
                    <Select value={adviceValidity} onValueChange={setAdviceValidity}>
                      <SelectTrigger id="validity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="45">45 Days</SelectItem>
                        <SelectItem value="60">60 Days</SelectItem>
                        <SelectItem value="90">90 Days</SelectItem>
                        <SelectItem value="120">120 Days</SelectItem>
                        <SelectItem value="custom">Custom Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {adviceValidity === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom_days">Custom Days</Label>
                      <Input 
                        id="custom_days"
                        type="number"
                        min="1"
                        value={customValidityDays}
                        onChange={(e) => setCustomValidityDays(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Display validity preview text */}
              <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg text-xs font-semibold text-primary/80">
                Advice Validity Statement: "{adviceValidity === "custom" ? customValidityDays : adviceValidity} calendar days from date of issue"
              </div>

              <div className="border-b border-primary/5 pb-2 mt-8 mb-4">
                <h3 className="font-bold text-lg text-primary">Section B — Client Financial Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="income_band">Annual Income Band</Label>
                  <Input 
                    id="income_band"
                    value={annualIncomeBand}
                    onChange={(e) => setAnnualIncomeBand(e.target.value)}
                    placeholder="e.g. Rs. 25 lakhs to Rs. 50 lakhs"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Auto-mapped from client profile: {mapIncomeToBand(client.annual_income || 0)}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aua">Assets Under Advice (AUA) in INR</Label>
                  <Input 
                    id="aua"
                    type="number"
                    value={assetsUnderAdvice}
                    onChange={(e) => setAssetsUnderAdvice(e.target.value)}
                    placeholder="e.g. 3850000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee_mode">Fee Mode</Label>
                  <Select value={feeMode} onValueChange={setFeeMode}>
                    <SelectTrigger id="fee_mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED_FEE">Fixed Fee & GST</SelectItem>
                      <SelectItem value="PERCENTAGE_AUA">Percentage of Asset Under Advisory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee_amount">Fee Amount / Percentage</Label>
                  <Input 
                    id="fee_amount"
                    type="number"
                    step="any"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    placeholder={feeMode === "FIXED_FEE" ? "e.g. 75000 (INR)" : "e.g. 1.25 (%)"}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="goal">Primary Financial Goal</Label>
                  <Input 
                    id="goal"
                    value={primaryFinancialGoal}
                    onChange={(e) => setPrimaryFinancialGoal(e.target.value)}
                    placeholder="e.g. Retirement Corpus & Child Education"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SUITABILITY & ALLOCATION */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-primary/5 pb-2 mb-4">
                <h3 className="font-bold text-lg text-primary">Section C — Suitability Assessment & Allocation</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="suitability">Advice Suitability Verdict</Label>
                  <Select value={suitabilityChoice} onValueChange={setSuitabilityChoice}>
                    <SelectTrigger id="suitability">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YES">Yes</SelectItem>
                      <SelectItem value="NO">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground italic">
                    {suitabilityChoice === "YES" 
                      ? "Resolves to: YES — Advice is suitable to the client's risk profile, financial goals and overall financial situation" 
                      : "Resolves to: NO"
                    }
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="suitability_basis">Suitability Basis / Rationale</Label>
                  <Textarea 
                    id="suitability_basis"
                    className="min-h-16"
                    value={suitabilityBasis}
                    onChange={(e) => setSuitabilityBasis(e.target.value)}
                  />
                </div>

                <div className="border-t border-primary/5 pt-4 md:col-span-2">
                  <h4 className="font-bold text-sm text-foreground/90 mb-4">Recommended Asset Allocation Breakdown (%)</h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label className="text-emerald-500 font-bold" htmlFor="rec_eq">Equity Total (%)</Label>
                      <Input 
                        id="rec_eq"
                        type="number"
                        disabled
                        value={recEquity}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-blue-500 font-bold" htmlFor="rec_dt">Debt Total (%)</Label>
                      <Input 
                        id="rec_dt"
                        type="number"
                        disabled
                        value={recDebt}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-amber-500 font-bold" htmlFor="rec_cm">Commodities Total (%)</Label>
                      <Input 
                        id="rec_cm"
                        type="number"
                        disabled
                        value={recCommodities}
                      />
                    </div>
                  </div>

                  {/* Sub-Asset Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/20 border border-primary/5 rounded-xl">
                    
                    {/* Equity Sub Assets */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-black text-emerald-500 uppercase tracking-wider">Equity Sub-Assets</h5>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_stocks">Direct Equity / Stocks (%)</Label>
                          <Input 
                            id="sub_stocks" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subStocks} 
                            onChange={(e) => setSubStocks(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_mfeq">Equity Mutual Funds (%)</Label>
                          <Input 
                            id="sub_mfeq" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subMfEquity} 
                            onChange={(e) => setSubMfEquity(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_ulipeq">Equity ULIPs (%)</Label>
                          <Input 
                            id="sub_ulipeq" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subUlipEquity} 
                            onChange={(e) => setSubUlipEquity(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_etfeq">Equity ETFs (%)</Label>
                          <Input 
                            id="sub_etfeq" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subEtfEquity} 
                            onChange={(e) => setSubEtfEquity(e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Debt Sub Assets */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-black text-blue-500 uppercase tracking-wider">Debt Sub-Assets</h5>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_fd">Fixed Deposits / Bonds (%)</Label>
                          <Input 
                            id="sub_fd" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subFdBonds} 
                            onChange={(e) => setSubFdBonds(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_mfdebt">Debt Mutual Funds (%)</Label>
                          <Input 
                            id="sub_mfdebt" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subMfDebt} 
                            onChange={(e) => setSubMfDebt(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_ulipdebt">Debt ULIPs (%)</Label>
                          <Input 
                            id="sub_ulipdebt" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subUlipDebt} 
                            onChange={(e) => setSubUlipDebt(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_etfdebt">Debt ETFs (%)</Label>
                          <Input 
                            id="sub_etfdebt" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subEtfDebt} 
                            onChange={(e) => setSubEtfDebt(e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Commodities Sub Assets */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-black text-amber-500 uppercase tracking-wider">Commodities Sub-Assets</h5>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_gold">Gold ETFs (%)</Label>
                          <Input 
                            id="sub_gold" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subGoldEtf} 
                            onChange={(e) => setSubGoldEtf(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_silver">Silver ETFs (%)</Label>
                          <Input 
                            id="sub_silver" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subSilverEtf} 
                            onChange={(e) => setSubSilverEtf(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_etfcomm">Commodity ETFs (%)</Label>
                          <Input 
                            id="sub_etfcomm" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subEtfCommodity} 
                            onChange={(e) => setSubEtfCommodity(e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground px-1">
                    <span>Sum: {parseInt(recEquity || "0") + parseInt(recDebt || "0") + parseInt(recCommodities || "0")}%</span>
                    {(parseInt(recEquity || "0") + parseInt(recDebt || "0") + parseInt(recCommodities || "0")) !== 100 && (
                      <span className="text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Recommended to sum to 100%</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_allocation">Date of Allocation</Label>
                  <Input 
                    id="date_of_allocation"
                    type="date"
                    value={dateOfAllocation}
                    onChange={(e) => setDateOfAllocation(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="current_allocation">Current Asset Allocation (For comparison table)</Label>
                  <Textarea 
                    id="current_allocation"
                    className="min-h-16"
                    placeholder="e.g. Equity 72%, Debt 23%, Gold 5%"
                    value={currentAssetAllocation}
                    onChange={(e) => setCurrentAssetAllocation(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="rebalancing">Rebalancing Rationale</Label>
                  <Textarea 
                    id="rebalancing"
                    className="min-h-16"
                    placeholder="e.g. Reduce equity overweight; increase gold allocation for portfolio stability."
                    value={rebalancingRationale}
                    onChange={(e) => setRebalancingRationale(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RECOMMENDATIONS LIST */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-primary/5 pb-2 mb-4">
                <h3 className="font-bold text-lg text-primary">Section D — Product Recommendations</h3>
              </div>

              {/* Inline Recommendation Adder */}
              <div className="bg-primary/[0.02] border border-primary/10 rounded-xl p-4 sm:p-6 space-y-4">
                <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add Product Recommendation
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Product Type</Label>
                    <Select value={recProductType} onValueChange={(val) => {
                      setRecProductType(val);
                      setSelectedProduct(null);
                      setRecProductName("");
                      setRecIsin("");
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shares">Direct Equity (Shares)</SelectItem>
                        <SelectItem value="mutual-funds">Mutual Fund</SelectItem>
                        <SelectItem value="etfs">Exchange Traded Fund (ETF)</SelectItem>
                        <SelectItem value="life-insurance">Life Insurance</SelectItem>
                        <SelectItem value="health-insurance">Health Insurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-6 space-y-1.5 relative">
                    <Label>Search Product</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                      <Input 
                        className="pl-9"
                        placeholder="Search product master..."
                        value={recSearchQuery}
                        onChange={(e) => setRecSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Autocomplete Results */}
                    {searchingProducts && (
                      <div className="absolute z-10 w-full bg-background border border-primary/10 rounded-md p-2 text-center text-xs mt-1 shadow-lg">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Searching...
                      </div>
                    )}
                    {!searchingProducts && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-background border border-primary/10 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1 divide-y divide-muted">
                        {searchResults.map((product) => {
                          let label = "";
                          let sub = "";
                          if (recProductType === "shares") {
                            label = (product as any).share_name;
                            sub = (product as any).symbol || (product as any).isin_code;
                          } else if (recProductType === "mutual-funds") {
                            label = (product as any).scheme_name;
                            sub = (product as any).scheme_code;
                          } else if (recProductType === "etfs") {
                            label = (product as any).etf_name;
                            sub = (product as any).symbol || (product as any).isin_code;
                          } else if (recProductType === "life-insurance" || recProductType === "health-insurance") {
                            label = (product as any).policy_name;
                            sub = (product as any).company_name;
                          }
                          return (
                            <button
                              key={product.id}
                              type="button"
                              className="w-full text-left p-2 hover:bg-primary/5 text-xs flex justify-between"
                              onClick={() => selectProduct(product)}
                            >
                              <span className="font-bold truncate">{label}</span>
                              <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{sub}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Action</Label>
                    <Select value={recAction} onValueChange={(val: any) => setRecAction(val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">BUY</SelectItem>
                        <SelectItem value="HOLD">HOLD</SelectItem>
                        <SelectItem value="SELL">SELL</SelectItem>
                        <SelectItem value="REVIEW">REVIEW</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6 space-y-1.5">
                    <Label>Product Name (Override)</Label>
                    <Input 
                      value={recProductName}
                      onChange={(e) => setRecProductName(e.target.value)}
                      placeholder="e.g. HDFC Bank Limited"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label>ISIN / Scheme Code / UIN</Label>
                    <Input 
                      value={recIsin}
                      onChange={(e) => setRecIsin(e.target.value)}
                      placeholder="e.g. INE040A01034"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Price / NAV (Rs.)</Label>
                    <Input 
                      type="number"
                      step="any"
                      value={recPriceNav}
                      onChange={(e) => setRecPriceNav(e.target.value)}
                      placeholder="e.g. 1530"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 space-y-1.5">
                    <Label>Amount / Units / SIP Description</Label>
                    <Input 
                      value={recAmountUnits}
                      onChange={(e) => setRecAmountUnits(e.target.value)}
                      placeholder="e.g. Rs. 1,00,000 lump sum"
                    />
                  </div>

                  <div className="md:col-span-8 space-y-1.5">
                    <Label>Adviser Rationale (Section E)</Label>
                    <Input 
                      value={recRationale}
                      onChange={(e) => setRecRationale(e.target.value)}
                      placeholder="e.g. Stock has corrected 12% offering attractive entry point..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-primary/20 text-primary hover:bg-primary/10 gap-1.5 h-9 text-xs" 
                    onClick={addRecommendation}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Recommendation
                  </Button>
                </div>
              </div>

              {/* Recommendations Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground/80">Draft Recommendations ({recommendations.length})</h4>
                <div className="border border-primary/10 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Price/NAV</TableHead>
                        <TableHead className="w-12 text-right">Remove</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recommendations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-xs italic">
                            No recommendations added yet. Add at least one above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        recommendations.map((rec, i) => (
                          <TableRow key={i} className="hover:bg-primary/5 transition-colors">
                            <TableCell className="text-xs">{i + 1}</TableCell>
                            <TableCell className="text-xs">
                              <div className="font-bold">{rec.product_name}</div>
                              <div className="text-[10px] text-muted-foreground">{rec.isin_code_scheme_code_uin}</div>
                            </TableCell>
                            <TableCell className="text-xs capitalize">{rec.product_type.replace("-", " ")}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant={rec.action === 'BUY' ? 'default' : 'secondary'} className="text-[9px] font-bold">
                                {rec.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{rec.amount_units}</TableCell>
                            <TableCell className="text-xs font-mono">₹{rec.indicative_price_nav || "N/A"}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => removeRecommendation(i)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REGULATORY DISCLOSURES */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-primary/5 pb-2 mb-4">
                <h3 className="font-bold text-lg text-primary">Section G — Conflict & Compliance Disclosures</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="conflict">Conflict of Interest Declarations (SEBI Reg 18)</Label>
                  <Textarea 
                    id="conflict" 
                    className="min-h-24 text-xs leading-relaxed" 
                    value={conflictText}
                    onChange={(e) => setConflictText(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="no_exec">No Execution Disclaimer</Label>
                  <Textarea 
                    id="no_exec" 
                    className="min-h-24 text-xs leading-relaxed" 
                    value={noExecutionText}
                    onChange={(e) => setNoExecutionText(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai_usage">AI Tools Usage Disclosure (December 2024 SEBI circular)</Label>
                  <Textarea 
                    id="ai_usage" 
                    className="min-h-24 text-xs leading-relaxed" 
                    value={aiUsageText}
                    onChange={(e) => setAiUsageText(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 mt-8">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 leading-relaxed">
                  <strong>Ready to Commit Draft:</strong> Locking features are disabled inside this form. 
                  This note will be saved as a <strong>Draft (v1)</strong>. Once you are satisfied with it, 
                  you can deliver it to the client and hit <strong>Lock & Deliver</strong> from the actions menu 
                  to freeze it for compliance purposes.
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center mt-6">
        <Button 
          variant="outline" 
          onClick={() => setStep(step - 1)} 
          disabled={step === 1 || isSubmitting}
          className="border-primary/20 hover:bg-primary/10 gap-1.5 h-10 px-4"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </Button>

        {step < 4 ? (
          <Button 
            onClick={() => setStep(step + 1)} 
            className="gap-1.5 h-10 px-4"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/95 shadow-lg shadow-primary/20 gap-1.5 h-10 px-6 font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Draft...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Create Draft Note
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
