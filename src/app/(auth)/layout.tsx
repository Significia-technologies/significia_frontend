import React from "react";

export const metadata = {
  title: "Join Significia — Secure Platform",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* Left Pane: Premium Branding */}
      <div className="relative h-screen hidden w-1/2 flex-col bg-slate-950 p-10 text-white lg:flex border-r border-white/5">
        {/* Animated Mesh Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(191,149,63,0.15),transparent_50%)]" />
          <div className="absolute top-0 left-0 h-[500px] w-[500px] bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[500px] w-[500px] bg-amber-500/5 blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in zoom-in duration-700">
           {/* Logo Container - No Border */}
           <div className="relative">
             <div className="absolute -inset-12 rounded-full bg-primary/10 blur-3xl animate-pulse" />
             <div className="relative flex h-48 w-48 items-center justify-center p-0">
                <img 
                  src="/logo.png" 
                  alt="Significia Logo" 
                  className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(191,149,63,0.3)]" 
                />
             </div>
           </div>

           <div className="text-center space-y-4">
              <h1 className="text-6xl font-black tracking-tighter">
                <span className="bg-gradient-to-b from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-transparent drop-shadow-2xl">
                  Significia
                </span>
              </h1>
              <p className="text-slate-400 text-lg font-medium tracking-wide max-w-sm mx-auto">
                WHERE IA COMES BEFORE AI
              </p>
           </div>
           
           <div className="absolute bottom-12 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              {/* <div className="h-px w-12 bg-slate-800" /> */}
              Empowering Business Growth
           </div>
        </div>
      </div>

      {/* Right Pane: Auth Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 lg:w-1/2 lg:px-12 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
