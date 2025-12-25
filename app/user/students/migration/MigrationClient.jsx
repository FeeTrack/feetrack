'use client'

import { createClientSupabase } from '@/utils/supabase/client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Select from 'react-select'

import { migrateStudentAction } from './actions'
import { useSession } from '@/Context/SessionContext'
import Spinner from '@/components/Spinner'

export default function MigrationClient({profile, classes, sections}) {
    const [fromSession, setFromSession] = useState(null)
    const [fromClass, setFromClass] = useState(null)
    const [fromSection, setFromSection] = useState(null)
    const [studentOptions, setStudentOptions] = useState([])
    const [selectedStudents, setSelectedStudents] = useState([])
    const [toSession, setToSession] = useState(null)
    const [toClass, setToClass] = useState(null)
    const [toSection, setToSection] = useState(null)

    const [allSelected, setAllSelected] = useState(false)
    const [genFee, setGenFee] = useState(false)
    const [clientErrors, setClientErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const supabase = createClientSupabase()

    const { availableSessions, currentSession } = useSession()

    const sessionOptions = availableSessions?.map(s => ({
        label: s.name,
        value: s.id
    }))

    const classOptions = classes.map(c => ({
        label: c.name,
        value: c.id
    }))

    const fromSectionOptions = fromClass?.value
        ? sections
            .filter(s => s.class_id === fromClass.value)
            ?.map(s => ({
                label: s.name,
                value: s.id
            }))
        : []

    const toSectionOptions = toClass?.value
        ? sections
            .filter(s => s.class_id === toClass.value)
            ?.map(s => ({
                label: s.name,
                value: s.id
            }))
        : []

    const handleFromClassChange = (fromClass) => {
        try {
            setFromSection(null)
            setStudentOptions([])
            setSelectedStudents([])
        } finally {
            setFromClass(fromClass)
        }
    }

    const handleToClassChange = (toClass) => {
        setToClass(toClass)
        setToSection(null)
    }

    const selectAllToggle = () => {
        if (allSelected) {
            setSelectedStudents([])
            setAllSelected(false)
        } else {
            const alreadySelectedValues = new Set(selectedStudents.map(s => s.value))
            const studentsToAdd = studentOptions.filter(s => !alreadySelectedValues.has(s.value))

            setSelectedStudents(prev => ([...prev, ...studentsToAdd]))
            setAllSelected(true)
        }
    }

    useEffect(() => {
        if (!fromSession?.value || !fromClass?.value) return

        if (fromSectionOptions.length && !fromSection?.value) return

        const fetchStudents = async () => {
            let query = supabase
                .from('students')
                .select('id, name, adm_no')
                .eq('school_id', profile.school_id)
                .eq('session_id', fromSession.value)
                .eq('class_id', fromClass.value)
    
            if (fromSection?.value) {
                query = query.eq('section_id', fromSection.value)
            }

            query = query.order('adm_no', {ascending: true})
    
            const { data: studentData, error: studentErr } = await query

            if (studentErr) {
                toast.error('Failed to fetch students.')
                console.error(studentErr.message)
                return
            }

            setStudentOptions(studentData.map(s => ({
                label: `${s.name} (Adm No: ${s.adm_no})`,
                value: s.id
            })))
        }

        fetchStudents()
    }, [fromClass, fromSection])

    const formData = {
        schoolId: profile.school_id,
        currentSession: currentSession,
        studentIds: selectedStudents.map(s => s.value),
        toSessionId: toSession?.value,
        toClassId: toClass?.value,
        toSectionId: toSection?.value,
        genFee: genFee,
        fromSessionId: fromSession?.value
    }

    const validateForm = () => {
        const errors = {}

        if (!fromSession?.value) {
            errors.fromSession = 'Please select session'
        }

        if (!fromClass?.value) {
            errors.fromClass = 'Please select class'
        }

        if (!selectedStudents.length >= 1) {
            errors.students = 'Please select students'
        }

        if (!toSession?.value) {
            errors.toSession = 'Please select session'
        }

        if (!toClass?.value) {
            errors.toClass = 'Please select class'
        }

        if (toSession?.value === fromSession?.value && toSection?.value === fromSection?.value) {
            errors.toSection = "Migrate-from and migrate-to details can't be same"
        }

        if (toSectionOptions.length && !toSection?.value) {
            errors.toSection = 'If the class has sections then need to assign a section'
        }

        return errors
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errors = validateForm()

        if (Object.keys(errors).length > 0) {
            setClientErrors(errors)
            return
        }

        try {
            setLoading(true)
            
            const res = await migrateStudentAction(formData)

            if (res.error) {
                if (res.error.message) {
                toast.error(res.error.message)
                return
                }
                console.error(res.error)
                toast.error('Failed to migrate students.')
                return
            }

            if (res.success) {
                toast.success('Students migrated successfully.')
                return
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to migrate students.')
        } finally {
            setLoading(false)
        }
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
            <div className="w-full flex flex-col gap-2">
                <h1 className='text-lg font-semibold'>Migrate From</h1>

                <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className='w-full sm:max-w-fit flex flex-col items-start'>
                        <label className='mb-1 font-semibold'>Session</label>
                        <div className="w-full sm:w-[240px] px-1">
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
                                instanceId='from-session'
                                options={sessionOptions}
                                value={fromSession}
                                onChange={setFromSession}
                                isClearable
                                placeholder="Select Session"
                            />
                            {clientErrors.fromSession && (
                                <p className='text-red-600 text-xs mt-1'>{clientErrors.fromSession}</p>
                            )}
                        </div>
                    </div>

                    <div className='w-full sm:max-w-fit flex flex-col items-start'>
                        <label className='mb-1 font-semibold'>Class</label>
                        <div className="w-full sm:w-[240px] px-1">
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
                                instanceId='from-class'
                                options={classOptions}
                                value={fromClass}
                                onChange={handleFromClassChange}
                                isClearable
                                placeholder="Select Class"
                            />
                            {clientErrors.fromClass && (
                                <p className='text-red-600 text-xs mt-1'>{clientErrors.fromClass}</p>
                            )}
                        </div>
                    </div>

                    <div className='w-full sm:max-w-fit flex flex-col items-start'>
                        <label className='mb-1 font-semibold'>Section</label>
                        <div className="w-full sm:w-[240px] px-1">
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
                                instanceId='from-section'
                                options={fromSectionOptions}
                                value={fromSection}
                                onChange={setFromSection}
                                isClearable
                                placeholder="Select Section"
                            />
                            {clientErrors.fromSection && (
                                <p className='text-red-600 text-xs mt-1'>{clientErrors.fromSection}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className='w-full flex flex-col gap-2'>
                <div className='w-full flex items-center justify-between gap-4'>
                    <label className='text-lg font-semibold'>Students</label>

                    <button type="button" className='px-2 py-1 rounded-xl text-black text-sm bg-[#f0f0f0] hover:bg-[#e6e6e6]' onClick={selectAllToggle}>
                        {allSelected ? 'Clear All' : 'Select All'}
                    </button>
                </div>
                <div className="w-full px-1">
                    <Select
                        styles={{
                        multiValueRemove: (base) => ({
                        ...base,
                        color: "black",
                        backgroundColor: "transparent",
                        ":hover": {
                            backgroundColor: "#f0f0f0",
                            cursor: "pointer",
                        },
                        }),
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
                            fontSize: '14px'
                        }),
                        }}
                        instanceId='migrate-students'
                        options={studentOptions}
                        value={selectedStudents}
                        onChange={setSelectedStudents}
                        isMulti
                        isClearable
                        placeholder="Select Students"
                    />
                    {clientErrors.students && (
                        <p className='text-red-600 text-xs mt-1'>{clientErrors.students}</p>
                    )}
                </div>
            </div>

            <div className="w-full flex flex-col gap-2">
                <h1 className='text-lg font-semibold'>Migrate To</h1>

                <div className="w-full flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    <div className='w-full sm:max-w-fit flex flex-col items-start'>
                        <label className='mb-1 font-semibold'>Session</label>
                        <div className="w-full sm:w-[240px] px-1">
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
                                instanceId='to-session'
                                options={sessionOptions}
                                value={toSession}
                                onChange={setToSession}
                                isClearable
                                placeholder="Select Session"
                            />
                            {clientErrors.toSession && (
                                <p className='text-red-600 text-xs mt-1'>{clientErrors.toSession}</p>
                            )}
                        </div>
                    </div>

                    <div className='w-full sm:max-w-fit flex flex-col items-start'>
                        <label className='mb-1 font-semibold'>Class</label>
                        <div className="w-full sm:w-[240px] px-1">
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
                                instanceId='to-class'
                                options={classOptions}
                                value={toClass}
                                onChange={handleToClassChange}
                                isClearable
                                placeholder="Select Class"
                            />
                            {clientErrors.toClass && (
                                <p className='text-red-600 text-xs mt-1'>{clientErrors.toClass}</p>
                            )}
                        </div>
                    </div>

                    <div className='w-full sm:max-w-fit flex flex-col items-start'>
                        <label className='mb-1 font-semibold'>Section</label>
                        <div className="w-full sm:w-[240px] px-1">
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
                                instanceId='migrate-from-section'
                                options={toSectionOptions}
                                value={toSection}
                                onChange={setToSection}
                                isClearable
                                placeholder="Select Section"
                            />
                            {clientErrors.toSection && (
                                <p className='text-red-600 text-xs mt-1'>{clientErrors.toSection}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className='flex items-center gap-2'>
                <input id='genFee' type='checkbox' checked={genFee} onChange={(e) => setGenFee(e.target.checked)} />
                <label htmlFor='genFee'>Generate fee for the new session and class</label>
            </div>
            
            <button className='primary-btn'>
                Migrate
            </button>

            {loading && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
                    <Spinner size={28} />
                </div>
            )}

        </form>
    )
}