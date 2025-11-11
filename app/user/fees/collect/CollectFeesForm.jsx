// CollectFeesForm.jsx
'use client';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';

import { downloadReceipt } from '@/utils/receipt/buildReceipt';
import Spinner from '@/components/Spinner';

export default function CollectFeesForm({ student, onCancel, payPeriods, invoiceItems, totalFeesAmount, totalFine, totalPaid, totalDiscount }) {
  const customStyles = {
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
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isDisabled ? "#f0f0f0" : "white",
      color: state.isDisabled ? "#888" : "black",
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: 200,
      overflowY: 'auto',
    }),
  };

  const [formData, setFormData] = useState({
    discountDescription: '',
    method: '',
    transactionId: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    })
  }

  const [items, setItems] = useState([]);
  const [allocations, setAllocations] = useState({}); // itemId -> amount
  const [loading, setLoading] = useState(false);
  const [applyDiscount, setApplyDiscount] = useState({});
  const [enableDiscountDescription, setEnableDiscountDescription] = useState(false);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [allSelected, setAllSelected] = useState(false)

  const handleDiscountChange = (id) => {
    setApplyDiscount(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      
      const applied = Object.values(updated).some(Boolean)
      setEnableDiscountDescription(applied)
      
      return updated;
    });
  }

  const handleAddPeriod = (period) => {
    const invoiceId = period?.invoiceId;
    if (!invoiceId) {
      toast.error('Could not find invoice for selected period.');
      return;
    }

    // Get items for this invoice
    const itemsForInvoice = invoiceItems.filter(item => item.invoice_id === invoiceId);
    
    // Use functional update to access current state
    setItems(prevItems => {
      // Filter out items that already exist
      const newItemsToAdd = itemsForInvoice.filter(item => !prevItems.some(i => i.id === item.id));
      
      // Create allocations for new items immediately
      if (newItemsToAdd.length > 0) {
        const newAllocToAdd = {};
        newItemsToAdd.forEach(item => {
          const prevDiscountsValue = item.payment_items.map(pi => pi.discounts)?.flat().reduce((acc, d) => acc + Number(d?.amount), 0) || 0;
          const remaining = Number(item.amount) - Number(item.amount_paid || 0) - prevDiscountsValue;
          newAllocToAdd[item.id] = {
            invoice_id: invoiceId,
            amount: item.amount,
            amount_paid: item.amount_paid,
            prev_discounts: prevDiscountsValue,
            receiving: remaining,
            discountAmount: 0
          };
        });
        
        // Update allocations
        setAllocations(prevAlloc => ({ ...prevAlloc, ...newAllocToAdd }));
      }
      
      return [...prevItems, ...newItemsToAdd];
    });
  };

  const handleRemovePeriod = (period) => {
    const invoiceId = period?.invoiceId;

    let removedItemIds = [];
    setItems(prevItems => {
      const itemsToRemove = items.filter(item => item.invoice_id === invoiceId);
      removedItemIds = itemsToRemove.map(item => item.id);
      return prevItems.filter(item => item.invoice_id !== invoiceId);
    });

    setAllocations(prevAlloc => {
      const newAlloc = { ...prevAlloc };
      
      removedItemIds.forEach(itemId => {
        delete newAlloc[itemId];
      });
      return newAlloc;
    });
  }

  const handlePayPeriodChange = (_, actionMeta) => {
    if (actionMeta.action === 'select-option') {
      const period = actionMeta?.option;
      setSelectedPeriods(prev => [...prev, period]);
      handleAddPeriod(period);
    } else if (actionMeta.action === 'remove-value' || actionMeta.action === 'pop-value') {
      const period = actionMeta?.removedValue;
      setSelectedPeriods(prev => prev.filter(p => p.value !== period.value));
      handleRemovePeriod(period);
    } else if (actionMeta.action === 'clear') {
      setItems([]);
      setAllocations({});
      setSelectedPeriods([]);
      setAllSelected(false);
    }
  }

  const selectAllFeesToggle = () => {
    if (allSelected) {
      // Clear all
      setItems([]);
      setAllocations({});
      setSelectedPeriods([]);
      setAllSelected(false);
    } else {
      // Select all
      const enabledPayPeriods = payPeriods.filter(p => !p.isDisabled);
      const alreadySelectedValues = new Set(selectedPeriods.map(p => p.value));
      const payPeriodsToAdd = enabledPayPeriods.filter(p => !alreadySelectedValues.has(p.value));

      setSelectedPeriods(prev => [...prev, ...payPeriodsToAdd]);
      payPeriodsToAdd.forEach(period => {
        handleAddPeriod(period);
      });
      setAllSelected(true);
    }
  }

  const handleAllocationChange = (itemId, event) => {
    let { name, value } = event.target;
    value = Number(value);
    let onDiscountChangeReceiving = null;

    const allocation = allocations[itemId];
    const prevBalance = allocation.amount - (allocation.amount_paid || 0) - (allocation.prev_discounts || 0);
    const maxReceivable = allocation.amount - (allocation.amount_paid || 0) - (allocation.prev_discounts || 0) - (allocation.discountAmount || 0);
    
    if (name === 'receiving' && value > maxReceivable) {
      value = maxReceivable;
    }

    if (name === 'discountAmount') {
      if (value > prevBalance) {
        value = prevBalance;
      }
      onDiscountChangeReceiving = allocation.amount - (allocation.amount_paid || 0) - (allocation.prev_discounts || 0) - value;
    }

    setAllocations(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [name]: value,
        receiving: name === 'discountAmount' ? (onDiscountChangeReceiving ?? 0) : value
      }
    }))
  };

  const totals = Object.values(allocations).reduce((acc, curr) => {
    acc.amount += Number(curr.amount || 0);
    acc.amount_paid += Number(curr.amount_paid || 0) + Number(curr.prev_discounts || 0);
    acc.discount += Number(curr.discountAmount || 0);
    acc.receiving += Number(curr.receiving || 0);
    acc.balance = acc.amount - acc.amount_paid - acc.discount - acc.receiving;
    return acc;
  }, { amount: 0, amount_paid: 0, receiving: 0, discount: 0, balance: 0 });

  async function handlePostPayment(paymentId) {
    try {
      const res = await fetch(`/api/fees/collect/receipt-details?payment_id=${paymentId}`);
      const payload = await res.json();
      if (!res.ok || payload?.error) {
        console.error('Failed to fetch payment details for printing' + (payload?.error || res.statusText));
        return;
      } 
      await downloadReceipt(payload);
    } catch (e) {
      console.error('print error', e);
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // build allocations array
    const allocArray = Object.entries(allocations).map(([itemId, data]) => ({
      invoice_item_id: itemId,
      invoice_id: data.invoice_id,
      amount: Number(data.amount),
      amount_paid: Number(data.amount_paid) || 0,   
      prev_discounts: Number(data.prev_discounts) || 0,   
      receiving: Number(data.receiving) || 0,
      discountAmount: Number(data.discountAmount) || 0
    }))
    
    if (allocArray.length === 0) {
      setLoading(false);
      toast.error('Enter at least one receiving amount.');
      setLoading(false);
      return;
    }

    // validate amounts
    let allocSum = 0;
    let totalAllocSum = 0;
    for (const a of allocArray) {
      const totalAmount = Number(a.amount);
      const prevPaidAmount = Number(a.amount_paid) + Number(a.prev_discounts || 0);
      const remaining = totalAmount - prevPaidAmount;
      const receivingAmount = Number(a.receiving);
      const discountAmount = Number(a.discountAmount || 0);
      const effectiveReceiving = receivingAmount + discountAmount;

      if (effectiveReceiving > remaining) {
        toast.error('Remaining balance cannot be less than zero.');
        setLoading(false);
        return;
      }
      if (receivingAmount < 0 || discountAmount < 0) {
        toast.error("Receiving and discount amounts must be non-negative.");
        setLoading(false);
        return;
      }
      allocSum += receivingAmount;
      totalAllocSum += (receivingAmount + discountAmount);
    }
    if (totalAllocSum <= 0) {
      toast.error("Total receiving amount must be greater than zero.");
      setLoading(false);
      return;
    }
    

    const res = await fetch('/api/fees/collect/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: student.id,
        sessionId: student.academic_sessions.id,
        session: student.academic_sessions.name,
        rawAllocations: allocArray,
        allocSum,
        method: formData.method,
        transactionId: formData.transactionId, // later add discounts and late fee logic also
        discountDescription: formData.discountDescription || null
      })
    });
    if (!res.ok) {
      setLoading(false);
      const errorData = await res.json();
      toast.error('Payment failed: ' + (errorData?.error || res.statusText));
      return;
    }
    
    const data = await res.json();

    setLoading(false);
    toast.success('Payment recorded successfully.');

    if (data?.paymentId) {
      await handlePostPayment(data.paymentId);

      setTimeout(() => {
        onCancel();
      }, 500);
    } else {
      onCancel();
    }
  };

  return (
    <div>
      <div className='flex flex-col gap-2'>
        <h2 className='font-semibold'>Student Details:</h2>
        <div className='w-full flex items-center justify-between text-gray-600 bg-[#f0f0f0] mb-4 rounded-xl px-1'>
          <div><b>Name:</b> {student.name}</div>
          <div><b>Adm No:</b> {student.adm_no}</div>
          <div><b>Class:</b> {student.classes.name}-{student.sections.name}</div>
          <div><b>Roll No:</b> {student.roll_no}</div>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <h2 className='font-semibold'>Total Fee Details:</h2>
        <div className='w-full flex items-center justify-between text-gray-600 bg-[#f0f0f0] mb-4 rounded-xl px-1'>
          <div><b>Total Fees:</b> {totalFeesAmount}</div>
          <div><b>Total Fine:</b> {totalFine}</div>
          <div><b>Total Paid Fees:</b> {totalPaid}</div>
          <div><b>Total Discount:</b> {totalDiscount || 0}</div>
          <div><b>Balance:</b> {totalFeesAmount + totalFine - totalPaid - totalDiscount}</div>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        {/* for the extended -> first search among duration types and then show the pay periods existing */}
        <div className='flex justify-between items-center'>
          <label className='font-semibold'>Search by Month:</label>
          <button className='px-2 py-1 rounded-xl bg-[#f0f0f0] hover:bg-[#e6e6e6]' onClick={selectAllFeesToggle}>{allSelected ? 'Clear All' : 'Select All Fees'}</button>
        </div>
        <Select
          isMulti
          isClearable
          options={payPeriods}
          value={selectedPeriods}
          onChange={handlePayPeriodChange}
          styles={customStyles}
        />
      </div>

      <form onSubmit={handlePayment}>
        <div className={`mt-4 ${items.length > 0 ? 'p-2' : ''} bg-[#f0f0f0] rounded flex flex-col items-start w-full overflow-x-auto`}>
          {items.map(item => (
              <div key={item.id} className='w-full flex items-center justify-between border-b border-gray-400 py-1 text-xs min-w-[600px]'>
                <div className='flex flex-col w-full max-w-[22%] min-w-[150px] items-start'>
                  <p>{`${item.is_late_fee ? 'Late Fee - ' : ''}${item.fee_heads?.name} ${`(${item.period_key})`}`}</p>
                  
                  {item.period_start_end?.[0] && (
                    <p className='text-[10px] text-gray-600 italic'>{`${new Date(item.period_start_end[0].period_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(item.period_start_end[0].period_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}</p>
                  )}
                </div>

                <div className='flex items-center gap-1 w-full max-w-[13%] min-w-[40px] justify-start'>Fees: {item.amount}</div>

                <div className='flex items-center gap-1 w-full max-w-[11%] min-w-[40px] justify-start'>Paid: {(allocations[item.id]?.amount_paid ?? 0) + (allocations[item.id]?.prev_discounts || 0)}</div>

                <div className='flex items-center gap-1 w-full max-w-[20%] min-w-[120px] justify-start'>
                  <label>Discount</label>
                  <input type='checkbox' name='applyDiscount' className='size-[10px]' checked={!!applyDiscount[item.id]} onChange={() => handleDiscountChange(item.id)} />
                  <input type='number' name='discountAmount' className='w-8 md:w-12 border rounded px-2 py-1 disabled:text-[#888] disabled:bg-[#e6e6e6]' disabled={!applyDiscount[item.id]} value={allocations[item.id]?.discountAmount || ''} onChange={(e) => handleAllocationChange(item.id, e)} onWheel={e => e.target.blur()} />
                </div>

                <div className='flex items-center gap-1 w-full max-w-[20%] min-w-[120px] justify-start'>
                  <label>Receiving:</label>
                  <input 
                    type="number"
                    name='receiving'
                    value={allocations[item.id]?.receiving ?? ''}
                    onChange={(e) => handleAllocationChange(item.id, e)}
                    onWheel={(e) => e.target.blur()}
                    className="w-10 md:w-16 border rounded px-2 py-1"
                  />
                </div>

                <div className='flex items-center gap-1 w-full max-w-[14%] min-w-[40px] justify-start'>
                  Balance: {item.amount - (allocations[item.id]?.amount_paid ?? 0) - (allocations[item.id]?.prev_discounts ?? 0) - (allocations[item.id]?.discountAmount ?? 0) - (allocations[item.id]?.receiving ?? 0)}
                </div>
              </div>
            )
          )}

          {items.length > 0 && (
            <div className='w-full flex items-center justify-between py-1 text-xs font-bold min-w-[600px]'>
              <div className='w-full max-w-[22%] min-w-[150px]'>
                Totals:
              </div>
              <div className='w-full max-w-[13%] min-w-[40px]'>
                {totals.amount}
              </div>
              <div className='w-full max-w-[11%] min-w-[40px]'>
                {totals.amount_paid}
              </div>
              <div className='w-full max-w-[20%] min-w-[120px]'>
                {totals.discount}
              </div>
              <div className='w-full max-w-[20%] min-w-[120px]'>
                {totals.receiving}
              </div>
              <div className='w-full max-w-[14%] min-w-[40px]'>
                {totals.balance}
              </div>
            </div>
          )}
        </div>

        <div className='flex flex-col items-center  '>
          <div className='flex flex-col gap-3 mt-4 w-full max-w-full md:max-w-[95%]'>
            <div className='flex justify-between items-center'>
              <label>Discount Description</label>
              <input type='text' name='discountDescription' className='w-full max-w-[180px] md:max-w-[280px] border rounded-2xl px-2 py-1 disabled:text-[#888] disabled:bg-[#e6e6e6]' required disabled={!enableDiscountDescription} value={formData.discountDescription} onChange={handleChange} />
            </div>

            <div className='flex justify-between items-center'>
              <label>Method</label>
              <select name='method' required className='w-full max-w-[180px] md:max-w-[280px] border rounded-2xl px-2 py-1' value={formData.method} onChange={handleChange}>
                <option value=''>Select Method</option>
                <option value='cash'>Cash</option>
                <option value='card'>Card</option>
                <option value='upi'>UPI</option>
                <option value='cheque'>Cheque</option>
              </select>
            </div>

            <div className='flex justify-between items-center'>
              <label>UTR/Cheque/Txn. No.</label>
              <input type='text' name='transactionId' className='w-full max-w-[180px] md:max-w-[280px] border rounded-2xl px-2 py-1' value={formData.transactionId} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className='p-2 mt-4 flex justify-end gap-2'>
          <button
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
            {loading ? 'Collecting…' : 'Collect Fees'}
          </button>
          {loading && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
                <Spinner size={28} />
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
