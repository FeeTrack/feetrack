'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { Lock } from 'lucide-react';

import { getStudentTransportAction, searchStudentAction, updateStudentTransportAction } from './actions';
import { useSession } from '@/Context/SessionContext';
import { months } from '@/utils/constants/backend';

import ConfirmModal from '@/components/ConfirmModal';
import Spinner from '@/components/Spinner';

const monthLabel = (payPeriod) => payPeriod.split('-')[0];

export default function ManageStudentTransport({ transportRoutes, onSubmit, onCancel }) {
    const [students, setStudents] = useState([])
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [selectedRoute, setSelectedRoute] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [clientErrors, setClientErrors] = useState({})

    // pay_period -> { locked } for months the student already has transport applied
    const [existingPeriods, setExistingPeriods] = useState(new Map())
    const [selectedPeriods, setSelectedPeriods] = useState(new Set())
    const [loadingPeriods, setLoadingPeriods] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

    const { currentSession } = useSession();
    const sessionStartYear = parseInt(currentSession?.name.split('-')[0])

    const monthPeriods = months.map(m => m.number <= 3 ? `${m.name}-${sessionStartYear + 1}` : `${m.name}-${sessionStartYear}`);
    const routeOptions = transportRoutes?.map(route => ({ label: route.name, value: route.id }))
    const routeFee = transportRoutes.find(route => route.id === selectedRoute?.value)?.monthly_fee || null;

    const isLocked = (p) => Boolean(existingPeriods.get(p)?.locked);
    const lockedPeriods = monthPeriods.filter(isLocked);
    const removablePeriods = monthPeriods.filter(p => existingPeriods.has(p) && !isLocked(p));
    const adding = monthPeriods.filter(p => selectedPeriods.has(p) && !existingPeriods.has(p));
    const removing = removablePeriods.filter(p => !selectedPeriods.has(p));

    useEffect(() => {
        if (!searchQuery) {
            setStudents([])
            return;
        }

        const searchStudents  = async () => {
            try {
                const res = await searchStudentAction(searchQuery)

                if (res.error) {
                    console.error(res.error)
                    toast.error('Failed to search student')
                    return
                }

                if (res.students.length === 0) {
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

    const handleSelectStudent = async (s) => {
        setStudents([])
        setSelectedStudent(s)
        setClientErrors({})

        const studentRoute = transportRoutes.find(route => route.id === s.route_id);
        setSelectedRoute(studentRoute ? { label: studentRoute.name, value: studentRoute.id } : null)

        setLoadingPeriods(true)
        const res = await getStudentTransportAction(s.id)
        setLoadingPeriods(false)

        if (res.error) {
            toast.error('Failed to load transport months.')
            console.error(res.error)
            return
        }

        setExistingPeriods(new Map(res.periods.map(p => [p.pay_period, p])))
        setSelectedPeriods(new Set(res.periods.map(p => p.pay_period)))
        if (res.duplicates > 0) {
            toast(`Found ${res.duplicates} duplicate transport month(s). Click Update to clean them up.`, { icon: '⚠️' })
        }
    }

    const togglePeriod = (p) => {
        if (isLocked(p)) return;
        setSelectedPeriods(prev => {
            const next = new Set(prev);
            next.has(p) ? next.delete(p) : next.add(p);
            return next;
        })
    }

    const selectAll = () => setSelectedPeriods(new Set(monthPeriods));
    const clearUnpaid = () => setSelectedPeriods(new Set(lockedPeriods));

    const save = async ({ routeId, payPeriods }) => {
        setSaving(true)
        try {
            const res = await updateStudentTransportAction({ studentId: selectedStudent.id, routeId, payPeriods })
            if (res.error) {
                toast.error(res.error.message || res.error)
                return
            }
            toast.success("Student's transport details updated successfully.")
            if (res.keptPaid?.length) {
                toast(`Kept paid month(s): ${res.keptPaid.map(monthLabel).join(', ')}`, { icon: 'ℹ️' })
            }
            if (res.missingPeriods?.length) {
                toast.error(`No invoice found for: ${res.missingPeriods.map(monthLabel).join(', ')}. Generate the student's fee first.`)
            }
            onSubmit()
        } catch (error) {
            console.error(error)
            toast.error("Failed to update student's transport details.")
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        const errors = {};
        const unlockedSelected = [...selectedPeriods].filter(p => !isLocked(p));
        if (unlockedSelected.length > 0 && !selectedRoute) errors.route = 'Please select transport route';
        if (selectedRoute && selectedPeriods.size === 0) errors.months = 'Please select months to apply transport';
        setClientErrors(errors);
        if (Object.keys(errors).length > 0) return;

        save({ routeId: selectedRoute?.value || null, payPeriods: [...selectedPeriods] })
    }

    // Removes the route and every unpaid month in one go; paid months stay
    const handleRemoveTransport = () => {
        setShowRemoveConfirm(false)
        save({ routeId: null, payPeriods: [] })
    }

    const chipClass = (p) => {
        if (isLocked(p)) return 'bg-emerald-50 border-emerald-400 text-emerald-800 cursor-not-allowed';
        if (selectedPeriods.has(p)) return existingPeriods.has(p)
            ? 'bg-primary border-primary text-white'
            : 'bg-primary/80 border-primary text-white ring-2 ring-primary/30';
        if (existingPeriods.has(p)) return 'bg-red-50 border-red-300 text-red-700 line-through';
        return 'bg-white border-gray-300 text-gray-700 hover:border-primary';
    }

    return (
        <div className='flex-1 overflow-y-auto max-h-full'>
            <div className='flex flex-col'>
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

            {selectedStudent && loadingPeriods && (
                <div className='flex justify-center py-6'><Spinner size={24} /></div>
            )}

            {selectedStudent && !loadingPeriods && (
                <form onSubmit={handleSubmit} className='space-y-4 w-full mt-4'>
                    <div>
                        <div className='flex items-center justify-between px-1 mb-1'>
                            <label className='block text-sm font-medium'>Transport Route</label>

                            {(selectedStudent.route_id || existingPeriods.size > 0) && (
                                <button type='button' className='text-red-600 text-xs font-semibold cursor-pointer hover:underline' onClick={() => setShowRemoveConfirm(true)}>
                                    Remove Transport
                                </button>
                            )}
                        </div>

                        <div className="w-full px-1">
                            <Select
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
                            <label className="block text-sm mb-1 font-medium">Route&apos;s Monthly Fee</label>
                            <input disabled name='routeFee' value={routeFee} className='w-full border rounded px-2 py-1 disabled:bg-gray-100'></input>
                        </div>
                    )}

                    <div className='px-1'>
                        <div className='flex items-center justify-between mb-2'>
                            <label className="block text-sm font-medium">Apply Transport For</label>
                            <div className='flex items-center gap-2 text-xs'>
                                <button type='button' className='px-2 py-1 rounded-xl bg-[#f0f0f0] hover:bg-[#e6e6e6]' onClick={selectAll}>Select All</button>
                                <button type='button' className='px-2 py-1 rounded-xl bg-[#f0f0f0] hover:bg-[#e6e6e6]' onClick={clearUnpaid}>Clear Unpaid</button>
                            </div>
                        </div>

                        <div className='grid grid-cols-4 sm:grid-cols-6 gap-2'>
                            {monthPeriods.map(p => (
                                <button
                                    key={p}
                                    type='button'
                                    onClick={() => togglePeriod(p)}
                                    title={isLocked(p) ? 'Payment received; cannot be removed' : undefined}
                                    className={`flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-sm font-semibold transition-colors ${chipClass(p)}`}
                                >
                                    {isLocked(p) && <Lock className='w-3 h-3' />}
                                    {monthLabel(p)}
                                </button>
                            ))}
                        </div>
                        {clientErrors.months && (
                            <p className='text-red-600 text-xs mt-1'>{clientErrors.months}</p>
                        )}

                        <div className='flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-600'>
                            <span className='flex items-center gap-1'><span className='h-2.5 w-2.5 rounded-sm bg-primary' /> Applied</span>
                            <span className='flex items-center gap-1'><span className='h-2.5 w-2.5 rounded-sm border border-emerald-400 bg-emerald-50' /> Paid (locked)</span>
                            <span className='flex items-center gap-1'><span className='h-2.5 w-2.5 rounded-sm border border-red-300 bg-red-50' /> Will be removed</span>
                        </div>

                        {(adding.length > 0 || removing.length > 0) && (
                            <div className='mt-3 rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs space-y-0.5'>
                                {adding.length > 0 && <p><span className='font-semibold text-gray-800'>Adding:</span> {adding.map(monthLabel).join(', ')}</p>}
                                {removing.length > 0 && <p><span className='font-semibold text-red-700'>Removing:</span> {removing.map(monthLabel).join(', ')}</p>}
                            </div>
                        )}
                        {selectedRoute && selectedStudent.route_id && selectedRoute.value !== selectedStudent.route_id && (
                            <p className='mt-2 text-xs text-gray-600'>Unpaid applied months will be charged at the new route&apos;s fee.</p>
                        )}
                    </div>

                    <div className='mt-6 px-2 pb-4 flex justify-end gap-2'>
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
                            disabled={saving}
                        >
                            {saving ? 'Updating…' : 'Update'}
                        </button>
                    </div>
                </form>
            )}

            {showRemoveConfirm && (
                <ConfirmModal
                    isOpen={showRemoveConfirm}
                    onClose={() => setShowRemoveConfirm(false)}
                    onConfirm={handleRemoveTransport}
                    title="Remove Transport"
                    action='Remove'
                    message={
                        <>
                            This will remove the transport route and the unpaid months
                            {removablePeriods.length > 0 && <> (<span className='font-medium'>{removablePeriods.map(monthLabel).join(', ')}</span>)</>}.
                            {lockedPeriods.length > 0 && (
                                <> Paid months (<span className='font-medium'>{lockedPeriods.map(monthLabel).join(', ')}</span>) will be kept.</>
                            )}
                        </>
                    }
                />
            )}
        </div>
    )
}
