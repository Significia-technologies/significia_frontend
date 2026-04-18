"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, Mail, MessageSquare, Users } from "lucide-react";

const CONTACT_OPTIONS = [
  {
    icon: MessageSquare,
    title: "Book a Demo",
    description: "See the platform live with a 30-min walkthrough tailored to your firm.",
  },
  {
    icon: Users,
    title: "Talk to Sales",
    description: "Discuss pricing, onboarding, and what's right for your firm size.",
  },
  {
    icon: Mail,
    title: "General Enquiry",
    description: "Any questions about the platform, SEBI compliance, or the Bridge model.",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    firm: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Placeholder — connect to your backend or email service
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="py-20 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary mb-4">
            Contact Us
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Let's talk
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Whether you want a demo, have questions about SEBI compliance, or want to understand
            the Bridge model — we're here.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Left: Info */}
          <div className="lg:col-span-2 space-y-5">
            {CONTACT_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.title} className="flex gap-4 p-4 rounded-xl border border-border/50 bg-card/30">
                  <div className="shrink-0 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{option.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {option.description}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="p-4 rounded-xl border border-border/50 bg-card/30">
              <p className="text-xs text-muted-foreground leading-relaxed">
                We typically respond within 1 business day. For urgent matters, reach us at{" "}
                <span className="text-primary">hello@significia.com</span>
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            <Card className="glass">
              <CardContent className="p-6 sm:p-8">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Message sent!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        We'll be in touch within 1 business day.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Bunty Sharma"
                          value={form.name}
                          onChange={handleChange}
                          required
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firm">Firm Name</Label>
                        <Input
                          id="firm"
                          name="firm"
                          placeholder="Sharma Financial Advisory"
                          value={form.firm}
                          onChange={handleChange}
                          required
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="bunty@sharmafa.com"
                          value={form.email}
                          onChange={handleChange}
                          required
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={form.phone}
                          onChange={handleChange}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">How can we help?</Label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        placeholder="Tell us about your firm, how many clients you serve, and what you're looking for..."
                        value={form.message}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
