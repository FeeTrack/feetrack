import {useState, useEffect} from 'react'
import toast from 'react-hot-toast'

export default function StudentSearch() {
    const [students, setStudents] = useState([])
    const [query, setQuery] = useState('')

    useEffect(() => {
        const fetchStudents = async () => {
            const res = await fetch(`/api/students/${query}`, {method: GET})
            const data = await res.json()

            if (!res.ok || data?.error) {
                toast.error('Error searching student: ' + (data.error.message || res.statusText))
            }

            setStudents(data?.students)
        }
        setTimeout(() => {
            fetchStudents()
        }, 300)
    }, [query])

    return (
        <div className='w-full rounded-2xl overflow-hidden'>
            <input 
                className='p-2'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </div>
    )
}