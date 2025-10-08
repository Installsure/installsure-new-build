import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/helpers';
import './Dashboard.css';

export const Dashboard = () => {
  const { user, policies, quotes } = useStore();

  const totalCoverage = policies.reduce((sum, policy) => sum + policy.coverage, 0);
  const totalPremium = policies.reduce((sum, policy) => sum + policy.premium, 0);
  const activePolicies = policies.filter(p => p.status === 'active').length;
  const pendingQuotes = quotes.filter(q => q.status === 'pending').length;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}!</h1>
        <p>Here's an overview of your insurance portfolio</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Coverage</h3>
            <p className="stat-value">{formatCurrency(totalCoverage)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Annual Premium</h3>
            <p className="stat-value">{formatCurrency(totalPremium)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Active Policies</h3>
            <p className="stat-value">{activePolicies}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending Quotes</h3>
            <p className="stat-value">{pendingQuotes}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-section">
          <h2>Recent Activity</h2>
          {policies.length === 0 && quotes.length === 0 ? (
            <div className="empty-state">
              <p>No activity yet. Get started by requesting a quote!</p>
            </div>
          ) : (
            <div className="activity-list">
              {quotes.slice(0, 3).map(quote => (
                <div key={quote.id} className="activity-item">
                  <span className="activity-icon">📝</span>
                  <div className="activity-info">
                    <p className="activity-title">
                      {quote.type.charAt(0).toUpperCase() + quote.type.slice(1)} Insurance Quote
                    </p>
                    <p className="activity-date">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`activity-status status-${quote.status}`}>
                    {quote.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="content-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <a href="/quotes" className="action-button">
              <span className="action-icon">📋</span>
              <div>
                <h4>Get a Quote</h4>
                <p>Request insurance quotes</p>
              </div>
            </a>
            <a href="/policies" className="action-button">
              <span className="action-icon">📄</span>
              <div>
                <h4>View Policies</h4>
                <p>Manage your policies</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
