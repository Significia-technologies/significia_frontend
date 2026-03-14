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
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{client.client_name}</h1>
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono">
                {client.client_code}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-muted-foreground">
              <span className="flex items-center gap-1.5 text-sm">
                <Mail className="w-4 h-4" /> {currentClient.email}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Phone className="w-4 h-4" /> {currentClient.phone_number}
              </span>
              <Badge variant={currentClient.is_active === false ? "secondary" : "default"} className={`ml-2 ${currentClient.is_active === false ? "bg-muted" : "bg-green-500/10 text-green-600 border-green-500/20"}`}>
                {currentClient.is_active === false ? "Deactivated" : "Active"}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <Button 
                variant="outline" 
                className="gap-2 border-primary/20"
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
            <Button className="gap-2 shadow-lg shadow-primary/20">
                <ShieldCheck className="w-4 h-4" />
                KYC Status
            </Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full h-auto p-0 flex flex-wrap bg-muted/30 border-b border-primary/10 rounded-none">
                <TabsTrigger value="overview" className="flex-1 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <Info className="w-4 h-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="personal" className="flex-1 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <User className="w-4 h-4" /> Personal
                </TabsTrigger>
                <TabsTrigger value="financial" className="flex-1 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <CreditCard className="w-4 h-4" /> Financial
                </TabsTrigger>
                <TabsTrigger value="bank" className="flex-1 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <Building className="w-4 h-4" /> Banking
                </TabsTrigger>
                <TabsTrigger value="investment" className="flex-1 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <TrendingUp className="w-4 h-4" /> Investment
                </TabsTrigger>
            </TabsList>

            <div className="p-8 min-h-[400px]">
              <TabsContent value="overview" className="mt-0 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold opacity-70">Registration Date</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                <span className="text-xl font-bold">{currentClient.declaration_date || "Not set"}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold opacity-70">Tax Residency</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                <span className="text-xl font-bold">{currentClient.tax_residency}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold opacity-70">PAN Number</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Fingerprint className="w-5 h-5 text-primary" />
                                <span className="text-xl font-bold font-mono">{currentClient.pan_number}</span>
                            </div>
                        </CardContent>
                    </Card>
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
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-8 flex justify-end gap-4">
        <Button variant="outline" className="px-8 border-primary/20" onClick={() => router.push(`/master/clients/${currentClient.id}/edit`)}>
            Edit Profile
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant={currentClient.is_active === false ? "default" : "destructive"} 
              className="px-8" 
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
