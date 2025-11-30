'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';

import { createClientSupabase } from '@/utils/supabase/client';
import { manageStudentTransportAction } from './actions';
import { searchStudentAction } from './actions';
import { useSession } from '@/Context/SessionContext';
import { months } from '@/utils/constants/backend';

import ConfirmModal from '@/components/ConfirmModal';

export default function ManageStudentTransport({ profile, transportRoutes, onSubmit, onCancel }) {
    const [students, setStudents] = useState([])
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [selectedRoute, setSelectedRoute] = useState({})
    const [selectedMonths, setSelectedMonths] = useState([])
    const [transFeeHeadId, setTransFeeHeadId] = useState('')
    const [existingTransPeriods, setExistingTransPeriods] = useState([])

    const [searchQuery, setSearchQuery] = useState('')
    const [clientErrors, setClientErrors] = useState({})
    const [showRemoveGuide, setShowRemoveGuide] = useState(false)

    const routeFee = transportRoutes.find(route => route.id === selectedRoute?.value)?.monthly_fee || null;

    const [state, setState] = useState()
    const [loading, setLoading] = useState(false)
    const [allSelected, setAllSelected] = useState(false)

    const { currentSession } = useSession();
    const sessionStartYear = parseInt(currentSession?.name.split('-')[0])

    const supabase = createClientSupabase();

    useEffect(() => {
        if (!searchQuery) {
            setStudents([]) 
            return;
        }

        const searchStudents  = async () => {
            try {
                const res = await searchStudentAction(profile.school_id, searchQuery)
                
                if (res.error) {
                    console.error(res.error)
                    toast.error('Failed to search student')
                    return
                }

                const students = res.students;

                if (students.length === 0) {
                    setStudents([])
                    toast.error('No matching students found.')
                    return
                }

                setStudents(res.students || [])
            } catch (error) {
                console.error(error)
                toast.error('Failed to search student.')
            } finally {
                setSelectedStudent(null)
            }
        }
        const searchTimeout = setTimeout(() => searchStudents(), 300)

        return () => clearTimeout(searchTimeout)
    }, [searchQuery])

    const handleSelectStudent = (s) => {
        try {
            setStudents([])
            setSelectedRoute({})
            setSelectedMonths([])
        } finally {
            setSelectedStudent(s)
        }
    }

    useEffect(() => {
        const setAppliedPeriods = async () => {
            const { data: transFeeHead } = await supabase
                .from('fee_heads')
                .select('id')
                .eq('school_id', profile.school_id)
                .eq('name', 'Transport Fee')
                .single();
            setTransFeeHeadId(transFeeHead.id)

            const {data: transPeriods, error} = await supabase
                .from('invoice_items')
                .select('pay_period')
                .eq('fee_head_id', transFeeHead.id);
            if (error) {
                console.error(error.message)
                toast.error('Failed to fetch transport applied periods.')
                return
            }
            setExistingTransPeriods(transPeriods.map(t => t.pay_period))

            const allMonths = months.map(month => month.name);

            const sortedPeriods = transPeriods.sort((a, b) => {
                const monthA = a.pay_period.split('-')[0];
                const monthB = b.pay_period.split('-')[0];
                return allMonths.indexOf(monthA) - allMonths.indexOf(monthB);
            });

            const formattedPeriods = sortedPeriods.map(p => ({
                label: p.pay_period.split('-')[0],
                value: p.pay_period
            }))

            setSelectedMonths(formattedPeriods || [])
        }

        if (selectedStudent?.route_id) {
            const studentRoute = transportRoutes.find(route => route.id === selectedStudent.route_id);
            setSelectedRoute({
                label: studentRoute.name,
                value: studentRoute.id
            })

            setAppliedPeriods();
        }
    }, [selectedStudent, transportRoutes])

    const monthOptions = months.map(month => ({
        label: month.name,
        value: month.number <= 3 ? `${month.name}-${sessionStartYear + 1}` : `${month.name}-${sessionStartYear}`
    }))

    const routeOptions = transportRoutes?.map(route => ({
        label: route.name,
        value: route.id
    }))

    const selectAllMonthsToggle = () => {
        if (allSelected) {
        // Clear all
        setSelectedMonths([]);
        setAllSelected(false);
        } else {
        // Select all
        const alreadySelectedValues = new Set(selectedMonths.map(m => m.value));
        const payPeriodsToAdd = monthOptions.filter(p => !alreadySelectedValues.has(p.value));

        setSelectedMonths(prev => [...prev, ...payPeriodsToAdd]);
        setAllSelected(true);
        }
    }

    const formData = {
        existing_route_id: selectedStudent?.route_id || '',
        existing_pay_periods: existingTransPeriods,
        school_id: profile.school_id,
        student_id: selectedStudent?.id,
        current_session: currentSession,
        trans_fee_head_id: transFeeHeadId,
        selected_route: transportRoutes.find(route => route.id === selectedRoute?.value) || null,
        pay_periods: selectedMonths.map(s => s.value)        
    }

    const validateForm = () => {
        const errors = {};

        if (selectedRoute && selectedMonths.length === 0) {
            errors.months = "Please select months to apply transport"
        }
        
        if (!selectedStudent?.route_id) {
            if (!selectedRoute && selectedMonths.length > 0) {
                errors.route = "Please select transport route"
            }

            if (!selectedRoute && !selectedMonths) {
                errors.route = "Please select transport route"
                errors.months = "Please select monthly to apply transport"
            }
        }

        return errors;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateForm();

        if (Object.keys(errors).length > 0) {
            e.preventDefault();
            setClientErrors(errors);
            return
        }

        try {
            setLoading(true);

            const res = await manageStudentTransportAction(formData);

            setState(res)
        } catch (error) {
            console.error(error)
            toast.error(error)
        } finally {
            setLoading(false)
        }

    }

    useEffect(() => {
        if (state?.success) {
            toast.success("Student's transport details updated successfully.");
            onSubmit();
            return
        }
        if (state?.error) {
            if (state.error.code) {
                toast.error(state.error.message)
            } else {
                console.error(state.error)
                toast.error("Failed to update student's transport details.")
            }
            return
        }
    }, [state]);

    return (
        <div className='flex-1 overflow-y-auto max-h-full'>
            <div className='flex flex-col'>
                <form>
                    <div>
                        <label className='block text-sm mb-2 font-medium'>Search Student</label>
                        <input 
                            name='searchQuery'
                            placeholder="Search by Admission No. or Name"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border rounded-2xl px-4 py-1"
                        />
                    </div>
                </form>

                <div className='w-full max-h-[300px] overflow-y-auto'>
                    <ul className='flex flex-col rounded-xl overflow-hidden'>
                        {students.map(s => (
                            <li key={s.id} className='w-full py-1 px-2 flex flex-col gap-1 bg-gray-50 hover:bg-gray-200 cursor-pointer' onClick={() => handleSelectStudent(s)}>
                                <h4 className='font-medium'>{s.name}</h4>
                                <div className='flex items-center gap-2 text-gray-700'>
                                    <h6>Admission No: {s.adm_no}</h6>
                                    <h6>Class: {s.classes.name}{s.sections?.name && `-${s.sections.name}`}</h6>
                                    <h6>Roll No: {s.roll_no}</h6>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>

            {selectedStudent && (
                <div className='w-full mt-4 grid grid-cols-2 gap-2'>
                    <h2><span className='font-medium'>Student Name: </span>{selectedStudent.name}</h2>
                    <h2><span className='font-medium'>Admission No: </span>{selectedStudent.adm_no}</h2>
                    <h2><span className='font-medium'>Class: </span>{selectedStudent.classes.name}{selectedStudent.sections?.name && `-${selectedStudent.sections.name}`}</h2>
                    <h2><span className='font-medium'>Roll No: </span>{selectedStudent.roll_no}</h2>                
                </div>            
            )}

            {selectedStudent && (
                <form onSubmit={handleSubmit} className='space-y-3 w-full mt-4'>
                    <input type='hidden' name='existingRouteId' value={selectedStudent.route_id ? selectedStudent.route_id : ''} />
                    <div>
                        <div className='flex items-center justify-between px-1 mb-1'>
                            <label className='block text-sm font-medium'>Transport Route</label>

                            {selectedStudent?.route_id && (
                                <button type='button' className='text-red-600 text-xs font-medium cursor-pointer' onClick={() => setShowRemoveGuide(true)}>
                                    Remove Transport
                                </button>
                            )}
                        </div>

                        <div className="w-full px-1">
                            <Select
                                styles={{
                                control: (base) => ({
                                ...base,
                                width: '100%',
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
                                instanceId='transport-route-select'
                                options={routeOptions}
                                value={selectedRoute}
                                onChange={setSelectedRoute}
                                isClearable
                                placeholder="Select Route"
                            />
                            {clientErrors.route && (
                                <p className='text-red-600 text-xs mt-1'>{clientErrors.route}</p>
                            )}
                        </div>
                    </div>

                    {routeFee && (
                        <div className='px-1'>
                            <label className="block text-sm mb-1 font-medium">Route's Monthly Fee</label>
                            <input disabled name='routeFee' value={routeFee} className='w-full border rounded px-2 py-1 disabled:bg-gray-100'></input>
                        </div>
                    )}

                    <div>
                        <div className='flex items-center justify-between mb-1 px-1'>
                            <label className="block text-sm font-medium">Apply Transport For</label>
                            <button type='button' className='px-2 py-1 rounded-xl bg-[#f0f0f0] hover:bg-[#e6e6e6]' onClick={selectAllMonthsToggle}>{allSelected ? 'Clear All' : 'Select All Months'}</button>
                        </div>
                        <div className="w-full px-1">
                            <Select
                                styles={{
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
                                control: (base) => ({
                                ...base,
                                width: '100%',
                                minHeight: '38px',
                                maxHeight: '80px'
                                }),
                                container: (base) => ({
                                ...base,
                                width: '100%',
                                }),
                                menuList: (base) => ({
                                    ...base,
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }),
                                }}
                                instanceId='months-select'
                                isMulti
                                isClearable
                                options={monthOptions}
                                value={selectedMonths}
                                onChange={setSelectedMonths}
                                placeholder="Select Months"
                            />
                            {clientErrors.months && (
                                <p className='text-red-600 text-xs mt-1'>{clientErrors.months}</p>
                            )}
                        </div>
                    </div>

                    <div className='mt-8 px-2 pb-4 flex justify-end gap-2'>
                        <button
                            type='button'
                            onClick={onCancel}
                            className="primary-btn bg-gray-200 hover:bg-gray-300 text-black"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={loading}
                        >
                            {loading ? 'Updating…' : 'Update'}
                        </button>
                    </div>
                </form>
            )}
            {showRemoveGuide && (
                <ConfirmModal
                    isOpen={showRemoveGuide}
                    onClose={() => setShowRemoveGuide(false)}
                    onConfirm={() => setShowRemoveGuide(false)}
                    title="Remove Transport"
                    buttonAction='Okay'
                    message={
                        <>
                            For removing transport, delete the transport details and update. For paid months, keep those months and delete the remaining details.
                        </>
                    }
                />
            )}
        </div>
    )
}