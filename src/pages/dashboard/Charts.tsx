import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';

function ChartTooltip({ active, payload, label, prefix = '' }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; prefix?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 shadow-float text-xs">
      {label && <p className="font-medium text-ink-700 dark:text-ink-200 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-500 dark:text-ink-400 capitalize">{p.name}:</span>
          <span className="font-medium text-ink-800 dark:text-ink-200">{prefix}{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: { data: { month: string; revenue: number; expenses: number }[] }) {
  const { theme } = useTheme();
  const grid = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const axis = theme === 'dark' ? '#64748b' : '#94a3b8';

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Revenue Overview</CardTitle>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-ink-500"><span className="h-2.5 w-2.5 rounded-full bg-primary-500" />Revenue</span>
          <span className="flex items-center gap-1.5 text-ink-500"><span className="h-2.5 w-2.5 rounded-full bg-accent-400" />Expenses</span>
        </div>
      </CardHeader>
      <CardBody className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="month" stroke={axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={axis} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs. ${v / 1000}k`} />
            <RTooltip content={<ChartTooltip prefix="Rs. " />} />
            <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#rev)" />
            <Area type="monotone" dataKey="expenses" stroke="#22d3ee" strokeWidth={2.5} fill="url(#exp)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}

export function PatientFlowChart({ data }: { data: { day: string; admitted: number; discharged: number }[] }) {
  const { theme } = useTheme();
  const grid = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const axis = theme === 'dark' ? '#64748b' : '#94a3b8';

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Patient Flow</CardTitle>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-ink-500"><span className="h-2.5 w-2.5 rounded-full bg-primary-500" />Admitted</span>
          <span className="flex items-center gap-1.5 text-ink-500"><span className="h-2.5 w-2.5 rounded-full bg-secondary-500" />Discharged</span>
        </div>
      </CardHeader>
      <CardBody className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="day" stroke={axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={axis} fontSize={12} tickLine={false} axisLine={false} />
            <RTooltip content={<ChartTooltip />} cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
            <Bar dataKey="admitted" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="discharged" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}

export function DepartmentPie({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Patients by Department</CardTitle>
      </CardHeader>
      <CardBody className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none">
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <RTooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center -mt-6">
          {data.slice(0, 5).map((d) => (
            <span key={d.name} className="flex items-center gap-1.5 text-xs text-ink-500">
              <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />{d.name}
            </span>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function AppointmentTypeChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Appointment Types</CardTitle>
      </CardHeader>
      <CardBody className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} paddingAngle={3} stroke="none">
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <RTooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center -mt-4">
          {data.map((d) => (
            <span key={d.name} className="flex items-center gap-1.5 text-xs text-ink-500">
              <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />{d.name}
            </span>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
