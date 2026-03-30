import { Link } from 'react-router-dom';
import appLogo from '../assets/Penny Professor logo 1.png';
import '../styles/landingpage.css';
import ToggleMenu from '../components/toggleMenu';


const LandingPage = () => {
  return (
    <div className="landing-container">
       
      {/* Navigation Bar */}
      <header className="navbar">
        <div className="logo-container">
         <img src={appLogo} alt="Penny Professor logo" className="landing-logo" />
          <h1 className="app-name">Penny Professor</h1>
        </div>
        <nav className="nav-links">
       
           <ToggleMenu />
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h2 className="hero-title"> Manage Your Semester Funds with Confidence.</h2>
          <p className="hero-description">
            The ultimate financial management dashboard for university students. 
            Track your HELB disbursements, automate your budgeting, and stretch your money until the end of the semester.
          </p>
          <Link to="/signup" className="cta-button primary">Create Account</Link>
        </div>
        <div className="hero-image-placeholder">
          {/* Replace this div with an actual image/mockup of your dashboard */}
          <p>Dashboard Mockup Here</p>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="features-section">
        <h3 className="section-title">Why Choose Us?</h3>
        <div className="features-grid">
          <div className="feature-card">
            <h4>Smart 50/30/20 Budgeting</h4>
            <p>We automatically split your lump-sum into Rent, Food, Tuition, Personal, and Savings.</p>
          </div>
          <div className="feature-card">
            <h4>Built for Students</h4>
            <p>No complex accounting jargon. Just clear progress bars showing exactly what you have left.</p>
          </div>
          <div className="feature-card">
            <h4>100% Secure</h4>
            <p>Your data is encrypted and stored safely. We help you track, not expose your finances.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h3 className="section-title">How It Works</h3>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <p><strong>Sign Up:</strong> Create your secure student account.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <p><strong>Input Funds:</strong> Enter your total semester disbursement.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <p><strong>Track Daily:</strong> Log expenses and watch your visual budget bars update.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bottom-cta">
        <h2>Ready to take control of your finances?</h2>
        <Link to="/signup" className="cta-button secondary">Join Now</Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 Penny Professor. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;