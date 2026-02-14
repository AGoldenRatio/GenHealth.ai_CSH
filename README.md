# Customer Success Hub 🎯

> GenHealth.ai Account Health and Revenue Intelligence

A React-based Customer Success operations dashboard that transforms customer data into proactive action. Built with health scoring algorithms, automation triggers, and revenue risk tracking to help CS teams prevent churn before it happens.

## 🚀 Features

- **Health Scoring Engine** - Real-time calculation based on login activity, API usage, support tickets, payment status, and stage progress
- **Automated Intervention Triggers** - 5 configurable automation rules that create tasks when customers show risk signals
- **Revenue Intelligence** - Track MRR by health status with visual ARR breakdown
- **Proactive Operations** - Intervention tracker with task ownership and accountability
- **Configurable Weights** - Adjust health score factors to match your business model
- **Dark Theme UI** - Professional, polished interface with pearlescent hover effects
- **Secure Delete** - Confirmation code required for destructive actions

## 📊 Dashboard Views

1. **Customer Health** - Daily CS operations with filterable customer cards
2. **Revenue Metrics** - Executive financial view with ARR breakdown and renewal risk
3. **Intervention Tracker** - Task ownership, active/completed interventions, color-coded severity

## 🛠️ Tech Stack

- React 18+ (Functional components + Hooks)
- Vite (Build tool)
- Recharts (ARR pie chart visualization)
- Lucide React (Icon system)
- LocalStorage (Data persistence)
- Tailwind-inspired color system

## 🎨 Design System

- **Green (#10b981)** - Healthy accounts
- **Amber (#f59e0b)** - Monitor status
- **Red (#ef4444)** - At-risk accounts
- **Purple (#8b5cf6)** - Totals and metrics
- **Dark Theme** - #0a0a0f background

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📦 Key Dependencies

```json
{
  "react": "^18.2.0",
  "lucide-react": "^0.263.1",
  "recharts": "^2.5.0",
  "vite": "^5.0.8"
}
```

## 🎯 Use Cases

- **CS Operations Teams** - Daily health monitoring and task management
- **Revenue Leaders** - Financial impact visibility and churn prevention
- **Account Managers** - Proactive customer engagement tracking
- **SaaS Founders** - Customer health intelligence without expensive CS platforms

## 🔧 Configuration

Health scoring weights are fully configurable in Settings:
- Login Activity (default: 25%)
- API Usage (default: 25%)
- Support Tickets (default: 20%)
- Payment Status (default: 15%)
- Stage Progress (default: 15%)

## 📝 Sample Data

Includes 6 realistic DME healthcare SaaS customers with:
- Health scores ranging from 31 (critical) to 94 (healthy)
- Multiple customer journey stages
- Automation-triggered tasks
- Complete ownership context

## 🔒 Data Persistence

- LocalStorage key: `gen_health_cs_hub`
- Survives page refresh
- Ready for backend integration

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push this repo to GitHub
2. Import project in Vercel
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AGoldenRatio/GenHealth.ai_CSH)

## 🎓 Built For

GenHealth.ai GTM Operations Generalist Assessment - Part 2 (AI-Powered Tool Demo)

## 📄 License

MIT

---

**Built with Claude (Anthropic) | Designed for Customer Success Operations Excellence**
