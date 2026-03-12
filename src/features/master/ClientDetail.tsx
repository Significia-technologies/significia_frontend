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
import { ClientCreate } from "@/core/services/master.service";
import { IAMasterService, Employee } from "@/core/services/ia-master.service";
import { useRouter } from "next/navigation";

interface ClientDetailProps {
  client: ClientCreate;
  connectorId: string;
}

export default function ClientDetail({ client, connectorId }: ClientDetailProps) {
  const router = useRouter();
  const [employees, setEmployees] = React.useState<Employee[]>([]);

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
                <Mail className="w-4 h-4" /> {client.email}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Phone className="w-4 h-4" /> {client.phone_number}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 border-primary/20">
                <FileText className="w-4 h-4" />
                Reports
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
                                <span className="text-xl font-bold">{client.declaration_date || "Not set"}</span>
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
                                <span className="text-xl font-bold">{client.tax_residency}</span>
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
                                <span className="text-xl font-bold font-mono">{client.pan_number}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <SectionHeader icon={ShieldCheck} title="Compliance Summary" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                            <DetailItem label="Advisor Name" value={client.advisor_name} />
                            <DetailItem label="Assigned Professional" value={
                              client.assigned_employee_id 
                                ? employees.find(e => e.id === client.assigned_employee_id)?.name_of_employee || "Loading..."
                                : "Unassigned"
                            } />
                            <DetailItem label="Risk Profile" value={<Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">{client.risk_profile}</Badge>} />
                            <DetailItem label="Declaration Signed" value={client.declaration_signed ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Yes</Badge> : <Badge variant="destructive">No</Badge>} />
                        </div>
                        <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                            <DetailItem label="Nominee Name" value={client.nominee_name} />
                            <DetailItem label="Nominee Relationship" value={client.nominee_relationship} />
                            <DetailItem label="Residential Status" value={client.residential_status} />
                        </div>
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="personal" className="mt-0 space-y-8">
                <div className="space-y-6">
                    <SectionHeader icon={User} title="Identity Details" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <DetailItem label="Full Name" value={client.client_name} />
                        <DetailItem label="Date of Birth" value={client.date_of_birth} />
                        <DetailItem label="Gender" value={client.gender} />
                        <DetailItem label="Marital Status" value={client.marital_status} />
                        <DetailItem label="Nationality" value={client.nationality} />
                        <DetailItem label="PEP Status" value={client.pep_status} />
                    </div>
                </div>

                <div className="space-y-6">
                    <SectionHeader icon={MapPin} title="Address & Contact" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="Phone Number" value={client.phone_number} />
                        <DetailItem label="Email Address" value={client.email} />
                        <div className="md:col-span-2">
                            <DetailItem label="Permanent Address" value={client.address} />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <SectionHeader icon={User} title="Family Information" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <DetailItem label="Father's Name" value={client.father_name} />
                        <DetailItem label="Mother's Name" value={client.mother_name} />
                        <DetailItem label="Spouse Name" value={client.spouse_name} />
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="mt-0 space-y-8">
                <div className="space-y-6">
                    <SectionHeader icon={CreditCard} title="Income & Net Worth" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="Annual Income (INR)" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(client.annual_income)} />
                        <DetailItem label="Net Worth (INR)" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(client.net_worth)} />
                        <DetailItem label="Source of Income" value={client.income_source} />
                        <DetailItem label="Occupation" value={client.occupation} />
                    </div>
                </div>

                <div className="space-y-6">
                    <SectionHeader icon={TrendingUp} title="Existing Portfolio" />
                    <div className="grid grid-cols-1 gap-6">
                        <DetailItem label="Portfolio Value" value={client.existing_portfolio_value ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(client.existing_portfolio_value) : "0.00"} />
                        <DetailItem label="Composition Details" value={client.existing_portfolio_composition} />
                        <DetailItem label="FATCA Compliance" value={client.fatca_compliance} />
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="bank" className="mt-0 space-y-8">
                <div className="space-y-6">
                    <SectionHeader icon={Building} title="Primary Bank Details" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="Bank Name" value={client.bank_name} />
                        <DetailItem label="Account Number" value={<span className="font-mono">{client.bank_account_number}</span>} />
                        <DetailItem label="IFSC Code" value={<span className="font-mono">{client.ifsc_code}</span>} />
                        <DetailItem label="Branch" value={client.bank_branch} />
                    </div>
                </div>

                <div className="space-y-6">
                    <SectionHeader icon={FileText} title="Trading & Demat" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="Demat Account Number" value={client.demat_account_number || "Not provided"} />
                        <DetailItem label="Trading Account Number" value={client.trading_account_number || "Not provided"} />
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="investment" className="mt-0 space-y-8">
                <div className="space-y-6">
                    <SectionHeader icon={TrendingUp} title="Risk & Objectives" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="Risk Profile" value={<Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-3">{client.risk_profile}</Badge>} />
                        <DetailItem label="Investment Horizon" value={client.investment_horizon} />
                        <DetailItem label="Investment Experience" value={client.investment_experience} />
                        <DetailItem label="Liquidity Needs" value={client.liquidity_needs} />
                    </div>
                </div>

                <div className="space-y-6">
                    <SectionHeader icon={Info} title="Investment Goals" />
                    <div className="bg-muted/50 p-6 rounded-xl border border-primary/10 italic text-muted-foreground">
                        "{client.investment_objectives}"
                    </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-8 flex justify-end gap-4">
        <Button variant="outline" className="px-8 border-primary/20" onClick={() => router.push(`/master/clients/${client.client_code}/edit`)}>
            Edit Profile
        </Button>
        <Button variant="destructive" className="px-8" onClick={() => {}}>
            Deactivate Client
        </Button>
      </div>
    </div>
  );
}
