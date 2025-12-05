'use client';
import React, { useState, useEffect, useRef } from 'react';
import toast from "react-hot-toast";
import ExcelJS from 'exceljs';

import { createClientSupabase } from '@/utils/supabase/client';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import AddTransportRoutesForm from './AddTransportRouteForm';
import EditTransportRouteForm from './EditTransportRouteForm';
import Spinner from '@/components/Spinner';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Download, Edit, Trash2, ArrowLeft, ArrowRight, User2 } from "lucide-react";
import ManageStudentTransport from './ManageStudentTransport';

export default function TransportClient({profile, transportRoutes: inital}) {
  const [transportRoutes, setTransportRoutes] = useState(inital);
  const [editTransportRoute, setEditTransportRoute] = useState(null);

  useEffect(() => {
    setTransportRoutes(inital)
  }, [inital]);

  const [showAdd, setShowAdd] = useState(false);
  const [showStudentTransport, setShowStudentTransport] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [pageNo, setPageNo] = useState(1);
  const pageSize = 10;
  const count = transportRoutes.length || 0;
  const totalPages = Math.ceil(count/pageSize)

  const transportRoutesToDisplay = transportRoutes.slice(
    (pageNo - 1) * pageSize, pageNo * pageSize
  )

  useEffect(() => {
    const filter = () => {
      if (searchQuery.trim() === '') {
        setTransportRoutes(inital);
      } else {
        const filtered = inital.filter(e =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setTransportRoutes(filtered);
      }
    }
    const filterTimeout = setTimeout(() => {
      filter();
    }, 500)

    return () => clearTimeout(filterTimeout)
  }, [searchQuery]);

  const modalRef = useRef();
  const scrollModalTop = () => {
    if (modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const handleSubmit = () => {
    scrollModalTop()
    setShowEdit(false)
    setEditTransportRoute(null)
  }

  const downloadExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Transport Routes");

    sheet.columns = [
      { header: "Sr.", key: "sr", width: 6 },
      { header: "Route", key: "route", width: 20 },
      { header: "Monthly Fee", key: "monthly_fee", width: 15 },
      { header: "Vehicle No.", key: "vehicle_no", width: 15 },
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

    transportRoutes.forEach((t, index) => {
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
    a.download = `Transport_Routes_${new Date().toLocaleDateString('en-IN')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTransportRoute, setDeleteTransportRoute] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClientSupabase();
  const handleDelete = async (transportRouteId, transportRouteName) => {
    if (!transportRouteId) return;

    try {
      setOpenDelete(false);
      setTimeout(() => setDeleting(true), 200); // Delay showing spinner to avoid flicker for fast operations

      const { error } = await supabase
        .from('transport_routes')
        .delete()
        .eq('id', transportRouteId);
      if (error) {
        console.error(error.message);
        toast.error('Failed to delete transport route.');
        return;
      }

      toast.success(`Successfully deleted transport route: ${transportRouteName}`);
      setTransportRoutes(prev => prev.filter(s => s.id !== transportRouteId));
    } catch (error) {
        console.error("Error deleting transport route:" + error)
    } finally {
        setDeleting(false)
    }
  }
  
  return (
    <div className="space-y-6 w-full max-w-full">
      <div className='w-full flex items-center gap-4 flex-wrap'>
        <button className="primary-btn" onClick={() => setShowAdd(true)}>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Routes
          </div>
        </button>

        <button className='primary-btn' onClick={() => setShowStudentTransport(true)}>
          <div className='flex items-center gap-2'>
            <User2 className='w-4 h-4' />
            Manage Student's Transport
          </div>
        </button>
      </div>

      <div className='w-full flex flex-col gap-4'>
        <h1 className="text-lg font-semibold">Transport Routes</h1>

        <Card className='w-full max-w-[calc(100vw-32px)] overflow-x-auto border-gray-300'>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 2-4 text-muted-foreground" />
                <Input 
                  placeholder="Search route..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                    <TableHead>Route</TableHead>
                    <TableHead>Monthly Fee</TableHead>
                    <TableHead>Vehicle No</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transportRoutes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No routes yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transportRoutesToDisplay.map((t, index) => (
                      <TableRow key={t.id} className='border-gray-300'>
                        <TableCell>{((pageNo-1) * pageSize)+(index + 1)}</TableCell>
                        <TableCell>{t.name}</TableCell>
                        <TableCell>{t.monthly_fee}</TableCell>
                        <TableCell>{t.vehicle_no}</TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end gap-2">
                            <button className='p-1 rounded hover:bg-secondary hover:text-secondary-foreground transition-all duration-200'
                              onClick={() => {
                                if (profile.role !== 'admin') {
                                  toast.error('Sorry, you do not have access to this feature.')
                                  return
                                }
                                setEditTransportRoute(t); setShowEdit(true);}}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className='p-1 rounded hover:bg-red-400 hover:text-secondary-foreground transition-all duration-200'
                              onClick={() => {
                                if (profile.role !== 'admin') {
                                  toast.error('Sorry, you do not have access to this feature.')
                                  return
                                }
                                setDeleteTransportRoute(t); setOpenDelete(true)}}
                            >
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
                
                <button className='p-1 bg-gray-200 rounded-md disabled:bg-transparent' disabled={pageNo === totalPages || transportRoutes.length === 0} onClick={() => setPageNo(prev => prev + 1)} >
                  <ArrowRight className='w-4 h-4' />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {deleteTransportRoute && (
        <ConfirmModal
          isOpen={openDelete}
          onClose={() => setOpenDelete(false)}
          onConfirm={() => handleDelete(deleteTransportRoute.id, deleteTransportRoute.name)}
          action="Delete"
            message={
              <>
                Are you sure you want to delete the route <strong>{deleteTransportRoute.name}</strong>? This action cannot be undone.
              </>
            }
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
          <Spinner size={28} />
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Transport Routes" ref={modalRef}>
        <AddTransportRoutesForm
          profile={profile}
          onSubmit={handleSubmit}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <Modal open={showStudentTransport} onClose={() => setShowStudentTransport(false)} title="Manage Student's Transport" ref={modalRef}>
        <ManageStudentTransport
          profile={profile}
          transportRoutes={transportRoutes}
          onSubmit={handleSubmit}
          onCancel={() => setShowStudentTransport(false)}
        />
      </Modal>

      <Modal open={showEdit} onClose={() => { setShowEdit(false); setEditTransportRoute(null); }} title="Edit Transport Route">
        {editTransportRoute && (
        <EditTransportRouteForm 
          route={editTransportRoute}
          onSubmit={handleSubmit}
          onCancel={() => { setShowEdit(false); setEditTransportRoute(null); }} />
        )}
      </Modal>
    </div>        
  )
}