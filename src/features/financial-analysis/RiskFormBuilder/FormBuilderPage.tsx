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

interface Option {
  id: string;
  text: string;
  score: number;
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

  const totalPossibleScore = questions.reduce((sum, q) => {
    const maxOptionScore = q.options.length > 0 ? Math.max(...q.options.map(o => o.score)) : 0;
    return sum + maxOptionScore;
  }, 0);

  const addQuestion = () => {
    const newId = `q_${Date.now()}`;
    const newQuestions = [...questions, { id: newId, text: "", options: [{ id: `opt_${Date.now()}`, text: "", score: 0 }] }];
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
    newQuestions[qIndex].options.push({ id: newId, text: "Enter option text", score: 0 });
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
    if (!portfolioName) {
      toast.error("Please provide a name for this questionnaire.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        portfolio_name: portfolioName,
        questions,
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

      toast.success(status === "active" ? "Architectural definition published successfully!" : "Progress saved to draft vault.");
      if (onClose) onClose();
    } catch (error) {
      toast.error(status === "active" ? "Failed to publish configuration." : "Failed to save draft.");
    } finally {
      setLoading(false);
    }
  };

  const activeQuestion = questions[activeQuestionIndex];

  return (
    <div className="flex flex-col min-h-screen bg-background/30 animate-in fade-in duration-700">
      <div className="max-w-3xl mx-auto w-full space-y-4 py-12 px-4 md:px-0">
        
        {/* Form Identity Card */}
        <Card className="border-t-[6px] border-t-primary border-primary/5 bg-card/40 backdrop-blur-xl shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-10 space-y-8">
            <div className="flex items-center gap-8">
               <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5 shrink-0">
                  <Layout className="w-8 h-8 text-primary" />
               </div>
               <div className="flex-1">
                  <Input 
                    value={portfolioName} 
                    onChange={e => setPortfolioName(e.target.value)} 
                    placeholder="UNTITLED PROTOCOL"
                    className="bg-transparent border-none text-4xl font-black focus-visible:ring-0 shadow-none px-0 h-auto py-0 placeholder:opacity-10 uppercase tracking-tighter text-foreground decoration-primary/30 underline-offset-8"
                  />
                  <div className="flex items-center gap-3 mt-3">
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-40">System Core v2.0.4</span>
                     <div className="h-1 w-1 rounded-full bg-primary/30" />
                     {initialData?.status && (
                        <>
                           <Badge variant="outline" className={`text-[8px] font-bold px-2 py-0.5 uppercase h-4.5 tracking-widest ${initialData.status === 'active' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' : 'border-amber-500/20 bg-amber-500/5 text-amber-500'}`}>
                              {initialData.status}
                           </Badge>
                           <div className="h-1 w-1 rounded-full bg-primary/30" />
                        </>
                     )}
                     <Badge variant="outline" className="text-[8px] border-primary/20 bg-primary/5 text-primary/80 font-bold px-2 py-0.5 uppercase h-4.5 tracking-widest">Verified Schema</Badge>
                  </div>
               </div>
            </div>
            
            <Separator className="bg-primary/10" />
            
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/[0.03] border border-primary/10">
               <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <AlertCircle className="w-4 h-4 text-primary" />
               </div>
               <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Security Layer Active</p>
                  <p className="text-[10px] font-medium text-muted-foreground/60 leading-tight">
                     Protocol definitions are verified against the encryption engine before synchronization.
                  </p>
               </div>
            </div>
            <div className="space-y-2 mt-4 pt-4 border-t border-primary/5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest pl-1">Protocol Disclaimer</Label>
                <div className="relative group">
                   <Textarea 
                      placeholder="Enter legal disclaimer for this protocol..."
                      value={disclaimer}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDisclaimer(e.target.value)}
                      className="bg-black/40 border-primary/10 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 text-white min-h-[100px] resize-none transition-all"
                   />
                </div>
                <p className="text-[9px] text-muted-foreground/40 italic pl-1">This text will appear at the end of assessments and on the cover of generated PDFs.</p>
            </div>
          </CardContent>
        </Card>

        {/* Question Cards */}
        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-primary/10 rounded-xl flex flex-col items-center justify-center gap-4 bg-primary/[0.01] animate-in fade-in zoom-in-95 duration-500">
               <div className="p-3 rounded-full bg-primary/5 text-primary/40">
                  <Plus className="w-6 h-6" />
               </div>
               <div className="flex flex-col gap-1 pr-6 border-r border-primary/10">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose} 
                    className="h-8 w-8 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all mb-1"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <p className="text-[7px] font-black uppercase text-center opacity-20 tracking-tighter">Exit</p>
               </div>
               <div className="flex-1">
                  <h1 className="text-2xl font-black tracking-tighter text-foreground/80 uppercase">
                     {initialData ? "Modify Strategy" : "Define Protocol"}
                  </h1>
                  <p className="text-[9px] font-bold uppercase text-muted-foreground/20 mt-1">Add your first strategic inquiry to begin the protocol.</p>
               </div>
               <Button onClick={addQuestion} variant="outline" size="sm" className="h-8 px-4 border-primary/20 hover:bg-primary/5 text-[8px] font-bold uppercase tracking-widest">
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
                      ? 'border-l-primary bg-card/40 ring-1 ring-primary/5' 
                      : 'border-l-transparent bg-card/10 hover:bg-card/20 opacity-90 border-white/5'
                  }`}
                >
                  <CardHeader className={`transition-all duration-300 ${isActive ? 'p-12 pb-6 bg-primary/[0.01]' : 'p-8 pb-4'}`}>
                   <div className="flex items-center gap-6">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[11px] transition-all ${isActive ? 'bg-primary text-black' : 'bg-muted/30 text-muted-foreground/40'}`}>
                         {idx + 1}
                      </div>
                      <div className="flex-1">
                         {isActive ? (
                            <Input 
                              value={q.text} 
                              onChange={e => updateQuestionText(idx, e.target.value)} 
                              placeholder="Strategic inquiry text..."
                              className="bg-transparent border-none text-3xl font-black focus-visible:ring-0 shadow-none px-0 h-auto py-0 placeholder:text-muted-foreground/30 uppercase tracking-tighter"
                              autoFocus
                            />
                         ) : (
                            <h3 className="text-xl font-bold text-foreground/70 uppercase tracking-tight truncate max-w-lg">{q.text || "UNCATEGORIZED"}</h3>
                         )}
                      </div>
                   </div>
                </CardHeader>

                <CardContent className={`px-12 pt-4 pb-12 space-y-6 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0 h-0 p-0 overflow-hidden'}`}>
                   <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">Response Protocol</h5>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); addOption(idx); }} className="h-6 gap-2 text-primary/50 text-[9px] font-bold uppercase hover:bg-primary/5 px-2.5 rounded-md transition-all">
                         <Plus className="w-3.5 h-3.5" /> Add Option
                      </Button>
                   </div>

                   <div className="flex flex-col gap-2.5">
                      {q.options.map((opt, oIdx) => (
                        <div key={opt.id} className="flex gap-2.5 items-center">
                           <div className="flex-1">
                             <Input 
                               value={opt.text} 
                               onChange={e => updateOption(idx, oIdx, "text", e.target.value)} 
                               placeholder="Option context..."
                               className="h-9 bg-primary/[0.01] border-primary/5 font-bold text-[10px] px-3.5 rounded-lg focus-visible:ring-primary/5 placeholder:text-muted-foreground/30"
                             />
                           </div>
                           <div className="w-20 relative">
                             <Input 
                               type="number" 
                               value={opt.score} 
                               onChange={e => updateOption(idx, oIdx, "score", parseFloat(e.target.value))} 
                               className="h-9 font-black text-[11px] text-center border-primary/5 bg-primary/5 rounded-lg focus-visible:ring-primary/10"
                             />
                             <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[6px] font-bold opacity-20 text-primary uppercase">pts</span>
                           </div>
                           <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeOption(idx, oIdx); }} className="h-9 w-9 text-destructive/20 hover:text-destructive hover:bg-destructive/5 rounded-lg shrink-0 transition-all">
                             <Trash2 className="w-3.5 h-3.5" />
                           </Button>
                        </div>
                      ))}
                   </div>
                </CardContent>

                {isActive && (
                   <CardFooter className="px-12 py-3 bg-primary/[0.01] border-t border-primary/5 flex justify-end items-center gap-2">
                      <div className="flex items-center gap-1.5 mr-auto">
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); moveQuestion(idx, 'up'); }} disabled={idx === 0}>
                            <ChevronUp className="w-4 h-4" />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); moveQuestion(idx, 'down'); }} disabled={idx === questions.length - 1}>
                            <ChevronDown className="w-4 h-4" />
                         </Button>
                      </div>
                      <Separator orientation="vertical" className="h-6 bg-primary/10 mx-2" />
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} className="h-8 px-3 gap-1.5 font-bold uppercase text-[7px] tracking-widest text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-md">
                         <Trash2 className="w-3 h-3" /> Delete Section
                      </Button>
                   </CardFooter>
                )}
                </Card>
              );
            })
          )}
        </div>

        {/* Action Button */}
        {questions.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button onClick={addQuestion} className="h-10 w-10 rounded-full shadow-lg bg-primary/90 hover:bg-primary transition-all text-black">
                <Plus className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Tier Section */}
        {questions.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-primary/5">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black tracking-widest text-foreground/40 uppercase flex items-center gap-2">
                  <PieChart className="w-3.5 h-3.5 opacity-20" />
                  Risk Protocol Spectrum
                </h3>
                <Button variant="ghost" size="sm" onClick={addCategory} className="gap-1 border-primary/10 hover:bg-primary/5 text-[7px] font-bold uppercase rounded-md px-2 h-6">
                  <Plus className="w-2.5 h-2.5" /> Tier
                </Button>
            </div>

            <Card className="bg-card/10 border-primary/5 rounded-lg p-6 space-y-4">
                <div className="h-4 w-full bg-muted/10 rounded-md overflow-hidden flex p-0.5 gap-0.5 border border-primary/5">
                  {categories.map((cat, idx) => {
                      const width = Math.max(5, ((cat.max_score - cat.min_score) / (totalPossibleScore || 100)) * 100);
                      return (
                        <div 
                          key={idx}
                          className="h-full rounded-sm transition-all duration-500"
                          style={{ width: `${width}%`, backgroundColor: cat.color + '20', border: `0.5px solid ${cat.color}40` }}
                        />
                      )
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {categories.map((cat, cIdx) => (
                    <Card key={cIdx} className="bg-card/20 border-primary/5 shadow-none rounded-md overflow-hidden transition-all hover:bg-card/30">
                      <CardContent className="p-3 space-y-3 relative group">
                          <Button variant="ghost" size="icon" onClick={() => removeCategory(cIdx)} className="absolute top-1 right-1 h-4 w-4 text-destructive/20 hover:text-destructive opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                          <div className="flex gap-2 items-center">
                            <input 
                                type="color" 
                                value={cat.color} 
                                onChange={e => updateCategory(cIdx, "color", e.target.value)}
                                className="w-3 h-3 rounded-sm border-none bg-transparent cursor-pointer ring-1 ring-white/5" 
                            />
                            <Input 
                                value={cat.name} 
                                onChange={e => updateCategory(cIdx, "name", e.target.value)} 
                                className="font-bold uppercase tracking-tight text-[8px] border-none bg-transparent p-0 h-auto focus-visible:ring-0 shadow-none text-foreground/60 w-full"
                                placeholder="Tier..."
                            />
                          </div>
                          <div className="flex gap-1 p-0.5 bg-background/20 rounded-sm border border-primary/5">
                            <Input 
                                type="number" 
                                value={cat.min_score} 
                                onChange={e => updateCategory(cIdx, "min_score", parseFloat(e.target.value))} 
                                className="h-3 font-bold text-[8px] border-none bg-transparent p-0 text-center"
                            />
                            <Separator orientation="vertical" className="h-2 bg-primary/10" />
                            <Input 
                                type="number" 
                                value={cat.max_score} 
                                onChange={e => updateCategory(cIdx, "max_score", parseFloat(e.target.value))} 
                                className="h-3 font-bold text-[8px] border-none bg-transparent p-0 text-center"
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
            <Card className="bg-primary/5 border border-primary/10 rounded-lg p-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-b-primary relative overflow-hidden">
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-sm font-black uppercase text-foreground/70 tracking-tight leading-none">Definition Ready</h4>
                  <p className="text-muted-foreground text-[6px] font-bold uppercase tracking-widest mt-1 opacity-20">Sync strategic protocol to global vault</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => handleSave("draft")} disabled={loading} className="gap-2 border-primary/10 hover:bg-primary/5 font-bold uppercase text-[7px] tracking-widest px-4 h-9 rounded-md transition-all">
                      <Clock className="w-3 h-3 text-amber-500" />
                      Save Draft
                  </Button>
                  <Button onClick={() => handleSave("active")} disabled={loading} className="gap-2 shadow-sm shadow-primary/10 font-bold uppercase text-[7px] tracking-widest px-5 h-9 bg-primary/80 hover:bg-primary transition-all rounded-md">
                      {loading ? <span className="animate-spin text-[10px]">⌛</span> : <Save className="w-3 h-3" />}
                      Publish Protocol
                  </Button>
                </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
