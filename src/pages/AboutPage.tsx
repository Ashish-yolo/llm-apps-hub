import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Home, 
  Users, 
  Calculator, 
  Brain, 
  Github, 
  Star, 
  ArrowRight,
  CheckCircle,
  Zap,
  Clock,
  Target,
  Search,
  BarChart3,
  DollarSign
} from 'lucide-react'

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 rounded-full glass-card mb-8">
              <Home className="h-5 w-5 text-accent-500 mr-2" />
              <span className="text-sm font-medium text-slate-700">AI Real Estate Agent Team</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect Home in{' '}
              <span className="gradient-text">Minutes</span> 🤯
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              3 AI agents work together like a real estate team to find undervalued properties, 
              analyze market trends, and deliver investment recommendations — all 100% open source.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link to="/app/ai-real-estate-team" className="btn-primary text-lg px-8 py-4">
                Try the Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a
                href="https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/advanced_ai_agents/multi_agent_apps/agent_teams/ai_real_estate_agent_team"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-lg px-8 py-4"
              >
                <Github className="mr-2 h-5 w-5" />
                View Source Code
              </a>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-card p-6 rounded-2xl text-center">
                <Clock className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-800">Minutes</div>
                <div className="text-sm text-slate-600">Not Hours</div>
              </div>
              <div className="glass-card p-6 rounded-2xl text-center">
                <Users className="h-8 w-8 text-accent-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-800">3 Agents</div>
                <div className="text-sm text-slate-600">Working Together</div>
              </div>
              <div className="glass-card p-6 rounded-2xl text-center">
                <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-800">100%</div>
                <div className="text-sm text-slate-600">Open Source</div>
              </div>
              <div className="glass-card p-6 rounded-2xl text-center">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-800">Smart</div>
                <div className="text-sm text-slate-600">Recommendations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How the AI Agent Team Works</h2>
            <p className="text-xl text-slate-600">Three specialized agents collaborate seamlessly to deliver results</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Agent 1 */}
            <div className="glass-card rounded-2xl p-8 text-center group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Property Search Agent</h3>
              <p className="text-slate-600 mb-6">
                Scrapes listings from Zillow, Realtor.com, and Trulia using Firecrawl. 
                Automatically gathers property details, pricing, and location data.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Multi-platform scraping</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Real-time data collection</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Automated filtering</span>
                </div>
              </div>
            </div>

            {/* Agent 2 */}
            <div className="glass-card rounded-2xl p-8 text-center group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Market Analysis Agent</h3>
              <p className="text-slate-600 mb-6">
                Processes discovered properties for market insights. Identifies buyer's vs seller's 
                market conditions and analyzes neighborhood characteristics.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Market trend analysis</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Neighborhood insights</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Investment outlook</span>
                </div>
              </div>
            </div>

            {/* Agent 3 */}
            <div className="glass-card rounded-2xl p-8 text-center group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Property Valuation Agent</h3>
              <p className="text-slate-600 mb-6">
                Evaluates individual properties for fair market value. Provides investment 
                potential ratings and delivers specific buy/hold/pass recommendations.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Fair market value</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Investment ratings</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Buy/Hold/Pass advice</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes It Special */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">What Surprised Us</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Beyond Just Finding Properties</h3>
                    <p className="text-slate-600">The agents don't just find properties — they spot undervalued listings and identify emerging market trends.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Calculator className="h-4 w-4 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Precise Investment Calculations</h3>
                    <p className="text-slate-600">They calculate precise investment returns and provide data-driven recommendations for every property.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Seamless Collaboration</h3>
                    <p className="text-slate-600">When the Search Agent finds a property, the Market Analyst immediately evaluates the neighborhood while the Valuation Agent calculates fair market value.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Lightning Fast Results</h3>
                    <p className="text-slate-600">All analysis completed in minutes, not hours — giving you a competitive edge in fast-moving markets.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-8">
              <div className="text-center mb-6">
                <Brain className="h-16 w-16 text-primary-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Powered by Advanced AI</h3>
                <p className="text-slate-600">Built with cutting-edge technologies</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                  <span className="font-medium">OpenAI GPT-OSS</span>
                  <span className="text-sm text-slate-600">AI Model</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                  <span className="font-medium">Firecrawl</span>
                  <span className="text-sm text-slate-600">Web Scraping</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                  <span className="font-medium">Agno Framework</span>
                  <span className="text-sm text-slate-600">Multi-Agent System</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                  <span className="font-medium">Streamlit</span>
                  <span className="text-sm text-slate-600">User Interface</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Github className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">100% Open Source</h2>
          <p className="text-xl mb-8 opacity-90">
            Complete source code, step-by-step tutorial, and documentation — all freely available
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-2xl font-bold mb-2">Free Forever</div>
              <div className="text-sm opacity-75">No hidden costs or limitations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-2xl font-bold mb-2">Full Tutorial</div>
              <div className="text-sm opacity-75">Step-by-step implementation guide</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-2xl font-bold mb-2">Community</div>
              <div className="text-sm opacity-75">Join developers worldwide</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/advanced_ai_agents/multi_agent_apps/agent_teams/ai_real_estate_agent_team"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-slate-900 hover:bg-gray-100 font-medium px-8 py-4 rounded-xl transition-colors duration-200 shadow-lg"
            >
              <Github className="mr-2 h-5 w-5 inline" />
              Get the Code
            </a>
            <Link
              to="/tutorials"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 font-medium px-8 py-4 rounded-xl transition-colors duration-200"
            >
              View Tutorial
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Build Your AI Agent Team?</h2>
          <p className="text-xl text-slate-600 mb-8">
            Start with our real estate example and adapt it to your domain
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/app/ai-real-estate-team" className="btn-primary text-lg px-8 py-4">
              Try the Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link to="/apps" className="btn-secondary text-lg px-8 py-4">
              Explore More Apps
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage