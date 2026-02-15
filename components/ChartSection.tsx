import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction, TransactionType, TransactionStatus } from '../types';

interface ChartSectionProps {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4'];

export const ChartSection: React.FC<ChartSectionProps> = ({ transactions }) => {
  // Aggregate expenses by category
  const data = React.useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE && t.status === TransactionStatus.COMPLETED);
    const categoryMap: Record<string, number> = {};

    expenses.forEach(t => {
      if (categoryMap[t.category]) {
        categoryMap[t.category] += t.amount;
      } else {
        categoryMap[t.category] = t.amount;
      }
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-card rounded-2xl border border-slate-700 p-6 text-center">
        <p className="text-slate-400 mb-2">No expense data to visualize yet.</p>
        <p className="text-xs text-slate-500">Add completed expenses to see the breakdown.</p>
      </div>
    );
  }

  return (
    <div className="bg-card p-4 rounded-2xl border border-slate-700 h-80 w-full">
      <h3 className="text-slate-100 font-semibold mb-4">Expense Breakdown</h3>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
            itemStyle={{ color: '#f8fafc' }}
            formatter={(value: number) => [`${value.toFixed(2)}`, 'Amount']}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-slate-300 text-xs ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
