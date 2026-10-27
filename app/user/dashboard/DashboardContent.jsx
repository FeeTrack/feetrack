'use client';

import { createClientSupabase } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, IndianRupee, Wallet, AlertCircle, Plus, CreditCard, ArrowRight, FileDown } from "lucide-react";
import { useSession } from "@/Context/SessionContext";
import { months } from "@/utils/constants/backend";
import MonthlyCollectionChart from "./MonthlyCollectionChart";
import { generateMonthlyCollectionPdf } from "./generateMonthlyCollectionPdf";

const formatINR = (value) => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const formatPaymentTime = (date) => new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});

export default function DashboardContent({profile}) {
    const { currentSession, sessionLoading } = useSession();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalFees: 0,
        totalCollection: 0,
        feesDue: 0,
    })
    const [monthlyData, setMonthlyData] = useState([]);
    const [recentPayments, setRecentPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const sessionStartYear = parseInt(currentSession?.name.split('-')[0]);

    const currentMonth = new Date().getMonth() + 1; // Months are 0-indexed

    let monthsPassed;
    if (currentMonth >= 4) {
        monthsPassed = months.slice(0, currentMonth - 3);
    } else {
        monthsPassed = months.slice(0, currentMonth + 9);
    }

    const toPayPeriod = (m) => m.number <= 3 ? `${m.name}-${sessionStartYear + 1}` : `${m.name}-${sessionStartYear}`;
    const passedPayPeriods = monthsPassed.map(toPayPeriod);

    useEffect(() => {
        if (currentSession) {
            fetchStats();
        }
    }, [currentSession])

    const fetchStats = async () => {
        setLoading(true)

        try {
            const supabase = createClientSupabase();

            const [{count: studentCount}, {data: summary, error: summaryError}, {data: payments}] = await Promise.all([
                supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true })
                    .eq('school_id', profile.school_id)
                    .eq('session_id', currentSession.id),
                // Totals are summed in the database: one row per pay period instead of every invoice
                supabase.rpc('get_monthly_fee_summary', {
                    p_school_id: profile.school_id,
                    p_session_id: currentSession.id,
                }),
                supabase
                    .from('payments')
                    .select('id, receipt_no, amount, method, created_at, students(name, classes(name), sections(name))')
                    .eq('school_id', profile.school_id)
                    .eq('session_id', currentSession.id)
                    .order('created_at', { ascending: false })
                    .limit(5),
            ]);

            if (summaryError) throw summaryError;
            const periods = summary || [];

            const totalFees = periods.reduce((sum, p) => sum + Number(p.billed), 0);
            const totalCollection = periods.reduce((sum, p) => sum + Number(p.collected), 0);

            const uptoCurrentPeriods = periods.filter(p => passedPayPeriods.includes(p.pay_period));
            const uptoCurrentFees = uptoCurrentPeriods.reduce((sum, p) => sum + Number(p.billed), 0);
            const uptoCurrentCollection = uptoCurrentPeriods.reduce((sum, p) => sum + Number(p.collected), 0);
            const uptoCurrentDueFees = uptoCurrentFees - uptoCurrentCollection;

            const monthly = months.map(m => {
                const payPeriod = toPayPeriod(m);
                const period = periods.find(p => p.pay_period === payPeriod);
                const billed = Number(period?.billed || 0);
                const collected = Number(period?.collected || 0);
                return {
                    month: m.name,
                    payPeriod,
                    billed,
                    collected,
                    pending: Math.max(billed - collected, 0),
                    upcoming: !passedPayPeriods.includes(payPeriod),
                };
            });

            setStats({
                totalStudents: studentCount || 0,
                totalFees,
                totalCollection,
                feesDue: uptoCurrentDueFees,
            });
            setMonthlyData(monthly);
            setRecentPayments(payments || []);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleGeneratePdf = async () => {
        setGeneratingPdf(true);
        try {
            await generateMonthlyCollectionPdf({
                schoolName: profile.schools?.name,
                sessionName: currentSession.name,
                monthlyData,
            });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error('Failed to generate PDF.');
        } finally {
            setGeneratingPdf(false);
        }
    }

    if (sessionLoading || loading) {
        return <DashboardSkeleton />
    }

    const collectedPercent = stats.totalFees > 0 ? Math.round((stats.totalCollection / stats.totalFees) * 100) : 0;

    const statCards = [
        {
            title: 'Total Students',
            value: stats.totalStudents.toLocaleString('en-IN'),
            icon: Users,
            description: `In ${currentSession.name}`,
            iconStyle: 'bg-indigo-50 text-indigo-600',
        },
        {
            title: 'Total Fees',
            value: formatINR(stats.totalFees),
            icon: IndianRupee,
            description: `For ${currentSession.name}`,
            iconStyle: 'bg-violet-50 text-violet-600',
        },
        {
            title: 'Total Collected',
            value: formatINR(stats.totalCollection),
            icon: Wallet,
            description: `${collectedPercent}% of Total Fees`,
            iconStyle: 'bg-emerald-50 text-emerald-600',
            progress: Math.min(collectedPercent, 100),
        },
        {
            title: 'Fees Due',
            value: formatINR(stats.feesDue),
            icon: AlertCircle,
            description: `Upto Current Month (${passedPayPeriods[passedPayPeriods.length - 1]})`,
            iconStyle: 'bg-rose-50 text-rose-600',
        },
    ]

    const quickActions = [
        {
            title: 'Add Student',
            icon: Plus,
            href: '/user/students/add-student',
            border: 'border-indigo-300 hover:border-indigo-500',
            iconColor: 'text-indigo-500',
            iconBg: 'bg-indigo-50',
        },
        {
            title: 'Collect Fees',
            icon: IndianRupee,
            href: '/user/fees/collect',
            border: 'border-amber-300 hover:border-amber-500',
            iconColor: 'text-amber-500',
            iconBg: 'bg-amber-50',
        },
        {
            title: 'View Defaulters',
            icon: AlertCircle,
            href: '/user/fees/defaulters',
            border: 'border-rose-300 hover:border-rose-500',
            iconColor: 'text-rose-500',
            iconBg: 'bg-rose-50',
        },
        {
            title: 'Recent Payments',
            icon: CreditCard,
            href: '/user/payments',
            border: 'border-indigo-300 hover:border-indigo-500',
            iconColor: 'text-indigo-500',
            iconBg: 'bg-indigo-50',
        },
    ]

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome, {profile.name}</h2>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <Card key={index} className='shadow-sm border-gray-200 hover:shadow-md transition-shadow gap-3'>
                        <CardHeader className='flex flex-row items-center justify-between gap-2'>
                            <CardTitle className='text-sm font-semibold text-gray-600'>
                                {stat.title}
                            </CardTitle>

                            <div className={`${stat.iconStyle} p-2 rounded-lg shrink-0`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight break-words">{stat.value}</div>
                            {stat.progress !== undefined && (
                                <div className="mt-2 h-2 rounded-full bg-emerald-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${stat.progress}%` }} />
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-2 font-medium">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Monthly Collection & Recent Payments */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Card className='lg:col-span-2 shadow-sm border-gray-200'>
                    <CardHeader className='flex flex-row items-start justify-between gap-2'>
                        <div className="space-y-2">
                            <CardTitle className='text-lg font-bold text-gray-900'>Monthly Collection</CardTitle>
                            <p className="text-xs text-muted-foreground font-medium">Fees collected and pending by month, {currentSession.name}</p>
                        </div>
                        <button
                            onClick={handleGeneratePdf}
                            disabled={generatingPdf}
                            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer disabled:opacity-60 disabled:cursor-wait shrink-0"
                        >
                            <FileDown className="h-3.5 w-3.5" /> {generatingPdf ? 'Generating...' : 'Generate PDF'}
                        </button>
                    </CardHeader>
                    <CardContent>
                        <MonthlyCollectionChart data={monthlyData} />
                    </CardContent>
                </Card>

                <Card className='shadow-sm border-gray-200'>
                    <CardHeader className='flex flex-row items-center justify-between'>
                        <CardTitle className='text-lg font-bold text-gray-900'>Recent Payments</CardTitle>
                        <Link href='/user/payments' className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                            View all <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </CardHeader>
                    <CardContent className='flex-1'>
                        {recentPayments.length === 0 ? (
                            <div className="h-full min-h-40 flex items-center justify-center text-sm text-muted-foreground">
                                No payments recorded in {currentSession.name} yet.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {recentPayments.map(p => (
                                    <li key={p.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{p.students?.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {p.students?.classes?.name}{p.students?.sections?.name ? `-${p.students.sections.name}` : ''} · {p.receipt_no}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-gray-900">{formatINR(Number(p.amount))}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {p.method && <span className="capitalize">{p.method} · </span>}
                                                {formatPaymentTime(p.created_at)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 items-stretch">
                    {quickActions.map((action, index) => (
                        <Link key={index} href={action.href}>
                            <Card className={`h-full border-1 cursor-pointer transition-all duration-200 hover:shadow-md ${action.border}`}>
                                <CardContent className='flex md:flex-col items-center justify-center gap-3 sm:p-2 md:p-6 text-sm text-center'>
                                    <div className={`${action.iconBg} p-3 rounded-full`} >
                                        <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                                    </div>
                                    <h3 className="font-semibold">{action.title}</h3>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

function DashboardSkeleton() {
    const block = "bg-gray-200 rounded animate-pulse";
    return (
        <div className="space-y-6">
            <div className={`${block} h-8 w-64`} />

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className='shadow-sm border-gray-200 gap-3'>
                        <CardHeader className='flex flex-row items-center justify-between'>
                            <div className={`${block} h-4 w-24`} />
                            <div className={`${block} h-9 w-9 rounded-lg`} />
                        </CardHeader>
                        <CardContent className='space-y-2'>
                            <div className={`${block} h-7 w-32`} />
                            <div className={`${block} h-3 w-20`} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className={`${block} lg:col-span-2 h-96 rounded-xl`} />
                <div className={`${block} h-96 rounded-xl`} />
            </div>

            <div>
                <div className={`${block} h-6 w-36 mb-4`} />
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                    {[...Array(4)].map((_, i) => <div key={i} className={`${block} h-28 rounded-xl`} />)}
                </div>
            </div>
        </div>
    )
}
