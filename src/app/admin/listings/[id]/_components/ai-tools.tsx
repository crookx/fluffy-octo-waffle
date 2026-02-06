'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Listing } from '@/lib/types';
import { getAiSummary, checkSuspiciousPatterns } from '@/app/actions';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  Sparkles,
  AlertTriangle,
  FileText,
  Loader2,
} from 'lucide-react';
import { TrustBadge } from '@/components/trust-badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function AiTools({ listing }: { listing: Listing }) {
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, string>>(
    listing.evidence.reduce((acc, doc) => {
      if (doc.summary) {
        acc[doc.id] = doc.summary;
      }
      return acc;
    }, {} as Record<string, string>)
  );
  const [suspicionResult, setSuspicionResult] = useState<{
    isSuspicious: boolean;
    reason?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleSummarize = async (docId: string, docContent: string) => {
    setIsSummarizing(docId);
    try {
      const result = await getAiSummary(docContent);
      setSummaries((prev) => ({ ...prev, [docId]: result.summary }));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Failed to generate summary.',
      });
    } finally {
      setIsSummarizing(null);
    }
  };

  const handleSuspicionCheck = async () => {
    setIsChecking(true);
    setSuspicionResult(null);
    try {
      const descriptions = listing.evidence.map((e) => e.content);
      if (descriptions.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No evidence to check.',
        });
        setIsChecking(false);
        return;
      }
      const result = await checkSuspiciousPatterns(descriptions);
      setSuspicionResult({
        isSuspicious: result.isSuspicious,
        reason: result.reason || 'No specific reason provided.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Failed to run suspicion check.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-accent" /> AI Assistant
        </CardTitle>
        <CardDescription>
          GenAI tools to accelerate your review process.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion
          type="multiple"
          defaultValue={['insights']}
          className="w-full"
        >
          {(listing.badgeSuggestion || listing.imageAnalysis?.isSuspicious) && (
            <AccordionItem value="insights">
              <AccordionTrigger className="font-semibold">
                Key Insights
              </AccordionTrigger>
              <AccordionContent className="pt-2 space-y-4">
                {listing.badgeSuggestion && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
                      <Sparkles className="h-5 w-5 text-accent" />
                      Trust Badge Suggestion
                    </h4>
                    <div className="rounded-md border bg-secondary/50 p-3">
                      <div className="flex items-center gap-2">
                        <TrustBadge
                          badge={listing.badgeSuggestion.badge}
                          showTooltip={false}
                        />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {listing.badgeSuggestion.reason}
                      </p>
                    </div>
                  </div>
                )}
                {listing.imageAnalysis?.isSuspicious && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      Image Analysis
                    </h4>
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                      <p className="font-bold text-destructive">
                        Result: Suspicious Image
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {listing.imageAnalysis.reason}
                      </p>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="documents">
            <AccordionTrigger className="font-semibold">
              Document Tools
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              {listing.evidence.length > 0 ? (
                <div className="space-y-3">
                  {listing.evidence.map((doc) => (
                    <div key={doc.id}>
                      <div className="mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <p
                          className="flex-1 truncate text-sm font-medium"
                          title={doc.name}
                        >
                          {doc.name}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSummarize(doc.id, doc.content)}
                          disabled={!!isSummarizing}
                        >
                          {isSummarizing === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Summarize'
                          )}
                        </Button>
                      </div>
                      {summaries[doc.id] && (
                        <div className="ml-6 rounded-md bg-secondary p-2 text-xs text-muted-foreground">
                          {summaries[doc.id]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No evidence to analyze.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fraud">
            <AccordionTrigger className="font-semibold">
              Fraud Detection
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <Button
                className="w-full"
                onClick={handleSuspicionCheck}
                disabled={isChecking || listing.evidence.length === 0}
              >
                {isChecking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Check for Suspicious Patterns'
                )}
              </Button>
              {suspicionResult && (
                <div
                  className={`mt-4 rounded-md border p-3 ${
                    suspicionResult.isSuspicious
                      ? 'border-destructive/50 bg-destructive/10'
                      : 'border-success/50 bg-success/10'
                  }`}
                >
                  <p
                    className={`font-bold ${
                      suspicionResult.isSuspicious
                        ? 'text-destructive'
                        : 'text-success'
                    }`}
                  >
                    {suspicionResult.isSuspicious
                      ? 'Result: Suspicious'
                      : 'Result: Not Suspicious'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {suspicionResult.reason}
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
