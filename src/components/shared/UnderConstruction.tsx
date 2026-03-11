import React from 'react';
import Link from 'next/link';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnderConstructionProps {
  pageName?: string;
}

export function UnderConstruction({ pageName }: UnderConstructionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center px-4 w-full h-full">
      <div className="relative flex items-center justify-center w-28 h-28 mb-8 rounded-full bg-accent">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
        <Construction className="w-14 h-14 text-primary animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
      
      <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl capitalize">
        {pageName ? `${pageName} Under Construction` : 'Page Under Construction'}
      </h1>
      
      <p className="max-w-lg mb-8 text-lg text-muted-foreground">
        We're currently building out this section of the platform. Our team is working hard to bring you the best experience possible.
      </p>
      
      <div className="flex items-center gap-4">
        <Button asChild variant="default" className="gap-2 px-6">
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
