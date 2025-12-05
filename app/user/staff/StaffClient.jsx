'use client';
import React, { useState, useEffect, useRef } from 'react';
import toast from "react-hot-toast";

import { createClientSupabase } from '@/utils/supabase/client';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import AddStaffForm from './AddStaffForm';
import EditStaffForm from './EditStaffForm';
import Spinner from '@/components/Spinner';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Download, Edit, Trash2, ArrowLeft, ArrowRight } from "lucide-react";

export default function StaffClient({profile, staff: inital}) {
  const [allStaff, setAllStaff] = useState(inital);
  const [editStaff, setEditStaff] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [nameQuery, setNameQuery] = useState('');
  const [designationQuery, setDesignationQuery] = useState('')

  useEffect(() => {
    setAllStaff(inital)
  }, [inital]);

  const [pageNo, setPageNo] = useState(1);
  const pageSize = 10;
  const count = allStaff.length || 0;
  const totalPages = Math.ceil(count/pageSize)

  const staffToDisplay = allStaff.slice(
    (pageNo - 1) * pageSize, pageNo * pageSize
  )

  useEffect(() => {
    const filterByName = () => {
      if (nameQuery.trim() === '') {
        setAllStaff(inital);
      } else {
        const filtered = inital.filter(s =>
          s.name.toLowerCase().includes(nameQuery.toLowerCase())
        );
        setAllStaff(filtered);
      }
    }
    const filterTimeout = setTimeout(() => {
      filterByName();
    }, 500)

    return () => clearTimeout(filterTimeout)
  }, [nameQuery]);

  useEffect(() => {
    const filterByDesignation = () => {
      if (designationQuery.trim() === '') {
        setAllStaff(inital);
      } else {
          const filtered = inital.filter(s =>
            s.designation.toLowerCase().includes(designationQuery.toLowerCase())
          );
          setAllStaff(filtered);
      }
    }
    const filterTimeout = setTimeout(() => {
      filterByDesignation();
    }, 500)

    return () => clearTimeout(filterTimeout)
  }, [designationQuery]);

  const modalRef = useRef();
  const scrollModalTop = () => {
    if (modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const handleSubmit = () => {
    scrollModalTop()
    setShowEdit(false)
    setEditStaff(null)
  }

  const downloadExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Staff");

    sheet.columns = [
      { header: "Sr.", key: "sr", width: 6 },
      { header: "Staff Name", key: "name", width: 20 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Mobile No.", key: "mobile_no", width: 15 },
    ];

    // ⭐ Bold header row (Row 1)
    sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        cell.alignment = { vertical: "middle", wrapText: true };
    });

    allStaff.forEach((t, index) => {
      const row = sheet.addRow({
        sr: index + 1,
        route: t.name,
        monthly_fee: t.monthly_fee,
        vehicle_no: t.vehicle_no
      });

      row.eachCell((cell) => {
          cell.alignment = { vertical: "top", wrapText: true };
          cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" }
          };
      });
      
      // Center align the Sr. column
      row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Staff_${new Date().toLocaleDateString('en-IN')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteStaff, setDeleteStaff] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClientSupabase();
  const handleDelete = async (staffId, staffName) => {
    if (!staffId) return;

    try {
      setOpenDelete(false);
      setTimeout(() => setDeleting(true), 200); // Delay showing spinner to avoid flicker for fast operations

      const {error} = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId);
      if (error) {
        console.error(error.message);
        toast.error('Failed to delete staff.');
        return;
      }

      toast.success(`Successfully deleted staff: ${staffName}`);
      setAllStaff(prev => prev.filter(s => s.id !== staffId));
    } catch (error) {
        console.error("Error deleting staff:" + error)
    } finally {
        setDeleting(false)
    }
  }
  
  return (
    <div className="space-y-6 w-full max-w-full">
      <div className='w-full flex items-center gap-4 flex-wrap'>
          <button className="primary-btn" onClick={() => setShowAdd(true)}>
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Staff
              </span>
          </button>
      </div>

      <Card className='w-full max-w-[calc(100vw-32px)] overflow-x-auto border-gray-300'>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 2-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name..."
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                className="pl-8 w-full max-w-64 text-sm"
              />
            </div>
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 2-4 text-muted-foreground" />
              <Input 
                placeholder="Search by designation..."
                value={designationQuery}
                onChange={(e) => setDesignationQuery(e.target.value)}
                className="pl-8 w-full max-w-64 text-sm"
              />
            </div>
            <Button variant='outline' size='icon' onClick={downloadExcel} >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border border-gray-300'>
            <Table>
              <TableHeader>
                <TableRow className='border-gray-300'>
                  <TableHead>Sr.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Mobile No.</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allStaff.length === 0 ? (
                  <TableRow className='border-gray-300'>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No staff yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  staffToDisplay.map((s, index) => (
                    <TableRow key={s.id} className='border-gray-300'>
                      <TableCell>{((pageNo-1) * pageSize)+(index + 1)}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.designation}</TableCell>
                      <TableCell>{s.mobile_no}</TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <button className='p-1 rounded hover:bg-secondary hover:text-secondary-foreground transition-all duration-200' onClick={() => {setEditStaff(s); setShowEdit(true);}}>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className='p-1 rounded hover:bg-red-400 hover:text-secondary-foreground transition-all duration-200' onClick={() => {setDeleteStaff(s); setOpenDelete(true)}}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                ))}
              </TableBody>
            </Table>
          </div>
          <div className='w-full flex justify-between items-center mt-2 px-2'>
            <p className='text-gray-700 text-sm'>Showing page {pageNo} of {totalPages}</p>

            <div className='flex items-center gap-4'>
              <button className='p-1 bg-gray-200 rounded-md disabled:bg-transparent' disabled={pageNo === 1} onClick={() => {setPageNo(prev => prev - 1)}}>
                <ArrowLeft className='w-4 h-4' />
              </button>
              
              <button className='p-1 bg-gray-200 rounded-md disabled:bg-transparent' disabled={pageNo === totalPages || allStaff.length === 0} onClick={() => setPageNo(prev => prev + 1)} >
                <ArrowRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {deleteStaff && (
        <ConfirmModal
          isOpen={openDelete}
          onClose={() => setOpenDelete(false)}
          onConfirm={() => handleDelete(deleteStaff.id, deleteStaff.name)}
          action="Delete"
            message={
              <>
                Are you sure you want to delete the staff <strong>{deleteStaff.name}</strong>? This action cannot be undone.
              </>
            }
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
          <Spinner size={28} />
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Staff" ref={modalRef}>
        <AddStaffForm
          profile={profile}
          onSubmit={handleSubmit}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <Modal open={showEdit} onClose={() => { setShowEdit(false); setEditStaff(null); }} title="Edit Staff">
        {editStaff && (
        <EditStaffForm 
          staff={editStaff}
          onSubmit={handleSubmit}
          onCancel={() => { setShowEdit(false); setEditStaff(null); }} />
        )}
      </Modal>
    </div>        
  )
}