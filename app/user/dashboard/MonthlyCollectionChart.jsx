'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLLECTED_COLOR = '#10b981';
const PENDING_COLOR = '#f59e0b';

const formatINR = (value) => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

// Compact Indian notation for the y-axis: ₹1.2Cr, ₹4.5L, ₹12K
const formatCompactINR = (value) => {
    if (value >= 1e7) return `₹${+(value / 1e7).toFixed(1)}Cr`;
    if (value >= 1e5) return `₹${+(value / 1e5).toFixed(1)}L`;
    if (value >= 1e3) return `₹${+(value / 1e3).toFixed(1)}K`;
    return `₹${value}`;
}

function ChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const percent = d.billed > 0 ? Math.round((d.collected / d.billed) * 100) : 0;

    return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-sm min-w-44">
            <p className="font-bold text-gray-900 mb-1.5">
                {d.payPeriod.replace('-', ' ')}
                {d.upcoming && <span className="ml-2 text-xs font-medium text-gray-500">Upcoming</span>}
            </p>
            <div className="space-y-1">
                <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Billed</span>
                    <span className="font-semibold text-gray-900">{formatINR(d.billed)}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-gray-600">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLLECTED_COLOR }} />
                        Collected
                    </span>
                    <span className="font-semibold text-gray-900">{formatINR(d.collected)}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-gray-600">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PENDING_COLOR }} />
                        Pending
                    </span>
                    <span className="font-semibold text-gray-900">{formatINR(d.pending)}</span>
                </div>
            </div>
            {d.billed > 0 && (
                <p className="mt-1.5 pt-1.5 border-t border-gray-100 text-xs text-gray-500 font-medium">{percent}% collected</p>
            )}
        </div>
    )
}

export default function MonthlyCollectionChart({ data }) {
    return (
        <div>
            <div className="flex items-center gap-4 mb-3 text-xs font-medium text-gray-600">
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLLECTED_COLOR }} />
                    Collected
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PENDING_COLOR }} />
                    Pending
                </span>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#e5e7eb' }} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tickFormatter={formatCompactINR} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={56} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f5f3ff' }} />
                    <Bar dataKey="collected" stackId="a" fill={COLLECTED_COLOR} stroke="#ffffff" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {data.map((d) => <Cell key={d.payPeriod} fillOpacity={d.upcoming ? 0.45 : 1} />)}
                    </Bar>
                    <Bar dataKey="pending" stackId="a" fill={PENDING_COLOR} stroke="#ffffff" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {data.map((d) => <Cell key={d.payPeriod} fillOpacity={d.upcoming ? 0.45 : 1} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
