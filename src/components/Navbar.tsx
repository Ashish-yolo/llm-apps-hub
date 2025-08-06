import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Brain, Zap } from 'lucide-react'

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/apps', label: 'Apps' },
    { path: '/tutorials', label: 'Tutorials' },
    { path: '/about', label: 'About' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="glass-card border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Brain className="h-8 w-8 text-primary-600 group-hover:text-accent-600 transition-colors duration-200" />
              <Zap className="h-4 w-4 text-accent-500 absolute -bottom-1 -right-1 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="text-xl font-bold gradient-text">LLM Apps Hub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'text-primary-600'
                    : 'text-slate-600 hover:text-primary-600'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="https://github.com/Shubhamsaboo/awesome-llm-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              ⭐ Star on GitHub
            </a>
            <Link to="/apps" className="btn-primary">
              Explore Apps
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-slate-600" />
              ) : (
                <Menu className="h-6 w-6 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4 animate-slide-up">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'text-primary-600'
                      : 'text-slate-600 hover:text-primary-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/20 space-y-3">
                <a
                  href="https://github.com/Shubhamsaboo/awesome-llm-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center btn-secondary"
                >
                  ⭐ Star on GitHub
                </a>
                <Link
                  to="/apps"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center btn-primary"
                >
                  Explore Apps
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar