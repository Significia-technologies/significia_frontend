"use client";

import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  CreditCard, 
  Building, 
  TrendingUp, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Briefcase,
  Users
} from "lucide-react";

interface RegistrationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: any;
  loading?: boolean;
}

export function RegistrationPreviewModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  formData,
  loading 
}: RegistrationPreviewModalProps) {
  
  const PreviewItem = ({ label, value, highlight = false }: { label: string, value: any, highlight?: boolean }) => (
    <div className="py-2 border-b border-primary/5 last:border-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className={`text-sm ${highlight ? "text-primary font-bold" : "text-foreground"}`}>
        {value?.toString() || <span className="text-muted-foreground italic text-xs">Not provided</span>}
      </p>
    </div>
  );

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0 text-primary">
      <Icon className="w-4 h-4" />
      <h3 className="text-sm font-bold uppercase tracking-widest">{title}</h3>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[800px] max-h-[90vh] p-0 overflow-hidden border-primary/20 bg-card/95 backdrop-blur-md flex flex-col">
        <DialogHeader className="p-4 sm:p-6 sm:pb-2 border-b border-primary/10 bg-primary/5 shrink-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-bold truncate">Review Registration Details</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm line-clamp-1 sm:line-clamp-none">
                Confirm all information is accurate before final submission.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 overflow-y-auto scrollbar-none flex-1">
          <div className="space-y-6">
            {/* Identity Highlighting */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <LabelWrapper label="Residential Status">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {formData.residential_status}
                </Badge>
              </LabelWrapper>
              <div>
                {formData.residential_status === "Resident Individual" ? (
                  <PreviewItem label="Aadhar Number" value={formData.aadhar_number} highlight />
                ) : (
                  <PreviewItem label="Passport Number" value={formData.passport_number} highlight />
                )}
              </div>
              <PreviewItem label="PAN Number" value={formData.pan_number?.toUpperCase()} highlight />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              {/* Column 1 */}
              <div className="space-y-6">
                <div>
                  <SectionHeader icon={User} title="Personal Information" />
                  <PreviewItem label="Full Name" value={formData.client_name} />
                  <PreviewItem label="Date of Birth" value={formData.date_of_birth} />
                  <PreviewItem label="Gender" value={formData.gender} />
                  <PreviewItem label="Marital Status" value={formData.marital_status} />
                  <PreviewItem label="Occupation" value={formData.occupation} />
                  <PreviewItem label="Nationality" value={formData.nationality} />
                </div>

                <div>
                  <SectionHeader icon={Briefcase} title="Family Details" />
                  <PreviewItem label="Father's Name" value={formData.father_name} />
                  <PreviewItem label="Mother's Name" value={formData.mother_name} />
                  <PreviewItem label="Spouse Name" value={formData.spouse_name} />
                </div>

                <div>
                  <SectionHeader icon={CheckCircle2} title="Compliance & Tax" />
                  <PreviewItem label="Tax Residency" value={formData.tax_residency} />
                  <PreviewItem label="PEP Status" value={formData.pep_status} />
                  <PreviewItem label="FATCA Compliance" value={formData.fatca_compliance} />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-6">
                <div>
                  <SectionHeader icon={MapPin} title="Contact & Address" />
                  <PreviewItem label="Email (Login)" value={formData.email} />
                  <PreviewItem label="Phone Number" value={formData.phone_number} />
                  <PreviewItem label="Permanent Address" value={formData.address} />
                </div>

                <div>
                  <SectionHeader icon={Building} title="Banking & Demat" />
                  <PreviewItem label="Bank Name" value={formData.bank_name} />
                  <PreviewItem label="Account Number" value={formData.bank_account_number} />
                  <PreviewItem label="IFSC Code" value={formData.ifsc_code} />
                  <PreviewItem label="Demat Account No" value={formData.demat_account_number} />
                  <PreviewItem label="Trading Account No" value={formData.trading_account_number} />
                </div>

                <div>
                  <SectionHeader icon={CreditCard} title="Financial Profile" />
                  <PreviewItem label="Annual Income" value={formData.annual_income} />
                  <PreviewItem label="Net Worth" value={formData.net_worth} />
                  <PreviewItem label="Income Source" value={formData.income_source} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                <div>
                  <SectionHeader icon={TrendingUp} title="Investment Strategy" />
                  <PreviewItem label="Risk Profile" value={formData.risk_profile} />
                  <PreviewItem label="Experience" value={formData.investment_experience} />
                  <PreviewItem label="Objective" value={formData.investment_objectives} />
                  <PreviewItem label="Horizon" value={formData.investment_horizon} />
                  <PreviewItem label="Liquidity Needs" value={formData.liquidity_needs} />
                </div>
                <div>
                  <SectionHeader icon={Users} title="Nominee Details" />
                  {formData.nominees && formData.nominees.length > 0 ? (
                    formData.nominees.map((nom: any, idx: number) => (
                      <div key={idx} className="mb-4 border-b border-primary/5 pb-2 last:border-0 last:pb-0">
                        <p className="text-xs font-bold text-primary mb-1">Nominee #{idx + 1} ({nom.percentage}%)</p>
                        <div className="grid grid-cols-2 gap-4">
                          <PreviewItem label="Nominee Name" value={nom.name} />
                          <PreviewItem label="Relationship" value={nom.relationship} />
                          <div className="col-span-2">
                            <PreviewItem label="Nominee DOB" value={nom.dob} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <PreviewItem label="Nominee Name" value={formData.nominee_name} />
                      <PreviewItem label="Relationship" value={formData.nominee_relationship} />
                    </>
                  )}
                  <div className="mt-8 p-3 rounded bg-primary/5 border border-primary/10">
                    <p className="text-[10px] uppercase font-bold text-primary mb-1">Registration Date</p>
                    <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-6 border-t border-primary/10 bg-primary/5 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
          <div className="hidden sm:flex items-center gap-2 text-muted-foreground mr-auto">
            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="text-xs uppercase font-bold tracking-tighter">Review all fields before confirming</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto px-6 border-primary/20 hover:bg-primary/5 h-11 sm:h-auto">
              Go Back & Edit
            </Button>
            <Button onClick={onConfirm} disabled={loading} className="w-full sm:w-auto px-8 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 h-11 sm:h-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 font-bold uppercase tracking-tight">
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Create
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabelWrapper({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</p>
            {children}
        </div>
    );
}
