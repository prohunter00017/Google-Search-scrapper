import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AnalysisConfig } from "@shared/schema";

const configSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  country: z.string().default("US"),
  language: z.string().default("en"),
  entityExtraction: z.boolean().default(true),
  sentimentAnalysis: z.boolean().default(true),
  imageAnalysis: z.boolean().default(false),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface ConfigurationPanelProps {
  onStartAnalysis: (analysisId: number) => void;
}

export function ConfigurationPanel({ onStartAnalysis }: ConfigurationPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      keyword: "",
      country: "US",
      language: "en",
      entityExtraction: true,
      sentimentAnalysis: true,
      imageAnalysis: false,
    },
  });

  const onSubmit = async (data: ConfigFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest("POST", "/api/analysis", data);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Analysis Started",
          description: "Your competitor analysis has been started successfully.",
        });
        onStartAnalysis(result.analysisId);
      } else {
        throw new Error(result.error || "Failed to start analysis");
      }
    } catch (error) {
      console.error("Analysis start error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start analysis",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="border-b border-neutral-200">
        <CardTitle className="flex items-center text-lg font-semibold text-neutral-800">
          <Settings className="text-primary mr-2" size={20} />
          Analysis Configuration
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Keyword Input */}
              <div className="lg:col-span-1">
                <FormField
                  control={form.control}
                  name="keyword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Keyword</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., best node.js frameworks" 
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Settings */}
              <div className="lg:col-span-1">
                <Label className="text-sm font-medium text-neutral-700 mb-2 block">Search Location</Label>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="US">🇺🇸 United States</SelectItem>
                            <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                            <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                            <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                            <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                            <SelectItem value="pt">Português</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Analysis Options */}
              <div className="lg:col-span-1">
                <Label className="text-sm font-medium text-neutral-700 mb-2 block">Analysis Options</Label>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="entityExtraction"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-neutral-700">Entity extraction</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sentimentAnalysis"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-neutral-700">Sentiment analysis</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="imageAnalysis"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-neutral-700">Image analysis</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
              <div className="flex items-center text-sm text-neutral-600">
                <Info className="text-primary mr-2" size={16} />
                This analysis will use approximately 15 API calls
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2" size={16} />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
