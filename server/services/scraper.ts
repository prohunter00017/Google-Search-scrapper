import * as cheerio from 'cheerio';

export interface ScrapedData {
  title: string;
  metaDescription: string;
  content: string;
  fullContent: string;
  wordCount: number;
  headings: Array<{ level: number; text: string }>;
  images: Array<{ src: string; alt: string }>;
  links: {
    internal: number;
    external: number;
  };
  structuredData: any[];
  styledElements: {
    emphasis: Array<{ tag: string; text: string }>;
    strong: Array<{ tag: string; text: string }>;
    italic: Array<{ tag: string; text: string }>;
  };
}

export class WebScraperService {
  private async fetchWithTimeout(url: string, timeout: number = 10000): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  async scrapePage(url: string): Promise<ScrapedData> {
    try {
      const html = await this.fetchWithTimeout(url);
      const $ = cheerio.load(html);

      // Store full content before cleaning
      const fullContent = $.html();

      // Remove unwanted elements
      $('script, style, nav, footer, header, aside, .advertisement, .ad, .sidebar').remove();

      // Extract title
      const title = $('title').text().trim() || $('h1').first().text().trim() || '';

      // Extract meta description
      const metaDescription = $('meta[name="description"]').attr('content') || 
                             $('meta[property="og:description"]').attr('content') || '';

      // Extract main content
      const contentSelectors = [
        'main',
        '[role="main"]',
        '.main-content',
        '.content',
        '.post-content',
        '.entry-content',
        'article',
        '.article-content'
      ];

      let content = '';
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length && element.text().trim().length > content.length) {
          content = element.text().trim();
        }
      }

      // Fallback to body content if no main content found
      if (!content) {
        content = $('body').text().trim();
      }

      content = this.cleanText(content);

      // Extract headings
      const headings: Array<{ level: number; text: string }> = [];
      $('h1, h2, h3, h4, h5, h6').each((_, element) => {
        const $el = $(element);
        const level = parseInt($el.prop('tagName').slice(1));
        const text = this.cleanText($el.text());
        if (text) {
          headings.push({ level, text });
        }
      });

      // Extract images
      const images: Array<{ src: string; alt: string }> = [];
      $('img').each((_, element) => {
        const $el = $(element);
        const src = $el.attr('src') || $el.attr('data-src') || '';
        const alt = $el.attr('alt') || '';
        if (src) {
          images.push({ src, alt });
        }
      });

      // Count links
      const domain = this.extractDomain(url);
      let internalLinks = 0;
      let externalLinks = 0;

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href') || '';
        if (href.startsWith('http')) {
          const linkDomain = this.extractDomain(href);
          if (linkDomain === domain) {
            internalLinks++;
          } else {
            externalLinks++;
          }
        } else if (href.startsWith('/') || href.startsWith('#')) {
          internalLinks++;
        }
      });

      // Extract structured data
      const structuredData: any[] = [];
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const jsonData = JSON.parse($(element).html() || '');
          structuredData.push(jsonData);
        } catch {
          // Ignore invalid JSON-LD
        }
      });

      // Extract styled elements
      const styledElements = {
        emphasis: [] as Array<{ tag: string; text: string }>,
        strong: [] as Array<{ tag: string; text: string }>,
        italic: [] as Array<{ tag: string; text: string }>
      };

      // Extract <em> tags
      $('em').each((_, element) => {
        const text = this.cleanText($(element).text());
        if (text) {
          styledElements.emphasis.push({ tag: 'em', text });
        }
      });

      // Extract <strong> tags
      $('strong').each((_, element) => {
        const text = this.cleanText($(element).text());
        if (text) {
          styledElements.strong.push({ tag: 'strong', text });
        }
      });

      // Extract <i> tags (but not those that are icons)
      $('i').each((_, element) => {
        const $el = $(element);
        const text = this.cleanText($el.text());
        // Skip icon elements (usually have classes like fa-, icon-, etc.)
        const classes = $el.attr('class') || '';
        const isIcon = /\b(fa-|icon-|glyphicon|material-icons)\b/.test(classes);
        if (text && !isIcon) {
          styledElements.italic.push({ tag: 'i', text });
        }
      });

      return {
        title,
        metaDescription,
        content,
        fullContent,
        wordCount: this.countWords(content),
        headings,
        images,
        links: {
          internal: internalLinks,
          external: externalLinks
        },
        structuredData,
        styledElements
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async scrapeMultiplePages(urls: string[], delayMs: number = 1000): Promise<Map<string, ScrapedData>> {
    const results = new Map<string, ScrapedData>();
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        console.log(`Scraping page ${i + 1}/${urls.length}: ${url}`);
        const data = await this.scrapePage(url);
        results.set(url, data);
        
        // Add delay between requests to be respectful
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        // Continue with other URLs even if one fails
      }
    }
    
    return results;
  }
}

export const webScraperService = new WebScraperService();
