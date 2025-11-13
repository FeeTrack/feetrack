'use client'
import { useState, useActionState, useEffect } from "react";
import toast from 'react-hot-toast';
import Select from 'react-select';

import { searchDefaultersAction } from './actions';
import { months } from "@/utils/constants/backend";
import Spinner from "@/components/Spinner";
import { useSession } from "@/Context/SessionContext";

import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download } from 'lucide-react';
import {UilWhatsapp} from '@iconscout/react-unicons';

export default function DefaultersClient({classes, sections}) {
    const customStyles = {
        multiValueRemove: (base, state) => ({
        ...base,
        color: "black",
        backgroundColor: state.isFocused ? "gray" : "transparent",
        ":hover": {
            backgroundColor: "#f0f0f0",
            color: "black",
            cursor: "pointer",
        },
        }),
        option: (base, state) => ({
        ...base,
        backgroundColor: state.isDisabled ? "#f0f0f0" : "white",
        color: state.isDisabled ? "#888" : "black",
        }),
        menuList: (base) => ({
        ...base,
        maxHeight: 200,
        overflowY: 'auto',
        }),
        control: (base) => ({
        ...base,
        width: '100%',
        maxHeight: '80px',
        minHeight: '38px',
        overflowY: 'auto',
        }),
        container: (base) => ({
        ...base,
        width: '100%'
        })
                                     
    }

    const { currentSession } = useSession();
    const sessionStartYear = parseInt(currentSession?.name.split('-')[0]);

    const [state, formAction, pending] = useActionState(searchDefaultersAction, {error: null});
    
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);

    const [defaulters, setDefaulters] = useState(null);
        
    const [allSelected, setAllSelected] = useState(false);

    const [hasSearched, setHasSearched] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [displayFine, setDisplayFine] = useState(false);
    const [displayDiscount, setDisplayDiscount] = useState(false);

    // Show error toast if there's an error
    useEffect(() => {
        if (state?.defaulters) {
            setHasSearched(true);
            setDefaulters(state.defaulters);
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state]);

    const monthOptions = months.map(month => ({
        label: month.name,
        value: month.number <= 3 ? `${month.name}-${sessionStartYear + 1}` : `${month.name}-${sessionStartYear}` // Add session awareness
    }))

    const classOptions = classes.map(cls => ({
        label: cls.name,
        value: cls.id
    }))

    const filteredSections = sections.filter(sec => sec.class_id === selectedClass?.value);

    const sectionOptions = filteredSections.map(sec => ({
        label: sec.name,
        value: sec.id
    }))

    useEffect(() => {
        setSelectedSection(null);
    }, [selectedClass])

    const selectAllToggle = () => {
        if (allSelected) {
        // Clear all
        setSelectedMonths([])
        setAllSelected(false);
        } else {
            // Select all
            const alreadySelectedValues = new Set(selectedMonths.map(m => m.value));
            const monthsToAdd = monthOptions.filter(p => !alreadySelectedValues.has(p.value));

            setSelectedMonths(prev => [...prev, ...monthsToAdd]);
            setAllSelected(true);
        }
    }

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setDefaulters(state?.defaulters || []);
        } else {
            const filtered = state?.defaulters.filter(d =>
                d?.student?.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setDefaulters(filtered);
        }
    }, [searchQuery]);

    const handleSendReminder = (studentName, schoolName, mobileNo) => {
        const message = `Dear Parent,

Greetings from ${schoolName}.

Your ward, ${studentName}'s fee is due. You are requested to deposit the fee at the earliest.

Regards,
${schoolName}`;

    const waLink = `https://wa.me/${mobileNo}?text=${encodeURIComponent(message)}`;
    
    console.log('Generated URL:', waLink);
    console.log('Message:', message);
    
    window.open(waLink, '_blank');
}

    return (
        <div className="space-y-6">
            <form action={formAction} id="searchDefaultersForm">
                <div className='w-full flex items-center justify-start gap-4 md:gap-8'>
                    <div className="w-full flex lg:max-w-fit lg:flex-row flex-col lg:items-center items-start gap-4 lg:gap-8">
                        <div className='flex w-full flex-row lg:flex-col items-center justify-between lg:items-start gap-2'>
                            <div className='flex w-full flex-1 flex-col lg:flex-row justify-between items-start lg:items-center'>
                                <label className='mb-1 font-semibold'>Months</label>
                                <button type="button" className='px-2 py-1 rounded-xl text-black text-sm bg-[#f0f0f0] hover:bg-[#e6e6e6]' onClick={selectAllToggle}>{allSelected ? 'Clear All' : 'Select All'}</button>
                            </div>
                            <div className="w-[300px]">
                                <Select
                                    instanceId='months-select'
                                    isMulti
                                    isClearable
                                    styles={customStyles}
                                    options={monthOptions}
                                    value={selectedMonths}
                                    onChange={setSelectedMonths}
                                    placeholder="Select Months"
                                />
                                {selectedMonths.map((m) => (
                                    <input key={m.value} type="hidden" name="pay_periods" value={m.value} />
                                ))}
                            </div>
                        </div>
                        
                        <div className='flex w-full flex-row lg:flex-col items-center justify-between lg:items-start gap-2'>
                            <label className='mb-1 font-semibold'>Class</label>
                            <div className="w-[300px] lg:w-[200px]">
                                <Select
                                    styles={{
                                        control: (base) => ({
                                        ...base,
                                        width: '100%'
                                        }),
                                        container: (base) => ({
                                        ...base,
                                        width: '100%'
                                        }),
                                        menuList: (base) => ({
                                            ...base,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                        }),
                                    }}
                                    instanceId='class-select'
                                    options={classOptions}
                                    value={selectedClass}
                                    onChange={setSelectedClass}
                                    placeholder="Select Class"
                                    isClearable
                                />
                                <input type="hidden" name="classId" value={selectedClass?.value || ''} />
                            </div>
                        </div>

                        <div className='flex w-full flex-row lg:flex-col items-center justify-between lg:items-start gap-2'>
                            <label className='mb-1 font-semibold'>Section</label>
                            <div className="w-[300px] lg:w-[200px]">
                                <Select
                                    styles={{
                                        control: (base) => ({
                                        ...base,
                                        width: '100%'
                                        }),
                                        container: (base) => ({
                                        ...base,
                                        width: '100%'
                                        }),
                                        menuList: (base) => ({
                                            ...base,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                        }),                              
                                    }}
                                    options={sectionOptions}
                                    instanceId='section-select'
                                    value={selectedSection}
                                    onChange={setSelectedSection}
                                    placeholder="Select Section"
                                    isClearable
                                />
                                <input type="hidden" name="sectionId" value={selectedSection?.value || ''} />
                            </div>
                        </div>
                    </div>
                    <button 
                        type="submit"
                        form="searchDefaultersForm"
                        disabled={!selectedClass || selectedMonths.length === 0}
                        className="primary-btn ml-2"
                    >
                        Search
                    </button>
                </div>

                {pending && (
                    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
                        <Spinner size={28} />
                    </div>
                )}
            </form>

            <div className="flex flex-col w-full">
                <h1 className="text-lg font-semibold mb-4">{state?.defaulters && 'Search Results'}</h1>

                {hasSearched ? (
                    <Card className='w-full max-w-[calc(100vw-32px)] overflow-x-auto'>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <CardDescription>
                                    {defaulters.length} student{defaulters.length > 1 ? 's' : ''} found.
                                </CardDescription>

                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1 sm:flex-initial">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 2-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search defaulters..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-8 w-full max-w-64 text-sm"
                                        />
                                    </div>
                                    <Button variant='outline' size='icon'>
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <Table className='border-collapse'>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className='border border-t-0 border-l-0'>Sr.</TableHead>
                                            <TableHead className='border border-t-0 '>Student Details</TableHead>
                                            <TableHead className='border border-t-0 '>Total</TableHead>
                                            {displayFine && <TableHead className='border border-t-0 '>Fine</TableHead>}
                                            <TableHead className='border border-t-0 '>Paid</TableHead>
                                            {displayDiscount && <TableHead className='border border-t-0 '>Discount</TableHead>}
                                            <TableHead className='border border-t-0 '>Balance</TableHead>
                                            <TableHead className='border border-t-0 border-r-0'>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {defaulters.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                                                    No defaulters found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            defaulters.map((d, index) => {
                                                if (d.grandFine > 0) {
                                                    setDisplayFine(true)
                                                }

                                                if (d.grandDiscount > 0) {
                                                    setDisplayDiscount(true)
                                                }
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell className={`border border-l-0 ${index === defaulters.length-1 ? 'border-b-0' : ''}`}>{index + 1}</TableCell>
                                                        <TableCell className={`p-2 border border-black ${index === defaulters.length-1 ? 'border-b-0' : ''}`}>
                                                            <div className="flex flex-col gap-1">
                                                                <div className="font-semibold">{d?.student?.name}</div>
                                                                <div>Class: {`${d?.student.class_name}-${d?.student?.section_name}`}</div>
                                                                <div>Adm No: {d?.student?.adm_no}{'  '}Roll No: {d?.student?.roll_no}</div>
                                                                <div>Mobile: {d?.student?.parent_mobile}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className={`p-2 border border-black align-top ${index === defaulters.length-1 ? 'border-b-0' : ''}`}>
                                                            {d?.periods.map(p => (
                                                                <div key={p?.pay_period} className="flex items-center gap-2"><h6 className="w-6">{p?.pay_period}:</h6> {p?.total}</div>
                                                            ))}
                                                            <div className="font-bold text-gray-700 mt-1">Total: {d?.grandTotal}</div>
                                                        </TableCell>
                                                        {d?.grandFine > 0 && (
                                                            <TableCell className={`p-2 border border-black align-top ${index === defaulters.length-1 ? 'border-b-0' : ''}`}>
                                                                {d?.periods.map(p => (
                                                                    <div key={p?.pay_period} className="flex items-center gap-2"><h6 className="w-6">{p?.pay_period}:</h6> {p?.fine}</div>
                                                                ))}
                                                                <div className="font-bold text-gray-700 mt-1">Total: {d?.grandFine}</div>
                                                            </TableCell>
                                                        )}
                                                        <TableCell className={`p-2 border border-black align-top ${index === defaulters.length-1 ? 'border-b-0' : ''}`}>
                                                            {d?.periods.map(p => (
                                                                <div key={p?.pay_period} className="flex items-center gap-2"><h6 className="w-6">{p?.pay_period}:</h6> {p?.paid}</div>
                                                            ))}
                                                            <div className="font-bold text-gray-700 mt-1">Total: {d?.grandPaid}</div>
                                                        </TableCell>
                                                        {d?.grandDiscount > 0 && (
                                                            <TableCell className={`p-2 border border-black align-top ${index === defaulters.length-1 ? 'border-b-0' : ''}`}>
                                                                {d?.periods.map(p => (
                                                                    <div key={p?.pay_period} className="flex items-center gap-2"><h6 className="w-6">{p?.pay_period}:</h6> {p?.discount}</div>
                                                                ))}
                                                                <div className="font-bold text-gray-700 mt-1">Total: {d?.grandDiscount}</div>
                                                            </TableCell>
                                                        )}
                                                        <TableCell className={`p-2 border border-black align-top ${index === defaulters.length-1 ? 'border-b-0' : ''}`}>
                                                            {d?.periods.map(p => (
                                                                <div key={p?.pay_period} className="flex items-center gap-2"><h6 className="w-6">{p?.pay_period}:</h6> {p?.balance}</div>
                                                            ))}
                                                            <div className="font-medium text-gray-700 mt-1">Total: {d?.grandBalance}</div>
                                                        </TableCell>
                                                        <TableCell className={`p-2 border border-black border-r-0 align-top ${index === defaulters.length-1 ? 'border-b-0' : ''}`}>
                                                            <button className="primary-btn flex items-center gap-1" onClick={() => handleSendReminder(d?.student?.name, d?.schoolName, d?.student?.parent_mobile)}>
                                                                <UilWhatsapp size='16px'/>
                                                                <h4><span className="hidden md:inline">Send </span>Reminder</h4>
                                                            </button>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    null
                )}


                {/* <DefaultersTable defaulters={defaulters} /> */}
            </div>

        </div>
    )
}