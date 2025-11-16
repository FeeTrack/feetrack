'use client';

import { useState, useEffect, useRef, useActionState } from "react";
import { createClientSupabase } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { filterStudentsAction } from "./actions";
import { updateStudentFeeStructure } from "@/utils/billing/updateStudentFeeStructure";
import { leftOutStudentAction } from "./actions";

import AddStudentForm from "./AddStudentForm";
import EditStudentForm from "./EditStudentForm";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import { useSession } from "@/Context/SessionContext";
import Spinner from "@/components/Spinner";

import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Download, Edit, Trash2, Filter, Menu, IndianRupee, EyeOff } from "lucide-react";

export default function StudentsClient({ profile, schoolType, recentAdmissions, showAdd: initialShowAdd }) {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [admNo, setAdmNo] = useState('');
  
  const [students, setStudents] = useState(recentAdmissions || []);
  const [hasFilteredStudents, setHasFilteredStudents] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [showAdd, setShowAdd] = useState(initialShowAdd || false);
  const [showEdit, setShowEdit] = useState(false);
  const [showFilter, setShowFilter] = useState(false)
  const [editStudent, setEditStudent] = useState(null);
  const [showConfirmLeftOut, setShowConfirmLeftOut] = useState(false);
  const [leftOutStudent, setLeftOutStudent] = useState(null);

  const { currentSession } = useSession();

  const [state, filterAction, pending] = useActionState(filterStudentsAction, {error: null});

  const supabase = createClientSupabase();

  useEffect(() => {
    const sourceData = hasFilteredStudents ? filteredStudents : recentAdmissions;
    if (searchQuery.trim() === '') {
      setStudents(sourceData);
    } else {
      const filtered = sourceData.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.adm_no.toString().includes(searchQuery)
      );
      setStudents(filtered);
    }

  }, [searchQuery]);

  useEffect(() => {
    if (classes.length > 0) return;
    async function fetchClassesSections() {
    
      const { data: classes } = await supabase
        .from('classes')
        .select('name, id')
        .eq('school_id', profile.school_id)
        .order("name", { ascending: true });
      setClasses(classes || []);
  
      const { data: sections } = await supabase
        .from('sections')
        .select('name, id, class_id')
        .eq('school_id', profile.school_id)
        .order("name", { ascending: true });
      setSections(sections || []);
    }
  
    fetchClassesSections();
  }, [])

  useEffect(() => {
    if (!showAdd) return;
    async function fetchAdmNo() {
      const { data: admissionNo } = await supabase
        .from('students')
        .select('adm_no')
        .eq('school_id', profile.school_id)
        .order('adm_no', { ascending: false })
        .limit(1);
      setAdmNo((admissionNo.length === 0 ? 1 : admissionNo[0].adm_no + 1));
    }
    fetchAdmNo();
  }, [showAdd]);

  const modalRef = useRef();
  const scrollModalTop = () => {
    if (modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  useEffect(() => {
    setStudents(recentAdmissions);
  }, [recentAdmissions]);

  const handleSubmit = (state) => {
    scrollModalTop()
    setShowEdit(false)
    setEditStudent(null)
    if (state?.status === 'success') {
      toast.success(state.message);
      return;
    }
    if (state?.error) {
      toast.error(state?.error);
    }
  }

  const [filterFormData, setFilterFormData] = useState({
    class: '',
    section: '',
    studentType: '',    
  })

  const studentTypes = [
    { label: 'New', value: 'new' },
    { label: 'Old', value: 'promoted' }
  ]

  const studentStatuses = [
    { label: 'Active', value: 'active' },
    { label: 'Left/TC', value: 'left_tc' }
  ]
  
  const handleFilterChange = (e) => {
    setFilterFormData({
      ...filterFormData,
      [e.target.name]: e.target.value
    });
  }

  const handleAddStudent = () => {
    if (classes.length === 0) {
      toast.error("Please set up classes first in the settings.");
      return;
    }
    setShowAdd(true);
  }

  useEffect(() => {
    const fs = sections.filter(s => s.class_id === filterFormData.class);
    setFilteredSections(fs);
  }, [filterFormData.class]);

  useEffect(() => {
    if (state.filteredStudentsResponse) {
      if (filterFormData.studentType) {
        const typeFiltered = state.filteredStudentsResponse?.filter(s => s.type === filterFormData.studentType);
        setHasFilteredStudents(true);
        setFilteredStudents(typeFiltered);
        setStudents(typeFiltered);
      } else {
        setHasFilteredStudents(true);
        setFilteredStudents(state.filteredStudentsResponse);
        setStudents(state.filteredStudentsResponse || []);
      }
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const clearFilters = () => {
    setFilterFormData({
      class: '',
      section: '',
      studentType: '',
    });
    setHasFilteredStudents(false);
    setStudents(recentAdmissions);
  }

  const handleUpdateFeeStructure = async (student) => {
    const toastId = toast.loading("Updating fee structure...");
    const res = await updateStudentFeeStructure({student, currentSession});
    toast.dismiss(toastId);
    if (res.success) {
      toast.success("Fee structure updated successfully.");
    } else {
      toast.error("Failed to update fee structure: " + res.error);
    }
  }

  const confirmLeftOutStudent = (student) => {
    // Later add TC modal for school.type === 'school'
    setLeftOutStudent(student);
    setShowConfirmLeftOut(true);
  }

  const handleLeftOutStudent = async (studentId) => {
    setDeleting(true);
    const res = await leftOutStudentAction(studentId);
    setDeleting(false);
    if (res.success) {
      toast.success('Student marked as left-out successfully.');
    } else {
      toast.error("Failed to mark student as left-out: " + res.error);
    }
  }

  const [openDelete, setOpenDelete] = useState(false)
  const [deleteStudent, setDeleteStudent] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (studentId, studentName) => {
    if (!studentId) return
    
    try {
      setOpenDelete(false)
      setTimeout(() => setDeleting(true), 200); // Delay showing spinner to avoid flicker for fast operations
      const res = await fetch(`/api/students/${studentId}`, {
          method: 'DELETE'
      })
      const data = await res.json()
      
      if (!res.ok) {
        toast.error("Failed to delete student: " + (data.error || res.statusText));
        return;
      }

      // Success
      toast.success(`Successfully Deleted Student: ${studentName}`);
      setStudents(prev => prev.filter(s => s.id !== studentId));
  } catch (error) {
      console.error('Failed to delete student. ' + error)
  } finally {
      setDeleting(false)
  }
}

  return (
  <div className="space-y-6">
    <div className="flex flex-col">
      <div className="w-full flex items-center gap-4 flex-wrap">
        <button className="primary-btn" onClick={handleAddStudent}>
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Student
          </span>
        </button>

        <button className="primary-btn" onClick={() => setShowFilter(prev => !prev)}>
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter Students
          </span>
        </button>
      </div>

      <div className={`w-full overflow-hidden ${showFilter ? 'max-h-20 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'} transition-all duration-300`}>
        <form action={filterAction} className="flex items-center gap-4 flex-wrap" id="filterForm">
          {currentSession?.id && <input type="hidden" name="currentSession" value={currentSession.id} />}

          <div className="flex flex-col gap-2 justify-start">
            <label className="font-semibold">Class</label>
            <select name="class" className="border rounded px-2 py-1 md:min-w-[100px] max-w-fit hover:border hover:border-secondary z-10" value={filterFormData.class} onChange={handleFilterChange}>
              <option value='' className="text-black">Select Class</option>
              {classes?.map(cls => (
                <option key={cls.id} value={cls.id} className='text-black'>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 justify-start">
            <label className="font-semibold">Section</label>
            <select name="section" className="border rounded px-2 py-1 w-[50px] md:w-[100px] hover:border hover:border-secondary z-10" value={filterFormData.section} onChange={handleFilterChange}>
              {filteredSections?.map(section => (
                <option key={section.id} value={section.id} className='text-black'>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 justify-start">
            <label className="font-semibold">Status</label>
            <select name="studentStatus" className="border rounded px-2 py-1 w-[60px] md:w-[100px] hover:border hover:border-secondary z-10" value={filterFormData.studentStatus} onChange={handleFilterChange}>
              <option value='' className="text-black">Select Status</option>
              {studentStatuses.map(status => (
                <option key={status.value} value={status.value} className='text-black'>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 justify-start">
            <label className="font-semibold">Type</label>
            <select name="studentType" className="border rounded px-2 py-1 w-[60px] md:w-[100px] hover:border hover:border-secondary z-10" value={filterFormData.studentType} onChange={handleFilterChange}>
              <option value='' className="text-black">Select Type</option>
              {studentTypes.map(type => (
                <option key={type.value} value={type.value} className='text-black'>
                  {type.label}
                </option>
              ))}
            </select>
          </div>


          <button type="submit" className="primary-btn ml-2" form="filterForm" disabled={!filterFormData.class}>Filter</button>
          
          {hasFilteredStudents && <button type="button" className="primary-btn" onClick={clearFilters} disabled={pending}>Clear</button>}
          
          {pending && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
              <Spinner size={28} />
            </div>
          )}
        </form>
      </div>
    </div>

    <div className="w-full flex flex-col">
      {!students ? (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
          <Spinner size={28} />
        </div>
      ) : (
        <>
          <h1 className="text-lg font-semibold mb-4">{hasFilteredStudents ? 'Search Results' : 'Recent Admissions'}</h1> {/* If not filter, then Recent Admissions */}

          {/* Table */}
          <Card className='w-full max-w-[calc(100vw-48px)] overflow-x-auto'>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {hasFilteredStudents && (
                  <div>
                    <CardDescription>
                      {students.length} student{students.length !== 1 ? 's' : ''} found.
                    </CardDescription>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="relative flex-initial">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search in the table"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='pl-8 w-full max-w-64 text-sm'
                    />
                  </div>
                  <Button variant='outline' size='icon'>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sr.</TableHead>
                      <TableHead>Student Details</TableHead>
                      <TableHead>Academic Details</TableHead>
                      <TableHead className='text-right pr-4'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className='text-center py-4 text-muted-foreground'>
                          No students yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((s, index) => (
                        <TableRow key={s.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-start">
                                <h2 className="font-semibold">{s.name}</h2>
                                {s.status === 'left_tc' && (
                                  <div className="ml-1 px-1 rounded bg-gray-200 h-1/2 text-[10px] font-medium">{(schoolType === 'school' || schoolType === 'college') ? 'TC Issued' : 'Left Out'}</div>
                                )}
                              </div>
                              <div>Father's Name: {s.father_name}</div>
                              <div>Mother's Name: {s.mother_name}</div>
                              <div>Mobile No: {s.parent_mobile}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div>Class: {`${s.classes.name}${s.sections.name ? ` (${s.sections.name})` : ''}`}</div>
                              <div>Admission No: {s.adm_no}</div>
                              <div>Roll No: {s.roll_no}</div>
                            </div>
                          </TableCell>
                          <TableCell className='text-right pr-6'>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <button className='p-1 rounded hover:bg-secondary hover:text-secondary-foreground transition-all duration-200' onClick={() => {setEditStudent(s); setShowEdit(true);}}>
                                    <Menu className="h-4 w-4" />
                                  </button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem className='p-0'>
                                    <button className='hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 w-full p-1 rounded-md' onClick={() => {setEditStudent(s); setShowEdit(true);}}>
                                      <span className="flex items-center gap-1">
                                        <Edit className="h-4 w-4 text-inherit" /> Edit
                                      </span>
                                    </button>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem className='p-0'>
                                    <button className="hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 w-full p-1 rounded-md" onClick={() => handleUpdateFeeStructure(s)}>
                                      <div className="flex items-center gap-1">
                                        <IndianRupee className="h-4 w-4 text-inherit" /> Update Fee Structure
                                      </div>
                                    </button>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem className='p-0'>
                                    <button className="hover:bg-red-400 hover:text-secondary-foreground transition-all duration-200 w-full p-1 rounded-md" onClick={() => confirmLeftOutStudent(s)}>
                                      <div className="flex items-center gap-1">
                                        <EyeOff className="h-4 w-4 text-inherit" /> {(schoolType === 'school' || schoolType === 'college') ? 'Issue TC' : 'Mark Left-Out'}
                                      </div>
                                    </button>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem className='p-0'>
                                    <button className="hover:bg-red-400 hover:text-secondary-foreground transition-all duration-200 w-full p-1 rounded-md" onClick={() => {setDeleteStudent(s); setOpenDelete(true)}}>
                                      <span className="flex items-center gap-1">
                                        <Trash2 className="h-4 w-4 text-inherit" /> Delete
                                      </span>
                                    </button>
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>        
        </>
      )}

      {leftOutStudent && (
        <ConfirmModal
          isOpen={showConfirmLeftOut}
          onClose={() => setShowConfirmLeftOut(false)}
          onConfirm={() => handleLeftOutStudent(leftOutStudent.id)}
          action={(schoolType === 'school' || schoolType === 'college') ? 'Issue TC' : 'Mark Left-Out'}
            message={
            <>
              Are you sure you want to mark the student <strong>{leftOutStudent.name}</strong> as {(schoolType === 'school' || schoolType === 'college') ? 'TC Issued' : 'Left Out'}?
            </>
            }
        />
      )}
      {deleteStudent && (
        <ConfirmModal
          isOpen={openDelete}
          onClose={() => setOpenDelete(false)}
          onConfirm={() => handleDelete(deleteStudent.id, deleteStudent.name)}
          action="Delete"
            message={
            <>
              Are you sure you want to delete the student <strong>{deleteStudent.name}</strong>? This will permanently remove the student's record and associated data.
            </>
            }
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
          <Spinner size={28} />
        </div>
      )}
      
      {/* Modals */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Student" ref={modalRef}>
        <AddStudentForm 
          onCancel={() => setShowAdd(false)}
          onSubmit={handleSubmit}
          currentSession={currentSession}
          classes={classes}
          admNo={admNo}
          sections={sections}
          schoolType={schoolType}
        />
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Student">
        {editStudent && (
          <EditStudentForm 
            student={editStudent}
            onSubmit={handleSubmit}
            onCancel={() => {
                setShowEdit(false)
                setEditStudent(null)
            }}
            classes={classes}
            sections={sections}
          />
        )}
      </Modal>
    </div>
  </div>
  )
}