export default function DefaultersTable({defaulters}) {
    return (
        <div className="bg-white p-4 mt-4 rounded shadow text-black overflow-x-auto">
            <table className="w-full table-auto border-collapse">
                <thead>
                    <tr className="text-left text-sm text-gray-700 font-bold ">
                        <td className="p-2 border border-black">Sr.</td>
                        <td className="p-2 border border-black">Student Details</td>
                        <td className="p-2 border border-black">Total</td>
                        <td className="p-2 border border-black">Fine</td>
                        <td className="p-2 border border-black">Paid</td>
                        <td className="p-2 border border-black">Discount</td>
                        <td className="p-2 border border-black">Balance</td>
                    </tr>
                </thead>
                <tbody>
                    {defaulters.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-sm text-center py-2 text-gray-500">
                                No defaulters found.
                            </td>
                        </tr>
                    ) : (
                        defaulters.map((d, index) => (
                            <tr key={index} className="text-sm">
                                <td className="p-2 border border-black">{index + 1}</td>
                                <td className="p-2 border border-black">
                                    <div className="flex flex-col gap-1">
                                        <div>Name: {d?.student?.name}</div>
                                        <div>Class: {`${d?.student.class_name}-${d?.student?.section_name}`}</div>
                                        <div>Adm No: {d?.student?.adm_no}{'  '}Roll No: {d?.student?.roll_no}</div>
                                        <div>Mobile: {d?.student?.parent_mobile}</div>
                                    </div>
                                </td>
                                <td className="p-2 border border-black align-top">
                                    {d?.periods.map(p => (
                                        <div key={p?.pay_period} className="flex items-center gap-2"><h6 className="w-6">{p?.pay_period}:</h6> {p?.total}</div>
                                    ))}
                                    <div className="font-bold text-gray-700 mt-1">Total: {d?.grandTotal}</div>
                                </td>
                                <td className="p-2 border border-black align-top">
                                    {d?.periods.map(p => (
                                        <div key={p?.pay_period} className="flex items-center gap-2"><h6 className="w-6">{p?.pay_period}:</h6> {p?.fine}</div>
                                    ))}
                                    <div className="font-bold text-gray-700 mt-1">Total: {d?.grandFine}</div>
                                </td>
                                <td className="p-2 border border-black align-top">
                                    {d?.periods.map(p => (
                                        <div key={p?.pay_period} className="flex items-center gap-2"><h6 className="w-6">{p?.pay_period}:</h6> {p?.paid}</div>
                                    ))}
                                    <div className="font-bold text-gray-700 mt-1">Total: {d?.grandPaid}</div>
                                </td>
                                <td className="p-2 border border-black align-top">
                                    {d?.periods.map(p => (
                                        <div key={p?.pay_period} className="flex items-center gap-2"><h6 className="w-6">{p?.pay_period}:</h6> {p?.discount}</div>
                                    ))}
                                    <div className="font-bold text-gray-700 mt-1">Total: {d?.grandDiscount}</div>
                                </td>
                                <td className="p-2 border border-black align-top">
                                    {d?.periods.map(p => (
                                        <div key={p?.pay_period} className="flex items-center gap-2"><h6 className="w-6">{p?.pay_period}:</h6> {p?.balance}</div>
                                    ))}
                                    <div className="font-bold text-gray-700 mt-1">Total: {d?.grandBalance}</div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}