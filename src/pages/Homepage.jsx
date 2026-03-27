import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Homepage.css';

const Homepage = () => {
  // Create refs for scrolling
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);

  // Smooth scroll function
  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const features = [
    {
      icon: '💰',
      title: 'Budget Tracking',
      description: 'Easily track your HELB loan allocation and manage your semester expenses'
    },
    {
      icon: '📊',
      title: 'Smart Allocation',
      description: 'Automatic budget splitting based on standard HELB recommendations'
    },
    {
      icon: '🎯',
      title: 'Goal Setting',
      description: 'Set savings goals and track your progress throughout the semester'
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description: 'Access your budget anywhere, anytime on any device'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Create Account',
      description: 'Sign up with your email and create your profile'
    },
    {
      number: '2',
      title: 'Enter HELB Amount',
      description: 'Input the amount you received for the semester'
    },
    {
      number: '3',
      title: 'Review Budget',
      description: 'See how your money is automatically allocated'
    },
    {
      number: '4',
      title: 'Start Managing',
      description: 'Track your expenses and stay within your budget'
    }
  ];

  return (
    <div className="homepage-container">
      {/* Navigation Bar - Fixed at top */}
      <nav className="homepage-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <Link to="/" className="logo-text">
              <span className="logo-icon">💰</span>
              HELB Manager
            </Link>
          </div>
          
          <div className="nav-links">
            <Link to="/" className="nav-link active">Home</Link>
            <button 
              onClick={() => scrollToSection(featuresRef)} 
              className="nav-link nav-btn"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection(howItWorksRef)} 
              className="nav-link nav-btn"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection(aboutRef)} 
              className="nav-link nav-btn"
            >
              About
            </button>
          </div>
          
          <div className="nav-buttons">
            <Link to="/login" className="nav-login-btn">Log In</Link>
            <Link to="/signup" className="nav-signup-btn">Sign Up</Link>
          </div>
          
          {/* Mobile menu button */}
          <button className="mobile-menu-btn">
            <span className="menu-icon">☰</span>
          </button>
        </div>
      </nav>

      {/* Scrollable Content Area */}
      <div className="homepage-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">
                Manage Your <span className="gradient-text">HELB Loan</span> Wisely
              </h1>
              <p className="hero-subtitle">
                Take control of your student finances with smart budget allocation, 
                expense tracking, and financial planning tools designed for students.
              </p>
              <div className="hero-buttons">
                <Link to="/signup" className="hero-btn-primary">
                  Get Started Free
                </Link>
                <button 
                  onClick={() => scrollToSection(aboutRef)} 
                  className="hero-btn-secondary"
                >
                  Learn More
                </button>
              </div>
              
              {/* Stats */}
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">10,000+</span>
                  <span className="stat-label">Active Students</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">KES 50M+</span>
                  <span className="stat-label">Budget Managed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">4.8★</span>
                  <span className="stat-label">User Rating</span>
                </div>
              </div>
            </div>
            
            <div className="hero-image">
              <div className="image-placeholder">
                <div className="placeholder-content">
                  <div className="budget-preview">
                    <div className="preview-item">
                      <span>Rent</span>
                      <span>30%</span>
                    </div>
                    <div className="preview-bar" style={{width: '30%', background: '#4299e1'}}></div>
                    <div className="preview-item">
                      <span>Food</span>
                      <span>25%</span>
                    </div>
                    <div className="preview-bar" style={{width: '25%', background: '#48bb78'}}></div>
                    <div className="preview-item">
                      <span>Tuition</span>
                      <span>25%</span>
                    </div>
                    <div className="preview-bar" style={{width: '25%', background: '#ed8936'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="features-section">
          <div className="features-container">
            <h2 className="section-title">Why Choose HELB Manager?</h2>
            <p className="section-subtitle">Everything you need to manage your student finances effectively</p>
            
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section ref={howItWorksRef} className="how-it-works">
          <div className="steps-container">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Get started in just a few simple steps</p>
            
            <div className="steps-grid">
              {steps.map((step, index) => (
                <div key={index} className="step-card">
                  <div className="step-number">{step.number}</div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section ref={aboutRef} className="about-section">
          <div className="about-container">
            <div className="about-header">
              <span className="about-badge">About Us</span>
              <h2 className="about-title">Empowering Students to <span className="gradient-text">Master Their Finances</span></h2>
              <p className="about-subtitle">
                We're on a mission to transform how students manage their HELB loans and build financial independence
              </p>
            </div>

            <div className="about-content">
              <div className="about-grid">
                <div className="about-card mission-card">
                  <div className="about-icon">🎯</div>
                  <h3>Our Mission</h3>
                  <p>
                    To empower Kenyan students with intelligent financial tools that simplify budget management, 
                    promote saving culture, and ensure every shilling of your HELB loan is utilized effectively 
                    for academic success.
                  </p>
                </div>

                <div className="about-card vision-card">
                  <div className="about-icon">👁️</div>
                  <h3>Our Vision</h3>
                  <p>
                    A future where every student graduates not just with academic excellence, but with strong 
                    financial literacy and healthy saving habits that last a lifetime.
                  </p>
                </div>

                <div className="about-card story-card">
                  <div className="about-icon">📖</div>
                  <h3>Our Story</h3>
                  <p>
                    Born from a simple observation - students struggling to make their HELB loans last the semester. 
                    What started as a personal budgeting spreadsheet evolved into a comprehensive platform 
                    helping thousands of students across Kenya.
                  </p>
                </div>
              </div>

              <div className="about-stats-grid">
                <div className="about-stat-item">
                  <span className="about-stat-number">2023</span>
                  <span className="about-stat-label">Year Founded</span>
                </div>
                <div className="about-stat-item">
                  <span className="about-stat-number">15+</span>
                  <span className="about-stat-label">Universities</span>
                </div>
                <div className="about-stat-item">
                  <span className="about-stat-number">10K+</span>
                  <span className="about-stat-label">Active Users</span>
                </div>
                <div className="about-stat-item">
                  <span className="about-stat-number">95%</span>
                  <span className="about-stat-label">Satisfaction Rate</span>
                </div>
              </div>

              <div className="about-values">
                <h3 className="values-title">Our Core Values</h3>
                <div className="values-grid">
                  <div className="value-item">
                    <span className="value-icon">🤝</span>
                    <div>
                      <h4>Student First</h4>
                      <p>Every feature we build starts with student needs</p>
                    </div>
                  </div>
                  <div className="value-item">
                    <span className="value-icon">🔒</span>
                    <div>
                      <h4>Privacy & Security</h4>
                      <p>Your financial data is always protected</p>
                    </div>
                  </div>
                  <div className="value-item">
                    <span className="value-icon">💡</span>
                    <div>
                      <h4>Innovation</h4>
                      <p>Constantly improving to serve you better</p>
                    </div>
                  </div>
                  <div className="value-item">
                    <span className="value-icon">🌍</span>
                    <div>
                      <h4>Accessibility</h4>
                      <p>Free financial tools for every Kenyan student</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="about-cta">
                <h3>Ready to join thousands of students?</h3>
                <p>Start your financial journey today - it's completely free!</p>
                <Link to="/signup" className="about-cta-button">
                  Create Your Free Account
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-container">
            <h2 className="cta-title">Ready to take control of your finances?</h2>
            <p className="cta-subtitle">Join thousands of students already managing their HELB loans wisely</p>
            <Link to="/signup" className="cta-button">
              Create Your Free Account
            </Link>
            <p className="cta-note">No credit card required • Free forever for students</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-container">
            <div className="footer-grid">
              <div className="footer-about">
                <h3 className="footer-title">HELB Manager</h3>
                <p className="footer-description">
                  Helping students manage their HELB loans wisely through smart budget allocation and expense tracking.
                </p>
              </div>
              
              <div className="footer-links">
                <h3 className="footer-title">Quick Links</h3>
                <ul>
                  <li><Link to="/">Home</Link></li>
                  <li><button onClick={() => scrollToSection(featuresRef)} className="footer-link-btn">Features</button></li>
                  <li><button onClick={() => scrollToSection(howItWorksRef)} className="footer-link-btn">How It Works</button></li>
                  <li><button onClick={() => scrollToSection(aboutRef)} className="footer-link-btn">About Us</button></li>
                </ul>
              </div>
              
              <div className="footer-links">
                <h3 className="footer-title">Support</h3>
                <ul>
                  <li><Link to="/help">Help Center</Link></li>
                  <li><Link to="/faq">FAQ</Link></li>
                  <li><Link to="/contact">Contact Us</Link></li>
                  <li><Link to="/privacy">Privacy Policy</Link></li>
                </ul>
              </div>
              
              <div className="footer-auth">
                <h3 className="footer-title">Get Started</h3>
                <div className="footer-buttons">
                  <Link to="/login" className="footer-login">Log In</Link>
                  <Link to="/signup" className="footer-signup">Sign Up</Link>
                </div>
              </div>
            </div>
            
            <div className="footer-bottom">
              <p>&copy; 2026 HELB Manager. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Homepage;