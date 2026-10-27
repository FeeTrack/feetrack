// PaymentsClient.jsx
'use client';
import DateInput from '@/components/DateInput';
import { useState, useEffect, useRef, useActionState } from "react";
import toast from "react-hot-toast";
import ExcelJS from 'exceljs';
import { months } from "@/utils/constants/backend";
import { filterPaymentsAction } from "./actions";

import EditPaymentForm from "./EditPaymentForm";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import ConfirmModal from "@/components/ConfirmModal";

import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Edit, Trash2, Plus, Filter, ArrowLeft, ArrowRight, Printer } from 'lucide-react';
import { downloadReceipt, openReceiptWindow } from "@/utils/receipt/buildReceipt";

import { useSession } from '@/Context/SessionContext';
import Link from "next/link";

export default function PaymentsClient({ profile, recentPayments, classes = [], sections = [] }) {
    const [payments, setPayments] = useState(recentPayments || []);
    const [showEdit, setShowEdit] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [editPayment, setEditPayment] = useState(null);

    const [payPeriods, setPayPeriods] = useState([]);
    const [invoiceItems, setInvoiceItems] = useState([]);

    const [totalFeesAmount, setTotalFeesAmount] = useState(null);
    const [totalFine, setTotalFine] = useState(null);
    const [totalPaid, setTotalPaid] = useState(null);
    const [totalDiscount, setTotalDiscount] = useState(null);

    const [paymentPayPeriods, setPaymentPayPeriods] = useState([]);
    const [paymentInvoiceItems, setPaymentInvoiceItems] = useState([]);
    const [paymentItemAmounts, setPaymentItemAmounts] = useState({});
    const [paymentItemDiscounts, setPaymentItemDiscounts] = useState({});
    const [discountDescription, setDiscountDescription] = useState('');

    const [loading, setLoading] = useState(null)
    const { currentSession } = useSession();

    const [filteredPayments, setFilteredPayments] = useState(null);
    const [hasFilteredPayments, setHasFilteredPayments] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const emptyFilters = { from_date: '', to_date: '', class: '', section: '', receipt_no: '' };
    const [filterFormData, setFilterFormData] = useState(emptyFilters);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'class' ? { section: '' } : {}),
        }))
    }

    const filterSections = sections.filter(s => s.class_id === filterFormData.class);
    const hasAnyFilter = Boolean(filterFormData.from_date || filterFormData.to_date || filterFormData.class || filterFormData.receipt_no.trim());

    const [printingId, setPrintingId] = useState(null);

    const handleReprint = async (payment) => {
        // Opened during the click so the browser doesn't block it
        const receiptWindow = openReceiptWindow();
        setPrintingId(payment.id);
        try {
            const res = await fetch(`/api/fees/collect/receipt-details?payment_id=${payment.id}`);
            const payload = await res.json();
            if (!res.ok || payload?.error) {
                receiptWindow?.close();
                toast.error('Failed to load receipt: ' + (payload?.error || res.statusText));
                return;
            }
            await downloadReceipt(payload, receiptWindow);
        } catch (error) {
            receiptWindow?.close();
            console.error('Reprint error:', error);
            toast.error('Failed to print receipt.');
        } finally {
            setPrintingId(null);
        }
    }

    const [pageNo, setPageNo] = useState(1);
    const pageSize = 10;
    const count = payments.length || 0;
    const totalPages = Math.ceil(count/pageSize)

    const paymentsToDisplay = payments.slice(
        (pageNo - 1) * pageSize, pageNo * pageSize
    )

    const [deletePayment, setDeletePayment] = useState(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    const [state, filterAction, pending] = useActionState(filterPaymentsAction, {error: null});

    useEffect(() => {
        const sourceData = hasFilteredPayments ? filteredPayments : recentPayments;
        if (searchQuery.trim() === '') {
            setPayments(sourceData);
        } else {
            const filtered = sourceData.filter(p => 
                p.receipt_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.students?.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setPayments(filtered);
        }
    }, [searchQuery])

    useEffect(() => {
        if (state.filteredPaymentsResponse) {
            setHasFilteredPayments(true);
            setFilteredPayments(state.filteredPaymentsResponse);
            setPayments(state.filteredPaymentsResponse);
        } else if (state.error) {
            toast.error(state.error);
        }
    }, [state]);

    const clearFilters = () => {
        setFilterFormData(emptyFilters);
        setHasFilteredPayments(false);
        setPayments(recentPayments);
    }

    // Filter results belong to the old session; the refreshed recent payments replace them
    const sessionIdRef = useRef(currentSession?.id);
    useEffect(() => {
        if (sessionIdRef.current === currentSession?.id) return;
        sessionIdRef.current = currentSession?.id;
        clearFilters();
        setPageNo(1);
    }, [currentSession?.id]);

    useEffect(() => {
        if (hasFilteredPayments) return;
        setPayments(recentPayments);
    }, [recentPayments]);

    useEffect(() => {
        if (!editPayment) return;   

        const fetchData = async () => {
            setLoading(true)

            // Invoice periods and Items
            const res = await fetch(`/api/payments/invoices?student_id=${editPayment.students?.id}&session_id=${editPayment.session_id}&payment_id=${editPayment.id}`, {
                method: 'GET'
            });

            if (!res.ok) {
                const errorData = await res.json();
                toast.error('Failed to fetch pay periods: ' + (errorData?.error || res.statusText));
                setLoading(false);
                return;
            }

            const data = await res.json();

            const invoices = data?.invoices ?? [];
            const totalDiscounts = data?.totalDiscounts ?? [];
            const invoiceItems = data?.invoiceItems ?? [];
            const payItems = data?.paymentItems ?? [];

            const payItemIds = payItems?.map(pi => pi.invoice_items?.id)
            const prevII = invoiceItems?.filter(ii => payItemIds.includes(ii.id));
            setPaymentInvoiceItems(prevII);

            const pia = {};
            payItems.forEach(pi => {
                pia[pi.invoice_items.id] = pi.amount;
            });
            setPaymentItemAmounts(pia);

            const pid = {};
            payItems.forEach(pi => {
                pid[pi.invoice_items.id] = pi.discounts?.amount || 0;
            });
            setPaymentItemDiscounts(pid);

            const dd = payItems.map(pi => pi.discounts)?.filter(Boolean)?.find(i => i.description)?.description || '';
            setDiscountDescription(dd);

            const tfa = invoices.reduce((acc, invoice) => acc + Number(invoice.amount), 0);
            
            const lateFeeItems = invoiceItems.filter(item => item.is_late_fee);
            const tf = lateFeeItems.reduce((acc, item) => acc + Number(item.amount), 0);
            setTotalFine(tf);
            setTotalFeesAmount(tfa - tf);

            const tp = invoices.reduce((acc, invoice) => acc + Number(invoice.amount_paid), 0);
            setTotalPaid(tp);

            if (totalDiscounts.length === 0) {
                setTotalDiscount(0);
            } else {
                const td = await totalDiscounts.reduce((acc, td) => acc + Number(td.amount), 0);
                setTotalDiscount(td);
            }

            const allMonths = months.map(month => month.name);

            const sortedInvoices = invoices.sort((a, b) => {
                const monthA = a.pay_period.split('-')[0];
                const monthB = b.pay_period.split('-')[0];
                return allMonths.indexOf(monthA) - allMonths.indexOf(monthB);
            });

            const periods = sortedInvoices.map(inv => ({
                value: inv.pay_period,
                label: inv.status === 'paid' ? `${inv.pay_period.split('-')[0]} (Paid)` : inv.pay_period.split('-')[0],
                isDisabled: inv.status === 'paid' ? true : false,
                invoiceId: inv.id
            }))

            setPayPeriods(periods);
            setInvoiceItems(invoiceItems);

            const payInvoiceIds = payItems?.map(pi => pi.invoice_items?.invoices?.id)
            const prevPP = periods.filter(pp => payInvoiceIds.includes(pp.invoiceId));
            setPaymentPayPeriods(prevPP.map(pp => ({...pp, isDisabled: false})));

            setLoading(false);
        }
        fetchData();
        
    }, [editPayment])

    const handleCancel = () => {
        setShowEdit(false);
        setEditPayment(null);
        setPaymentPayPeriods([]);
        setPaymentInvoiceItems([]);
        setPaymentItemAmounts({});
        setPaymentItemDiscounts({});        
        setTotalFeesAmount(null);
        setTotalFine(null);
        setTotalPaid(null);
        setTotalDiscount(null);
        setDiscountDescription('');
        setLoading(false);
    }

    const downloadExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Payments");

        sheet.columns = [
            { header: "Sr.", key: "sr", width: 6 },
            { header: "Receipt No.", key: "receipt_no", width: 15 },
            { header: "Student Name", key: "student", width: 25 },
            { header: "Class", key: "class", width: 15 },
            { header: "Amount", key: "amount", width: 10 },
            { header: "Date", key: "date", width: 12 },
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

        payments.forEach((p, index) => {
            const row = sheet.addRow({
            sr: index + 1,
            receipt_no: p.receipt_no,
            student: p.students?.name,
            class: `${p.students?.classes?.name}${p.students?.sections?.name ? `-${p.students.sections.name}` : ''}`,
            amount: p.amount,
            date: new Date(p.created_at).toLocaleDateString("en-IN"),
            });

            // Style each cell
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
        a.download = `Payments_${new Date().toLocaleDateString('en-IN')}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDelete = async (paymentId, receiptNo) => {
        if (!paymentId) return;

        try {
            setOpenDelete(false);
            setTimeout(() => setDeleting(true), 200); // Delay showing spinner to avoid flicker for fast operations

            const res = await fetch(`/api/payments/${paymentId}`, {method: 'DELETE'});
            const data = await res.json();

            if (!res.ok) {
                toast.error("Failed to delete payment: " + (data.error || res.statusText));
                return;
            }

            setPayments(prev => prev.filter(p => p.id !== paymentId));
            toast.success(`Successfully Deleted Payment: ${receiptNo}`);
        } catch (error) {
            console.error("Error deleting payment: " + error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col">
                <div className="w-full flex items-center gap-4 flex-wrap">
                    <Link href='/user/fees/collect' className="primary-btn flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Payment                            
                    </Link>
                </div>

                <div className={`w-full overflow-hidden ${showFilter ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'} transition-all duration-300`}>
                    <form action={filterAction} className="flex items-end gap-4 flex-wrap" id="filterForm">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="receipt_no" className="font-semibold">Receipt No.</label>
                            <input type="text" id="receipt_no" name="receipt_no" placeholder="e.g. 15 or 2026/15" className="border rounded px-2 py-1 w-40 hover:border hover:border-secondary" value={filterFormData.receipt_no} onChange={handleFilterChange} />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="class" className="font-semibold">Class</label>
                            <select id="class" name="class" className="border rounded px-2 py-1 hover:border hover:border-secondary" value={filterFormData.class} onChange={handleFilterChange}>
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="section" className="font-semibold">Section</label>
                            <select id="section" name="section" className="border rounded px-2 py-1 hover:border hover:border-secondary disabled:text-gray-400" value={filterFormData.section} onChange={handleFilterChange} disabled={!filterFormData.class}>
                                <option value="">All Sections</option>
                                {filterSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="from_date" className="font-semibold">From</label>
                            <DateInput id="from_date" name="from_date" className="border rounded px-2 py-1 max-w-fit hover:border hover:border-secondary" value={filterFormData.from_date} onChange={handleFilterChange} min={currentSession?.start_date} max={currentSession?.end_date} />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="to_date" className="font-semibold">To</label>
                            <DateInput id="to_date" name="to_date" className="border rounded px-2 py-1 max-w-fit hover:border hover:border-secondary" value={filterFormData.to_date} onChange={handleFilterChange} min={filterFormData.from_date || currentSession?.start_date} max={currentSession?.end_date} />
                        </div>

                        <button type="submit" className="primary-btn ml-2" form="filterForm" disabled={!hasAnyFilter}>Filter</button>
                        
                        {state?.filteredPaymentsResponse && <button type="button" className="primary-btn" onClick={clearFilters} disabled={pending}>Clear</button>}

                        {pending && (
                            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
                                <Spinner size={28} />
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <div className="flex flex-col w-full">
                <h1 className="text-lg font-semibold mb-4">{ hasFilteredPayments ? 'Search Results' : 'Recent Payments'}</h1>

                {/* Table */}
                <Card className='w-full max-w-[calc(100vw-32px)] overflow-x-auto border-gray-300'>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            {hasFilteredPayments && (
                                <div>
                                    <CardDescription>
                                        {payments.length} payment{payments.length !== 1 ? 's' : ''} found.
                                    </CardDescription>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1 sm:flex-initial">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search by receipt no or name"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className='pl-8 w-full max-w-64 md:w-72 text-sm'
                                    />
                                </div>
                                <Button variant='outline' size='icon' onClick={downloadExcel} >
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-gray-300">
                            <Table>
                                <TableHeader>
                                    <TableRow className='border-gray-300'>
                                        <TableHead>Sr.</TableHead>
                                        <TableHead>Receipt No.</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.length === 0 ? (
                                        <TableRow className='border-gray-300'>
                                            <TableCell colSpan={7} className='text-center py-4 text-muted-foreground'>
                                                No payments yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paymentsToDisplay.map((p, index) => (
                                            <TableRow key={p.id} className='border-gray-300'>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{p.receipt_no}</TableCell>
                                                <TableCell>{`${p.students?.name} {${p.students?.adm_no}}`}</TableCell>
                                                <TableCell>{`${p.students?.classes?.name}-${p.students?.sections?.name}`}</TableCell>
                                                <TableCell>{p.amount}</TableCell>
                                                <TableCell>{new Date(p.created_at).toLocaleDateString('en-IN').split('T')[0]}</TableCell>
                                                <TableCell className='text-right'>
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            className="p-1 rounded hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
                                                            title="Print receipt"
                                                            disabled={printingId === p.id}
                                                            onClick={() => handleReprint(p)}
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </button>
                                                        <button className="p-1 rounded hover:bg-secondary hover:text-secondary-foreground transition-all duration-200" onClick={() => {setEditPayment(p); setShowEdit(true);}}>
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button className="p-1 rounded hover:bg-red-400 hover:text-secondary-foreground transition-all duration-200" onClick={() => {setDeletePayment(p); setOpenDelete(true);}}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className='w-full flex justify-between items-center mt-2 px-2'>
                            <p className='text-gray-700 text-sm'>Showing page {pageNo} of {totalPages === 0 ? 1 : totalPages}</p>

                            <div className='flex items-center gap-4'>
                            <button className='p-1 bg-gray-200 rounded-md disabled:bg-transparent' disabled={pageNo === 1} onClick={() => {setPageNo(prev => prev - 1)}}>
                                <ArrowLeft className='w-4 h-4' />
                            </button>
                            
                            <button className='p-1 bg-gray-200 rounded-md disabled:bg-transparent' disabled={pageNo === totalPages || payments.length === 0} onClick={() => setPageNo(prev => prev + 1)} >
                                <ArrowRight className='w-4 h-4' />
                            </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {deletePayment && (
                <ConfirmModal 
                    isOpen={openDelete}
                    onClose={() => setOpenDelete(false)}
                    onConfirm={() => handleDelete(deletePayment.id, deletePayment.receipt_no)}
                    action="Delete"
                    message={
                    <>
                        Are you sure you want to delete the payment with receipt no. <strong>{deletePayment.receipt_no}</strong>? This action cannot be undone.
                    </>
                    }
                />
            )}
            {deleting && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
                    <Spinner size={28} />
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
                    <Spinner size={28} />
                </div>
            )}

            {editPayment && (Object.keys(paymentItemAmounts).length > 0) && (
                <Modal open={showEdit} onClose={handleCancel} title="Edit Payment">
                    {editPayment && (
                        <EditPaymentForm 
                            payment={editPayment}
                            student={editPayment.students}
                            paymentPayPeriods={paymentPayPeriods}
                            paymentInvoiceItems={paymentInvoiceItems}
                            paymentItemAmounts={paymentItemAmounts}
                            paymentItemDiscounts={paymentItemDiscounts}
                            discountDescription={discountDescription}
                            payPeriods={payPeriods}
                            invoiceItems={invoiceItems}
                            totalFeesAmount={totalFeesAmount}
                            totalFine={totalFine}
                            totalPaid={totalPaid}
                            totalDiscount={totalDiscount}
                            onCancel={handleCancel}
                        />
                    )}
                </Modal>
            )}
        </div>
    )
}