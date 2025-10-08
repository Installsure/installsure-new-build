import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import './Home.css';

export const Home = () => {
  const { isAuthenticated } = useStore();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Your Trusted Insurance Partner
          </h1>
          <p className="hero-subtitle">
            Protect what matters most with comprehensive coverage options tailored to your needs
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn-primary-large">
                  Go to Dashboard
                </Link>
                <Link to="/quotes" className="btn-secondary-large">
                  Get a Quote
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-primary-large">
                  Get Started
                </Link>
                <a href="#features" className="btn-secondary-large">
                  Learn More
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="features-container">
          <h2 className="section-title">Our Insurance Solutions</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚗</div>
              <h3>Auto Insurance</h3>
              <p>Comprehensive coverage for your vehicle with flexible payment options</p>
              <ul className="feature-list">
                <li>Collision coverage</li>
                <li>Liability protection</li>
                <li>Roadside assistance</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏠</div>
              <h3>Home Insurance</h3>
              <p>Protect your home and belongings with our comprehensive coverage</p>
              <ul className="feature-list">
                <li>Property damage</li>
                <li>Personal liability</li>
                <li>Natural disasters</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>Life Insurance</h3>
              <p>Secure your family's financial future with our life insurance plans</p>
              <ul className="feature-list">
                <li>Term life options</li>
                <li>Whole life coverage</li>
                <li>Flexible premiums</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏥</div>
              <h3>Health Insurance</h3>
              <p>Access quality healthcare with our comprehensive health insurance</p>
              <ul className="feature-list">
                <li>Medical coverage</li>
                <li>Prescription drugs</li>
                <li>Preventive care</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="benefits-container">
          <h2 className="section-title">Why Choose InstallSure?</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon">⚡</div>
              <h3>Instant Quotes</h3>
              <p>Get personalized insurance quotes in seconds</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🔒</div>
              <h3>Secure & Reliable</h3>
              <p>Your data is protected with bank-level security</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">💰</div>
              <h3>Competitive Rates</h3>
              <p>Best rates in the market for quality coverage</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">📞</div>
              <h3>24/7 Support</h3>
              <p>Expert assistance whenever you need it</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of satisfied customers who trust InstallSure</p>
          <Link to={isAuthenticated ? "/quotes" : "/login"} className="btn-cta">
            Get Your Free Quote Now
          </Link>
        </div>
      </section>
    </div>
  );
};
