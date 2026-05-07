"use client";

import React, { useState, useEffect } from "react";
import { 
  Calculator, 
  Save, 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RotateCcw,
  ShieldCheck,
  Edit2,
  Eye,
  GripVertical,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { MasterDataService } from "@/core/services/master.service";
import { RiskProfileService } from "@/core/services/risk-profile.service";
import { CUSTOM_RISK_PROFILE_DISCLAIMER } from "../../financial-analysis/constants";

interface DynamicRiskFormProps {
  
  questionnaireId?: string;
  questionnaire?: any;
  onClose?: () => void;
  isPreview?: boolean;
}

export function DynamicRiskForm({ questionnaireId, questionnaire: initialQuestionnaire, onClose, isPreview = false }: DynamicRiskFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [panValidating, setPanValidating] = useState(false);
  const [clientFound, setClientFound] = useState(false);
  
  const [questionnaire, setQuestionnaire] = useState<any>(initialQuestionnaire || null);
  const [clientInfo, setClientInfo] = useState({
    name: isPreview ? "PREVIEW MODE" : "",
    code: isPreview ? "PREVIEW" : "",
  });

  const [responses, setResponses] = useState<Record<string, { option_id: string, score: number, text: string }>>({});
  const [discussionNotes, setDiscussionNotes] = useState("");
  const [currentStep, setCurrentStep] = useState(-1); // -1 for client entry, 0+ for questions, 999 for review

  useEffect(() => {
    if (!initialQuestionnaire && questionnaireId) {
      loadQuestionnaire();
    } else if (initialQuestionnaire) {
        setFetching(false);
        if (isPreview) setCurrentStep(0);
    }
  }, [questionnaireId, initialQuestionnaire]);

  const loadQuestionnaire = async () => {
    if (!questionnaireId) return;
    setFetching(true);
    try {
      const data = await RiskProfileService.getQuestionnaire(questionnaireId);
      setQuestionnaire(data);
    } catch (error) {
      toast.error("Failed to load questionnaire.");
    } finally {
      setFetching(false);
    }
  };

  const validateClientByCode = async (code: string) => {
    if (!code || code.length < 3) return;
    setPanValidating(true);
    try {
      const client = await MasterDataService.getClientByCode(code);
      if (client) {
        setClientInfo({
          name: client.client_name,
          code: client.client_code,
        });
        setClientFound(true);
      }
    } catch (error) {
      toast.error("Client not found with this code");
      setClientFound(false);
    } finally {
      setPanValidating(false);
    }
  };

  const handleOptionSelect = (qId: string, option: any) => {
    setResponses(prev => ({
      ...prev,
      [qId]: { option_id: option.id, score: option.score, text: option.text }
    }));
    
    // Auto-advance after small delay for better UX
    if (currentStep < (questionnaire?.questions?.length - 1)) {
        setTimeout(() => setCurrentStep(prev => prev + 1), 400);
    } else {
        setTimeout(() => setCurrentStep(999), 400); // 999 is Review
    }
  };

  const calculateTotalScore = () => {
    return Object.values(responses).reduce((sum, r) => sum + r.score, 0);
  };

  const getCurrentCategory = (score: number) => {
    if (!questionnaire) return null;
    return questionnaire.categories.find((c: any) => score >= c.min_score && score <= c.max_score);
  };

  const handleSubmit = async () => {
    if (!clientFound && !isPreview) {
      toast.error("Please identify a client first.");
      return;
    }
    
    if (Object.keys(responses).length < questionnaire.questions.length) {
      toast.error("Please answer all questions.");
      return;
    }

    setSubmitting(true);
    try {
      if (isPreview) {
        toast.info("Preview session concluded.");
        if (onClose) onClose();
        return;
      }
      await RiskProfileService.saveCustomAssessment({
        questionnaire_id: questionnaireId || questionnaire.id,
        client_code: clientInfo.code,
        responses,
        discussion_notes: discussionNotes
      });
      toast.success("Risk profile successfully registered to vault.");
      if (onClose) onClose();
    } catch (error) {
      toast.error("Failed to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return <div className="p-20 text-center animate-pulse font-black text-primary uppercase tracking-widest text-sm">Synchronizing with Security Vault...</div>;
  }

  if (!questionnaire) {
    return <div className="p-20 text-center text-destructive font-bold">Questionnaire definition not found or corrupted.</div>;
  }

  if (isPreview && currentStep === -1) {
     setCurrentStep(0);
  }

  const totalScore = calculateTotalScore();
  const currentCategory = getCurrentCategory(totalScore);
  const totalQuestions = questionnaire.questions.length;
  const progressPercent = currentStep === -1 ? 0 : currentStep === 999 ? 100 : Math.round(((currentStep + 1) / totalQuestions) * 100);

  return (
    <div className="space-y-4 animate-in fade-in duration-700 max-w-4xl mx-auto pb-4 px-4 md:px-0">
      {/* Hyper-Compact Header with Progress */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-primary/[0.02] border border-primary/5 rounded-2xl px-4 py-2 gap-4">
          <div className="flex items-center gap-3">
             {onClose && (
               <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-7 w-7 hover:bg-primary/10 hover:text-primary transition-all shrink-0">
                 <ChevronLeft className="w-4 h-4" />
               </Button>
             )}
            <div className="p-1.5 rounded-lg bg-primary/5 border border-primary/10 shrink-0">
              <ClipboardList className="w-4 h-4 text-primary/70" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight text-foreground uppercase truncate max-w-[200px]">{questionnaire.portfolio_name}</h1>
              <div className="flex items-center gap-1.5">
                 <Badge variant="outline" className="text-[6px] border-primary/10 bg-primary/5 text-primary/40 font-bold px-1.5 py-0 uppercase h-3">Session v1</Badge>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-sm w-full flex items-center gap-4">
             <div className="flex-1 space-y-1">
                <div className="flex justify-between items-end">
                   <span className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground/40 leading-none">
                     {currentStep === -1 ? 'Identification' : currentStep === 999 ? 'Review' : `Q ${currentStep + 1}/${totalQuestions}`}
                   </span>
                   <span className="text-[8px] font-black text-primary/40 leading-none">{progressPercent}%</span>
                </div>
                <div className="h-1 w-full bg-primary/5 rounded-full overflow-hidden">
                   <div className="h-full bg-primary/40 transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
                </div>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6 min-h-[300px]">
          {/* Step -1: Identification */}
          {currentStep === -1 && (
            <Card className="glass border-primary/5 shadow-xl rounded-[1.5rem] overflow-hidden animate-in slide-in-from-bottom-4 duration-500 max-w-sm mx-auto">
              <CardHeader className="bg-primary/[0.02] p-6 border-b border-primary/5 text-center">
                 <CardTitle className="text-lg font-black uppercase tracking-tight">Client Identification</CardTitle>
                 <CardDescription className="text-[8px] font-bold uppercase tracking-widest opacity-30 mt-0.5">Verified Session Required</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[8px] font-bold uppercase tracking-widest opacity-30 text-center block">Internal Code</Label>
                    <div className="relative group">
                      <Input 
                        value={clientInfo.code} 
                        onChange={e => {
                          setClientInfo(prev => ({ ...prev, code: e.target.value.toUpperCase() }));
                          setClientFound(false);
                        }}
                        onKeyDown={e => e.key === 'Enter' && !clientFound && validateClientByCode(clientInfo.code)}
                        placeholder="ENTER CODE..."
                        className={`uppercase font-black text-lg tracking-widest text-center h-12 rounded-xl border bg-primary/[0.01] focus-visible:ring-primary/10 transition-all ${clientFound ? 'border-green-500/30 bg-green-500/5' : 'border-primary/10'}`}
                      />
                      {panValidating && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary/40 text-[10px]">⌛</div>}
                      {clientFound && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500/60 w-4 h-4 shadow-sm" />}
                    </div>
                  </div>

                  {clientFound ? (
                    <div className="space-y-3 animate-in zoom-in-95 duration-300">
                      <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10 text-center">
                        <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-green-500/40 mb-0.5">Identity Verified</p>
                        <h4 className="text-xs font-black text-foreground/80 uppercase">{clientInfo.name}</h4>
                      </div>
                      <Button 
                        onClick={() => setCurrentStep(0)}
                        className="w-full h-10 rounded-lg bg-primary font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                      >
                        Start Assessment
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => { setClientFound(false); setClientInfo({ name: "", code: "" }); }}
                        className="w-full h-7 text-[7px] font-bold uppercase tracking-widest opacity-30 hover:opacity-100"
                      >
                        Reset Identity
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => validateClientByCode(clientInfo.code)}
                      disabled={panValidating || !clientInfo.code}
                      className="w-full h-10 rounded-lg bg-primary/90 font-bold uppercase tracking-widest text-[9px] shadow-lg shadow-primary/10 transition-all active:scale-95"
                    >
                      {panValidating ? "Verifying..." : "Validate Identity"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wizard Steps */}
          {currentStep >= 0 && currentStep < totalQuestions && (
            <div key={currentStep} className="animate-in slide-in-from-right-4 fade-in duration-500">
               <Card className="glass border-primary/10 shadow-2xl rounded-[1.2rem] overflow-hidden max-w-xl mx-auto border-white/5">
                 <CardHeader className="bg-primary/5 p-5 border-b border-white/5 flex flex-row items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary text-black flex items-center justify-center font-black text-xs border border-primary/20 shrink-0">
                      {currentStep + 1}
                    </div>
                    <div>
                      <CardTitle className="text-md font-black tracking-tight text-foreground uppercase leading-tight">{questionnaire.questions[currentStep].text}</CardTitle>
                      <p className="text-[7px] font-bold text-primary uppercase tracking-[0.2em] mt-0.5 opacity-60">Selection Required</p>
                    </div>
                 </CardHeader>
                 <CardContent className="p-5">
                    <div className="grid grid-cols-1 gap-1.5">
                      {questionnaire.questions[currentStep].options.map((opt: any) => (
                        <button
                          key={opt.id}
                          onClick={() => handleOptionSelect(questionnaire.questions[currentStep].id, opt)}
                          className={`flex items-center gap-3.5 p-2.5 rounded-lg border text-left transition-all relative overflow-hidden ${
                            responses[questionnaire.questions[currentStep].id]?.option_id === opt.id 
                              ? 'border-primary bg-primary/10 shadow-lg' 
                              : 'border-white/5 bg-white/[0.02] hover:border-primary/30 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                            responses[questionnaire.questions[currentStep].id]?.option_id === opt.id 
                              ? 'border-primary bg-primary text-black shadow-[0_0_10px_rgba(var(--primary),0.3)]' 
                              : 'border-white/20'
                          }`}>
                            {responses[questionnaire.questions[currentStep].id]?.option_id === opt.id && <CheckCircle2 className="w-2.5 h-2.5" />}
                          </div>
                          <span className={`text-[11px] font-black tracking-wide uppercase ${responses[questionnaire.questions[currentStep].id]?.option_id === opt.id ? 'text-primary' : 'text-foreground/90'}`}>
                            {opt.text}
                          </span>
                        </button>
                      ))}
                    </div>
                 </CardContent>
                 <CardFooter className="px-5 py-3 bg-white/[0.02] border-t border-white/5 flex justify-between">
                    <Button 
                      variant="ghost" 
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="h-6 px-2.5 font-bold uppercase text-[7px] tracking-widest text-foreground/40 hover:text-primary transition-all"
                    >
                      <ChevronLeft className="w-3 h-3 mr-1" /> Previous
                    </Button>
                    <span className="text-[7px] font-bold uppercase tracking-widest text-primary/30">Auto-Advance Active</span>
                 </CardFooter>
               </Card>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 999 && (
            <Card className="glass border-primary/10 shadow-2xl rounded-[1.2rem] overflow-hidden animate-in zoom-in-95 duration-500 max-w-2xl mx-auto border-white/5">
              <CardHeader className="bg-primary/5 p-4 border-b border-white/5 flex flex-row items-center gap-3">
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setCurrentStep(totalQuestions - 1)}
                    className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary transition-all shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="text-left">
                     <CardTitle className="text-md font-black uppercase tracking-tight">Protocol Summary {isPreview && <Badge className="ml-2 bg-amber-500/10 text-amber-500 border-amber-500/20">PREVIEW</Badge>}</CardTitle>
                     <CardDescription className="text-[7px] font-bold uppercase tracking-widest opacity-40 mt-0.5 text-primary">Final Review & Submission</CardDescription>
                  </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                  <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                     <h4 className="text-[8px] font-black uppercase tracking-[0.3em] opacity-20 mb-1 px-1">Response Audit</h4>
                     {questionnaire.questions.map((q: any, i: number) => (
                       <div key={q.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 group hover:bg-primary/5 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                             <span className="text-[9px] font-black text-primary/40 w-4">{i + 1}</span>
                             <div className="min-w-0">
                                <p className="text-[10px] font-black text-foreground/80 truncate max-w-[150px] uppercase tracking-tight">{q.text}</p>
                                <p className="text-[8px] font-bold text-primary truncate max-w-[150px] uppercase">{responses[q.id]?.text || 'No Answer'}</p>
                             </div>
                          </div>
                          <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => setCurrentStep(i)}
                             className="h-6 w-6 rounded-md hover:bg-primary hover:text-black transition-all opacity-0 group-hover:opacity-100 shrink-0"
                          >
                             <Edit2 className="w-3 h-3" />
                          </Button>
                       </div>
                     ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-4">
                    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Calculated Total Score</span>
                       <span className="text-5xl font-black text-primary">{calculateTotalScore()}</span>
                       {currentCategory && (
                          <Badge 
                            className="mt-3 px-3 h-6 uppercase font-black tracking-tight text-[10px] border-none shadow-lg"
                            style={{ backgroundColor: currentCategory.color, color: 'black' }}
                          >
                            {currentCategory.name}
                          </Badge>
                       )}
                    </div>
                  </div>

                 <div className="space-y-4">
                     <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 selection:bg-primary/20">
                            <Label className="text-[9px] font-black uppercase text-primary/60 tracking-widest block mb-1">Standard Regulatory Disclaimer</Label>
                            <p className="text-[10px] leading-relaxed text-muted-foreground/80 italic font-medium">
                              {CUSTOM_RISK_PROFILE_DISCLAIMER}
                            </p>
                        </div>
                        
                        {questionnaire.disclaimer && (
                          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <Label className="text-[9px] font-black uppercase text-red-500/60 tracking-widest block mb-1">Additional Protocol Disclaimer</Label>
                            <p className="text-[10px] leading-relaxed text-muted-foreground/80 italic font-medium">
                              {questionnaire.disclaimer}
                            </p>
                          </div>
                        )}
                     </div>
                    
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest pl-1">Discussion & Strategic Notes</Label>
                       <Textarea 
                          placeholder="Final observations or client context..."
                          value={discussionNotes}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDiscussionNotes(e.target.value)}
                          className="bg-white/[0.03] border-white/10 focus:border-primary/30 focus:ring-1 focus:ring-primary/10 text-white min-h-[80px] resize-none text-[11px] transition-all"
                       />
                    </div>
                 </div>
              </CardContent>
              <CardFooter className="px-5 py-3 bg-white/[0.02] border-t border-white/5 gap-3">
                 <Button 
                   variant="outline" 
                   onClick={() => onClose && onClose()}
                   className="flex-1 h-9 rounded-lg font-black uppercase text-[9px] tracking-widest border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
                 >
                   Discard
                 </Button>
                 <Button 
                   onClick={handleSubmit} 
                   disabled={submitting}
                   className="flex-[2] h-9 rounded-lg bg-primary text-black font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                 >
                   {submitting ? "Vaulting..." : isPreview ? "Finish Preview" : "Submit to history"}
                 </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
