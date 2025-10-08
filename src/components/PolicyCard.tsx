import type { Policy } from '../store/useStore';
import { formatCurrency, formatDate } from '../utils/helpers';
import './PolicyCard.css';

interface PolicyCardProps {
  policy: Policy;
}

export const PolicyCard = ({ policy }: PolicyCardProps) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'expired':
        return 'status-expired';
      default:
        return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'auto':
        return '🚗';
      case 'home':
        return '🏠';
      case 'life':
        return '💼';
      case 'health':
        return '🏥';
      default:
        return '📋';
    }
  };

  return (
    <div className="policy-card">
      <div className="policy-header">
        <div className="policy-icon">{getTypeIcon(policy.type)}</div>
        <div className="policy-info">
          <h3>{policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance</h3>
          <p className="policy-number">Policy #{policy.policyNumber}</p>
        </div>
        <span className={`policy-status ${getStatusClass(policy.status)}`}>
          {policy.status}
        </span>
      </div>
      
      <div className="policy-details">
        <div className="detail-row">
          <span className="detail-label">Coverage:</span>
          <span className="detail-value">{formatCurrency(policy.coverage)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Premium:</span>
          <span className="detail-value">{formatCurrency(policy.premium)}/year</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Start Date:</span>
          <span className="detail-value">{formatDate(policy.startDate)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">End Date:</span>
          <span className="detail-value">{formatDate(policy.endDate)}</span>
        </div>
      </div>
    </div>
  );
};
