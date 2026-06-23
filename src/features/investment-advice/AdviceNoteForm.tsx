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
import { TargetPortfolioService, TargetPortfolioEntry } from "@/core/services/target-portfolio.service";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CustomCheckbox } from "@/components/ui/CustomCheckbox";

const FINANCIAL_GOAL_OPTIONS = ["HLV", "Retirement", "Child Education", "Child Marriage", "General"];

interface AdviceNoteFormProps {
  client: ClientCreate;
  noteId?: string;
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

export const formatIndianNumber = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '';
  const numVal = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(numVal)) return String(val);

  const isNeg = numVal < 0;
  const absVal = Math.abs(numVal);
  const formatted = absVal.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: absVal % 1 === 0 ? 0 : 2
  });
  return isNeg ? `(${formatted})` : formatted;
};

export const formatAmountUnits = (rec: Partial<InvestmentAdviceRecommendation>, productType?: string): string => {
  const ttype = rec.transaction_type;
  if (!ttype) return rec.amount_units || '';

  if (ttype === 'HOLDING') {
    return 'Existing holding';
  }
  if (ttype === 'TEXT_ONLY') {
    return rec.custom_instruction || '';
  }

  const formattedAmount = formatIndianNumber(rec.amount);
  
  if (ttype === 'LUMP_SUM') {
    return `Rs. ${formattedAmount} lump sum`;
  }
  if (ttype === 'SWITCH_IN') {
    return `Rs. ${formattedAmount} Switch In`;
  }
  if (ttype === 'SWITCH_OUT') {
    return `Rs. ${formattedAmount} Switch Out`;
  }
  if (ttype === 'TRANSFER_IN') {
    return `Rs. ${formattedAmount} Transfer In`;
  }
  if (ttype === 'TRANSFER_OUT') {
    return `Rs. ${formattedAmount} Transfer Out`;
  }

  const isLifeInsurance = productType?.toLowerCase() === 'life-insurance';
  const freq = rec.frequency;
  
  let freqLabel = '';
  if (freq === 'MONTHLY') freqLabel = 'month';
  else if (freq === 'QUARTERLY') freqLabel = 'quarter';
  else if (freq === 'HALF_YEARLY') freqLabel = 'half-year';
  else if (freq === 'YEARLY') freqLabel = 'year';

  if (isLifeInsurance && freq === 'YEARLY') {
    return `Annual prem. Rs. ${formattedAmount}`;
  }

  if (ttype === 'SIP' || ttype === 'STP' || ttype === 'SWP') {
    return `Rs. ${formattedAmount}/${freqLabel} ${ttype}`;
  }

  return rec.amount_units || '';
};

export function AdviceNoteForm({ client, noteId, onSuccess, onCancel }: AdviceNoteFormProps) {
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [dateOfIssue, setDateOfIssue] = useState<string>(new Date().toISOString().split('T')[0]);
  const [adviceValidity, setAdviceValidity] = useState<string>("60"); // 30, 45, 60, 90, 120, custom
  const [customValidityDays, setCustomValidityDays] = useState<string>("30");
  const [principalOfficerId, setPrincipalOfficerId] = useState<string>("");
  const [natureOfEntity, setNatureOfEntity] = useState<string>("");
  const [adviceCategory, setAdviceCategory] = useState<string>("Comprehensive Advisory");
  
  const [annualIncomeBand, setAnnualIncomeBand] = useState<string>(mapIncomeToBand(client.annual_income || 0));
  const [assetsUnderAdvice, setAssetsUnderAdvice] = useState<string>("");
  const [primaryFinancialGoal, setPrimaryFinancialGoal] = useState<string>("");
  const [goalPopoverOpen, setGoalPopoverOpen] = useState(false);
  const [feeMode, setFeeMode] = useState<string>("FIXED_FEE"); // FIXED_FEE, PERCENTAGE_AUA

  const getSelectedGoals = (value: string): string[] => {
    if (!value) return [];
    return value.split(",").map(g => g.trim()).filter(Boolean);
  };

  const handleGoalToggle = (goal: string) => {
    const current = getSelectedGoals(primaryFinancialGoal);
    let updated: string[];
    if (current.includes(goal)) {
      updated = current.filter(g => g !== goal);
    } else {
      updated = [...current, goal];
    }
    // Keep order consistent with the options list
    const orderedUpdated = FINANCIAL_GOAL_OPTIONS.filter(opt => updated.includes(opt));
    setPrimaryFinancialGoal(orderedUpdated.join(", "));
  };
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

  const [suitabilityChoice, setSuitabilityChoice] = useState<string>("YES");
  const [suitabilityBasis, setSuitabilityBasis] = useState<string>(
    "Financial Goals, Risk profile, income, liabilities, Asset Allocation, Target Portfolio, existing portfolio and investment horizon reviewed"
  );
  const [investorAdvice, setInvestorAdvice] = useState<string>("");
  const [originalInvestorAdvice, setOriginalInvestorAdvice] = useState<string>("");

  const equitySubSum = (parseFloat(subStocks) || 0) + 
                       (parseFloat(subMfEquity) || 0) + 
                       (parseFloat(subUlipEquity) || 0) + 
                       (parseFloat(subEtfEquity) || 0);

  const debtSubSum = (parseFloat(subFdBonds) || 0) + 
                     (parseFloat(subMfDebt) || 0) + 
                     (parseFloat(subUlipDebt) || 0) + 
                     (parseFloat(subEtfDebt) || 0);

  const commoditiesSubSum = (parseFloat(subGoldEtf) || 0) + 
                            (parseFloat(subSilverEtf) || 0) + 
                            (parseFloat(subEtfCommodity) || 0);

  // Recommendations
  const [recommendations, setRecommendations] = useState<InvestmentAdviceRecommendation[]>([]);

  // Recommendations editor row state
  const [recProductType, setRecProductType] = useState<string>("shares");
  const [targetPortfolioEntries, setTargetPortfolioEntries] = useState<TargetPortfolioEntry[]>([]);
  const [loadingTargetPortfolio, setLoadingTargetPortfolio] = useState(false);
  const [selectedTargetPortfolioEntryId, setSelectedTargetPortfolioEntryId] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<AnyProduct | null>(null);
  
  const [recProductName, setRecProductName] = useState<string>("");
  const [recIsin, setRecIsin] = useState<string>("");
  const [recAction, setRecAction] = useState<"BUY" | "HOLD" | "SELL">("BUY");
  const [recTransactionType, setRecTransactionType] = useState<'SIP' | 'STP' | 'SWP' | 'LUMP_SUM' | 'HOLDING' | 'TEXT_ONLY' | 'SWITCH_IN' | 'SWITCH_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT'>("SIP");
  const [recFrequency, setRecFrequency] = useState<'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'>("MONTHLY");
  const [recAmount, setRecAmount] = useState<string>("");
  const [recCustomInstruction, setRecCustomInstruction] = useState<string>("");
  const [recPriceNav, setRecPriceNav] = useState<string>("");
  const [recRationale, setRecRationale] = useState<string>("");
  const [recFromFund, setRecFromFund] = useState<string>("");
  const [recToFund, setRecToFund] = useState<string>("");
  const [recAdviceValidity, setRecAdviceValidity] = useState<string>("30");
  const [recAdviceCustomDays, setRecAdviceCustomDays] = useState<string>("7");
  const [recInstallments, setRecInstallments] = useState<string>("");
  const [recSwpWithdrawalAmount, setRecSwpWithdrawalAmount] = useState<string>("");
  const [recSwpWithdrawalPercent, setRecSwpWithdrawalPercent] = useState<string>("");
  const [recFolioNo, setRecFolioNo] = useState<string>("");
  const [recFromFolioNo, setRecFromFolioNo] = useState<string>("");
  const [recToFolioNo, setRecToFolioNo] = useState<string>("");
  const [existingAdviceAmounts, setExistingAdviceAmounts] = useState<Record<string, number>>({});
  const [recPreviouslyAdvised, setRecPreviouslyAdvised] = useState<number>(0);
  const [recBalance, setRecBalance] = useState<number | null>(null);

  const selectedEntry = targetPortfolioEntries.find(e => e.id === selectedTargetPortfolioEntryId);
  let mappedType: 'SIP' | 'STP' | 'SWP' | 'LUMP_SUM' | 'HOLDING' | 'TEXT_ONLY' | 'SWITCH_IN' | 'SWITCH_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | null = null;
  if (selectedEntry?.transaction_type) {
    if (selectedEntry.transaction_type === "SINGLE_PAY") {
      mappedType = "LUMP_SUM";
    } else if (selectedEntry.transaction_type === "RECURRING") {
      mappedType = "SIP";
    } else {
      mappedType = selectedEntry.transaction_type as any;
    }
  }

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
        if (!noteId && advisoryList.length > 0) {
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
          
          setInvestorAdvice(latest.tier_recommendation || "");
          setOriginalInvestorAdvice(latest.tier_recommendation || "");
        }
      } catch (error) {
        console.error("Failed to fetch client latest asset allocation", error);
      }
    };

    // 4. Fetch IA Master details for dynamic entity name
    const fetchIAMaster = async () => {
      try {
        const iaMaster = await IAMasterService.getLatest();
        if (iaMaster) {
          setNatureOfEntity(iaMaster.nature_of_entity || "");
          if (!noteId) {
            const name = iaMaster.name_of_entity || iaMaster.name_of_ia || "";
            setConflictText(
              `${name} is a fee-only SEBI Registered Investment Adviser. We receive no commissions, brokerage or trail fees from any product manufacturer, distributor or intermediary. There is no material conflict of interest in this advice note.`
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch IA Master details", error);
      }
    };

    // 5. Fetch Target Portfolio Entries (all active members, current version, single query)
    const fetchTargetPortfolio = async () => {
      if (!client.id) return;
      setLoadingTargetPortfolio(true);
      try {
        const { entries } = await TargetPortfolioService.listAllMemberEntries(client.id);
        setTargetPortfolioEntries(entries);
      } catch (error) {
        console.error("Failed to load target portfolio", error);
      } finally {
        setLoadingTargetPortfolio(false);
      }
    };

    // 6. Fetch Target Portfolio Total AUA for Assets Under Advice
    const fetchTotalAUA = async () => {
      if (!client.id) return;
      try {
        const res = await TargetPortfolioService.getAUASummary([client.id]);
        if (res.summary && res.summary.length > 0) {
          const totalAua = res.summary[0].total_aua || 0;
          setAssetsUnderAdvice(String(totalAua));
        } else {
          setAssetsUnderAdvice("0");
        }
      } catch (error) {
        console.error("Failed to fetch target portfolio total AUA", error);
        setAssetsUnderAdvice("0");
      }
    };

    const fetchExistingAdviceAmounts = async () => {
      if (!client.id) return;
      try {
        const notes = await InvestmentAdviceService.list(client.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const map: Record<string, number> = {};
        for (const note of notes) {
          if (!note.is_locked) continue;
          if (noteId && note.id === noteId) continue;
          const issueDate = new Date(note.date_of_issue);
          const expiryDate = new Date(issueDate);
          expiryDate.setDate(expiryDate.getDate() + note.advice_validity_days);
          if (expiryDate < today) continue;
          for (const rec of note.recommendations || []) {
            if (rec.product_id && rec.amount) {
              map[rec.product_id] = (map[rec.product_id] || 0) + rec.amount;
            }
          }
        }
        setExistingAdviceAmounts(map);
      } catch {
        // non-critical
      }
    };

    // 7. When editing a draft, load existing note data into form state
    const fetchDraftNote = async () => {
      if (!noteId) return;
      try {
        const note = await InvestmentAdviceService.get(noteId);

        setDateOfIssue(note.date_of_issue);

        const validityOptions = ["30", "45", "60", "90", "120"];
        if (validityOptions.includes(String(note.advice_validity_days))) {
          setAdviceValidity(String(note.advice_validity_days));
        } else {
          setAdviceValidity("custom");
          setCustomValidityDays(String(note.advice_validity_days));
        }

        if (note.principal_officer_id) setPrincipalOfficerId(note.principal_officer_id);
        setAdviceCategory(note.advice_category);
        setAnnualIncomeBand(note.annual_income_band || "");
        setAssetsUnderAdvice(String(note.assets_under_advice));
        setPrimaryFinancialGoal(note.primary_financial_goal || "");
        setFeeMode(note.fee_mode);
        setFeeAmount(String(note.fee_amount));
        if (note.date_of_allocation) setDateOfAllocation(note.date_of_allocation.split('T')[0]);

        const alloc = note.recommended_asset_allocation;
        if (alloc && typeof alloc === 'object') {
          setRecEquity(String(alloc.Equity ?? 0));
          setRecDebt(String(alloc.Debt ?? 0));
          setRecCommodities(String(alloc.Commodities ?? 0));
          const sub = alloc.sub_assets;
          if (sub) {
            setSubStocks(String(sub.stocks_percentage ?? 0));
            setSubMfEquity(String(sub.mutual_fund_equity_percentage ?? 0));
            setSubUlipEquity(String(sub.ulip_equity_percentage ?? 0));
            setSubEtfEquity(String(sub.etf_equity_percentage ?? 0));
            setSubFdBonds(String(sub.fixed_deposits_bonds_percentage ?? 0));
            setSubMfDebt(String(sub.mutual_fund_debt_percentage ?? 0));
            setSubUlipDebt(String(sub.ulip_debt_percentage ?? 0));
            setSubEtfDebt(String(sub.etf_debt_percentage ?? 0));
            setSubGoldEtf(String(sub.gold_etf_percentage ?? 0));
            setSubSilverEtf(String(sub.silver_etf_percentage ?? 0));
            setSubEtfCommodity(String(sub.etf_commodity_percentage ?? 0));
          }
        }

        const suitabilityText = note.suitability_assessment || "";
        setSuitabilityChoice(suitabilityText.startsWith("YES") ? "YES" : "NO");
        setSuitabilityBasis(note.suitability_basis || "");
        setInvestorAdvice(note.investor_advice || "");
        setOriginalInvestorAdvice(note.investor_advice || "");

        if (note.conflict_of_interest_text) setConflictText(note.conflict_of_interest_text);
        if (note.no_execution_text) setNoExecutionText(note.no_execution_text);
        if (note.ai_usage_text) setAiUsageText(note.ai_usage_text);

        if (note.recommendations && note.recommendations.length > 0) {
          setRecommendations(note.recommendations);
        }
      } catch (error) {
        console.error("Failed to fetch draft note", error);
        toast.error("Failed to load draft note for editing.");
      }
    };

    fetchEmployees();
    fetchIAMaster();
    fetchTargetPortfolio();
    fetchExistingAdviceAmounts();

    if (noteId) {
      fetchDraftNote();
    } else {
      fetchAnalysisGoal();
      fetchLatestAllocation();
      fetchTotalAUA();
    }
  }, [client]);

  const handleSelectTargetPortfolioEntry = async (entry: TargetPortfolioEntry) => {
    setRecProductName(entry.product_name);

    const previouslyAdvisedFromHistory = existingAdviceAmounts[entry.product_id] || 0;
    const previouslyAdvisedInSession = recommendations
      .filter(r => r.product_id === entry.product_id)
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    const previouslyAdvised = previouslyAdvisedFromHistory + previouslyAdvisedInSession;
    setRecPreviouslyAdvised(previouslyAdvised);
    const target = entry.suggested_investment_amount ?? null;
    setRecBalance(target !== null ? Math.max(0, target - previouslyAdvised) : null);

    // Set a dummy/partial selectedProduct object so that selectedProduct.id is populated
    setSelectedProduct({
      id: entry.product_id,
      product_name: entry.product_name
    } as any);

    if (entry.suggested_investment_amount !== null && entry.suggested_investment_amount !== undefined) {
      setRecAmount(String(entry.suggested_investment_amount));
    } else {
      setRecAmount("");
    }

    let resolvedTType: typeof recTransactionType = recTransactionType;
    if (entry.transaction_type) {
      if (entry.transaction_type === "SINGLE_PAY") {
        resolvedTType = "LUMP_SUM";
      } else if (entry.transaction_type === "RECURRING") {
        resolvedTType = "SIP";
      } else {
        resolvedTType = entry.transaction_type as any;
      }
      setRecTransactionType(resolvedTType);
    }

    // Auto-populate From / To for transfer-type transactions
    if (resolvedTType === "STP") {
      setRecFromFund(entry.product_name);
      const stpToName = entry.stp_to_product_name
        || targetPortfolioEntries.find(e => e.product_id === entry.stp_to_product_id)?.product_name
        || "";
      setRecToFund(stpToName);
    } else if (resolvedTType === "SWITCH_OUT" || resolvedTType === "TRANSFER_OUT") {
      setRecFromFund(entry.product_name);
      setRecToFund("");
    } else if (resolvedTType === "SWITCH_IN" || resolvedTType === "TRANSFER_IN") {
      setRecFromFund("");
      setRecToFund(entry.product_name);
    } else {
      setRecFromFund("");
      setRecToFund("");
    }

    if (entry.frequency) {
      const freq = entry.frequency;
      if (freq === "MONTHLY" || freq === "QUARTERLY" || freq === "HALF_YEARLY") {
        setRecFrequency(freq);
      } else if (freq === "YEARLY" || freq === "ANNUAL" || freq === "ANNUALLY") {
        setRecFrequency("YEARLY");
      } else {
        setRecFrequency("MONTHLY");
      }
    }

    try {
      const res = await ProductMasterService.list(recProductType as any, entry.product_name);
      const matchedProduct = res.items.find(item => item.id === entry.product_id) || res.items[0];
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);

        let code = "";
        if (recProductType === "shares") {
          code = (matchedProduct as any).isin_code || "";
        } else if (recProductType === "mutual-funds") {
          code = (matchedProduct as any).scheme_code || "";
        } else if (recProductType === "etfs") {
          code = (matchedProduct as any).isin_code || "";
        } else if (recProductType === "life-insurance" || recProductType === "health-insurance") {
          code = (matchedProduct as any).uin || "";
        }
        setRecIsin(code);

        const latestPrice = (matchedProduct as any).latest_price;
        if (latestPrice !== undefined && latestPrice !== null) {
          setRecPriceNav(String(latestPrice));
        } else {
          setRecPriceNav("");
        }
      } else {
        setRecIsin("");
        setRecPriceNav("");
      }
    } catch (error) {
      console.error("Failed to fetch product details from master", error);
      setRecIsin("");
      setRecPriceNav("");
    }
  };

  const addRecommendation = () => {
    if (!selectedProduct?.id) {
      toast.error("Please select a product from the client's Target Portfolio");
      return;
    }
    if (!recProductName.trim()) {
      toast.error("Please select or enter a Product Name");
      return;
    }

    const isMutualFund = recProductType === "mutual-funds";
    const isTransferSwitch = ['SWITCH_IN', 'SWITCH_OUT', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(recTransactionType);

    if (isMutualFund && (recAction === 'SELL' || recAction === 'HOLD') && !isTransferSwitch) {
      if (!recFolioNo.trim()) {
        toast.error("Folio No is mandatory for SELL or HOLD on Mutual Funds.");
        return;
      }
    }
    if (isTransferSwitch) {
      if (!recFromFolioNo.trim()) {
        toast.error("From Folio No is mandatory for Switch/Transfer transactions.");
        return;
      }
      if (!recToFolioNo.trim()) {
        toast.error("To Folio No is mandatory for Switch/Transfer transactions.");
        return;
      }
    }

    const ttype = recTransactionType;
    const freq = ['SIP', 'STP', 'SWP'].includes(ttype) ? recFrequency : null;
    const amountVal = ['SIP', 'STP', 'SWP', 'LUMP_SUM', 'SWITCH_IN', 'SWITCH_OUT', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(ttype) ? (recAmount ? parseFloat(recAmount) : null) : null;
    const fromToTypes = ['STP', 'SWITCH_IN', 'SWITCH_OUT', 'TRANSFER_IN', 'TRANSFER_OUT'];
    const customInst = ttype === 'TEXT_ONLY'
      ? recCustomInstruction
      : fromToTypes.includes(ttype) && (recFromFund || recToFund)
        ? `From: ${recFromFund || '—'} | To: ${recToFund || '—'}`
        : null;

    if (amountVal !== null && !isNaN(amountVal)) {
      const entry = targetPortfolioEntries.find(e => e.id === selectedTargetPortfolioEntryId);
      if (entry && entry.suggested_investment_amount !== null && entry.suggested_investment_amount !== undefined) {
        const previouslyAdvisedInSession = recommendations
          .filter(r => r.product_id === entry.product_id)
          .reduce((sum, r) => sum + (r.amount || 0), 0);
        const previouslyAdvisedForProduct = (existingAdviceAmounts[entry.product_id] || 0) + previouslyAdvisedInSession;
        const remainingBalance = Math.max(0, entry.suggested_investment_amount - previouslyAdvisedForProduct);
        if (amountVal > remainingBalance) {
          const balanceLabel = previouslyAdvisedForProduct > 0
            ? `remaining balance of Rs. ${remainingBalance.toLocaleString('en-IN')} (Target: Rs. ${entry.suggested_investment_amount.toLocaleString('en-IN')}, Already Advised: Rs. ${previouslyAdvisedForProduct.toLocaleString('en-IN')})`
            : `target portfolio suggested amount of Rs. ${entry.suggested_investment_amount.toLocaleString('en-IN')}`;
          toast.error(`Amount Exceeded: Rs. ${amountVal.toLocaleString('en-IN')} exceeds the ${balanceLabel} for "${entry.product_name}".`);
          return;
        }
      }
    }

    const tempRec: Partial<InvestmentAdviceRecommendation> = {
      transaction_type: ttype,
      frequency: freq,
      amount: amountVal,
      custom_instruction: customInst
    };

    const adviceValidityText = recAdviceValidity === "Immediate"
      ? "Immediate"
      : recAdviceValidity === "custom"
        ? `${recAdviceCustomDays || "—"} Days`
        : `${recAdviceValidity} Days`;

    const entry = targetPortfolioEntries.find(e => e.id === selectedTargetPortfolioEntryId);
    const memberName = entry ? (entry as any).member_name : null;

    const newRec: InvestmentAdviceRecommendation = {
      product_type: recProductType,
      product_id: selectedProduct?.id,
      product_name: recProductName,
      isin_code_scheme_code_uin: recIsin,
      action: recAction,
      transaction_type: ttype,
      frequency: freq,
      amount: amountVal,
      custom_instruction: customInst,
      advice_validity_text: adviceValidityText,
      no_of_installments: recTransactionType === 'SWP' && recInstallments ? parseInt(recInstallments) : null,
      amount_units: formatAmountUnits(tempRec, recProductType),
      indicative_price_nav: recPriceNav ? parseFloat(recPriceNav) : null,
      rationale: recRationale || "Recommended as suitable according to client's risk profile.",
      folio_no: (recProductType === "mutual-funds" && (recAction === 'SELL' || recAction === 'HOLD') && !isTransferSwitch) ? recFolioNo || null : null,
      from_folio_no: isTransferSwitch ? recFromFolioNo || null : null,
      to_folio_no: isTransferSwitch ? recToFolioNo || null : null,
      member_name: memberName || null,
    };

    setRecommendations([...recommendations, newRec]);

    // Clear recommendation row
    setSelectedProduct(null);
    setSelectedTargetPortfolioEntryId("");
    setRecProductName("");
    setRecIsin("");
    setRecAction("BUY");
    setRecTransactionType("SIP");
    setRecFrequency("MONTHLY");
    setRecAmount("");
    setRecCustomInstruction("");
    setRecPriceNav("");
    setRecRationale("");
    setRecFromFund("");
    setRecToFund("");
    setRecAdviceValidity("30");
    setRecAdviceCustomDays("7");
    setRecInstallments("");
    setRecFolioNo("");
    setRecFromFolioNo("");
    setRecToFolioNo("");
    setRecPreviouslyAdvised(0);
    setRecBalance(null);
    toast.success("Recommendation added to draft table.");
  };

  const removeRecommendation = (index: number) => {
    setRecommendations(recommendations.filter((_, i) => i !== index));
  };

  const getSubAssetKey = (entry: TargetPortfolioEntry): string | null => {
    const ac = entry.asset_class;
    const subtype = entry.product_subtype || "";
    const nature = entry.nature || "";

    if (ac === "shares") {
      return "subStocks";
    }
    if (ac === "mf") {
      if (subtype === "Equity") return "subMfEquity";
      if (subtype === "Debt") return "subMfDebt";
    }
    if (ac === "etf") {
      if (subtype === "Gold") return "subGoldEtf";
      if (subtype === "Silver") return "subSilverEtf";
      if (subtype === "Other ETF") return "subEtfEquity";
    }
    if (ac === "life_insurance") {
      if (subtype === "ULIP") {
        if (nature === "Equity") return "subUlipEquity";
        if (nature === "Debt") return "subUlipDebt";
      }
      if (subtype === "Endowment" || subtype === "Annuity") {
        return "subUlipDebt";
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    // Validate Asset Allocation
    const eqAlloc = parseInt(recEquity) || 0;
    const dtAlloc = parseInt(recDebt) || 0;
    const cmAlloc = parseInt(recCommodities) || 0;
    const parentSum = eqAlloc + dtAlloc + cmAlloc;

    if (parentSum !== 100) {
      toast.error(`Recommended Asset Allocation Totals (Equity + Debt + Commodities) must sum to 100%. Current sum: ${parentSum}%`);
      return;
    }

    if (eqAlloc > 0 && equitySubSum !== 100) {
      toast.error(`Equity sub-assets must sum to 100% (currently ${equitySubSum}%).`);
      return;
    }

    if (dtAlloc > 0 && debtSubSum !== 100) {
      toast.error(`Debt sub-assets must sum to 100% (currently ${debtSubSum}%).`);
      return;
    }

    if (cmAlloc > 0 && commoditiesSubSum !== 100) {
      toast.error(`Commodities sub-assets must sum to 100% (currently ${commoditiesSubSum}%).`);
      return;
    }

    // Enforce sub-asset limit validation against recommended allocation
    const subAssetSums: Record<string, number> = {};
    const subAssetProductNames: Record<string, string[]> = {};

    for (const rec of recommendations) {
      const entry = targetPortfolioEntries.find(e => e.product_id === rec.product_id);
      if (!entry) {
        continue;
      }

      const key = getSubAssetKey(entry);
      if (key) {
        subAssetSums[key] = (subAssetSums[key] || 0) + (entry.percentage || 0);
        if (!subAssetProductNames[key]) {
          subAssetProductNames[key] = [];
        }
        subAssetProductNames[key].push(`${rec.product_name} (${entry.percentage}%)`);
      }
    }

    const limits: Record<string, { label: string; limitValue: number }> = {
      subStocks: { label: "Direct Equity / Stocks", limitValue: parseFloat(subStocks) || 0 },
      subMfEquity: { label: "Equity Mutual Funds", limitValue: parseFloat(subMfEquity) || 0 },
      subUlipEquity: { label: "Equity ULIPs", limitValue: parseFloat(subUlipEquity) || 0 },
      subEtfEquity: { label: "Equity ETFs", limitValue: parseFloat(subEtfEquity) || 0 },
      subMfDebt: { label: "Debt Mutual Funds", limitValue: parseFloat(subMfDebt) || 0 },
      subUlipDebt: { label: "Debt ULIPs", limitValue: parseFloat(subUlipDebt) || 0 },
      subGoldEtf: { label: "Gold ETFs", limitValue: parseFloat(subGoldEtf) || 0 },
      subSilverEtf: { label: "Silver ETFs", limitValue: parseFloat(subSilverEtf) || 0 },
    };

    for (const key of Object.keys(subAssetSums)) {
      const sum = subAssetSums[key];
      const limitInfo = limits[key];
      if (limitInfo) {
        if (sum > limitInfo.limitValue) {
          toast.error(
            `Allocation Exceeded: Sum of recommended allocations in "${limitInfo.label}" is ${sum}%, which exceeds the recommended sub-asset allocation limit of ${limitInfo.limitValue}%. Products: ${subAssetProductNames[key].join(", ")}`
          );
          return;
        }
      }
    }

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
        suitability_assessment: suitabilityChoice === "YES" 
          ? "YES — Advice is suitable to the client's risk profile, financial goals and overall financial situation"
          : "NO",
        suitability_basis: suitabilityBasis,
        investor_advice: investorAdvice,
        conflict_of_interest_text: conflictText,
        no_execution_text: noExecutionText,
        ai_usage_text: aiUsageText,
        recommendations: recommendations
      };

      if (noteId) {
        await InvestmentAdviceService.update(noteId, payload);
        toast.success("Investment Advice Note Draft updated successfully!");
        onSuccess(noteId);
      } else {
        const result = await InvestmentAdviceService.create(client.id!, payload);
        toast.success("Investment Advice Note Draft created successfully!");
        onSuccess(result.id);
      }
    } catch (error) {
      console.error("Create advice note failed", error);
      toast.error("Failed to create Investment Advice Note. Check required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPortfolioEntries = targetPortfolioEntries.filter(entry => {
    const mapping: Record<string, string> = {
      "shares": "shares",
      "mutual-funds": "mf",
      "etfs": "etf",
      "life-insurance": "life_insurance",
      "health-insurance": "health_insurance"
    };
    return entry.asset_class === mapping[recProductType];
  });

  const selectedSuggestedAmount = selectedEntry?.suggested_investment_amount ?? null;
  const enteredRecAmount = parseFloat(recAmount) || 0;
  const isPriceExceeded = selectedSuggestedAmount !== null && enteredRecAmount > selectedSuggestedAmount;
  const isBalanceExceeded = !isPriceExceeded && recBalance !== null && recPreviouslyAdvised > 0 && enteredRecAmount > recBalance;

  const isBodyCorporate = natureOfEntity?.toLowerCase().includes("body") || 
                          natureOfEntity?.toLowerCase().includes("corporate");

  return (
    <div className="max-w-4xl mx-auto py-4">

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
                  <Label htmlFor="principal_officer">{isBodyCorporate ? "Principal Officer" : "Investment Adviser"}</Label>
                  {loadingEmployees ? (
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  ) : (
                    <Select value={principalOfficerId} onValueChange={setPrincipalOfficerId}>
                      <SelectTrigger>
                        <SelectValue placeholder={isBodyCorporate ? "Select Principal Officer" : "Select Investment Adviser"} />
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
                    disabled
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
                  <Popover open={goalPopoverOpen} onOpenChange={setGoalPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="goal"
                        variant="outline"
                        role="combobox"
                        aria-expanded={goalPopoverOpen}
                        className="w-full justify-between text-left font-normal bg-background border-input hover:bg-background hover:text-foreground h-10 rounded-xl"
                      >
                        <span className="truncate">
                          {primaryFinancialGoal || "Select financial goals..."}
                        </span>
                        <span className="ml-2 shrink-0 opacity-50">▼</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-2 z-[200] bg-popover border border-border shadow-md rounded-md" align="start">
                      <div className="space-y-1">
                        {FINANCIAL_GOAL_OPTIONS.map((goal) => {
                          const isSelected = getSelectedGoals(primaryFinancialGoal).includes(goal);
                          return (
                            <label
                              key={goal}
                              className="flex items-center space-x-2 p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors text-sm"
                            >
                              <CustomCheckbox
                                checked={isSelected}
                                onCheckedChange={() => handleGoalToggle(goal)}
                              />
                              <span>{goal}</span>
                            </label>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="investor_advice">Investor Advice</Label>
                  <Textarea 
                    id="investor_advice"
                    className="min-h-16"
                    value={investorAdvice}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith(originalInvestorAdvice)) {
                        setInvestorAdvice(val);
                      }
                    }}
                    placeholder="Enter investor advice..."
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
                        value={recEquity}
                        onChange={(e) => setRecEquity(e.target.value)}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-blue-500 font-bold" htmlFor="rec_dt">Debt Total (%)</Label>
                      <Input 
                        id="rec_dt"
                        type="number"
                        value={recDebt}
                        onChange={(e) => setRecDebt(e.target.value)}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-amber-500 font-bold" htmlFor="rec_cm">Commodities Total (%)</Label>
                      <Input 
                        id="rec_cm"
                        type="number"
                        value={recCommodities}
                        onChange={(e) => setRecCommodities(e.target.value)}
                        disabled
                      />
                    </div>
                  </div>

                  {/* Sub-Asset Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/20 border border-primary/5 rounded-xl">
                    
                    {/* Equity Sub Assets */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-black text-emerald-500 uppercase tracking-wider">Equity Sub-Assets</h5>
                        <span className="text-xs font-mono font-bold text-emerald-500">{equitySubSum}%</span>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_stocks">Direct Equity / Stocks (%)</Label>
                          <Input 
                            id="sub_stocks" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subStocks} 
                            onChange={(e) => setSubStocks(e.target.value)} 
                            disabled
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
                            disabled
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
                            disabled
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
                            disabled
                          />
                        </div>
                      </div>
                      {parseInt(recEquity || "0") > 0 && equitySubSum !== 100 && (
                        <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Sub-assets must sum to 100%
                        </p>
                      )}
                    </div>

                    {/* Debt Sub Assets */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-black text-blue-500 uppercase tracking-wider">Debt Sub-Assets</h5>
                        <span className="text-xs font-mono font-bold text-blue-500">{debtSubSum}%</span>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_fd">Fixed Deposits / Bonds (%)</Label>
                          <Input 
                            id="sub_fd" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subFdBonds} 
                            onChange={(e) => setSubFdBonds(e.target.value)} 
                            disabled
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
                            disabled
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
                            disabled
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
                            disabled
                          />
                        </div>
                      </div>
                      {parseInt(recDebt || "0") > 0 && debtSubSum !== 100 && (
                        <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Sub-assets must sum to 100%
                        </p>
                      )}
                    </div>

                    {/* Commodities Sub Assets */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-black text-amber-500 uppercase tracking-wider">Commodities Sub-Assets</h5>
                        <span className="text-xs font-mono font-bold text-amber-500">{commoditiesSubSum}%</span>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]" htmlFor="sub_gold">Gold ETFs (%)</Label>
                          <Input 
                            id="sub_gold" 
                            type="number" 
                            className="h-8 text-xs"
                            value={subGoldEtf} 
                            onChange={(e) => setSubGoldEtf(e.target.value)} 
                            disabled
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
                            disabled
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
                            disabled
                          />
                        </div>
                      </div>
                      {parseInt(recCommodities || "0") > 0 && commoditiesSubSum !== 100 && (
                        <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Sub-assets must sum to 100%
                        </p>
                      )}
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
                    disabled
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
                      setSelectedTargetPortfolioEntryId("");
                      setRecProductName("");
                      setRecIsin("");
                      setRecPriceNav("");
                      setRecAmount("");
                      setRecFromFund("");
                      setRecToFund("");
                      setRecPreviouslyAdvised(0);
                      setRecBalance(null);
                    }}>
                      <SelectTrigger className="w-full max-w-full">
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

                  <div className="md:col-span-6 space-y-1.5">
                    <Label>Select Target Portfolio Product</Label>
                    {loadingTargetPortfolio ? (
                      <div className="h-10 bg-muted animate-pulse rounded flex items-center justify-center text-xs text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading target portfolio...
                      </div>
                    ) : (
                      <Select 
                        value={selectedTargetPortfolioEntryId} 
                        onValueChange={(entryId) => {
                          const entry = targetPortfolioEntries.find(e => e.id === entryId);
                          if (entry) {
                            setSelectedTargetPortfolioEntryId(entryId);
                            handleSelectTargetPortfolioEntry(entry);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full max-w-full">
                          <SelectValue placeholder="Choose a product from target portfolio..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredPortfolioEntries.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No active target portfolio products for this type
                            </SelectItem>
                          ) : (
                            filteredPortfolioEntries.map((entry) => {
                              let details = "";
                              if (entry.product_subtype) {
                                details = entry.product_subtype;
                                if (entry.nature) {
                                  details += ` - ${entry.nature}`;
                                }
                              }
                              const pctLabel = entry.asset_class === "life_insurance" ? "HLV" : "Alloc";
                              const desc = details ? ` (${details})` : "";
                              const memberLabel = (entry as any).member_name ? ` [${(entry as any).member_name}]` : "";
                              
                              return (
                                <SelectItem key={entry.id} value={entry.id}>
                                  {entry.product_name}{desc} — {entry.percentage}% {pctLabel}{memberLabel}
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Action</Label>
                    <Select value={recAction} onValueChange={(val: any) => setRecAction(val)}>
                      <SelectTrigger className="w-full max-w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">BUY</SelectItem>
                        <SelectItem value="HOLD">HOLD</SelectItem>
                        <SelectItem value="SELL">SELL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6 space-y-1.5">
                    <Label>Product Name</Label>
                    <Input 
                      value={recProductName}
                      onChange={(e) => setRecProductName(e.target.value)}
                      placeholder="e.g. HDFC Bank Limited"
                      disabled
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label>ISIN / Scheme Code / UIN</Label>
                    <Input 
                      value={recIsin}
                      onChange={(e) => setRecIsin(e.target.value)}
                      placeholder="e.g. INE040A01034"
                      disabled
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
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Action Type — editable only for Lump Sum (can switch to SWP) */}
                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Action Type</Label>
                    {recTransactionType === 'LUMP_SUM' || recTransactionType === 'SWP' && mappedType === 'LUMP_SUM' ? (
                      <Select value={recTransactionType} onValueChange={(val: any) => {
                        setRecTransactionType(val);
                        setRecInstallments("");
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LUMP_SUM">Lump Sum</SelectItem>
                          <SelectItem value="SWP">SWP</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        disabled
                        value={
                          recTransactionType === 'SIP' ? 'SIP' :
                          recTransactionType === 'STP' ? 'STP' :
                          recTransactionType === 'SWP' ? 'SWP' :
                          recTransactionType === 'HOLDING' ? 'Hold' :
                          recTransactionType === 'TEXT_ONLY' ? 'Custom Note' :
                          recTransactionType === 'SWITCH_IN' ? 'Switch In' :
                          recTransactionType === 'SWITCH_OUT' ? 'Switch Out' :
                          recTransactionType === 'TRANSFER_IN' ? 'Transfer In' :
                          recTransactionType === 'TRANSFER_OUT' ? 'Transfer Out' :
                          recTransactionType
                        }
                      />
                    )}
                  </div>

                  {/* Conditional Frequency */}
                  {['SIP', 'STP', 'SWP'].includes(recTransactionType) && (
                    <div className="md:col-span-3 space-y-1.5 animate-in fade-in duration-200">
                      <Label>Frequency</Label>
                      {recTransactionType === 'SWP' ? (
                        <Select value={recFrequency} onValueChange={(val: any) => setRecFrequency(val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                            <SelectItem value="HALF_YEARLY">Half-Yearly</SelectItem>
                            <SelectItem value="YEARLY">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          disabled
                          value={
                            recFrequency === 'MONTHLY' ? 'Monthly' :
                            recFrequency === 'QUARTERLY' ? 'Quarterly' :
                            recFrequency === 'HALF_YEARLY' ? 'Half-Yearly' :
                            recFrequency === 'YEARLY' ? 'Yearly' :
                            recFrequency
                          }
                        />
                      )}
                    </div>
                  )}

                  {/* Conditional Amount/Instruction Input */}
                  <div className={`${['SIP', 'STP', 'SWP'].includes(recTransactionType) ? 'md:col-span-6' : 'md:col-span-9'} space-y-1.5`}>
                    <Label className={isPriceExceeded ? "text-destructive" : isBalanceExceeded ? "text-amber-600" : ""}>
                      {recTransactionType === 'HOLDING' ? 'Amount / Description' : recTransactionType === 'TEXT_ONLY' ? 'Custom Note Text' : 'Amount'}
                    </Label>

                    {['SIP', 'STP', 'SWP', 'LUMP_SUM', 'SWITCH_IN', 'SWITCH_OUT', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(recTransactionType) && (
                      <div className="relative animate-in fade-in duration-200">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rs.</span>
                        <Input
                          type="number"
                          className={`pl-9 ${isPriceExceeded ? 'border-destructive focus-visible:ring-destructive text-destructive bg-destructive/5 placeholder:text-destructive/40' : isBalanceExceeded ? 'border-amber-500 focus-visible:ring-amber-500 text-amber-700' : ''}`}
                          value={recAmount}
                          onChange={(e) => setRecAmount(e.target.value)}
                          placeholder="e.g. 10000"
                        />
                      </div>
                    )}

                    {['SIP', 'STP', 'SWP', 'LUMP_SUM', 'SWITCH_IN', 'SWITCH_OUT', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(recTransactionType) && recBalance !== null && recPreviouslyAdvised > 0 && (
                      <div className="text-[11px] mt-1 space-x-2 text-muted-foreground animate-in fade-in duration-200">
                        <span>Max: Rs. {formatIndianNumber(selectedSuggestedAmount)}</span>
                        <span>|</span>
                        <span>Advised: Rs. {formatIndianNumber(recPreviouslyAdvised)}</span>
                        <span>|</span>
                        <span className={`font-semibold ${recBalance <= 0 ? 'text-destructive' : 'text-primary'}`}>
                          Balance: Rs. {formatIndianNumber(recBalance)}
                        </span>
                      </div>
                    )}

                    {['SIP', 'STP', 'SWP', 'LUMP_SUM', 'SWITCH_IN', 'SWITCH_OUT', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(recTransactionType) && isPriceExceeded && selectedSuggestedAmount !== null && (
                      <p className="text-xs text-destructive mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Exceeds target portfolio suggested amount of Rs. {selectedSuggestedAmount.toLocaleString('en-IN')}
                      </p>
                    )}

                    {isBalanceExceeded && recBalance !== null && (
                      <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Exceeds remaining balance of Rs. {formatIndianNumber(recBalance)} — up to Rs. {formatIndianNumber(selectedSuggestedAmount)} allowed
                      </p>
                    )}

                    {recTransactionType === 'TEXT_ONLY' && (
                      <Input 
                        className="animate-in fade-in duration-200"
                        value={recCustomInstruction}
                        onChange={(e) => setRecCustomInstruction(e.target.value)}
                        placeholder="e.g. Review coverage"
                      />
                    )}

                    {recTransactionType === 'HOLDING' && (
                      <Input 
                        disabled
                        className="bg-muted/50 cursor-not-allowed border-dashed animate-in fade-in duration-200"
                        value="Existing holding (Hold)"
                      />
                    )}
                  </div>
                </div>

                {/* SWP — % / Amount to be withdrawn + Installments */}
                {recTransactionType === 'SWP' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <Label>% to be Withdrawn</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={recSwpWithdrawalPercent}
                        onChange={(e) => {
                          const pct = e.target.value;
                          setRecSwpWithdrawalPercent(pct);
                          const total = parseFloat(recAmount);
                          if (!isNaN(total) && total > 0 && pct !== "") {
                            const amt = Math.floor((parseFloat(pct) / 100) * total);
                            setRecSwpWithdrawalAmount(String(amt));
                            if (amt > 0) setRecInstallments(String(Math.floor(total / amt)));
                          } else {
                            setRecSwpWithdrawalAmount("");
                            setRecInstallments("");
                          }
                        }}
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Amount to be Withdrawn (Rs.)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={recSwpWithdrawalAmount}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const amt = Math.floor(parseFloat(raw));
                          const amtStr = isNaN(amt) ? "" : String(amt);
                          setRecSwpWithdrawalAmount(amtStr);
                          const total = parseFloat(recAmount);
                          if (!isNaN(total) && total > 0 && amtStr !== "") {
                            setRecSwpWithdrawalPercent(((amt / total) * 100).toFixed(2));
                            setRecInstallments(String(Math.floor(total / amt)));
                          } else {
                            setRecSwpWithdrawalPercent("");
                            setRecInstallments("");
                          }
                        }}
                        placeholder="e.g. 5000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>No. of Installments</Label>
                      <Input
                        type="number"
                        min="1"
                        value={recInstallments}
                        onChange={(e) => setRecInstallments(e.target.value)}
                        placeholder="Auto-calculated"
                      />
                    </div>
                  </div>
                )}

                {/* From / To fields for transfer-type transactions (auto-populated from target portfolio) */}
                {['STP', 'SWITCH_IN', 'SWITCH_OUT', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(recTransactionType) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <Label>From (Fund / Scheme)</Label>
                      <Input
                        disabled
                        value={recFromFund}
                        placeholder="—"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>To (Fund / Scheme)</Label>
                      <Input
                        disabled
                        value={recToFund}
                        placeholder="—"
                      />
                    </div>
                  </div>
                )}

                {/* Folio No — Mutual Fund SELL/HOLD */}
                {recProductType === "mutual-funds" && (recAction === 'SELL' || recAction === 'HOLD') && !['SWITCH_IN', 'SWITCH_OUT', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(recTransactionType) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <Label className="text-destructive font-semibold">Folio No <span className="text-destructive">*</span></Label>
                      <Input
                        value={recFolioNo}
                        onChange={(e) => setRecFolioNo(e.target.value)}
                        placeholder="e.g. 1234567890"
                        className={!recFolioNo.trim() ? "border-destructive/50 focus-visible:ring-destructive/50" : ""}
                      />
                      <p className="text-[10px] text-destructive/80">Required for SELL / HOLD on Mutual Funds</p>
                    </div>
                  </div>
                )}

                {/* From / To Folio No — Switch & Transfer transactions */}
                {['SWITCH_IN', 'SWITCH_OUT', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(recTransactionType) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <Label className="text-destructive font-semibold">From Folio No <span className="text-destructive">*</span></Label>
                      <Input
                        value={recFromFolioNo}
                        onChange={(e) => setRecFromFolioNo(e.target.value)}
                        placeholder="e.g. 1234567890"
                        className={!recFromFolioNo.trim() ? "border-destructive/50 focus-visible:ring-destructive/50" : ""}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-destructive font-semibold">To Folio No <span className="text-destructive">*</span></Label>
                      <Input
                        value={recToFolioNo}
                        onChange={(e) => setRecToFolioNo(e.target.value)}
                        placeholder="e.g. 0987654321"
                        className={!recToFolioNo.trim() ? "border-destructive/50 focus-visible:ring-destructive/50" : ""}
                      />
                    </div>
                    <p className="text-[10px] text-destructive/80 md:col-span-2">Both folio numbers are required for Switch / Transfer transactions</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Adviser Rationale (Section E)</Label>
                    <Input
                      value={recRationale}
                      onChange={(e) => setRecRationale(e.target.value)}
                      placeholder="e.g. Stock has corrected 12% offering attractive entry point..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Advice Validity</Label>
                    <div className="flex gap-2">
                      <Select value={recAdviceValidity} onValueChange={setRecAdviceValidity}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Immediate">Immediate</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="15">15 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="90">90 Days</SelectItem>
                          <SelectItem value="180">180 Days</SelectItem>
                          <SelectItem value="365">365 Days</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      {recAdviceValidity === "custom" && (
                        <Input
                          type="number"
                          min="1"
                          className="w-24"
                          value={recAdviceCustomDays}
                          onChange={(e) => setRecAdviceCustomDays(e.target.value)}
                          placeholder="Days"
                        />
                      )}
                    </div>
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
                        <TableHead>Validity</TableHead>
                        <TableHead>Price/NAV</TableHead>
                        <TableHead className="w-12 text-right">Remove</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recommendations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-muted-foreground text-xs italic">
                            No recommendations added yet. Add at least one above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        recommendations.map((rec, i) => (
                          <TableRow key={i} className="hover:bg-primary/5 transition-colors">
                            <TableCell className="text-xs">{i + 1}</TableCell>
                             <TableCell className="text-xs">
                              <div className="font-bold">{rec.product_name}</div>
                              {rec.member_name && (
                                <div className="text-[10px] text-primary/80 font-medium mt-0.5">
                                  Allotted to: {rec.member_name}
                                </div>
                              )}
                              <div className="text-[10px] text-muted-foreground">{rec.isin_code_scheme_code_uin}</div>
                              {rec.folio_no && <div className="text-[10px] text-muted-foreground">Folio: {rec.folio_no}</div>}
                              {rec.from_folio_no && <div className="text-[10px] text-muted-foreground">From Folio: {rec.from_folio_no}</div>}
                              {rec.to_folio_no && <div className="text-[10px] text-muted-foreground">To Folio: {rec.to_folio_no}</div>}
                            </TableCell>
                            <TableCell className="text-xs capitalize">{rec.product_type.replace("-", " ")}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant={rec.action === 'BUY' ? 'default' : 'secondary'} className="text-[9px] font-bold">
                                {rec.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{rec.amount_units}</TableCell>
                            <TableCell className="text-xs">{rec.advice_validity_text || "—"}</TableCell>
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
                <Save className="w-4 h-4" /> {noteId ? "Update Draft Note" : "Create Draft Note"}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
