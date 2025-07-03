import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ConfigurationPanel } from "@/components/ConfigurationPanel";
import { ProgressTracker } from "@/components/ProgressTracker";
import { ResultsDashboard } from "@/components/ResultsDashboard";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, FileText, Search } from "lucide-react";
import { AnalysisResults } from "@shared/schema";

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<'analysis' | 'history' | 'keyword' | 'content'>('analysis');
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: allAnalyses } = useQuery<AnalysisResults[]>({
    queryKey: ['/api/analyses'],
    enabled: currentView === 'history',
  });

  const handleStartAnalysis = (analysisId: number) => {
    setCurrentAnalysisId(analysisId);
    setIsAnalyzing(true);
    setCurrentView('analysis');
  };

  const handleAnalysisComplete = () => {
    console.log('Analysis completed, showing results for ID:', currentAnalysisId);
    setIsAnalyzing(false);
  };

  const handleViewAnalysis = (analysisId: number) => {
    setCurrentAnalysisId(analysisId);
    setIsAnalyzing(false);
    setCurrentView('analysis');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'history':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="mr-2" />
                Analysis History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allAnalyses && allAnalyses.length > 0 ? (
                <div className="space-y-4">
                  {allAnalyses.map((analysis) => (
                    <div 
                      key={analysis.id} 
                      className="p-4 border rounded-lg hover:bg-neutral-50 cursor-pointer"
                      onClick={() => handleViewAnalysis(analysis.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-neutral-800">{analysis.keyword}</h3>
                          <p className="text-sm text-neutral-600">
                            {analysis.country} • {analysis.language} • {analysis.competitors.length} competitors
                          </p>
                          <p className="text-xs text-neutral-500">{new Date(analysis.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                          analysis.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          analysis.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {analysis.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600">No analyses found. Start your first analysis above!</p>
              )}
            </CardContent>
          </Card>
        );
      
      case 'keyword':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2" />
                Keyword Research
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">Keyword research tools coming soon...</p>
            </CardContent>
          </Card>
        );
      
      case 'content':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2" />
                Content Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">Content analysis tools coming soon...</p>
            </CardContent>
          </Card>
        );
      
      default:
        return (
          <div>
            <ConfigurationPanel onStartAnalysis={handleStartAnalysis} />
            
            {isAnalyzing && currentAnalysisId && (
              <ProgressTracker 
                analysisId={currentAnalysisId} 
                onComplete={handleAnalysisComplete}
              />
            )}
            
            {currentAnalysisId && !isAnalyzing && (
              <ResultsDashboard analysisId={currentAnalysisId} />
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
