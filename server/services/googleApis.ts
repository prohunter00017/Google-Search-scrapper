import { EntityData, SentimentData } from "@shared/schema";

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  error?: {
    code: number;
    message: string;
  };
}

interface GoogleEntityResponse {
  entities?: Array<{
    name: string;
    type: string;
    salience: number;
    mentions?: Array<{
      text: { content: string };
      type: string;
    }>;
  }>;
  error?: {
    code: number;
    message: string;
  };
}

interface GoogleSentimentResponse {
  documentSentiment?: {
    score: number;
    magnitude: number;
  };
  error?: {
    code: number;
    message: string;
  };
}

export class GoogleApisService {
  async searchGoogle(query: string, apiKey: string, cseId: string, country: string = "US", language: string = "en"): Promise<GoogleSearchResult[]> {
    if (!apiKey) {
      throw new Error("Google API Key is required");
    }
    
    if (!cseId) {
      throw new Error("Google Custom Search Engine ID is required");
    }

    const params = new URLSearchParams({
      key: apiKey,
      cx: cseId,
      q: query,
      cr: `country${country}`,
      hl: language,
      num: "10",
      safe: "off",
      fields: "items(title,link,snippet,displayLink)"
    });

    const url = `https://www.googleapis.com/customsearch/v1?${params}`;
    
    try {
      const response = await fetch(url);
      const data: GoogleSearchResponse = await response.json();
      
      if (data.error) {
        throw new Error(`Google Search API Error: ${data.error.message}`);
      }
      
      return data.items || [];
    } catch (error) {
      console.error("Google Search API Error:", error);
      throw new Error(`Failed to fetch search results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeEntities(text: string, apiKey: string): Promise<EntityData[]> {
    if (!apiKey) {
      throw new Error("Google API Key is required");
    }

    const url = `https://language.googleapis.com/v1/documents:analyzeEntities?key=${apiKey}`;
    
    const requestBody = {
      document: {
        type: "PLAIN_TEXT",
        content: text.substring(0, 1000000) // API limit
      },
      encodingType: "UTF8"
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      const data: GoogleEntityResponse = await response.json();
      
      if (data.error) {
        throw new Error(`Google Natural Language API Error: ${data.error.message}`);
      }

      return (data.entities || []).map(entity => ({
        name: entity.name,
        type: entity.type,
        salience: entity.salience,
        mentions: entity.mentions?.length || 0
      }));
    } catch (error) {
      console.error("Google Natural Language API Error:", error);
      throw new Error(`Failed to analyze entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeSentiment(text: string, apiKey: string): Promise<SentimentData> {
    if (!apiKey) {
      throw new Error("Google API Key is required");
    }

    const url = `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${apiKey}`;
    
    const requestBody = {
      document: {
        type: "PLAIN_TEXT",
        content: text.substring(0, 1000000) // API limit
      },
      encodingType: "UTF8"
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      const data: GoogleSentimentResponse = await response.json();
      
      if (data.error) {
        throw new Error(`Google Natural Language API Error: ${data.error.message}`);
      }

      const sentiment = data.documentSentiment;
      if (!sentiment) {
        throw new Error("No sentiment data returned from API");
      }

      let label: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (sentiment.score > 0.1) label = 'positive';
      else if (sentiment.score < -0.1) label = 'negative';

      return {
        score: sentiment.score,
        magnitude: sentiment.magnitude,
        label
      };
    } catch (error) {
      console.error("Google Sentiment Analysis API Error:", error);
      throw new Error(`Failed to analyze sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const googleApisService = new GoogleApisService();