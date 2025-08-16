# GenAI CRM Dashboard

A modern React TypeScript dashboard for the GenAI CRM system with AI-powered customer service enhancement capabilities.

## Features

- **Authentication & Authorization** - Secure user management with Supabase Auth
- **Real-time Dashboard** - Live metrics and KPIs with automatic updates
- **AI Chat Interface** - Interactive AI assistant for customer service support
- **Customer Management** - Comprehensive customer database and interaction tracking
- **Analytics & Reporting** - Advanced analytics with visualization charts
- **Responsive Design** - Mobile-first design with dark/light theme support
- **Modern UI** - Built with TailwindCSS and Headless UI components

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Headless UI
- **State Management**: TanStack Query (React Query)
- **Authentication**: Supabase Auth
- **API Client**: Custom service layer with Supabase client
- **Icons**: Heroicons
- **Notifications**: React Hot Toast
- **Deployment**: Netlify

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase project
- GenAI CRM API backend running

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd genai-crm-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE_URL=http://localhost:3001/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard-specific components
│   └── layout/         # Layout components
├── contexts/           # React contexts
├── pages/              # Page components
├── services/           # API services
├── types/              # TypeScript type definitions
├── App.tsx             # Main app component
└── main.tsx           # App entry point
```

## Key Components

### Authentication System
- `AuthProvider` - Authentication context with Supabase integration
- `ProtectedRoute` - Route guard for authenticated pages
- `PublicRoute` - Route guard for public pages

### Dashboard Layout
- `DashboardLayout` - Main layout with sidebar and navigation
- `Sidebar` - Navigation sidebar with routing
- `TopNavigation` - Top navigation bar with user menu

### Dashboard Components
- `MetricsOverview` - KPI cards with trend indicators
- `RealtimeMetrics` - Live updating metrics display
- `ActivityFeed` - Recent activity timeline
- `QuickActions` - Quick action dropdown menu

### AI Chat Interface
- Interactive chat with AI assistant
- Customer context integration
- Response suggestions
- Conversation management

## Configuration

### Environment Variables

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_API_BASE_URL` - Backend API base URL

### Theme Configuration

The app supports light/dark/system themes with customizable colors:
- Primary colors for branding
- Accent colors for highlights
- Font family selection
- Custom CSS properties

## Deployment

### Netlify Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Netlify:
- Connect your repository to Netlify
- Set build command: `npm run build`
- Set publish directory: `dist`
- Add environment variables in Netlify dashboard

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Upload the `dist/` folder to your hosting provider

## API Integration

The dashboard integrates with the GenAI CRM API backend for:

- User authentication via Supabase Auth
- Customer data management
- AI query processing
- Analytics and reporting
- Real-time metrics

Ensure the backend API is running and accessible at the configured `VITE_API_BASE_URL`.

## Development

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Update navigation in `src/components/layout/Sidebar.tsx`

### Adding New API Endpoints

1. Add types in `src/types/index.ts`
2. Add methods in `src/services/api.ts`
3. Use with TanStack Query in components

### Styling Guidelines

- Use TailwindCSS utility classes
- Follow the established color scheme
- Use semantic class names for custom components
- Maintain dark mode compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.