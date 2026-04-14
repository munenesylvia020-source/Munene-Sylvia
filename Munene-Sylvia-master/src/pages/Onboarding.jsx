import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Lock, ArrowRight, ChevronRight, CheckCircle2 } from 'lucide-react';
import { auth } from '../services/api';
import '../styles/onboarding.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'welcome',
      icon: <ShieldCheck size={64} className="oboard-icon pulse-soft" style={{ color: 'var(--color-primary)' }} />,
      title: "Welcome to Penny Professor",
      subtitle: "The ultimate vault for your HELB loan.",
      description: "Managing bulk disbursements is tough. We immediately lock your funds in a high-security vault so you don't blow it in the first two weeks."
    },
    {
      id: 'rule503020',
      icon: <TrendingUp size={64} className="oboard-icon pulse-soft" style={{ color: 'var(--color-accent)' }} />,
      title: "The 50/30/20 Trap Door",
      subtitle: "Automatic budgeting the second cash arrives.",
      description: "When your HELB drops, we instantly cut it into 50% Needs, 30% Wants, and strictly trap 20% into an interest-earning Money Market Fund. No math, just discipline."
    },
    {
      id: 'guard',
      icon: <Lock size={64} className="oboard-icon pulse-soft" style={{ color: 'var(--color-secondary)' }} />,
      title: "Daily Spending Guard",
      subtitle: "Live off the drip-feed.",
      description: "Lock your vault and set a daily M-Pesa allowance (e.g. KES 500). The app sends you exactly your allowance every morning and strictly blocks heavy withdrawals."
    }
  ];

  const handleNext = async () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      // Finished onboarding! Move to HELB amount setup.
      try {
        await auth.completeOnboarding();
      } catch (err) {
        console.error("Failed to complete onboarding", err);
      }
      navigate('/helb-amount');
    }
  };

  return (
    <div className="onboarding-page animate-fade-in">
      <div className="onboarding-container">
        
        <div className="slides-viewport">
          <div 
            className="slides-track animate-slide-up" 
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, idx) => (
              <div className="slide" key={slide.id}>
                <div className="slide-hero">
                  <div className="icon-wrapper">
                    {slide.icon}
                  </div>
                </div>
                <div className="slide-content">
                  <h1 className="slide-title">{slide.title}</h1>
                  <h3 className="slide-subtitle">{slide.subtitle}</h3>
                  <p className="slide-description">{slide.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="onboarding-footer pointer-events-auto">
          <div className="dots-container">
            {slides.map((_, idx) => (
              <div 
                key={idx} 
                className={`dot ${currentSlide === idx ? 'active' : ''}`}
              />
            ))}
          </div>
          
          <button 
            className="primary-btn oboard-btn" 
            onClick={handleNext}
          >
            {currentSlide === slides.length - 1 ? (
              <>Start Securing My Money <CheckCircle2 size={18} /></>
            ) : (
              <>Next Step <ArrowRight size={18} /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;
