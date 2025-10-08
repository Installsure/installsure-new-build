import { useState } from 'react';
import { useStore } from '../store/useStore';
import { generateId, calculatePremium, formatCurrency } from '../utils/helpers';
import './Quotes.css';

export const Quotes = () => {
  const [insuranceType, setInsuranceType] = useState<'auto' | 'home' | 'life' | 'health'>('auto');
  const [coverage, setCoverage] = useState<number>(100000);
  const [age, setAge] = useState<number>(30);
  const [showQuote, setShowQuote] = useState(false);
  const [calculatedPremium, setCalculatedPremium] = useState(0);
  
  const { addQuote, addPolicy } = useStore();

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const premium = calculatePremium(insuranceType, coverage, age);
    setCalculatedPremium(premium);
    setShowQuote(true);
  };

  const handleAcceptQuote = () => {
    const quoteId = generateId();
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    const quote = {
      id: quoteId,
      type: insuranceType,
      premium: calculatedPremium,
      coverage,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'accepted' as const,
    };
    
    const policy = {
      id: generateId(),
      type: insuranceType,
      policyNumber: `POL-${Date.now()}`,
      premium: calculatedPremium,
      status: 'active' as const,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      coverage,
    };
    
    addQuote(quote);
    addPolicy(policy);
    
    setShowQuote(false);
    setCoverage(100000);
    setAge(30);
    alert('Policy created successfully! Check your dashboard.');
  };

  const coverageOptions = {
    auto: [50000, 100000, 250000, 500000],
    home: [100000, 250000, 500000, 1000000],
    life: [100000, 250000, 500000, 1000000],
    health: [50000, 100000, 250000, 500000],
  };

  return (
    <div className="quotes-page">
      <div className="quotes-container">
        <div className="quotes-header">
          <h1>Get an Insurance Quote</h1>
          <p>Find the perfect coverage for your needs</p>
        </div>

        <form onSubmit={handleCalculate} className="quote-form">
          <div className="form-group">
            <label htmlFor="type">Insurance Type</label>
            <select
              id="type"
              value={insuranceType}
              onChange={(e) => setInsuranceType(e.target.value as 'auto' | 'home' | 'life' | 'health')}
            >
              <option value="auto">Auto Insurance</option>
              <option value="home">Home Insurance</option>
              <option value="life">Life Insurance</option>
              <option value="health">Health Insurance</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="coverage">Coverage Amount</label>
            <select
              id="coverage"
              value={coverage}
              onChange={(e) => setCoverage(Number(e.target.value))}
            >
              {coverageOptions[insuranceType].map(amount => (
                <option key={amount} value={amount}>
                  {formatCurrency(amount)}
                </option>
              ))}
            </select>
          </div>

          {(insuranceType === 'life' || insuranceType === 'health') && (
            <div className="form-group">
              <label htmlFor="age">Your Age</label>
              <input
                id="age"
                type="number"
                min="18"
                max="100"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                required
              />
            </div>
          )}

          <button type="submit" className="btn-calculate">
            Calculate Quote
          </button>
        </form>

        {showQuote && (
          <div className="quote-result">
            <h2>Your Quote</h2>
            <div className="quote-details">
              <div className="quote-item">
                <span>Insurance Type:</span>
                <strong>{insuranceType.charAt(0).toUpperCase() + insuranceType.slice(1)}</strong>
              </div>
              <div className="quote-item">
                <span>Coverage Amount:</span>
                <strong>{formatCurrency(coverage)}</strong>
              </div>
              <div className="quote-item">
                <span>Annual Premium:</span>
                <strong className="premium-amount">{formatCurrency(calculatedPremium)}</strong>
              </div>
              <div className="quote-item">
                <span>Monthly Payment:</span>
                <strong>{formatCurrency(calculatedPremium / 12)}</strong>
              </div>
            </div>
            
            <div className="quote-actions">
              <button onClick={handleAcceptQuote} className="btn-accept">
                Accept & Create Policy
              </button>
              <button onClick={() => setShowQuote(false)} className="btn-decline">
                Decline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
