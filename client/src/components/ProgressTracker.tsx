import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { AnalysisResults } from "@shared/schema";

interface ProgressTrackerProps {
  analysisId: number;
  onComplete: () => void;
}

export function ProgressTracker({ analysisId, onComplete }: ProgressTrackerProps) {
  const [progress, setProgress] = useState(0);

  const { data: analysis, isLoading } = useQuery<AnalysisResults>({
    queryKey: [`/api/analysis/${analysisId}`],
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: !!analysisId,
  });

  useEffect(() => {
    if (analysis) {
      if (analysis.status === 'completed') {
        setProgress(100);
        setTimeout(() => onComplete(), 500);
      } else if (analysis.status === 'processing') {
        // Calculate progress based on number of competitors analyzed
        const completedPages = analysis.competitors?.length || 0;
        const totalPages = 10; // We're analyzing top 10
        setProgress(Math.min((completedPages / totalPages) * 90, 90)); // Cap at 90% until fully complete
      } else if (analysis.status === 'failed') {
        // Handle failure case
        setProgress(0);
      } else if (analysis.status === 'pending') {
        setProgress(5);
      }
    }
  }, [analysis, onComplete]);

  if (isLoading && !analysis) {
    return null; // Don't show until we have data
  }

  if (!analysis || analysis.status === 'completed') {
    return null;
  }

  const getStatusText = () => {
    switch (analysis.status) {
      case 'pending':
        return 'Initializing analysis...';
      case 'processing':
        return `Analyzing competitor pages... (${analysis.competitors.length}/10)`;
      case 'failed':
        return 'Analysis failed';
      default:
        return 'Processing...';
    }
  };

  const totalEntities = analysis.competitors.reduce((sum, competitor) => {
    return sum + (Array.isArray(competitor.entities) ? competitor.entities.length : 0);
  }, 0);

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-semibold text-neutral-800 flex items-center">
            <Loader2 className="animate-spin text-primary mr-2" size={20} />
            Analysis in Progress
          </CardTitle>
          <span className="text-sm text-neutral-600">{getStatusText()}</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Overall Progress</span>
            <span className="font-medium text-neutral-800">
              {analysis.competitors.length} of 10 pages analyzed
            </span>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{analysis.competitors.length}</div>
              <div className="text-xs text-neutral-500">Pages Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{totalEntities}</div>
              <div className="text-xs text-neutral-500">Entities Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">~{15 + analysis.competitors.length * 2}</div>
              <div className="text-xs text-neutral-500">API Calls Used</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
