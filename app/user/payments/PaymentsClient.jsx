// PaymentsClient.jsx
'use client';
import { useState, useEffect, useActionState } from "react";
import toast from "react-hot-toast";
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
import { Search, Download, Edit, Trash2, Plus, Filter } from 'lucide-react';

import { useSession } from '@/Context/SessionContext';
import Link from "next/link";

export default function PaymentsClient({ recentPayments }) {
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

    const [filterFormData, setFilterFormData] = useState({
        from_date: '',
        to_date: ''
    });

    const handleFilterChange = (e) => {
        setFilterFormData({
            ...filterFormData,
            [e.target.name]: e.target.value
        })
    }

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
    setFilterFormData({
      from_date: '',
      to_date: '',
    });
    setHasFilteredPayments(false);
    setPayments(recentPayments);
  }

    useEffect(() => {
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

                    <button type="button" className="primary-btn flex items-center gap-2" onClick={() => setShowFilter(prev => !prev)}>
                        <Filter className="w-4 h-4" />
                        Filter Payments
                    </button>
                </div>

                <div className={`w-full overflow-hidden ${showFilter ? 'max-h-20 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'} transition-all duration-300`}>
                    <form action={filterAction} className="flex items-center gap-4 flex-wrap" id="filterForm">
                        <div className="flex flex-col gap-2 justify-start">
                            <label htmlFor="from_date" className="font-semibold">From</label>
                            <input type="date" name="from_date" className="border rounded px-2 py-1 max-w-fit hover:border hover:border-secondary" value={filterFormData.from_date} onChange={handleFilterChange} />
                        </div>

                        <div className="flex flex-col gap-2 justify-start">
                            <label htmlFor="to_date" className="font-semibold">To</label>
                            <input type="date" name="to_date" className="border rounded px-2 py-1 max-w-fit hover:border hover:border-secondary" value={filterFormData.to_date} onChange={handleFilterChange} min={filterFormData.from_date} max={currentSession?.end_date} />
                        </div>

                        <button type="submit" className="primary-btn ml-2" form="filterForm" disabled={!filterFormData.from_date || !filterFormData.to_date}>Filter</button>
                        
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
                <Card className='w-full max-w-[calc(100vw-48px)] overflow-x-auto'>
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
                                        <TableRow>
                                            <TableCell colSpan={7} className='text-center py-4 text-muted-foreground'>
                                                No payments yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        payments.map((p, index) => (
                                            <TableRow key={p.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{p.receipt_no}</TableCell>
                                                <TableCell>{`${p.students?.name} {${p.students?.adm_no}}`}</TableCell>
                                                <TableCell>{`${p.students?.classes?.name}-${p.students?.sections?.name}`}</TableCell>
                                                <TableCell>{p.amount}</TableCell>
                                                <TableCell>{new Date(p.created_at).toLocaleDateString('en-IN').split('T')[0]}</TableCell>
                                                <TableCell className='text-right'>
                                                    <div className="flex justify-end gap-2">
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