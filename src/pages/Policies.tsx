import { useStore } from '../store/useStore';
import { PolicyCard } from '../components/PolicyCard';
import './Policies.css';

export const Policies = () => {
  const { policies } = useStore();

  const activePolicies = policies.filter(p => p.status === 'active');
  const pendingPolicies = policies.filter(p => p.status === 'pending');
  const expiredPolicies = policies.filter(p => p.status === 'expired');

  return (
    <div className="policies-page">
      <div className="policies-container">
        <div className="policies-header">
          <h1>My Insurance Policies</h1>
          <p>Manage and view all your insurance policies</p>
        </div>

        {policies.length === 0 ? (
          <div className="empty-policies">
            <div className="empty-icon">📋</div>
            <h2>No Policies Yet</h2>
            <p>You haven't created any insurance policies yet.</p>
            <a href="/quotes" className="btn-get-quote">
              Get Your First Quote
            </a>
          </div>
        ) : (
          <>
            {activePolicies.length > 0 && (
              <div className="policy-section">
                <h2>Active Policies</h2>
                <div className="policies-grid">
                  {activePolicies.map(policy => (
                    <PolicyCard key={policy.id} policy={policy} />
                  ))}
                </div>
              </div>
            )}

            {pendingPolicies.length > 0 && (
              <div className="policy-section">
                <h2>Pending Policies</h2>
                <div className="policies-grid">
                  {pendingPolicies.map(policy => (
                    <PolicyCard key={policy.id} policy={policy} />
                  ))}
                </div>
              </div>
            )}

            {expiredPolicies.length > 0 && (
              <div className="policy-section">
                <h2>Expired Policies</h2>
                <div className="policies-grid">
                  {expiredPolicies.map(policy => (
                    <PolicyCard key={policy.id} policy={policy} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
