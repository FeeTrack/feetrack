'use client';

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Home, Users, CreditCard, Settings, ChevronDown, IndianRupee
} from "lucide-react";

const navigation = [
    { name: 'Dashboard', href: '/user/dashboard', icon: Home },
    { name: 'Students', href: '/user/students', icon: Users },
    { name: 'Fees', icon: IndianRupee, submenu: [
        { name: 'Collect Fees', href: '/user/fees/collect' },
        { name: 'Class-wise Fees', href: '/user/fees/class-wise-fees' },
        { name: 'Defaulters', href: '/user/fees/defaulters' },
    ] },
    { name: 'Payments', href: '/user/payments', icon: CreditCard },
    { name: 'Settings', icon: Settings, submenu: [
        { name: 'Classes & Sections', href: '/user/settings/classes-sections' },
        { name: 'Fees Setup', href: '/user/settings/fees-setup' },
    ] },
]

function Sidebar({ handleMobileClick, mobile, profile }) {
    const pathname = usePathname();
    const segmentedPaths = pathname.split('/').filter(Boolean);
    const secondLastPath = segmentedPaths[segmentedPaths.length - 2];

    const [expandedMenu, setExpandedMenu] = useState('');

    const toggleMenu = (name) => {
        setExpandedMenu(expandedMenu === name ? '' : name);
    }

    return (
        <aside className="flex h-full flex-col gap-y-6 bg-primary px-4 py-6">
            <Link href='/' className="text-base font-bold text-center text-gray-50 italic">
                FeeTrack
            </Link>

            <div className="flex h-16 w-full shrink-0 items-center mt-4">
                <h1 className="text-xl font-bold text-primary-foreground text-center w-full">
                    {profile?.schools?.name || '[School]'}
                </h1>
            </div>

            <nav className="flex flex-1 flex-col">
                <ul className="flex flex-1 flex-col gap-y-1">
                    {navigation.map(item => {
                        if (item.submenu) {
                            const isExpanded = expandedMenu === item.name;
                            return (
                                <li key={item.name}>
                                    <button onClick={() => toggleMenu(item.name)} className={`sidebar-item ${secondLastPath === item.name.toLowerCase() ? 'sidebar-item-active' : 'sidebar-item-inactive'} w-full justify-between cursor-pointer`} >
                                        <span className="flex items-center gap-3">
                                            <item.icon className="h-5 w-5" />
                                            {item.name}
                                        </span>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                    <ul className={`ml-9 mt-1 space-y-1 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        {item.submenu.map(sub => (
                                            <li key={sub.name}>
                                                <Link href={sub.href} onClick={() => (mobile ? handleMobileClick() : '')} className={`sidebar-item ${pathname === sub.href ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
                                                    {sub.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            )
                        }
                        return (
                            <li key={item.name}>
                                <Link href={item.href} onClick={() => (mobile ? handleMobileClick() : '')} className={`sidebar-item ${pathname === item.href ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
                                    <item.icon className="w-5 h-5" /> {item.name}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </aside>
    )
}

export default Sidebar;