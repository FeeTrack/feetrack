// app/api/fees/collect/receipt-details/route.js
// API to fetch complete payment details for receipt generation
// SOON - Make receipts from available invoice data during fee collection, collection data and prefetched school data

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";
import { months } from "@/utils/constants/backend";

export async function GET(req) {
    try {
        const supabase = await createServerSupabase();
        const profile = await getUser();
        if (!profile) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get payment_id from query params
        const { searchParams } = new URL(req.url);
        const paymentId = searchParams.get('payment_id');

        if (!paymentId) {
            return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
        }

        // Fetch payment with all related data
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select(`
                schools (name, address),
                receipt_no,
                created_at,
                method,
                students (
                    name,
                    adm_no,
                    roll_no,
                    classes (name),
                    sections (name),
                    father_name,
                    mother_name,
                    parent_mobile
                ),
                payment_items (
                    amount,
                    invoice_items (
                        amount,
                        period_key,
                        pay_period,
                        is_late_fee,
                        fee_heads (
                            name
                        )
                    ),
                    discounts (
                        amount,
                        description
                    )
                )
            `)
            .eq('id', paymentId)
            .single();

        if (paymentError) {
            return NextResponse.json(
                { error: 'Payment not found: ' + paymentError.message },
                { status: 404 }
            );
        }

        // Transform payment items for receipt
        const rawItems = payment?.payment_items?.map(pi => {
            const invoiceItem = pi.invoice_items;
            const discount = pi.discounts?.amount;

            return {
                fee_head_name: invoiceItem.fee_heads.name,
                period_key: invoiceItem.period_key,
                pay_period: invoiceItem.pay_period,
                is_late_fee: invoiceItem.is_late_fee,
                amount: invoiceItem.amount,
                amount_paid: pi.amount,
                discount: discount || 0,
            };
        });

        const allMonths = months.map(month => month.name);
        
        const sortedItems = rawItems.sort((a, b) => {
            const monthA = a.pay_period.split('-')[0];
            const monthB = b.pay_period.split('-')[0];
            return allMonths.indexOf(monthA) - allMonths.indexOf(monthB);
        });

        // Build response payload
        const payload = {
            school: {
                name: payment?.schools.name || 'School Name',
                address: payment?.schools.address || 'Gurugram to Gram',
                logo: payment?.schools.logo_url || null
            },
            payment: {
                receipt_no: payment?.receipt_no,
                created_at: payment?.created_at,
                method: payment?.method,
                discount_description: payment?.payment_items?.flatMap(pi => pi.discounts || [])?.find(d => d.description)?.description || null
            },
            student: {
                name: payment?.students?.name,
                adm_no: payment?.students?.adm_no,
                roll_no: payment?.students?.roll_no,
                father_name: payment?.students?.father_name,
                mother_name: payment?.students?.mother_name,
                mobile_no: payment?.students?.parent_mobile,
                class_name: payment?.students?.classes?.name,
                section_name: payment?.students?.sections?.name
            },
            items: sortedItems || []
        };
        return NextResponse.json(payload);

    } catch (error) {
        console.error('Error fetching receipt details:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}