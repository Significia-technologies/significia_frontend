"use client";

import React from "react";
import { 
  User, 
  ArrowLeft, 
  FileText, 
  CreditCard, 
  Building, 
  TrendingUp, 
  ShieldCheck,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Fingerprint,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientCreate, MasterDataService } from "@/core/services/master.service";
import { IAMasterService, Employee } from "@/core/services/ia-master.service";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnalysisList } from "@/features/financial-analysis/AnalysisList";
import { AnalysisForm } from "@/features/financial-analysis/AnalysisForm";
import { AnalysisDashboard } from "@/features/financial-analysis/AnalysisDashboard";
import { FinancialAnalysisResult, FinancialAnalysisService } from "@/core/services/financial-analysis.service";

interface ClientDetailProps {
  client: ClientCreate;
  connectorId: string;
}

export default function ClientDetail({ client, connectorId }: ClientDetailProps) {
  const router = useRouter();
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [downloading, setDownloading] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [currentClient, setCurrentClient] = React.useState<ClientCreate>(client);

  React.useEffect(() => {
    setCurrentClient(client);
  }, [client]);

  const handleToggleActive = async () => {
    if (!currentClient.id) return;
    
    const action = currentClient.is_active === false ? "activate" : "deactivate";

    setIsUpdating(true);
    try {
      const updatedClient = await MasterDataService.updateClient(connectorId, currentClient.id, {
        is_active: !currentClient.is_active
      });
      // The updateClient returns a Client, but we need to update our ClientCreate state
      setCurrentClient(prev => ({ ...prev, is_active: !prev.is_active }));
      toast.success(`Client ${action}d successfully`);
    } catch (error) {
      console.error(`Failed to ${action} client`, error);
      toast.error(`Failed to ${action} client`);
    } finally {
      setIsUpdating(false);
    }
  };

  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const iaMaster = await IAMasterService.getLatest(connectorId);
        if (iaMaster?.employees) {
          setEmployees(iaMaster.employees);
        }
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };
    fetchEmployees();
  }, [connectorId]);

  const DetailItem = ({ label, value }: { label: string; value: any }) => (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold">{value || "N/A"}</p>
    </div>
  );

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      await MasterDataService.downloadClientReport(connectorId, client.id!, client.client_name);
      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Failed to download report", error);
      toast.error("Failed to generate report");
    } finally {
      setDownloading(false);
    }
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-6 border-b border-primary/10 pb-2">
      <Icon className="w-5 h-5 text-primary" />
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-8 px-4 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-start sm:items-center gap-4 w-full">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shadow-sm shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate max-w-full">
                {client.client_name}
              </h1>
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-[10px] sm:text-xs">
                {client.client_code}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Mail className="w-3.5 h-3.5" /> {currentClient.email}
              </span>
              <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Phone className="w-3.5 h-3.5" /> {currentClient.phone_number}
              </span>
              <Badge variant={currentClient.is_active === false ? "secondary" : "default"} className={`text-[10px] sm:text-xs ${currentClient.is_active === false ? "bg-muted" : "bg-green-500/10 text-green-600 border-green-500/20"}`}>
                {currentClient.is_active === false ? "Deactivated" : "Active"}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
            <Button 
                variant="outline" 
                className="flex-1 lg:flex-none gap-2 border-primary/20 h-10"
                onClick={handleDownloadReport}
                disabled={downloading}
            >
                {downloading ? (
                    <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                    <FileText className="w-4 h-4" />
                )}
                {downloading ? "Generating..." : "Reports"}
            </Button>
            <Button className="flex-1 lg:flex-none gap-2 shadow-lg shadow-primary/20 h-10">
                <ShieldCheck className="w-4 h-4" />
                KYC Status
            </Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="w-full">
            <div className="w-full overflow-x-auto scrollbar-none bg-muted/30 border-b border-primary/10">
              <TabsList className="min-w-max h-auto p-0 flex bg-transparent rounded-none">
                  <TabsTrigger value="overview" className="px-6 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm transition-all">
                    <Info className="w-4 h-4" /> Overview
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="px-6 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm transition-all">
                    <User className="w-4 h-4" /> Personal
                  </TabsTrigger>
                  <TabsTrigger value="financial" className="px-6 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm transition-all">
                    <CreditCard className="w-4 h-4" /> Financial
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="px-6 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm transition-all">
                    <Building className="w-4 h-4" /> Banking
                  </TabsTrigger>
                  <TabsTrigger value="investment" className="px-6 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm transition-all">
                    <TrendingUp className="w-4 h-4" /> Investment
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="px-6 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm transition-all">
                    <TrendingUp className="w-4 h-4 text-orange-500" /> Financial Analysis
                  </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 sm:p-8 min-h-[400px]">
              <TabsContent value="overview" className="mt-0 space-y-8">
                {/* Top Info Highlights Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Registration</p>
                      <p className="text-base font-bold truncate">{currentClient.declaration_date || "Not set"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Tax Residency</p>
                      <p className="text-base font-bold truncate">{currentClient.tax_residency}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Fingerprint className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">PAN Number</p>
                      <p className="text-base font-bold font-mono tracking-tight">{currentClient.pan_number}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                    <SectionHeader icon={ShieldCheck} title="Compliance Summary" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                            <DetailItem label="Advisor Name" value={currentClient.advisor_name} />
                            <DetailItem label="Assigned Professional" value={
                              currentClient.assigned_employee_id 
                                ? employees.find(e => e.id === currentClient.assigned_employee_id)?.name_of_employee || "Loading..."
                                : "Unassigned"
                            } />
                            <DetailItem label="Risk Profile" value={<Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">{currentClient.risk_profile}</Badge>} />
                            <DetailItem label="Declaration Signed" value={currentClient.declaration_signed ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Yes</Badge> : <Badge variant="destructive">No</Badge>} />
                        </div>
                        <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                            <DetailItem label="Nominee Name" value={currentClient.nominee_name} />
                            <DetailItem label="Nominee Relationship" value={currentClient.nominee_relationship} />
                            <DetailItem label="Residential Status" value={currentClient.residential_status} />
                        </div>
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="personal" className="mt-0 space-y-8">
                <div className="space-y-6">
                    <SectionHeader icon={User} title="Identity Details" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <DetailItem label="Full Name" value={currentClient.client_name} />
                        <DetailItem label="Date of Birth" value={currentClient.date_of_birth} />
                        <DetailItem label="Gender" value={currentClient.gender} />
                        <DetailItem label="Marital Status" value={currentClient.marital_status} />
                        <DetailItem label="Nationality" value={currentClient.nationality} />
                        <DetailItem label="PEP Status" value={currentClient.pep_status} />
                        <DetailItem label="FATCA Compliance" value={currentClient.fatca_compliance} />
                        {currentClient.residential_status === "Resident Individual" ? (
                          <DetailItem label="Aadhar Number" value={currentClient.aadhar_number} />
                        ) : (
                          <DetailItem label="Passport Number" value={currentClient.passport_number} />
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <SectionHeader icon={MapPin} title="Address & Contact" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="Phone Number" value={currentClient.phone_number} />
                        <DetailItem label="Email Address" value={currentClient.email} />
                        <div className="md:col-span-2">
                            <DetailItem label="Permanent Address" value={currentClient.address} />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <SectionHeader icon={User} title="Family Information" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <DetailItem label="Father's Name" value={currentClient.father_name} />
                        <DetailItem label="Mother's Name" value={currentClient.mother_name} />
                        <DetailItem label="Spouse Name" value={currentClient.spouse_name} />
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="mt-0 space-y-8">
                <div className="space-y-6">
                    <SectionHeader icon={CreditCard} title="Income & Net Worth" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="Annual Income (INR)" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(currentClient.annual_income)} />
                        <DetailItem label="Net Worth (INR)" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(currentClient.net_worth)} />
                        <DetailItem label="Source of Income" value={currentClient.income_source} />
                        <DetailItem label="Occupation" value={currentClient.occupation} />
                    </div>
                </div>

                <div className="space-y-6">
                    <SectionHeader icon={TrendingUp} title="Existing Portfolio" />
                    <div className="grid grid-cols-1 gap-6">
                        <DetailItem label="Portfolio Value" value={currentClient.existing_portfolio_value ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(currentClient.existing_portfolio_value) : "0.00"} />
                        <DetailItem label="Composition Details" value={currentClient.existing_portfolio_composition} />
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="bank" className="mt-0 space-y-8">
                <div className="space-y-6">
                    <SectionHeader icon={Building} title="Primary Bank Details" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="Bank Name" value={currentClient.bank_name} />
                        <DetailItem label="Account Number" value={<span className="font-mono">{currentClient.bank_account_number}</span>} />
                        <DetailItem label="IFSC Code" value={<span className="font-mono">{currentClient.ifsc_code}</span>} />
                        <DetailItem label="Branch" value={currentClient.bank_branch} />
                    </div>
                </div>

                <div className="space-y-6">
                    <SectionHeader icon={FileText} title="Trading & Demat" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="Demat Account Number" value={currentClient.demat_account_number || "Not provided"} />
                        <DetailItem label="Trading Account Number" value={currentClient.trading_account_number || "Not provided"} />
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="investment" className="mt-0 space-y-8">
                <div className="space-y-6">
                    <SectionHeader icon={TrendingUp} title="Risk & Objectives" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="Risk Profile" value={<Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-3">{currentClient.risk_profile}</Badge>} />
                        <DetailItem label="Investment Horizon" value={currentClient.investment_horizon} />
                        <DetailItem label="Investment Experience" value={currentClient.investment_experience} />
                        <DetailItem label="Liquidity Needs" value={currentClient.liquidity_needs} />
                    </div>
                </div>

                <div className="space-y-6">
                    <SectionHeader icon={Info} title="Investment Goals" />
                    <div className="bg-muted/50 p-6 rounded-xl border border-primary/10 italic text-muted-foreground">
                        "{currentClient.investment_objectives}"
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="mt-0 space-y-8">
                 <AnalysisTabContent 
                    connectorId={connectorId} 
                    clientId={client.id!} 
                    clientName={client.client_name} 
                 />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
        <Button variant="outline" className="w-full sm:w-auto px-8 border-primary/20 h-11" onClick={() => router.push(`/master/clients/${currentClient.id}/edit`)}>
            Edit Profile
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant={currentClient.is_active === false ? "default" : "destructive"} 
              className="w-full sm:w-auto px-8 h-11" 
              disabled={isUpdating}
            >
                {isUpdating ? "Updating..." : currentClient.is_active === false ? "Activate Client" : "Deactivate Client"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will {currentClient.is_active === false ? "reactivate" : "deactivate"} the client <strong>{currentClient.client_name}</strong>. 
                {currentClient.is_active !== false && " Deactivated clients may have restricted access to certain features."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleToggleActive}
                className={currentClient.is_active === false ? "bg-primary" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function AnalysisTabContent({ connectorId, clientId, clientName }: { connectorId: string, clientId: string, clientName: string }) {
  const [view, setView] = React.useState<"LIST" | "FORM" | "DASHBOARD">("LIST");
  const [selectedResult, setSelectedResult] = React.useState<FinancialAnalysisResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSelect = async (id: string) => {
    setLoading(true);
    try {
      const result = await FinancialAnalysisService.get(connectorId, id);
      setSelectedResult(result);
      setView("DASHBOARD");
    } catch (e) {
      toast.error("Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center animate-pulse text-muted-foreground">Loading Analysis data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         {view !== "LIST" && (
           <Button variant="ghost" size="sm" onClick={() => setView("LIST")} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to List
           </Button>
         )}
      </div>

      {view === "LIST" && (
        <AnalysisList 
          connectorId={connectorId} 
          clientId={clientId} 
          onSelectAnalysis={handleSelect}
          onCreateNew={() => setView("FORM")}
        />
      )}

      {view === "FORM" && (
        <AnalysisForm 
          connectorId={connectorId} 
          clientId={clientId}
          onSuccess={(id) => handleSelect(id)}
          onCancel={() => setView("LIST")}
        />
      )}

      {view === "DASHBOARD" && selectedResult && (
        <AnalysisDashboard 
          connectorId={connectorId} 
          result={selectedResult} 
          clientName={clientName} 
        />
      )}
    </div>
  );
}
