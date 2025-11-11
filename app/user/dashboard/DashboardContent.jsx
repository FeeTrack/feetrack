'use client';

import { createClientSupabase } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, IndianRupee, Wallet, AlertCircle, Plus, CreditCard } from "lucide-react";
import { useSession } from "@/Context/SessionContext";
import { months } from "@/utils/constants/backend";
import Spinner from "@/components/Spinner";

export default function DashboardContent({profile}) {
    const { currentSession, sessionLoading } = useSession();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalFees: 0,
        totalCollection: 0,
        feesDue: 0,
    })
    const [loading, setLoading] = useState(true);

    const sessionStartYear = parseInt(currentSession?.name.split('-')[0]);

    const currentMonth = new Date().getMonth() + 1; // Months are 0-indexed
    
    let monthsPassed;
    if (currentMonth >= 4) {
        monthsPassed = months.slice(0, currentMonth - 3);
    } else {
        monthsPassed = months.slice(0, currentMonth + 9);
    }
    
    const passedPayPeriods = monthsPassed.map(m => m.number <= 3 ? `${m.name}-${sessionStartYear + 1}` : `${m.name}-${sessionStartYear}`);

    useEffect(() => {
        if (currentSession) {
            fetchStats();
        }
    }, [currentSession])

    const fetchStats = async () => {
        setLoading(true)

        try {
            const supabase = createClientSupabase();

            const {count: studentCount} = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('school_id', profile.school_id)
                .eq('session_id', currentSession.id);

            const {data: totalInvoices} = await supabase
                .from('invoices')
                .select('amount, amount_paid')
                .eq('school_id', profile.school_id)
                .eq('session_id', currentSession.id);

            const {data: uptoCurrentInvoices} = await supabase
                .from('invoices')
                .select('amount, amount_paid')
                .eq('school_id', profile.school_id)
                .eq('session_id', currentSession.id)
                .in('pay_period', passedPayPeriods);

            const totalFees = totalInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
            const totalCollection = totalInvoices?.reduce((sum, inv) => sum + Number(inv.amount_paid), 0) || 0;

            const uptoCurrentFees = uptoCurrentInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
            const uptoCurrentCollection = uptoCurrentInvoices?.reduce((sum, inv) => sum + Number(inv.amount_paid), 0) || 0;
            const uptoCurrentDueFees = uptoCurrentFees - uptoCurrentCollection;

            setStats({
                totalStudents: studentCount,
                totalFees,
                totalCollection,
                feesDue: uptoCurrentDueFees,
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    }

    if (sessionLoading || loading) {
        return (
            <div className="w-full flex items-center justify-center h-24">
                <Spinner size={32} />
            </div>
        )
    }

    const statCards = [
        {
            title: 'Total Students',
            value: stats.totalStudents.toLocaleString('en-IN'),
            icon: Users,
            description: `In ${currentSession.name}`,
            color: 'text-purple-600',
        },
        {
            title: 'Total Fees',
            value: stats.totalFees.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            icon: IndianRupee,
            description: `For ${currentSession.name}`,
            color: 'text-purple-600',
        },
        {
            title: 'Total Collected',
            value: stats.totalCollection.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            icon: Wallet,
            description: `${Math.round((stats.totalCollection / stats.totalFees) * 100)}% of Total Fees`,
            color: 'text-purple-600',
        },
        {
            title: 'Fees Due',
            value: stats.feesDue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            icon: AlertCircle,
            description: `Upto Current Month (${passedPayPeriods[passedPayPeriods.length - 1]})`,
            color: 'text-purple-600',
        },
    ]

    const quickActions = [
        {
            title: 'Add Student',
            icon: Plus,
            href: { pathname: '/user/students', query: { showAdd: true } },
            color: 'border-purple-200 hover:border-purple-400',
        },
        {
            title: 'Collect Fees',
            icon: CreditCard,
            href: '/user/fees/collect',
            color: 'border-amber-200 hover:border-amber-400',
        },
        {
            title: 'View Defaulters',
            icon: AlertCircle,
            href: '/user/fees/defaulters',
            color: 'border-red-200 hover:border-red-400',
        },
    ]

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Welcome, {profile.name}</h2>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <Card key={index} className='hover:shadow-md transition-shadow'>
                        <CardHeader className='flex flex-row items-center justify-between'>
                            <CardTitle className='font-medium text-muted-foreground'>
                                {stat.title}
                            </CardTitle>

                            <div className={`${stat.color} p-2 rounded-lg`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </CardHeader>

                        <CardContent className='flex flex-col items-center'>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid gap-4 grid-cols-3 items-stretch">
                    {quickActions.map((action, index) => (
                        <Link key={index} href={action.href}>
                            <Card className={`h-full border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${action.color}`}>
                                <CardContent className='flex flex-col items-center justify-center p-2 md:p-6 text-center'>
                                    <div className="bg-primary/10 p-3 rounded-full mb-3">
                                        <action.icon className="h-5 w-5 text-primary" />
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