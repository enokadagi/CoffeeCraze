import { lazy, Suspense } from 'react';

const RechartsBar = lazy(async () => {
  const { BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, YAxis } = await import('recharts');
  return {
    default: function WeeklyBarChart({ data }: { data: { name: string; revenue: number }[] }) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#1a0f0a" name="Revenue (Millions LBP)" />
          </BarChart>
        </ResponsiveContainer>
      );
    },
  };
});

export default function AdminWeeklyRevenueChart({ data }: { data: { name: string; revenue: number }[] }) {
  return (
    <Suspense fallback={<div className="h-[300px] bg-espresso/5 animate-pulse rounded-xl" />}>
      <RechartsBar data={data} />
    </Suspense>
  );
}
