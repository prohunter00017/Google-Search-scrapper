# SEO Competitor Analysis Tool

## Overview

This is a full-stack web application built to analyze the top 10 Google search results for any keyword. The application scrapes Google search results, extracts detailed content from each competitor page, and provides comprehensive SEO analysis including entity extraction, sentiment analysis, and content metrics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Development**: Hot module replacement via Vite integration

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless connection
- **Schema**: Two main tables - `analyses` and `competitor_results`
- **Migrations**: Drizzle Kit for schema management
- **Fallback**: In-memory storage implementation for development

## Key Components

### Analysis Service
- Orchestrates the entire analysis workflow
- Manages background processing of search and scraping tasks
- Handles status updates and error recovery
- Provides real-time progress tracking

### Google APIs Service
- Integrates with Google Custom Search API for search results
- Connects to Google Cloud Natural Language API for entity extraction and sentiment analysis
- Handles API rate limiting and error responses
- Supports localization with country and language parameters

### Web Scraper Service
- Fetches and parses HTML content from competitor pages
- Extracts title, meta description, and clean content
- Analyzes page structure (headings, images, links)
- Implements timeout protection and user agent rotation
- Provides detailed content metrics and structured data extraction

### UI Components
- **Configuration Panel**: Form for setting up analysis parameters
- **Progress Tracker**: Real-time progress updates with polling
- **Results Dashboard**: Comprehensive analysis results with export options
- **Sidebar Navigation**: Main application navigation and usage metrics

## Data Flow

1. **User Input**: User submits keyword, country, and language preferences through the configuration panel
2. **Analysis Creation**: Backend creates analysis record and returns analysis ID
3. **Background Processing**: 
   - Google search API retrieves top 10 results
   - Web scraper fetches content from each competitor URL
   - Google NLP APIs analyze entities and sentiment
   - Results are stored in the database
4. **Real-time Updates**: Frontend polls analysis endpoint for progress updates
5. **Results Display**: Completed analysis data is presented in interactive dashboard
6. **Export Options**: Users can download results as CSV or JSON files

## External Dependencies

### Required API Keys
- **Google Custom Search API**: For retrieving search results
- **Google Cloud Natural Language API**: For entity extraction and sentiment analysis

### Third-party Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Cheerio**: HTML parsing and manipulation
- **Drizzle ORM**: Type-safe database operations

### Development Tools
- **Replit Integration**: Development environment optimization
- **ESBuild**: Production bundling for server code
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Development
- Local development with Vite dev server
- Hot module replacement for both client and server
- In-memory storage fallback for database-less development
- Environment variable configuration for API keys

### Production
- Client build via Vite with static asset optimization
- Server bundling with ESBuild for Node.js deployment
- PostgreSQL database with connection pooling
- Environment-based configuration management

### Build Process
- `npm run dev`: Development server with HMR
- `npm run build`: Production build (client + server)
- `npm run start`: Production server startup
- `npm run db:push`: Database schema deployment

## Changelog
- January 3, 2025: Enhanced HTML reports to include complete page content with statistics (file size, lines, HTML tags, word count) and full HTML source code preview
- January 3, 2025: Added full content extraction feature with complete HTML page storage and styled elements analysis (&lt;em&gt;, &lt;i&gt;, &lt;strong&gt; tags)
- January 3, 2025: Enhanced competitor analysis with detailed heading structure (H1-H4) display and SEO meta information analysis
- January 3, 2025: Added comprehensive HTML report generation with professional styling and complete competitor insights
- June 30, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.