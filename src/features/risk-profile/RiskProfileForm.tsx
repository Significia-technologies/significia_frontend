"use client";

import React, { useState, useEffect } from "react";
import { 
  Calculator, 
  Save, 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  TrendingDown,
  ShieldCheck,
  User,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MasterDataService } from "@/core/services/master.service";
import { RiskProfileService, RiskAssessmentCalculateResponse } from "@/core/services/risk-profile.service";
import { 
  RISK_PROFILE_DISCLAIMER, 
  RISK_PROFILE_DISCUSSION_INIT, 
  Q2_FACTORS 
} from "../financial-analysis/constants";

interface RiskProfileFormProps {
  
  clientId?: string;
}

const MiniBarChart = ({ title, subtitle, data, yLabels, xLabel, maxVal = 25, minVal = -15 }: any) => {
  const range = maxVal - minVal;
  const zeroPos = (maxVal / range) * 100;

  return (
    <div className="bg-primary/5 rounded-xl p-4 border border-primary/5 flex flex-col h-full transition-all hover:bg-primary/[0.07]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">{title}</h4>
          <p className="text-[8px] text-muted-foreground font-medium italic mt-0.5">{subtitle}</p>
        </div>
      </div>
      
      <div className="flex-1 flex gap-3 relative min-h-[140px]">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between text-[7px] font-bold text-muted-foreground/50 w-5 pr-1 border-r border-primary/10 pb-4">
          {yLabels.map((lbl: string) => <span key={lbl}>{lbl}</span>)}
        </div>

        {/* Chart Area */}
        <div className="flex-1 flex justify-around relative px-2 h-full">
          {/* Zero Line */}
          <div 
            className="absolute left-0 right-0 border-t border-primary/20 z-0" 
            style={{ top: `${zeroPos}%` }}
          />
          
          {data.map((val: number, i: number) => {
            const isNegative = val < 0;
            const height = (Math.abs(val) / range) * 100;
            return (
              <div key={i} className="flex flex-col items-center flex-1 group relative h-full">
                <div className="relative w-full flex justify-center h-full">
                  <div 
                    className={`absolute w-1.5 transition-all duration-300 rounded-full hover:w-2.5 z-1 ${isNegative ? 'bg-orange-500/60' : 'bg-primary/80'}`}
                    style={{ 
                      height: `${height}%`, 
                      top: isNegative ? `${zeroPos}%` : 'auto',
                      bottom: isNegative ? 'auto' : `${100 - zeroPos}%`
                    }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground border border-primary/20 px-1.5 py-0.5 rounded text-[7px] font-black z-10 shadow-lg whitespace-nowrap">
                      {val}%
                    </div>
                  </div>
                </div>
                <span className="absolute -bottom-1 text-[7px] font-bold opacity-20 group-hover:opacity-60 transition-opacity">{i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const QuestionWrapper = ({ title, children, number }: any) => (
  <Card className="border-primary/10 overflow-hidden">
    <CardHeader className="bg-primary/5 py-3 px-4 flex flex-row items-center gap-3">
      <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
        {number}
      </div>
      <CardTitle className="text-sm font-bold">{title}</CardTitle>
    </CardHeader>
    <CardContent className="pt-4 px-4 pb-4">
      {children}
    </CardContent>
  </Card>
);

const RadioOption = ({ name, value, label, current, onChange }: any) => (
  <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-primary/5 ${current === value ? 'border-primary bg-primary/5' : 'border-transparent'}`}>
    <input 
      type="radio" 
      name={name} 
      value={value} 
      checked={current === value} 
      onChange={() => onChange(value)}
      className="mt-1 accent-primary"
    />
    <span className="text-sm leading-tight">{label}</span>
  </label>
);

export function RiskProfileForm({ clientId }: RiskProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [panValidating, setPanValidating] = useState(false);
  const [clientFound, setClientFound] = useState(false);
  
  const [clientInfo, setClientInfo] = useState({
    name: "",
    code: "",
    pan: "",
    iaReg: ""
  });

  const [answers, setAnswers] = useState<Record<string, any>>({
    q1: "",
    q2: { a: "", b: "", c: "", d: "", e: "", f: "", g: "", h: "" },
    q3: "",
    q4: "",
    q5: "",
    q6: "",
    q7: "",
    q8: "",
    q9: "",
    q10: "",
    q11: "",
    q12: "",
    q13: "",
    q14: "",
    q15: "",
    q16: ""
  });

  const [result, setResult] = useState<RiskAssessmentCalculateResponse | null>(null);
  const [discussionNotes, setDiscussionNotes] = useState(RISK_PROFILE_DISCUSSION_INIT);
  const [additionalDisclaimer, setAdditionalDisclaimer] = useState("");
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastAssessmentId, setLastAssessmentId] = useState<string | null>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);

  // Load client if ID provided
  useEffect(() => {
    if (clientId) {
      MasterDataService.getClient(clientId).then(client => {
        setClientInfo({
          name: client.client_name,
          code: client.client_code,
          pan: client.pan_number,
          iaReg: client.advisor_registration_number
        });
        setClientFound(true);
      });
    }
  }, [clientId]);

  const validateClientByCode = async (code: string) => {
    if (!code || code.length < 3) return;
    setPanValidating(true);
    try {
      const client = await MasterDataService.getClientByCode(code);
      if (client) {
        setClientInfo({
          name: client.client_name,
          code: client.client_code,
          pan: client.pan_number,
          iaReg: client.advisor_registration_number
        });
        setClientFound(true);
      }
    } catch (error) {
      // Try by code specifically if needed
      toast.error("Client not found with this code");
      setClientFound(false);
    } finally {
      setPanValidating(false);
    }
  };

  const handleAnswerChange = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleQ2Change = (factor: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      q2: { ...prev.q2, [factor]: value }
    }));
  };

  const calculateScore = async () => {
    setCalculating(true);
    try {
      const resp = await RiskProfileService.calculate({ answers });
      setResult(resp);
      toast.success("Score calculated successfully!");
      
      // Smooth scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (error) {
      toast.error("Failed to calculate score. Ensure all questions are answered.");
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!clientFound) {
      toast.error("Please identify a client first");
      return;
    }
    setLoading(true);

    // Concatenate standard disclaimer with custom disclaimer if present
    const combinedDisclaimer = additionalDisclaimer.trim()
      ? `${RISK_PROFILE_DISCLAIMER}\n\n${additionalDisclaimer.trim()}`
      : RISK_PROFILE_DISCLAIMER;

    try {
      const saveResp = await RiskProfileService.save({
        client_code: clientInfo.code,
        answers,
        discussion_notes: discussionNotes,
        disclaimer_text: combinedDisclaimer,
        form_name: "Sample"
      });
      
      setLastAssessmentId(saveResp.assessment_id);
      setShowSuccessDialog(true);
      toast.success("Risk assessment saved successfully!");
    } catch (error) {
      toast.error("Failed to save risk assessment");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (type: 'PDF' | 'DOCX') => {
    if (!lastAssessmentId) return;
    try {
        if (type === 'PDF') {
            await RiskProfileService.downloadPDF(lastAssessmentId, `Risk_Profile_${clientInfo.code}.pdf`);
        } else {
            await RiskProfileService.downloadDOCX(lastAssessmentId, `Risk_Profile_${clientInfo.code}.docx`);
        }
    } catch (error) {
        toast.error(`Failed to download ${type}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex justify-between">
                  Client Code * 
                  {panValidating && <span className="text-[10px] animate-spin">⌛</span>}
                </Label>
                <div className="relative">
                  <Input 
                    value={clientInfo.code} 
                    onChange={e => setClientInfo(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    onBlur={e => validateClientByCode(e.target.value)}
                    placeholder="e.g. A12345"
                    className={`uppercase font-mono tracking-widest pl-10 ${clientFound ? 'border-green-500/50 bg-green-500/5' : ''}`}
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-40" />
                  {clientFound && <CheckCircle2 className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />}
                </div>
              </div>
              <div className="space-y-2 opacity-80">
                <Label>Client Name</Label>
                <div className="h-10 px-3 flex items-center rounded-md border border-input bg-muted/30 font-bold uppercase text-primary/80">
                  {clientInfo.name || "Validate Code first"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Q1 */}
        <QuestionWrapper number="1" title="Interest Statement">
          <p className="text-xs text-muted-foreground mb-4 font-medium italic">Which statement best describes your investment interest?</p>
          <div className="space-y-2">
            <RadioOption name="q1" value="a" label="a. Achieve high long-term return, accepting significant short-term swings." current={answers.q1} onChange={(v:any) => handleAnswerChange('q1', v)} />
            <RadioOption name="q1" value="b" label="b. Stable growth, accepting lower returns over time." current={answers.q1} onChange={(v:any) => handleAnswerChange('q1', v)} />
            <RadioOption name="q1" value="c" label="c. Equal value to maximizing long-term returns and minimizing fluctuations." current={answers.q1} onChange={(v:any) => handleAnswerChange('q1', v)} />
          </div>
        </QuestionWrapper>

        {/* Q2 */}
        <QuestionWrapper number="2" title="Decision Factors">
          <p className="text-xs text-muted-foreground mb-4 font-medium italic">Rate each factor as (A) Very, (B) Somewhat, or (C) Not at All Important</p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10">
            {Q2_FACTORS.map(f => (
              <div key={f.code} className="p-3 rounded-lg bg-muted/30 border border-primary/5 flex items-center justify-between gap-4">
                <span className="text-xs font-medium opacity-80">{f.desc}</span>
                <div className="flex gap-2">
                  {['A', 'B', 'C'].map(opt => (
                    <button 
                      key={opt}
                      onClick={() => handleQ2Change(f.code, opt)}
                      className={`w-10 h-10 rounded-lg text-xs font-black border-2 transition-all shadow-sm flex items-center justify-center ${
                        answers.q2[f.code] === opt 
                          ? 'bg-primary text-black border-primary ring-2 ring-primary/20 scale-110' 
                          : 'bg-card hover:bg-primary/10 border-primary/20 text-muted-foreground hover:text-primary'
                      }`}
                      aria-label={`Rate ${f.desc} as ${opt}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </QuestionWrapper>

        {/* Q3 */}
        <QuestionWrapper number="3" title="Asset Allocation Scenario">
          <p className="text-xs text-muted-foreground mb-4 font-medium italic">Which scenario would you choose for Rs 500,000 investment?</p>
          <div className="space-y-2">
            <RadioOption name="q3" value="a" label="a. 70% chance to double (1M) / 30% chance to lose it all" current={answers.q3} onChange={(v:any) => handleAnswerChange('q3', v)} />
            <RadioOption name="q3" value="b" label="b. 80% chance to double / 20% chance to lose it all" current={answers.q3} onChange={(v:any) => handleAnswerChange('q3', v)} />
            <RadioOption name="q3" value="c" label="c. 60% chance to double / 40% chance to lose it all" current={answers.q3} onChange={(v:any) => handleAnswerChange('q3', v)} />
          </div>
        </QuestionWrapper>

        {/* Q4 */}
        <QuestionWrapper number="4" title="Portfolio Comparison">
          <p className="text-xs text-muted-foreground mb-4 font-medium italic">Based on 12-month asset returns, which portfolio would you choose?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 h-[220px]">
             <MiniBarChart 
                title="PORTFOLIO A"
                subtitle="(High Volatility)"
                xLabel="ASSETS"
                yLabels={['25%', '15%', '5%', '-5%', '-15%']}
                data={[25, 10, 10, -10, 20, 0]}
                maxVal={25}
                minVal={-15}
             />
             <MiniBarChart 
                title="PORTFOLIO B"
                subtitle="(Low Volatility)"
                xLabel="ASSETS"
                yLabels={['10%', '6%', '2%', '0%']}
                data={[6, 8, 10, 10, 8, 6, 2, 2]}
                maxVal={10}
                minVal={0}
             />
          </div>
          <div className="flex gap-4">
            <RadioOption name="q4" value="A" label="Portfolio A" current={answers.q4} onChange={(v:any) => handleAnswerChange('q4', v)} />
            <RadioOption name="q4" value="B" label="Portfolio B" current={answers.q4} onChange={(v:any) => handleAnswerChange('q4', v)} />
          </div>
        </QuestionWrapper>

        {/* Q5 */}
        <QuestionWrapper number="5" title="Loss Reaction">
          <p className="text-xs text-muted-foreground mb-4 font-medium italic">You lost Rs 20,000 in an investment. Do you:</p>
          <div className="space-y-2">
            <RadioOption name="q5" value="a" label="a. Sell and take the immediate 100% loss." current={answers.q5} onChange={(v:any) => handleAnswerChange('q5', v)} />
            <RadioOption name="q5" value="b" label="b. Hold for a 50/50 chance to recoup or lose Rs 20,000 more." current={answers.q5} onChange={(v:any) => handleAnswerChange('q5', v)} />
            <RadioOption name="q5" value="c" label="c. No preference." current={answers.q5} onChange={(v:any) => handleAnswerChange('q5', v)} />
          </div>
        </QuestionWrapper>

        {/* Q6 */}
        <QuestionWrapper number="6" title="Market Reaction">
          <p className="text-xs text-muted-foreground mb-4 font-medium italic">Your Rs 100,000 stock drops 15% in one week. Do you:</p>
          <div className="space-y-2">
            <RadioOption name="q6" value="a" label="a. Buy more." current={answers.q6} onChange={(v:any) => handleAnswerChange('q6', v)} />
            <RadioOption name="q6" value="b" label="b. Sell all immediately and move to less volatile assets." current={answers.q6} onChange={(v:any) => handleAnswerChange('q6', v)} />
            <RadioOption name="q6" value="c" label="c. Sell half immediately." current={answers.q6} onChange={(v:any) => handleAnswerChange('q6', v)} />
            <RadioOption name="q6" value="d" label="d. Wait for price to recover then sell." current={answers.q6} onChange={(v:any) => handleAnswerChange('q6', v)} />
            <RadioOption name="q6" value="e" label="e. Do nothing." current={answers.q6} onChange={(v:any) => handleAnswerChange('q6', v)} />
          </div>
        </QuestionWrapper>

        {/* Q7 */}
        <QuestionWrapper number="7" title="Fund Choice">
          <p className="text-xs text-muted-foreground mb-4 font-medium italic">Based on quarterly returns, which fund would you choose?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 h-[220px]">
             <MiniBarChart 
                title="FUND A"
                subtitle="(High Fluctuation)"
                xLabel="QUARTERS"
                yLabels={['20%', '10%', '0%', '-10%', '-20%']}
                data={[10, -15, 5, 15, 20, 15, -5, 10]}
                maxVal={20}
                minVal={-20}
             />
             <MiniBarChart 
                title="FUND B"
                subtitle="(Steady Growth)"
                xLabel="QUARTERS"
                yLabels={['10%', '6%', '2%', '0%']}
                data={[6, 8, 8, 10, 6, 4, 4, 2]}
                maxVal={10}
                minVal={0}
             />
          </div>
          <div className="flex gap-4">
            <RadioOption name="q7" value="A" label="Fund A" current={answers.q7} onChange={(v:any) => handleAnswerChange('q7', v)} />
            <RadioOption name="q7" value="B" label="Fund B" current={answers.q7} onChange={(v:any) => handleAnswerChange('q7', v)} />
          </div>
        </QuestionWrapper>

        {/* Q8 */}
        <QuestionWrapper number="8" title="Experience Level">
          <p className="text-xs text-muted-foreground mb-4 font-medium italic">How would you rate your investment experience?</p>
          <div className="space-y-2">
            <RadioOption name="q8" value="a" label="a. Extremely experienced." current={answers.q8} onChange={(v:any) => handleAnswerChange('q8', v)} />
            <RadioOption name="q8" value="b" label="b. More than average." current={answers.q8} onChange={(v:any) => handleAnswerChange('q8', v)} />
            <RadioOption name="q8" value="c" label="c. Average." current={answers.q8} onChange={(v:any) => handleAnswerChange('q8', v)} />
            <RadioOption name="q8" value="d" label="d. Less than average." current={answers.q8} onChange={(v:any) => handleAnswerChange('q8', v)} />
            <RadioOption name="q8" value="e" label="e. Little or no experience." current={answers.q8} onChange={(v:any) => handleAnswerChange('q8', v)} />
          </div>
        </QuestionWrapper>

        {/* Q9-Q16 Grid (Simplified for space) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuestionWrapper number="9" title="Time Horizon">
            <div className="space-y-2">
              <RadioOption name="q9" value="a" label="a. < 1 year" current={answers.q9} onChange={(v:any) => handleAnswerChange('q9', v)} />
              <RadioOption name="q9" value="b" label="b. 1-3 years" current={answers.q9} onChange={(v:any) => handleAnswerChange('q9', v)} />
              <RadioOption name="q9" value="c" label="c. 3-5 years" current={answers.q9} onChange={(v:any) => handleAnswerChange('q9', v)} />
              <RadioOption name="q9" value="d" label="d. 5-10 years" current={answers.q9} onChange={(v:any) => handleAnswerChange('q9', v)} />
              <RadioOption name="q9" value="e" label="e. > 10 years" current={answers.q9} onChange={(v:any) => handleAnswerChange('q9', v)} />
            </div>
          </QuestionWrapper>

          <QuestionWrapper number="10" title="Net Worth Range">
            <div className="space-y-2">
              <RadioOption name="q10" value="a" label="a. Upto Rs 50 lac" current={answers.q10} onChange={(v:any) => handleAnswerChange('q10', v)} />
              <RadioOption name="q10" value="b" label="b. Rs 51 lac - Rs 2 cr" current={answers.q10} onChange={(v:any) => handleAnswerChange('q10', v)} />
              <RadioOption name="q10" value="c" label="c. Rs 2 cr - Rs 5 cr" current={answers.q10} onChange={(v:any) => handleAnswerChange('q10', v)} />
              <RadioOption name="q10" value="d" label="d. Rs 5 cr - Rs 10 cr" current={answers.q10} onChange={(v:any) => handleAnswerChange('q10', v)} />
              <RadioOption name="q10" value="e" label="e. Above 10 cr" current={answers.q10} onChange={(v:any) => handleAnswerChange('q10', v)} />
            </div>
          </QuestionWrapper>

          <QuestionWrapper number="11" title="Age Range">
            <div className="space-y-2">
              <RadioOption name="q11" value="a" label="a. 18 - 30 years" current={answers.q11} onChange={(v:any) => handleAnswerChange('q11', v)} />
              <RadioOption name="q11" value="b" label="b. 31 - 45 years" current={answers.q11} onChange={(v:any) => handleAnswerChange('q11', v)} />
              <RadioOption name="q11" value="c" label="c. 46 - 60 years" current={answers.q11} onChange={(v:any) => handleAnswerChange('q11', v)} />
              <RadioOption name="q11" value="d" label="d. Above 60 years" current={answers.q11} onChange={(v:any) => handleAnswerChange('q11', v)} />
            </div>
          </QuestionWrapper>

          <QuestionWrapper number="12" title="Annual Income">
            <div className="space-y-2">
              <RadioOption name="q12" value="a" label="a. Upto Rs 12 lac" current={answers.q12} onChange={(v:any) => handleAnswerChange('q12', v)} />
              <RadioOption name="q12" value="b" label="b. Rs 13 lac - 25 lac" current={answers.q12} onChange={(v:any) => handleAnswerChange('q12', v)} />
              <RadioOption name="q12" value="c" label="c. Rs 26 lac - 50 lac" current={answers.q12} onChange={(v:any) => handleAnswerChange('q12', v)} />
              <RadioOption name="q12" value="d" label="d. Over Rs 51 lac" current={answers.q12} onChange={(v:any) => handleAnswerChange('q12', v)} />
            </div>
          </QuestionWrapper>

          <QuestionWrapper number="13" title="Annual Expenses">
            <div className="space-y-2">
              <RadioOption name="q13" value="a" label="a. Upto Rs 6 lac" current={answers.q13} onChange={(v:any) => handleAnswerChange('q13', v)} />
              <RadioOption name="q13" value="b" label="b. Rs 7 lac - 12 lac" current={answers.q13} onChange={(v:any) => handleAnswerChange('q13', v)} />
              <RadioOption name="q13" value="c" label="c. Rs 13 lac - 25 lac" current={answers.q13} onChange={(v:any) => handleAnswerChange('q13', v)} />
              <RadioOption name="q13" value="d" label="d. Over Rs 26 lac" current={answers.q13} onChange={(v:any) => handleAnswerChange('q13', v)} />
            </div>
          </QuestionWrapper>

          <QuestionWrapper number="14" title="Dependents">
            <div className="space-y-2">
              <RadioOption name="q14" value="a" label="a. Upto 2" current={answers.q14} onChange={(v:any) => handleAnswerChange('q14', v)} />
              <RadioOption name="q14" value="b" label="b. 3 - 5" current={answers.q14} onChange={(v:any) => handleAnswerChange('q14', v)} />
              <RadioOption name="q14" value="c" label="c. Over 5" current={answers.q14} onChange={(v:any) => handleAnswerChange('q14', v)} />
            </div>
          </QuestionWrapper>

          <QuestionWrapper number="15" title="Active Loan / EMI">
            <div className="space-y-2">
              <RadioOption name="q15" value="a" label="a. Yes" current={answers.q15} onChange={(v:any) => handleAnswerChange('q15', v)} />
              <RadioOption name="q15" value="b" label="b. No" current={answers.q15} onChange={(v:any) => handleAnswerChange('q15', v)} />
            </div>
          </QuestionWrapper>

          <QuestionWrapper number="16" title="Investment Objective">
            <div className="space-y-2">
              <RadioOption name="q16" value="a" label="a. Capital Growth" current={answers.q16} onChange={(v:any) => handleAnswerChange('q16', v)} />
              <RadioOption name="q16" value="b" label="b. Income" current={answers.q16} onChange={(v:any) => handleAnswerChange('q16', v)} />
              <RadioOption name="q16" value="c" label="c. Capital preservation" current={answers.q16} onChange={(v:any) => handleAnswerChange('q16', v)} />
            </div>
          </QuestionWrapper>
        </div>
      </div>

      {/* Footer / Notes */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Discussion Notes & Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-black tracking-widest opacity-50">Standard Disclaimer (Read-Only)</Label>
              <div className="p-4 rounded-md border border-primary/10 bg-muted/20 text-xs leading-relaxed text-muted-foreground select-none max-h-[150px] overflow-y-auto">
                {RISK_PROFILE_DISCLAIMER}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-black tracking-widest opacity-50">Additional Disclaimer (Optional)</Label>
              <Textarea 
                placeholder="Enter custom disclaimer text to append..."
                className="p-4 rounded-md border border-primary/10 bg-muted/5 text-sm leading-relaxed min-h-[90px] focus-visible:ring-primary/20"
                value={additionalDisclaimer}
                onChange={e => setAdditionalDisclaimer(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-black tracking-widest opacity-50">Discussion Notes (500 Words Max)</Label>
             <Textarea 
              className="p-4 rounded-md border border-primary/10 bg-muted/5 text-sm leading-relaxed min-h-[200px] focus-visible:ring-primary/20"
              value={discussionNotes}
              onChange={e => setDiscussionNotes(e.target.value)}
              placeholder="Enter final observations or client interaction context..."
            />
          </div>          

          {/* Moved Result Display to Bottom */}
          <div ref={resultRef} className="animate-in fade-in duration-500 pt-4">
            <div className="p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
               <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Calculator className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">Risk Assessment Outcome</h3>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Calculated based on 16 regulatory factors</p>
                  </div>
               </div>

               {result ? (
                  <div className="flex items-center gap-8 animate-in zoom-in duration-500">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block">Total Score</span>
                      <div className="text-4xl font-black text-primary">
                        {result.total_score}
                        <span className="text-lg font-normal text-muted-foreground ml-1">/ 100</span>
                      </div>
                    </div>
                    <div className="h-12 w-[2px] bg-primary/20" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block">Profile Tier</span>
                      <Badge className="bg-primary text-black uppercase font-black tracking-tighter text-xs py-1">
                        {result.risk_tier}
                      </Badge>
                    </div>
                  </div>
               ) : (
                  <div className="flex items-center gap-3 opacity-40 italic">
                    <span className="text-xs font-bold uppercase tracking-tighter">Click 'Calculate Risk' to see score</span>
                    <AlertCircle className="w-4 h-4" />
                  </div>
               )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-primary/5 flex justify-between gap-4 py-4">
          <Button 
            variant="outline" 
            className="gap-2 border-primary/20"
            onClick={calculateScore}
            disabled={calculating}
          >
            {calculating ? <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Calculator className="w-4 h-4" />}
            Calculate Risk
          </Button>
          <div className="flex gap-2">
             <Button 
              className="gap-2 shadow-lg shadow-primary/20"
              onClick={handleSave}
              disabled={loading || !result}
            >
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save & Get Report
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <div className="flex justify-center pb-10">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-30">
          Significia Secured Risk Processing Pipeline v4.0
        </p>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-primary/20">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <DialogTitle className="text-2xl font-black text-primary">Assessment Saved!</DialogTitle>
            <DialogDescription className="font-medium">
              Risk assessment for <span className="text-foreground font-black">{clientInfo.name}</span> has been stored securely in the vault.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-6">
            <Button 
                variant="outline" 
                className="h-24 flex flex-col gap-2 border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                onClick={() => downloadFile('PDF')}
            >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Download PDF</span>
            </Button>
            <Button 
                variant="outline" 
                className="h-24 flex flex-col gap-2 border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                onClick={() => downloadFile('DOCX')}
            >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Download Word</span>
            </Button>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button 
                variant="ghost" 
                className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100"
                onClick={() => setShowSuccessDialog(false)}
            >
                Close & Finish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
