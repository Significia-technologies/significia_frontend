"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  Settings,
  ChevronDown,
  ChevronUp,
  Layout,
  PieChart,
  Eye,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  Clock,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { RiskProfileService } from "@/core/services/risk-profile.service";
import { CUSTOM_RISK_PROFILE_DISCLAIMER} from "../../financial-analysis/constants";

interface Option {
  id: string;
  text: string;
  score: number | string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface Category {
  name: string;
  min_score: number;
  max_score: number;
  color: string;
  description: string;
}

interface FormBuilderPageProps {

  onClose?: () => void;
  initialData?: any;
}

export function FormBuilderPage({ onClose, initialData }: FormBuilderPageProps) {
  const [loading, setLoading] = useState(false);
  const [portfolioName, setPortfolioName] = useState(initialData?.portfolio_name || "");
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
  const [categories, setCategories] = useState<Category[]>(initialData?.categories || [
    { name: "Neutral", min_score: 0, max_score: 5, color: "#94A3B8", description: "Baseline profile" },
    { name: "Strategic", min_score: 6, max_score: 10, color: "#EAB308", description: "Standard profile" }
  ]);
  const [disclaimer, setDisclaimer] = useState(initialData?.disclaimer || "");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [disclaimerExpanded, setDisclaimerExpanded] = useState(false);
  const [existingQuestionnaires, setExistingQuestionnaires] = useState<any[]>([]);
  const [nameError, setNameError] = useState<"required" | "duplicate" | null>(null);

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const data = await RiskProfileService.listQuestionnaires();
        setExistingQuestionnaires(data || []);
      } catch (err) {
        console.error("Failed to load existing questionnaires for validation", err);
      }
    };
    fetchExisting();
  }, []);

  const validateName = (name: string, list: any[]) => {
    if (!name.trim()) {
      return "required";
    }
    const isDuplicate = list.some(q => 
      q.portfolio_name.toLowerCase().trim() === name.toLowerCase().trim() && 
      q.id !== initialData?.id
    );
    if (isDuplicate) {
      return "duplicate";
    }
    return null;
  };

  const totalPossibleScore = questions.reduce((sum, q) => {
    const maxOptionScore = q.options.length > 0 
      ? Math.max(...q.options.map(o => typeof o.score === 'number' ? o.score : 0)) 
      : 0;
    return sum + maxOptionScore;
  }, 0);

  const addQuestion = () => {
    const newId = `q_${Date.now()}`;
    const newQuestions = [...questions, { id: newId, text: "", options: [{ id: `opt_${Date.now()}`, text: "", score: "" }] }];
    setQuestions(newQuestions);
    setActiveQuestionIndex(newQuestions.length - 1);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
        toast.error("At least one question is required.");
        return;
    }
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
    setActiveQuestionIndex(Math.max(0, index - 1));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) return;
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    setQuestions(newQuestions);
    setActiveQuestionIndex(targetIndex);
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].text = text;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    const newId = `opt_${Date.now()}`;
    newQuestions[qIndex].options.push({ id: newId, text: "", score: "" });
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof Option, value: any) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = { ...newQuestions[qIndex].options[oIndex], [field]: value };
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    if (questions[qIndex].options.length <= 1) {
        toast.error("Each question requires at least one option.");
        return;
    }
    const newQuestions = [...questions];
    newQuestions[qIndex].options.splice(oIndex, 1);
    setQuestions(newQuestions);
  };

  const addCategory = () => {
    setCategories([...categories, { name: "New Risk Tier", min_score: 0, max_score: 0, color: "#D4AF37", description: "" }]);
  };

  const updateCategory = (index: number, field: keyof Category, value: any) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setCategories(newCategories);
  };

  const removeCategory = (index: number) => {
    const newCategories = [...categories];
    newCategories.splice(index, 1);
    setCategories(newCategories);
  };

  const handleSave = async (status: "active" | "draft" = "active") => {
    const error = validateName(portfolioName, existingQuestionnaires);
    if (error) {
      setNameError(error);
      if (error === "required") {
        toast.error("Please provide a name for this questionnaire.");
      } else if (error === "duplicate") {
        toast.error("A questionnaire with this name already exists.");
      }
      return;
    }

    setLoading(true);
    try {
      const payload = {
        portfolio_name: portfolioName,
        questions: questions.map(q => ({
          ...q,
          options: q.options.map(o => ({
            ...o,
            score: typeof o.score === 'number' ? o.score : 0
          }))
        })),
        categories,
        status: status,
        disclaimer,
        max_possible_score: totalPossibleScore
      };

      if (initialData?.id) {
        await RiskProfileService.updateQuestionnaire(initialData.id, payload);
      } else {
        await RiskProfileService.createQuestionnaire(payload);
      }

      toast.success(status === "active" ? "Questionnaire published successfully!" : "Draft saved successfully.");
      if (onClose) onClose();
    } catch (error) {
      toast.error(status === "active" ? "Failed to publish questionnaire." : "Failed to save draft.");
    } finally {
      setLoading(false);
    }
  };

  const activeQuestion = questions[activeQuestionIndex];

  return (
    <div className="flex flex-col min-h-screen bg-background/30 animate-in fade-in duration-700">
      <div className="max-w-3xl mx-auto w-full space-y-4 py-8 px-4 md:px-0">

        {/* Form Identity Card */}
        <Card className="border-t-4 border-t-primary border-primary/10 bg-card/60 backdrop-blur-xl shadow-lg rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4">
               <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                  <Layout className="w-6 h-6 text-primary" />
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Questionnaire Name <span className="text-red-500">*</span></Label>
                    {initialData?.status && (
                      <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wide ${initialData.status === 'active' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500' : 'border-amber-500/30 bg-amber-500/5 text-amber-500'}`}>
                        {initialData.status}
                      </Badge>
                    )}
                  </div>
                  <Input
                    value={portfolioName}
                    onChange={e => {
                      const value = e.target.value;
                      setPortfolioName(value);
                      const error = validateName(value, existingQuestionnaires);
                      setNameError(error);
                    }}
                    placeholder="Enter questionnaire name..."
                    className={`bg-transparent border text-xl font-bold focus-visible:ring-1 shadow-none px-3 h-10 rounded-lg placeholder:text-muted-foreground/40 text-foreground mt-1 ${
                      nameError 
                        ? 'border-destructive focus-visible:ring-destructive/20' 
                        : 'border-primary/15 focus-visible:ring-primary/20'
                    }`}
                  />
                  {nameError === "required" && (
                    <p className="text-xs text-destructive font-semibold mt-1">
                      Questionnaire Name is mandatory.
                    </p>
                  )}
                  {nameError === "duplicate" && (
                    <p className="text-xs text-destructive font-semibold mt-1">
                      A questionnaire with this name already exists. Name must be unique.
                    </p>
                  )}
               </div>
            </div>

            <Separator className="bg-primary/10" />

            <div className="space-y-4">
                <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setDisclaimerExpanded(prev => !prev)}
                      className="flex items-center justify-between w-full text-left group"
                    >
                      <Label className="text-sm font-semibold text-foreground/70 cursor-pointer group-hover:text-foreground/90 transition-colors">Standard Regulatory Disclaimer</Label>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground/50 transition-transform duration-200 ${disclaimerExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {disclaimerExpanded && (
                      <div className="p-4 rounded-lg bg-muted/20 border border-primary/10 text-sm leading-relaxed text-muted-foreground italic animate-in fade-in slide-in-from-top-1 duration-200">
                          {CUSTOM_RISK_PROFILE_DISCLAIMER}
                      </div>
                    )}
                    {!disclaimerExpanded && (
                      <p className="text-xs text-muted-foreground/40 italic pl-0.5">Click to expand the standard regulatory disclaimer.</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Additional Disclaimer <span className="text-xs font-normal opacity-60">(Optional)</span></Label>
                    <Textarea
                       placeholder="Enter supplemental disclaimer text for this questionnaire..."
                       value={disclaimer}
                       onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDisclaimer(e.target.value)}
                       className="bg-black/40 border-primary/10 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 text-white min-h-[90px] resize-none transition-all placeholder:text-muted-foreground/30 text-sm"
                    />
                    <p className="text-xs text-muted-foreground/50 italic">This text will be appended to the standard regulatory disclaimer in all outputs.</p>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Cards */}
        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="py-16 border-2 border-dashed border-primary/15 rounded-xl flex flex-col items-center justify-center gap-4 bg-primary/[0.01] animate-in fade-in zoom-in-95 duration-500">
               <div className="p-3 rounded-full bg-primary/5 text-primary/40">
                  <Plus className="w-6 h-6" />
               </div>
               <div className="text-center space-y-1">
                  <h3 className="text-lg font-semibold text-foreground/70">
                     {initialData ? "No questions yet" : "Add your first question"}
                  </h3>
                  <p className="text-sm text-muted-foreground/50">Build the questionnaire by adding questions below.</p>
               </div>
               <Button onClick={addQuestion} variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5 text-sm font-medium">
                  Add First Question
               </Button>
            </div>
          ) : (
            questions.map((q, idx) => {
              const isActive = idx === activeQuestionIndex;
              return (
                <Card
                  key={q.id}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`transition-all duration-300 relative border-l-2 rounded-lg shadow-sm group cursor-pointer overflow-hidden ${
                    isActive
                      ? 'border-l-primary bg-card/60 ring-1 ring-primary/10'
                      : 'border-l-transparent bg-card/20 hover:bg-card/30 opacity-90 border-white/5'
                  }`}
                >
                  <CardHeader className={`transition-all duration-300 ${isActive ? 'p-5 pb-3' : 'p-4 pb-3'}`}>
                   <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm transition-all shrink-0 ${isActive ? 'bg-primary text-black' : 'bg-muted/30 text-muted-foreground/50'}`}>
                         {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                         {isActive ? (
                            <Input
                              value={q.text}
                              onChange={e => updateQuestionText(idx, e.target.value)}
                              placeholder="Enter question text..."
                              className="bg-muted/10 border border-primary/15 text-base font-semibold focus-visible:ring-1 focus-visible:ring-primary/20 shadow-none px-3 h-9 rounded-lg placeholder:text-muted-foreground/30"
                              autoFocus
                            />
                         ) : (
                            <h3 className="text-sm font-semibold text-foreground/70 truncate max-w-lg">{q.text || <span className="text-muted-foreground/40 font-normal italic">Untitled question</span>}</h3>
                         )}
                      </div>
                   </div>
                </CardHeader>

                <CardContent className={`px-5 pt-0 pb-5 space-y-3 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0 h-0 p-0 overflow-hidden'}`}>
                   {/* Column headers */}
                   <div className="flex items-center gap-2 px-1">
                      <div className="flex-1">
                        <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wide">Answer</span>
                      </div>
                      <div className="w-24 text-center">
                        <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wide">Score</span>
                      </div>
                      <div className="w-9" />
                   </div>

                   <div className="flex flex-col gap-1.5">
                      {q.options.map((opt, oIdx) => (
                        <div key={opt.id} className="flex gap-2 items-center">
                           <div className="flex-1">
                             <Input
                               value={opt.text}
                               onChange={e => updateOption(idx, oIdx, "text", e.target.value)}
                               placeholder={`Option ${oIdx + 1}`}
                               className="h-9 bg-muted/10 border-primary/10 text-sm px-3 rounded-lg focus-visible:ring-primary/15 placeholder:text-muted-foreground/25"
                             />
                           </div>
                           <div className="w-24">
                              <Input
                                type="number"
                                value={opt.score}
                                onChange={e => {
                                  const val = e.target.value;
                                  updateOption(idx, oIdx, "score", val === "" ? "" : parseFloat(val));
                                }}
                                placeholder="0"
                                className="h-9 text-sm text-center border-primary/10 bg-primary/5 rounded-lg focus-visible:ring-primary/15"
                              />
                           </div>
                           <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeOption(idx, oIdx); }} className="h-9 w-9 text-muted-foreground/25 hover:text-destructive hover:bg-destructive/5 rounded-lg shrink-0 transition-all">
                             <Trash2 className="w-3.5 h-3.5" />
                           </Button>
                        </div>
                      ))}
                   </div>

                   <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); addOption(idx); }} className="h-8 gap-1.5 text-primary/50 text-xs font-medium hover:bg-primary/5 hover:text-primary px-2 rounded-md transition-all border border-dashed border-primary/15 w-full mt-1">
                      <Plus className="w-3.5 h-3.5" /> Add Option
                   </Button>
                </CardContent>

                {isActive && (
                   <CardFooter className="px-5 py-2.5 bg-muted/[0.02] border-t border-primary/5 flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/30 hover:text-primary transition-colors rounded-md" onClick={(e) => { e.stopPropagation(); moveQuestion(idx, 'up'); }} disabled={idx === 0} title="Move up">
                         <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/30 hover:text-primary transition-colors rounded-md" onClick={(e) => { e.stopPropagation(); moveQuestion(idx, 'down'); }} disabled={idx === questions.length - 1} title="Move down">
                         <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                      <div className="flex-1" />
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} className="h-7 px-2.5 gap-1.5 text-xs font-medium text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-md">
                         <Trash2 className="w-3 h-3" /> Delete Question
                      </Button>
                   </CardFooter>
                )}
                </Card>
              );
            })
          )}
        </div>

        {/* Add Question Button */}
        {questions.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button onClick={addQuestion} className="h-10 w-10 rounded-full shadow-md bg-primary/90 hover:bg-primary transition-all text-black">
                <Plus className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Risk Score Categories */}
        {questions.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-primary/10">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-primary/50" />
                  Risk Score Categories
                </h3>
                <Button variant="outline" size="sm" onClick={addCategory} className="gap-1 border-primary/20 hover:bg-primary/5 text-xs font-medium h-7 px-3">
                  <Plus className="w-3 h-3" /> Add Tier
                </Button>
            </div>

            <Card className="bg-card/20 border-primary/10 rounded-lg p-5 space-y-4">
                <div className="h-3 w-full bg-muted/10 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-primary/5">
                  {categories.map((cat, idx) => {
                      const width = Math.max(5, ((cat.max_score - cat.min_score) / (totalPossibleScore || 100)) * 100);
                      return (
                        <div
                          key={idx}
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${width}%`, backgroundColor: cat.color + '25', border: `1px solid ${cat.color}50` }}
                        />
                      )
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {categories.map((cat, cIdx) => (
                    <Card key={cIdx} className="bg-card/30 border-primary/10 shadow-none rounded-lg overflow-hidden transition-all hover:bg-card/40">
                      <CardContent className="p-3 space-y-2.5 relative group">
                          <Button variant="ghost" size="icon" onClick={() => removeCategory(cIdx)} className="absolute top-1.5 right-1.5 h-5 w-5 text-destructive/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={cat.color}
                                onChange={e => updateCategory(cIdx, "color", e.target.value)}
                                className="w-4 h-4 rounded border-none bg-transparent cursor-pointer ring-1 ring-white/10 shrink-0"
                            />
                            <Input
                                value={cat.name}
                                onChange={e => updateCategory(cIdx, "name", e.target.value)}
                                className="text-sm font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 shadow-none text-foreground/70 w-full"
                                placeholder="Tier name..."
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Input
                                type="number"
                                value={cat.min_score}
                                onChange={e => updateCategory(cIdx, "min_score", parseFloat(e.target.value))}
                                className="h-7 text-xs border border-primary/10 bg-background/20 p-1 text-center rounded-md"
                            />
                            <span className="text-xs text-muted-foreground/40 shrink-0">–</span>
                            <Input
                                type="number"
                                value={cat.max_score}
                                onChange={e => updateCategory(cIdx, "max_score", parseFloat(e.target.value))}
                                className="h-7 text-xs border border-primary/10 bg-background/20 p-1 text-center rounded-md"
                            />
                          </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
            </Card>
          </div>
        )}

        {/* Footer Publish */}
        {questions.length > 0 && (
          <div className="pt-3">
            <Card className="bg-primary/5 border border-primary/15 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-b-primary">
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-base font-bold text-foreground/80">Ready to Publish</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">Save as draft or publish this questionnaire to make it available.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => handleSave("draft")} disabled={loading} className="gap-2 border-primary/20 hover:bg-primary/5 text-sm font-medium px-4 h-9 rounded-md transition-all">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Save Draft
                  </Button>
                  <Button onClick={() => handleSave("active")} disabled={loading} className="gap-2 shadow-sm shadow-primary/10 text-sm font-semibold px-5 h-9 bg-primary/80 hover:bg-primary transition-all rounded-md">
                      {loading ? <span className="animate-spin text-sm">⌛</span> : <Save className="w-4 h-4" />}
                      Publish
                  </Button>
                </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
