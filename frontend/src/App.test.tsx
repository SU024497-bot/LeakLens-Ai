import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrandLogo } from './components/BrandLogo';
import { MetricCard } from './components/MetricCard';
import { RiskGauge } from './components/RiskGauge';
import { Database } from 'lucide-react';
import { AuditRiskSummary } from './types/audit';

describe('BrandLogo Component', () => {
  it('renders LeakLens AI brand text correctly', () => {
    render(<BrandLogo />);
    expect(screen.getByText('LeakLens')).toBeDefined();
    expect(screen.getByText('AI')).toBeDefined();
    expect(screen.getByText('Auditing & Leakage Lab')).toBeDefined();
  });
});

describe('MetricCard Component', () => {
  it('renders title, value, and subtitle', () => {
    render(
      <MetricCard
        title="Dataset Rows"
        value="1,500"
        subtitle="100% complete"
        icon={Database}
      />
    );
    expect(screen.getByText('Dataset Rows')).toBeDefined();
    expect(screen.getByText('1,500')).toBeDefined();
    expect(screen.getByText('100% complete')).toBeDefined();
  });
});

describe('RiskGauge Component', () => {
  it('renders transparent score and risk level', () => {
    const mockRisk: AuditRiskSummary = {
      overall_risk_level: 'CRITICAL',
      overall_risk_score: 75.0,
      score_calculation_rationale: 'Calculated via critical findings count.',
      critical_findings_count: 2,
      high_findings_count: 1,
      medium_findings_count: 0,
      low_findings_count: 0,
      passed_checks_count: 5,
      unavailable_checks_count: 1,
    };

    render(<RiskGauge risk={mockRisk} />);
    expect(screen.getByText('75')).toBeDefined();
    expect(screen.getByText('Critical Leakage Risk')).toBeDefined();
  });
});
