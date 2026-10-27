'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";
import ExcelJS from 'exceljs';

import ConfirmModal from '@/components/ConfirmModal';
import Spinner from '@/components/Spinner';
import { deleteStaffAction } from './actions';
import { genders } from '@/utils/constants/students';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Download, Edit, Eye, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { checkFeatureLimit } from '@/utils/supabase/supabaseQueries';

const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : '';

export default function StaffClient({profile, staff: inital}) {
  const router = useRouter();
  const [allStaff, setAllStaff] = useState(inital);
  const [nameQuery, setNameQuery] = useState('');
  const [designationQuery, setDesignationQuery] = useState('')

  const [pageNo, setPageNo] = useState(1);
  const pageSize = 10;
  const count = allStaff.length || 0;
  const totalPages = Math.ceil(count/pageSize)

  const staffToDisplay = allStaff.slice(
    (pageNo - 1) * pageSize, pageNo * pageSize
  )

  // Both searches apply together
  useEffect(() => {
    const filterTimeout = setTimeout(() => {
      const name = nameQuery.trim().toLowerCase();
      const designation = designationQuery.trim().toLowerCase();
      setAllStaff(inital.filter(s =>
        (!name || s.name.toLowerCase().includes(name)) &&
        (!designation || s.designation?.toLowerCase().includes(designation))
      ));
      setPageNo(1);
    }, 300)

    return () => clearTimeout(filterTimeout)
  }, [nameQuery, designationQuery, inital]);

  const handleAddStaff = async () => {
    const limitCheck = await checkFeatureLimit(profile.school_id, 'staff')
    if (!limitCheck.allowed) {
      toast.error('Staff limit reached. Please upgrade your plan to add more staff.')
      return
    }

    router.push('/user/staff/add-staff')
  }

  const downloadExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Staff");

    sheet.columns = [
      { header: "Sr.", key: "sr", width: 6 },
      { header: "Staff Name", key: "name", width: 22 },
      { header: "Designation", key: "designation", width: 18 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Mobile No.", key: "mobile_no", width: 14 },
      { header: "Joining Date", key: "joining_date", width: 13 },
      { header: "Salary", key: "salary", width: 10 },
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

    allStaff.forEach((s, index) => {
      const row = sheet.addRow({
        sr: index + 1,
        name: s.name,
        designation: s.designation,
        gender: genders.find(g => g.value === s.gender)?.label || '',
        mobile_no: s.mobile_no,
        joining_date: formatDate(s.joining_date),
        salary: s.salary,
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

  const handleDelete = async (staffId, staffName) => {
    if (!staffId) return;

    setOpenDelete(false);
    setDeleting(true);
    try {
      const res = await deleteStaffAction(staffId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Successfully deleted staff: ${staffName}`);
      setAllStaff(prev => prev.filter(s => s.id !== staffId));
    } catch (error) {
      console.error("Error deleting staff:" + error)
      toast.error('Failed to delete staff.');
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className='w-full flex items-center gap-4 flex-wrap'>
          <button className="primary-btn" onClick={handleAddStaff}>
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Staff
              </span>
          </button>
      </div>

      <Card className='w-full max-w-[calc(100vw-32px)] overflow-x-auto border-gray-300'>
        <CardHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                className="pl-8 w-full max-w-64 text-sm"
              />
            </div>
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  <TableHead>Joining Date</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allStaff.length === 0 ? (
                  <TableRow className='border-gray-300'>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No staff yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  staffToDisplay.map((s, index) => (
                    <TableRow key={s.id} className='border-gray-300'>
                      <TableCell>{((pageNo-1) * pageSize)+(index + 1)}</TableCell>
                      <TableCell className='font-semibold'>{s.name}</TableCell>
                      <TableCell>{s.designation}</TableCell>
                      <TableCell>{s.mobile_no}</TableCell>
                      <TableCell>{formatDate(s.joining_date)}</TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <button title="View / Print" className='p-1 rounded hover:bg-secondary hover:text-secondary-foreground transition-all duration-200' onClick={() => router.push(`/user/staff/${s.id}/details`)}>
                            <Eye className="h-4 w-4" />
                          </button>
                          <button title="Edit" className='p-1 rounded hover:bg-secondary hover:text-secondary-foreground transition-all duration-200' onClick={() => router.push(`/user/staff/${s.id}/edit`)}>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button title="Delete" className='p-1 rounded hover:bg-red-400 hover:text-secondary-foreground transition-all duration-200' onClick={() => {setDeleteStaff(s); setOpenDelete(true)}}>
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
            <p className='text-gray-700 text-sm'>Showing page {pageNo} of {totalPages === 0 ? 1 : totalPages}</p>

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
    </div>
  )
}
