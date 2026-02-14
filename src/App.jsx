import React, { useState, useEffect } from 'react';
import {
  Activity,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Zap,
  Target,
  Shield,
  HeartPulse
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Expected stage durations (in days) for stalled stage calculation
const EXPECTED_STAGE_DAYS = {
  'Signed': 14,
  'Kickoff': 30,
  'Integration': 45,
  'Training': 21,
  'Go-Live': 30
};

// Initial sample data - 6 customers
const INITIAL_CUSTOMERS = [
  {
    id: 1,
    name: "Sunrise Home Health",
    mrr: 2850,
    stage: "Integration",
    daysInStage: 52,
    lastLogin: 18,
    apiUsage: 45,
    supportTickets: 8,
    paymentStatus: "current",
    renewalDays: 145,
    contractStart: "2024-09-15",
    trend: "down",
    closedBy: "Sarah Chen",
    csOwner: "Mike Rodriguez",
    dealSource: "Inbound",
    lastTouchDate: "2025-01-28",
    tasks: [
      {
        id: 1,
        name: "Schedule integration review call",
        priority: "high",
        status: "open",
        dueDate: "2025-02-18",
        triggerId: "stalledStage",
        completedDate: null
      },
      {
        id: 2,
        name: "Send API optimization guide",
        priority: "medium",
        status: "open",
        dueDate: "2025-02-20",
        triggerId: "lowApi",
        completedDate: null
      }
    ]
  },
  {
    id: 2,
    name: "MediSupply Partners",
    mrr: 4200,
    stage: "Go-Live",
    daysInStage: 12,
    lastLogin: 2,
    apiUsage: 88,
    supportTickets: 1,
    paymentStatus: "current",
    renewalDays: 280,
    contractStart: "2024-05-10",
    trend: "up",
    closedBy: "Tom Martinez",
    csOwner: "Jessica Park",
    dealSource: "Partner Referral",
    lastTouchDate: "2025-02-10",
    tasks: []
  },
  {
    id: 3,
    name: "CarePath Solutions",
    mrr: 3100,
    stage: "Training",
    daysInStage: 25,
    lastLogin: 9,
    apiUsage: 62,
    supportTickets: 4,
    paymentStatus: "current",
    renewalDays: 198,
    contractStart: "2024-08-01",
    trend: "stable",
    closedBy: "Sarah Chen",
    csOwner: "Mike Rodriguez",
    dealSource: "Outbound",
    lastTouchDate: "2025-02-05",
    tasks: [
      {
        id: 3,
        name: "Follow up on training session feedback",
        priority: "medium",
        status: "open",
        dueDate: "2025-02-17",
        triggerId: null,
        completedDate: null
      }
    ]
  },
  {
    id: 4,
    name: "Velocity DME",
    mrr: 5800,
    stage: "Go-Live",
    daysInStage: 8,
    lastLogin: 1,
    apiUsage: 92,
    supportTickets: 0,
    paymentStatus: "current",
    renewalDays: 312,
    contractStart: "2024-04-05",
    trend: "up",
    closedBy: "Tom Martinez",
    csOwner: "Jessica Park",
    dealSource: "Inbound",
    lastTouchDate: "2025-02-12",
    tasks: []
  },
  {
    id: 5,
    name: "HealthBridge Equipment",
    mrr: 1950,
    stage: "Kickoff",
    daysInStage: 48,
    lastLogin: 35,
    apiUsage: 18,
    supportTickets: 12,
    paymentStatus: "late",
    renewalDays: 52,
    contractStart: "2024-12-20",
    trend: "down",
    closedBy: "Lisa Wang",
    csOwner: "Mike Rodriguez",
    dealSource: "Outbound",
    lastTouchDate: "2025-01-15",
    tasks: [
      {
        id: 4,
        name: "URGENT: Executive escalation call",
        priority: "critical",
        status: "open",
        dueDate: "2025-02-15",
        triggerId: "lowHealth",
        completedDate: null
      },
      {
        id: 5,
        name: "Payment follow-up",
        priority: "critical",
        status: "open",
        dueDate: "2025-02-16",
        triggerId: "renewalRisk",
        completedDate: null
      },
      {
        id: 6,
        name: "Check-in call - no recent login",
        priority: "high",
        status: "open",
        dueDate: "2025-02-17",
        triggerId: "noLogin",
        completedDate: null
      }
    ]
  },
  {
    id: 6,
    name: "Premier Home Care",
    mrr: 3600,
    stage: "Go-Live",
    daysInStage: 15,
    lastLogin: 3,
    apiUsage: 85,
    supportTickets: 2,
    paymentStatus: "current",
    renewalDays: 245,
    contractStart: "2024-06-12",
    trend: "up",
    closedBy: "Sarah Chen",
    csOwner: "Jessica Park",
    dealSource: "Inbound",
    lastTouchDate: "2025-02-11",
    tasks: []
  }
];

// Default health weights (must total 100)
const DEFAULT_WEIGHTS = {
  login: 25,
  api: 25,
  support: 20,
  payment: 15,
  stage: 15
};

// Automation trigger definitions
const AUTOMATION_TRIGGERS = {
  noLogin: {
    id: 'noLogin',
    name: 'No Recent Login',
    condition: 'Last login > 14 days',
    action: 'CS check-in call',
    priority: 'high',
    enabled: true
  },
  lowApi: {
    id: 'lowApi',
    name: 'Low API Usage',
    condition: 'API usage < 40%',
    action: 'Send optimization email',
    priority: 'medium',
    enabled: true
  },
  lowHealth: {
    id: 'lowHealth',
    name: 'Low Health Score',
    condition: 'Health score < 60',
    action: 'Slack alert to CS team',
    priority: 'high',
    enabled: true
  },
  stalledStage: {
    id: 'stalledStage',
    name: 'Stalled in Stage',
    condition: 'Days in stage > 1.5× expected',
    action: 'Escalation call',
    priority: 'high',
    enabled: true
  },
  renewalRisk: {
    id: 'renewalRisk',
    name: 'Renewal at Risk',
    condition: 'Renewal ≤ 60 days AND score < 70',
    action: 'Flag for renewal team',
    priority: 'critical',
    enabled: true
  }
};

function App() {
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('health');
  const [healthWeights, setHealthWeights] = useState(DEFAULT_WEIGHTS);
  const [automationTriggers, setAutomationTriggers] = useState(AUTOMATION_TRIGGERS);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('healthScore');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState('weights');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [deleteConfirmationCode, setDeleteConfirmationCode] = useState('');
  const [deleteInputValue, setDeleteInputValue] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('gen_health_cs_hub');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCustomers(parsed.customers || INITIAL_CUSTOMERS);
        setHealthWeights(parsed.healthWeights || DEFAULT_WEIGHTS);
        setAutomationTriggers(parsed.automationTriggers || AUTOMATION_TRIGGERS);
      } catch (e) {
        setCustomers(INITIAL_CUSTOMERS);
      }
    } else {
      setCustomers(INITIAL_CUSTOMERS);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (customers.length > 0) {
      localStorage.setItem('gen_health_cs_hub', JSON.stringify({
        customers,
        healthWeights,
        automationTriggers
      }));
    }
  }, [customers, healthWeights, automationTriggers]);

  // Calculate health score for a customer
  const calculateHealthScore = (customer) => {
    const weights = healthWeights;

    // Login score (based on days since last login)
    let loginScore = 0;
    if (customer.lastLogin <= 7) loginScore = 100;
    else if (customer.lastLogin <= 14) loginScore = 70;
    else if (customer.lastLogin <= 30) loginScore = 40;
    else loginScore = 0;

    // API usage score (direct percentage)
    const apiScore = customer.apiUsage;

    // Support ticket score
    let supportScore = 0;
    if (customer.supportTickets <= 2) supportScore = 100;
    else if (customer.supportTickets <= 5) supportScore = 70;
    else if (customer.supportTickets <= 10) supportScore = 40;
    else supportScore = 20;

    // Payment status score
    let paymentScore = 0;
    if (customer.paymentStatus === 'current') paymentScore = 100;
    else if (customer.paymentStatus === 'late') paymentScore = 50;
    else paymentScore = 0;

    // Stage progress score
    const expectedDays = EXPECTED_STAGE_DAYS[customer.stage] || 30;
    let stageScore = 0;
    if (customer.daysInStage <= expectedDays) stageScore = 100;
    else if (customer.daysInStage <= expectedDays * 1.5) stageScore = 60;
    else stageScore = 30;

    // Weighted total
    const totalScore = 
      (loginScore * weights.login / 100) +
      (apiScore * weights.api / 100) +
      (supportScore * weights.support / 100) +
      (paymentScore * weights.payment / 100) +
      (stageScore * weights.stage / 100);

    return Math.round(totalScore);
  };

  // Get health status based on score
  const getHealthStatus = (score) => {
    if (score >= 80) return 'healthy';
    if (score >= 60) return 'monitor';
    return 'at-risk';
  };

  // Check which automation triggers apply to a customer
  const getActiveAutomationTriggers = (customer) => {
    const score = calculateHealthScore(customer);
    const triggers = [];

    if (automationTriggers.noLogin.enabled && customer.lastLogin > 14) {
      triggers.push('noLogin');
    }
    if (automationTriggers.lowApi.enabled && customer.apiUsage < 40) {
      triggers.push('lowApi');
    }
    if (automationTriggers.lowHealth.enabled && score < 60) {
      triggers.push('lowHealth');
    }
    if (automationTriggers.stalledStage.enabled) {
      const expectedDays = EXPECTED_STAGE_DAYS[customer.stage] || 30;
      if (customer.daysInStage > expectedDays * 1.5) {
        triggers.push('stalledStage');
      }
    }
    if (automationTriggers.renewalRisk.enabled && customer.renewalDays <= 60 && score < 70) {
      triggers.push('renewalRisk');
    }

    return triggers;
  };

  // Calculate metrics for dashboard
  const calculateMetrics = () => {
    const customersWithScores = customers.map(c => ({
      ...c,
      healthScore: calculateHealthScore(c),
      healthStatus: getHealthStatus(calculateHealthScore(c))
    }));

    const totalCustomers = customersWithScores.length;
    const healthyCount = customersWithScores.filter(c => c.healthStatus === 'healthy').length;
    const monitorCount = customersWithScores.filter(c => c.healthStatus === 'monitor').length;
    const atRiskCount = customersWithScores.filter(c => c.healthStatus === 'at-risk').length;

    const totalMRR = customers.reduce((sum, c) => sum + c.mrr, 0);
    const healthyMRR = customersWithScores.filter(c => c.healthStatus === 'healthy').reduce((sum, c) => sum + c.mrr, 0);
    const monitorMRR = customersWithScores.filter(c => c.healthStatus === 'monitor').reduce((sum, c) => sum + c.mrr, 0);
    const atRiskMRR = customersWithScores.filter(c => c.healthStatus === 'at-risk').reduce((sum, c) => sum + c.mrr, 0);

    const protectedMRR = healthyMRR;
    const riskMRR = monitorMRR + atRiskMRR;

    const atRiskCustomers = customersWithScores.filter(c => c.healthStatus === 'at-risk');
    const totalTasks = atRiskCustomers.reduce((sum, c) => sum + c.tasks.filter(t => t.status === 'open').length, 0);
    const csReps = [...new Set(customers.map(c => c.csOwner))].length;
    const avgDaysAtRisk = atRiskCustomers.length > 0 
      ? Math.round(atRiskCustomers.reduce((sum, c) => sum + c.daysInStage, 0) / atRiskCustomers.length)
      : 0;

    return {
      totalCustomers,
      healthyCount,
      monitorCount,
      atRiskCount,
      totalMRR,
      healthyMRR,
      monitorMRR,
      atRiskMRR,
      protectedMRR,
      riskMRR,
      atRiskCustomers: atRiskCount,
      totalTasks,
      csReps,
      avgDaysAtRisk
    };
  };

  // Filter and sort customers
  const getFilteredAndSortedCustomers = () => {
    let filtered = customers.map(c => ({
      ...c,
      healthScore: calculateHealthScore(c),
      healthStatus: getHealthStatus(calculateHealthScore(c))
    }));

    // Apply filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.healthStatus === filterStatus);
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'healthScore':
          return a.healthScore - b.healthScore; // Lowest first (most urgent)
        case 'mrr':
          return b.mrr - a.mrr; // Highest first
        case 'renewalDate':
          return a.renewalDays - b.renewalDays; // Soonest first
        default:
          return 0;
      }
    });

    return filtered;
  };

  // CRUD operations
  const addCustomer = (customerData) => {
    const newCustomer = {
      ...customerData,
      id: Math.max(...customers.map(c => c.id), 0) + 1,
      tasks: []
    };
    setCustomers([...customers, newCustomer]);
    setShowAddModal(false);
  };

  const updateCustomer = (id, customerData) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, ...customerData } : c));
    setShowEditModal(false);
    setEditingCustomer(null);
  };

  const deleteCustomer = (id) => {
    setCustomers(customers.filter(c => c.id !== id));
    setShowDeleteModal(false);
    setDeletingCustomer(null);
    setDeleteConfirmationCode('');
    setDeleteInputValue('');
  };

  const toggleCardExpansion = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const metrics = calculateMetrics();
  const filteredCustomers = getFilteredAndSortedCustomers();
  const allCustomers = customers.map(c => ({
    ...c,
    healthScore: calculateHealthScore(c),
    healthStatus: getHealthStatus(calculateHealthScore(c))
  }));

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0f',
      color: 'white',
      fontFamily: "'Inter', sans-serif"
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          
          body {
            margin: 0;
            padding: 0;
          }

          .stat-number {
            font-family: 'JetBrains Mono', monospace;
          }

          .card-hover {
            transition: all 0.2s ease;
          }

          .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(139, 92, 246, 0.2);
          }

          /* Pearlescent hover effects for stat cards */
          .stat-card-purple:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(139, 92, 246, 0.6), 0 0 40px rgba(168, 85, 247, 0.4);
            filter: brightness(1.15);
          }

          .stat-card-green:hover {
            transform: translateY(-3px);
            background: rgba(16, 185, 129, 0.08) !important;
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3);
            border-color: rgba(16, 185, 129, 0.6) !important;
          }

          .stat-card-amber:hover {
            transform: translateY(-3px);
            background: rgba(251, 191, 36, 0.08) !important;
            box-shadow: 0 8px 24px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3);
            border-color: rgba(251, 191, 36, 0.6) !important;
          }

          .stat-card-red:hover {
            transform: translateY(-3px);
            background: rgba(239, 68, 68, 0.08) !important;
            box-shadow: 0 8px 24px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 0.6) !important;
          }

          .sort-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 8px;
            background: #1a1a2e;
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 8px;
            padding: 8px;
            min-width: 200px;
            z-index: 100;
          }

          .sort-option {
            padding: 10px 12px;
            cursor: pointer;
            border-radius: 6px;
            transition: background 0.2s;
          }

          .sort-option:hover {
            background: rgba(139, 92, 246, 0.2);
          }

          .sort-option.active {
            background: rgba(139, 92, 246, 0.3);
            color: #a855f7;
          }
        `}
      </style>

      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        padding: '24px 32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              position: 'relative',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.15) 100%)',
                filter: 'blur(2px)'
              }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.08), 0 0 20px rgba(139, 92, 246, 0.15)'
              }} />
              <HeartPulse size={26} style={{ position: 'relative', color: '#a78bfa', strokeWidth: 1.8 }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                Customer Success Hub
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
                GenHealth.ai Account Health and Revenue Intelligence
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Plus size={18} />
              Add Customer
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              style={{
                padding: '12px 24px',
                background: '#1a1a2e',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#1a1a2e';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Settings size={18} />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        background: '#0a0a0f',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        padding: '0 32px'
      }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {[
            { id: 'health', label: 'Customer Health', icon: Activity },
            { id: 'revenue', label: 'Revenue Metrics', icon: DollarSign },
            { id: 'intervention', label: 'Intervention Tracker', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 24px',
                background: activeTab === tab.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #8b5cf6' : '2px solid transparent',
                color: activeTab === tab.id ? '#a855f7' : '#94a3b8',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px' }}>
        {/* VIEW 1: Customer Health */}
        {activeTab === 'health' && (
          <div>
            {/* Stats Bar - Single Row with 1:2 ratio */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 2fr',
              gap: '16px',
              marginBottom: '32px'
            }}>
              {/* Left Side (1/3): Customer Counts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div className="card-hover stat-card-green" style={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>🟢 Healthy</div>
                  <div className="stat-number" style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                    {metrics.healthyCount}
                  </div>
                </div>

                <div className="card-hover stat-card-amber" style={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>🟡 Monitor</div>
                  <div className="stat-number" style={{ fontSize: '24px', fontWeight: '700', color: '#fbbf24' }}>
                    {metrics.monitorCount}
                  </div>
                </div>

                <div className="card-hover stat-card-red" style={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>🔴 At-Risk</div>
                  <div className="stat-number" style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                    {metrics.atRiskCount}
                  </div>
                </div>

                <div className="card-hover stat-card-purple" style={{
                  background: '#1a1a2e',
                  border: '2px solid rgba(139, 92, 246, 0.5)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '11px', color: '#a855f7', marginBottom: '6px' }}>Total</div>
                  <div className="stat-number" style={{ fontSize: '24px', fontWeight: '700', color: '#a855f7' }}>
                    {metrics.totalCustomers}
                  </div>
                </div>
              </div>

              {/* Right Side (2/3): MRR */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div className="card-hover stat-card-green" style={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>Healthy MRR</div>
                  <div className="stat-number" style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                    ${(metrics.healthyMRR / 1000).toFixed(1)}k
                  </div>
                </div>

                <div className="card-hover stat-card-amber" style={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>Monitor MRR</div>
                  <div className="stat-number" style={{ fontSize: '24px', fontWeight: '700', color: '#fbbf24' }}>
                    ${(metrics.monitorMRR / 1000).toFixed(1)}k
                  </div>
                </div>

                <div className="card-hover stat-card-red" style={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>At-Risk MRR</div>
                  <div className="stat-number" style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                    ${(metrics.atRiskMRR / 1000).toFixed(1)}k
                  </div>
                </div>

                <div className="card-hover stat-card-purple" style={{
                  background: '#1a1a2e',
                  border: '2px solid rgba(139, 92, 246, 0.5)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '11px', color: '#a855f7', marginBottom: '6px' }}>Total MRR</div>
                  <div className="stat-number" style={{ fontSize: '24px', fontWeight: '700', color: '#a855f7' }}>
                    ${(metrics.totalMRR / 1000).toFixed(1)}k
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Sort */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'healthy', label: 'Healthy' },
                  { id: 'monitor', label: 'Monitor' },
                  { id: 'at-risk', label: 'At-Risk' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setFilterStatus(filter.id)}
                    style={{
                      padding: '10px 20px',
                      background: filterStatus === filter.id ? 'rgba(139, 92, 246, 0.3)' : '#1a1a2e',
                      border: filterStatus === filter.id ? '1px solid #8b5cf6' : '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '8px',
                      color: filterStatus === filter.id ? '#a855f7' : '#94a3b8',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  style={{
                    padding: '10px 20px',
                    background: '#1a1a2e',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Sort by: {sortBy === 'healthScore' ? 'Health Score' : sortBy === 'mrr' ? 'MRR' : 'Renewal Date'}
                  <ChevronDown size={16} />
                </button>

                {showSortDropdown && (
                  <div className="sort-dropdown">
                    {[
                      { id: 'healthScore', label: 'Health Score (Low → High)' },
                      { id: 'mrr', label: 'MRR (High → Low)' },
                      { id: 'renewalDate', label: 'Renewal Date (Soon → Later)' }
                    ].map(option => (
                      <div
                        key={option.id}
                        className={`sort-option ${sortBy === option.id ? 'active' : ''}`}
                        onClick={() => {
                          setSortBy(option.id);
                          setShowSortDropdown(false);
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Cards Grid */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              {filteredCustomers.map(customer => {
                const activeTriggers = getActiveAutomationTriggers(customer);
                const isExpanded = expandedCards[customer.id];
                
                return (
                  <div
                    key={customer.id}
                    className="card-hover"
                    style={{
                      background: '#1a1a2e',
                      border: `1px solid ${
                        customer.healthStatus === 'healthy' ? 'rgba(16, 185, 129, 0.3)' :
                        customer.healthStatus === 'monitor' ? 'rgba(251, 191, 36, 0.3)' :
                        'rgba(239, 68, 68, 0.3)'
                      }`,
                      borderRadius: '12px',
                      padding: '20px',
                      position: 'relative'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                          {customer.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#94a3b8' }}>
                          <span>Stage: {customer.stage}</span>
                          <span>•</span>
                          <span>{customer.daysInStage} days</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingCustomer(customer);
                            setShowEditModal(true);
                          }}
                          style={{
                            padding: '8px',
                            background: 'rgba(139, 92, 246, 0.2)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '6px',
                            color: '#a855f7',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
                            setDeleteConfirmationCode(randomCode);
                            setDeleteInputValue('');
                            setDeletingCustomer(customer);
                            setShowDeleteModal(true);
                          }}
                          style={{
                            padding: '8px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Health Score Badge */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: customer.healthStatus === 'healthy' ? 'rgba(16, 185, 129, 0.2)' :
                                  customer.healthStatus === 'monitor' ? 'rgba(251, 191, 36, 0.2)' :
                                  'rgba(239, 68, 68, 0.2)',
                      border: `1px solid ${
                        customer.healthStatus === 'healthy' ? 'rgba(16, 185, 129, 0.3)' :
                        customer.healthStatus === 'monitor' ? 'rgba(251, 191, 36, 0.3)' :
                        'rgba(239, 68, 68, 0.3)'
                      }`,
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <span className="stat-number" style={{ 
                        fontSize: '24px', 
                        fontWeight: '700',
                        color: customer.healthStatus === 'healthy' ? '#10b981' :
                               customer.healthStatus === 'monitor' ? '#fbbf24' :
                               '#ef4444'
                      }}>
                        {customer.healthScore}
                      </span>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>Health Score</span>
                      {customer.trend === 'up' && <TrendingUp size={16} color="#10b981" />}
                      {customer.trend === 'down' && <TrendingDown size={16} color="#ef4444" />}
                      {customer.trend === 'stable' && <Minus size={16} color="#94a3b8" />}
                    </div>

                    {/* Key Metrics */}
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>MRR</div>
                        <div className="stat-number" style={{ fontSize: '18px', fontWeight: '600' }}>
                          ${customer.mrr.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Renewal</div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                          {customer.renewalDays} days
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Last Login</div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                          {customer.lastLogin} days ago
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>API Usage</div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                          {customer.apiUsage}%
                        </div>
                      </div>
                    </div>

                    {/* Automation Triggers Preview */}
                    {activeTriggers.length > 0 && (
                      <div style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginTop: '12px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '8px'
                        }}>
                          <Zap size={14} color="#a855f7" />
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#a855f7' }}>
                            Active Triggers ({activeTriggers.length})
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {activeTriggers.map(triggerId => automationTriggers[triggerId].name).join(', ')}
                        </div>
                      </div>
                    )}

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleCardExpansion(customer.id)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '6px',
                        color: '#a855f7',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {isExpanded ? 'Show Less' : 'Show More Details'}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div style={{ 
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid rgba(139, 92, 246, 0.2)'
                      }}>
                        <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Support Tickets:</span>{' '}
                            <span style={{ fontWeight: '600' }}>{customer.supportTickets}</span>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Payment Status:</span>{' '}
                            <span style={{ 
                              fontWeight: '600',
                              color: customer.paymentStatus === 'current' ? '#10b981' :
                                     customer.paymentStatus === 'late' ? '#fbbf24' : '#ef4444'
                            }}>
                              {customer.paymentStatus.charAt(0).toUpperCase() + customer.paymentStatus.slice(1)}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>CS Owner:</span>{' '}
                            <span style={{ fontWeight: '600' }}>{customer.csOwner}</span>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Closed By:</span>{' '}
                            <span style={{ fontWeight: '600' }}>{customer.closedBy}</span>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Deal Source:</span>{' '}
                            <span style={{ fontWeight: '600' }}>{customer.dealSource}</span>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Contract Start:</span>{' '}
                            <span style={{ fontWeight: '600' }}>{customer.contractStart}</span>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Last Touch:</span>{' '}
                            <span style={{ fontWeight: '600' }}>{customer.lastTouchDate}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: Revenue Metrics */}
        {activeTab === 'revenue' && (
          <div>
            {/* Revenue Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div className="card-hover" style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                padding: '24px',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Total ARR</div>
                <div className="stat-number" style={{ fontSize: '32px', fontWeight: '700' }}>
                  ${(metrics.totalMRR * 12 / 1000).toFixed(1)}k
                </div>
              </div>

              <div className="card-hover" style={{
                background: '#1a1a2e',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '24px',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Healthy ARR</div>
                <div className="stat-number" style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
                  ${(metrics.healthyMRR * 12 / 1000).toFixed(1)}k
                </div>
              </div>

              <div className="card-hover" style={{
                background: '#1a1a2e',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                padding: '24px',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Monitor ARR</div>
                <div className="stat-number" style={{ fontSize: '32px', fontWeight: '700', color: '#fbbf24' }}>
                  ${(metrics.monitorMRR * 12 / 1000).toFixed(1)}k
                </div>
              </div>

              <div className="card-hover" style={{
                background: '#1a1a2e',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '24px',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>At-Risk ARR</div>
                <div className="stat-number" style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
                  ${(metrics.atRiskMRR * 12 / 1000).toFixed(1)}k
                </div>
              </div>
            </div>

            {/* ARR Pie Chart */}
            <div style={{
              background: '#1a1a2e',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '600' }}>
                ARR Breakdown by Health Status
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Healthy', value: metrics.healthyMRR * 12, color: '#10b981' },
                        { name: 'Monitor', value: metrics.monitorMRR * 12, color: '#f59e0b' },
                        { name: 'At-Risk', value: metrics.atRiskMRR * 12, color: '#f43f5e' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Healthy', value: metrics.healthyMRR * 12, color: '#10b981' },
                        { name: 'Monitor', value: metrics.monitorMRR * 12, color: '#f59e0b' },
                        { name: 'At-Risk', value: metrics.atRiskMRR * 12, color: '#f43f5e' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1a1a2e', 
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                    />
                    <Legend 
                      wrapperStyle={{ color: 'white' }}
                      formatter={(value) => <span style={{ color: 'white' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              {/* Renewal Risk - Next 90 Days */}
              <div style={{
                background: '#1a1a2e',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} color="#a855f7" />
                  Renewal Risk - Next 90 Days
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {allCustomers
                    .filter(c => c.renewalDays <= 90)
                    .sort((a, b) => a.renewalDays - b.renewalDays)
                    .map(customer => (
                      <div
                        key={customer.id}
                        style={{
                          padding: '16px',
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: `1px solid ${
                            customer.healthStatus === 'at-risk' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(139, 92, 246, 0.3)'
                          }`,
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '600' }}>{customer.name}</span>
                          <span style={{ 
                            color: customer.renewalDays <= 30 ? '#ef4444' : 
                                   customer.renewalDays <= 60 ? '#fbbf24' : '#94a3b8',
                            fontWeight: '600'
                          }}>
                            {customer.renewalDays} days
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8' }}>
                          <span>Health: {customer.healthScore}</span>
                          <span>MRR: ${customer.mrr.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Highest Revenue Risk */}
              <div style={{
                background: '#1a1a2e',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} color="#ef4444" />
                  Highest Revenue Risk
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {allCustomers
                    .filter(c => c.healthStatus === 'at-risk')
                    .sort((a, b) => b.mrr - a.mrr)
                    .map(customer => (
                      <div
                        key={customer.id}
                        style={{
                          padding: '16px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '600' }}>{customer.name}</span>
                          <span className="stat-number" style={{ color: '#ef4444', fontWeight: '700' }}>
                            ${(customer.mrr / 1000).toFixed(1)}k
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8' }}>
                          <span>Health: {customer.healthScore}</span>
                          <span>Stage: {customer.stage}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Intervention Tracker */}
        {activeTab === 'intervention' && (
          <div>
            {/* Overview Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div className="card-hover" style={{
                background: '#1a1a2e',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '24px',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>At-Risk Customers</div>
                <div className="stat-number" style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
                  {metrics.atRiskCustomers}
                </div>
              </div>

              <div className="card-hover" style={{
                background: '#1a1a2e',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '24px',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Open Tasks</div>
                <div className="stat-number" style={{ fontSize: '32px', fontWeight: '700', color: '#a855f7' }}>
                  {metrics.totalTasks}
                </div>
              </div>

              <div className="card-hover" style={{
                background: '#1a1a2e',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '24px',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>CS Reps</div>
                <div className="stat-number" style={{ fontSize: '32px', fontWeight: '700' }}>
                  {metrics.csReps}
                </div>
              </div>

              <div className="card-hover" style={{
                background: '#1a1a2e',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '24px',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Avg Days At-Risk</div>
                <div className="stat-number" style={{ fontSize: '32px', fontWeight: '700' }}>
                  {metrics.avgDaysAtRisk}
                </div>
              </div>
            </div>

            {/* Intervention Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {customers
                .map(c => ({
                  ...c,
                  healthScore: calculateHealthScore(c),
                  healthStatus: getHealthStatus(calculateHealthScore(c))
                }))
                .filter(c => c.healthStatus === 'at-risk')
                .sort((a, b) => a.healthScore - b.healthScore) // Lowest score first (most urgent)
                .map(customer => {
                  const openTasks = customer.tasks.filter(t => t.status === 'open');
                  const completedTasks = customer.tasks.filter(t => t.status === 'completed');
                  
                  // Determine color coding based on health score
                  const getBorderColor = (score) => {
                    if (score >= 50) return 'rgba(251, 191, 36, 0.5)'; // Amber for 50-59
                    if (score >= 40) return 'rgba(239, 68, 68, 0.5)'; // Red for 40-49
                    return 'rgba(220, 38, 38, 0.8)'; // Dark red for critical <40
                  };
                  
                  const getBackgroundColor = (score) => {
                    if (score >= 50) return 'rgba(251, 191, 36, 0.05)';
                    if (score >= 40) return 'rgba(239, 68, 68, 0.05)';
                    return 'rgba(220, 38, 38, 0.1)';
                  };
                  
                  const getScoreColor = (score) => {
                    if (score >= 50) return '#fbbf24'; // Amber
                    if (score >= 40) return '#ef4444'; // Red
                    return '#dc2626'; // Dark red
                  };
                  
                  return (
                    <div
                      key={customer.id}
                      style={{
                        background: getBackgroundColor(customer.healthScore),
                        border: `2px solid ${getBorderColor(customer.healthScore)}`,
                        borderRadius: '12px',
                        padding: '24px'
                      }}
                    >
                      {/* Customer Header */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
                              {customer.name}
                            </h3>
                            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                              Health Score: <span style={{ color: getScoreColor(customer.healthScore), fontWeight: '700', fontSize: '15px' }}>{customer.healthScore}</span>
                              {' • '}
                              MRR: <span style={{ fontWeight: '600' }}>${customer.mrr.toLocaleString()}</span>
                            </div>
                          </div>
                          <div style={{
                            padding: '8px 16px',
                            background: customer.healthScore < 40 ? 'rgba(220, 38, 38, 0.2)' : 
                                        customer.healthScore < 50 ? 'rgba(239, 68, 68, 0.2)' : 
                                        'rgba(251, 191, 36, 0.2)',
                            border: `1px solid ${getBorderColor(customer.healthScore)}`,
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: getScoreColor(customer.healthScore)
                          }}>
                            {customer.daysInStage} days in {customer.stage}
                          </div>
                        </div>

                        {/* Ownership Context */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '12px',
                          padding: '16px',
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '8px'
                        }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>CS Owner</div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>{customer.csOwner}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Closed By</div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>{customer.closedBy}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Last Touch</div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>{customer.lastTouchDate}</div>
                          </div>
                        </div>
                      </div>

                      {/* Active Tasks */}
                      {openTasks.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ 
                            margin: '0 0 12px 0', 
                            fontSize: '14px', 
                            fontWeight: '600',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <Clock size={16} />
                            Active Tasks ({openTasks.length})
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {openTasks.map(task => (
                              <div
                                key={task.id}
                                style={{
                                  padding: '12px 16px',
                                  background: task.priority === 'critical' ? 'rgba(239, 68, 68, 0.1)' :
                                              task.priority === 'high' ? 'rgba(251, 191, 36, 0.1)' :
                                              'rgba(139, 92, 246, 0.1)',
                                  border: `1px solid ${
                                    task.priority === 'critical' ? 'rgba(239, 68, 68, 0.3)' :
                                    task.priority === 'high' ? 'rgba(251, 191, 36, 0.3)' :
                                    'rgba(139, 92, 246, 0.3)'
                                  }`,
                                  borderRadius: '8px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{task.name}</div>
                                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                    Due: {task.dueDate}
                                    {task.triggerId && ` • Triggered by: ${automationTriggers[task.triggerId]?.name}`}
                                  </div>
                                </div>
                                <div style={{
                                  padding: '4px 12px',
                                  background: task.priority === 'critical' ? 'rgba(239, 68, 68, 0.2)' :
                                              task.priority === 'high' ? 'rgba(251, 191, 36, 0.2)' :
                                              'rgba(139, 92, 246, 0.2)',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                  color: task.priority === 'critical' ? '#ef4444' :
                                         task.priority === 'high' ? '#fbbf24' :
                                         '#a855f7'
                                }}>
                                  {task.priority}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Completed Tasks */}
                      {completedTasks.length > 0 && (
                        <div>
                          <h4 style={{ 
                            margin: '0 0 12px 0', 
                            fontSize: '14px', 
                            fontWeight: '600',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <CheckCircle size={16} color="#10b981" />
                            Completed Tasks ({completedTasks.length})
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {completedTasks.map(task => (
                              <div
                                key={task.id}
                                style={{
                                  padding: '12px 16px',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  borderRadius: '8px',
                                  opacity: 0.7
                                }}
                              >
                                <div style={{ fontWeight: '600', marginBottom: '4px', textDecoration: 'line-through' }}>
                                  {task.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                  Completed: {task.completedDate}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No tasks message */}
                      {customer.tasks.length === 0 && (
                        <div style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: '#94a3b8',
                          fontSize: '14px'
                        }}>
                          No intervention tasks created yet
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {(showAddModal || showEditModal) && (
        <CustomerFormModal
          customer={editingCustomer}
          onSave={editingCustomer ? (data) => updateCustomer(editingCustomer.id, data) : addCustomer}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
              Delete Customer?
            </h2>
            <p style={{ margin: '0 0 16px 0', color: '#94a3b8' }}>
              Are you sure you want to delete <strong>{deletingCustomer.name}</strong>? This action cannot be undone.
            </p>
            <p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '14px' }}>
              To confirm deletion, please type: <span style={{ 
                fontFamily: 'JetBrains Mono, monospace', 
                color: '#ef4444', 
                fontWeight: '700',
                fontSize: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>{deleteConfirmationCode}</span>
            </p>
            <input
              type="text"
              value={deleteInputValue}
              onChange={(e) => setDeleteInputValue(e.target.value.toUpperCase())}
              placeholder="Enter confirmation code"
              style={{
                width: '100%',
                padding: '12px',
                background: '#0a0a0f',
                border: `1px solid ${deleteInputValue === deleteConfirmationCode ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontFamily: 'JetBrains Mono, monospace',
                marginBottom: '24px',
                textTransform: 'uppercase'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingCustomer(null);
                  setDeleteConfirmationCode('');
                  setDeleteInputValue('');
                }}
                style={{
                  padding: '12px 24px',
                  background: '#1a1a2e',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteInputValue === deleteConfirmationCode) {
                    deleteCustomer(deletingCustomer.id);
                  }
                }}
                disabled={deleteInputValue !== deleteConfirmationCode}
                style={{
                  padding: '12px 24px',
                  background: deleteInputValue === deleteConfirmationCode ? '#ef4444' : '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: deleteInputValue === deleteConfirmationCode ? 'pointer' : 'not-allowed',
                  opacity: deleteInputValue === deleteConfirmationCode ? 1 : 0.5
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          healthWeights={healthWeights}
          automationTriggers={automationTriggers}
          settingsTab={settingsTab}
          onSettingsTabChange={setSettingsTab}
          onWeightsChange={setHealthWeights}
          onTriggersChange={setAutomationTriggers}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}

// Customer Form Modal Component
function CustomerFormModal({ customer, onSave, onClose }) {
  const [formData, setFormData] = useState(customer || {
    name: '',
    mrr: 0,
    stage: 'Signed',
    daysInStage: 0,
    lastLogin: 0,
    apiUsage: 0,
    supportTickets: 0,
    paymentStatus: 'current',
    renewalDays: 365,
    contractStart: new Date().toISOString().split('T')[0],
    trend: 'stable',
    closedBy: '',
    csOwner: '',
    dealSource: 'Inbound',
    lastTouchDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflow: 'auto',
      padding: '20px'
    }}>
      <div className="customer-form-modal" style={{
        background: '#1a1a2e',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Customer Name */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0a0a0f',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* MRR */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                MRR ($) *
              </label>
              <input
                type="number"
                required
                value={formData.mrr}
                onChange={(e) => setFormData({ ...formData, mrr: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0a0a0f',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Stage and Days in Stage */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Stage *
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="Signed">Signed</option>
                  <option value="Kickoff">Kickoff</option>
                  <option value="Integration">Integration</option>
                  <option value="Training">Training</option>
                  <option value="Go-Live">Go-Live</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Days in Stage *
                </label>
                <input
                  type="number"
                  required
                  value={formData.daysInStage}
                  onChange={(e) => setFormData({ ...formData, daysInStage: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Last Login and API Usage */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Last Login (days ago) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.lastLogin}
                  onChange={(e) => setFormData({ ...formData, lastLogin: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  API Usage (%) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={formData.apiUsage}
                  onChange={(e) => setFormData({ ...formData, apiUsage: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Support Tickets and Payment Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Support Tickets *
                </label>
                <input
                  type="number"
                  required
                  value={formData.supportTickets}
                  onChange={(e) => setFormData({ ...formData, supportTickets: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Payment Status *
                </label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="current">Current</option>
                  <option value="late">Late</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Renewal Days and Trend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Renewal (days) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.renewalDays}
                  onChange={(e) => setFormData({ ...formData, renewalDays: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Trend *
                </label>
                <select
                  value={formData.trend}
                  onChange={(e) => setFormData({ ...formData, trend: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="up">Up ↑</option>
                  <option value="stable">Stable →</option>
                  <option value="down">Down ↓</option>
                </select>
              </div>
            </div>

            {/* Contract Start and Last Touch */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Contract Start *
                </label>
                <input
                  type="date"
                  required
                  value={formData.contractStart}
                  onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Last Touch Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.lastTouchDate}
                  onChange={(e) => setFormData({ ...formData, lastTouchDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* CS Owner and Closed By */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  CS Owner *
                </label>
                <input
                  type="text"
                  required
                  value={formData.csOwner}
                  onChange={(e) => setFormData({ ...formData, csOwner: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Closed By *
                </label>
                <input
                  type="text"
                  required
                  value={formData.closedBy}
                  onChange={(e) => setFormData({ ...formData, closedBy: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Deal Source */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                Deal Source *
              </label>
              <select
                value={formData.dealSource}
                onChange={(e) => setFormData({ ...formData, dealSource: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0a0a0f',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
                <option value="Partner Referral">Partner Referral</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: '#1a1a2e',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {customer ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Settings Modal Component
function SettingsModal({ healthWeights, automationTriggers, settingsTab, onSettingsTabChange, onWeightsChange, onTriggersChange, onClose }) {
  const [localWeights, setLocalWeights] = useState(healthWeights);
  const [localTriggers, setLocalTriggers] = useState(automationTriggers);

  const totalWeight = Object.values(localWeights).reduce((sum, val) => sum + val, 0);
  const isValidWeight = totalWeight === 100;

  const handleSave = () => {
    if (!isValidWeight) {
      alert('Health weights must total 100%');
      return;
    }
    onWeightsChange(localWeights);
    onTriggersChange(localTriggers);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#1a1a2e',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Settings</h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          marginBottom: '24px'
        }}>
          {[
            { id: 'weights', label: 'Health Weights' },
            { id: 'automation', label: 'Automation Rules' },
            { id: 'guide', label: 'Quick Guide' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onSettingsTabChange(tab.id)}
              style={{
                padding: '12px 20px',
                background: settingsTab === tab.id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                border: 'none',
                borderBottom: settingsTab === tab.id ? '2px solid #8b5cf6' : '2px solid transparent',
                color: settingsTab === tab.id ? '#a855f7' : '#94a3b8',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Health Weights Tab */}
        {settingsTab === 'weights' && (
          <div>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
              Adjust the weight of each factor in the health score calculation. Total must equal 100%.
            </p>

            <div style={{ marginBottom: '24px' }}>
              {Object.entries(localWeights).map(([key, value]) => (
                <div key={key} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>
                      {key === 'api' ? 'API Usage' : key}
                    </label>
                    <span className="stat-number" style={{ fontSize: '16px', fontWeight: '700', color: '#a855f7' }}>
                      {value}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => setLocalWeights({ ...localWeights, [key]: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${value}%, #1a1a2e ${value}%, #1a1a2e 100%)`,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{
              padding: '16px',
              background: isValidWeight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${isValidWeight ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Total Weight:</span>
                <span className="stat-number" style={{ 
                  fontSize: '20px', 
                  fontWeight: '700',
                  color: isValidWeight ? '#10b981' : '#ef4444'
                }}>
                  {totalWeight}%
                </span>
              </div>
              {!isValidWeight && (
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#ef4444' }}>
                  Weights must total exactly 100%
                </p>
              )}
            </div>
          </div>
        )}

        {/* Automation Rules Tab */}
        {settingsTab === 'automation' && (
          <div>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
              Enable or disable automation triggers that create tasks and alerts.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.values(localTriggers).map(trigger => (
                <div
                  key={trigger.id}
                  style={{
                    padding: '20px',
                    background: trigger.enabled ? 'rgba(139, 92, 246, 0.1)' : 'rgba(71, 85, 105, 0.1)',
                    border: `1px solid ${trigger.enabled ? 'rgba(139, 92, 246, 0.3)' : 'rgba(71, 85, 105, 0.3)'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                      {trigger.name}
                    </h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#94a3b8' }}>
                      Condition: {trigger.condition}
                    </p>
                    <p style={{ margin: '0', fontSize: '13px', color: '#94a3b8' }}>
                      Action: {trigger.action}
                    </p>
                    <div style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      padding: '4px 8px',
                      background: trigger.priority === 'critical' ? 'rgba(239, 68, 68, 0.2)' :
                                  trigger.priority === 'high' ? 'rgba(251, 191, 36, 0.2)' :
                                  'rgba(139, 92, 246, 0.2)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      color: trigger.priority === 'critical' ? '#ef4444' :
                             trigger.priority === 'high' ? '#fbbf24' :
                             '#a855f7'
                    }}>
                      {trigger.priority}
                    </div>
                  </div>
                  <label style={{ 
                    position: 'relative',
                    display: 'inline-block',
                    width: '60px',
                    height: '32px',
                    marginLeft: '20px'
                  }}>
                    <input
                      type="checkbox"
                      checked={trigger.enabled}
                      onChange={(e) => setLocalTriggers({
                        ...localTriggers,
                        [trigger.id]: { ...trigger, enabled: e.target.checked }
                      })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: trigger.enabled ? '#8b5cf6' : '#475569',
                      borderRadius: '16px',
                      transition: 'background 0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '24px',
                        width: '24px',
                        left: trigger.enabled ? '32px' : '4px',
                        bottom: '4px',
                        background: 'white',
                        borderRadius: '50%',
                        transition: 'left 0.3s'
                      }} />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Guide Tab */}
        {settingsTab === 'guide' && (
          <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#94a3b8' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}>Customer Health Hub - Quick Guide</h3>
            
            <h4 style={{ color: '#a855f7', marginTop: '24px' }}>Health Score Calculation</h4>
            <p>
              Health scores range from 0-100 based on weighted factors:
            </p>
            <ul>
              <li><strong>Login Activity:</strong> Recent logins indicate engagement</li>
              <li><strong>API Usage:</strong> Higher usage shows product adoption</li>
              <li><strong>Support Tickets:</strong> Fewer tickets suggest smoother experience</li>
              <li><strong>Payment Status:</strong> Current payments reduce risk</li>
              <li><strong>Stage Progress:</strong> On-time stage progression is healthy</li>
            </ul>

            <h4 style={{ color: '#a855f7', marginTop: '24px' }}>Health Tiers</h4>
            <ul>
              <li><strong style={{ color: '#10b981' }}>🟢 Healthy (80-100):</strong> Low risk, high engagement</li>
              <li><strong style={{ color: '#fbbf24' }}>🟡 Monitor (60-79):</strong> Watch closely for changes</li>
              <li><strong style={{ color: '#ef4444' }}>🔴 At-Risk (0-59):</strong> Immediate intervention needed</li>
            </ul>

            <h4 style={{ color: '#a855f7', marginTop: '24px' }}>Three Views</h4>
            <ul>
              <li><strong>Customer Health:</strong> Daily CS operations and customer cards</li>
              <li><strong>Revenue Metrics:</strong> Financial impact and ARR breakdown</li>
              <li><strong>Intervention Tracker:</strong> Task ownership and accountability</li>
            </ul>

            <h4 style={{ color: '#a855f7', marginTop: '24px' }}>Automation Triggers</h4>
            <p>
              Five automated triggers create tasks and alerts when conditions are met. Configure them in the Automation Rules tab.
            </p>

            <h4 style={{ color: '#a855f7', marginTop: '24px' }}>Data Persistence</h4>
            <p>
              All data is saved to your browser's LocalStorage and persists across sessions. Clear browser data to reset.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: '#1a1a2e',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          {settingsTab !== 'guide' && (
            <button
              onClick={handleSave}
              disabled={!isValidWeight}
              style={{
                padding: '12px 24px',
                background: isValidWeight ? 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' : '#475569',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isValidWeight ? 'pointer' : 'not-allowed',
                opacity: isValidWeight ? 1 : 0.5
              }}
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
