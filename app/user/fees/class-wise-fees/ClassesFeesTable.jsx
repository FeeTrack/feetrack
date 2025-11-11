export default function ClassesFeesTable({ classesFees = [], classes = []}) {
    return (
        <div className="bg-white p-4 rounded shadow text-black overflow-x-auto">
            <table className="w-full table-auto border-collapse">
                <thead className="text-left text-sm text-gray-600 border-b">
                    <tr>
                        <th rowSpan={2} className="text-center border w-[200px] md:w-[300px]">Fee Type</th>
                        <th colSpan={classes.length} className="text-center border border-black py-2">Classes</th>
                    </tr>
                    <tr>
                         {classes.map((cls) => (
                            <th key={cls.id} className="px-4 py-2 text-center font-bold border border-black">{cls.name}</th>
                         ))}
                    </tr>
                </thead>
                <tbody>
                    {classesFees.map((fee) => (
                        <tr key={fee.id} className="hover:bg-gray-100">
                            <td className="px-4 py-2 border border-black w-[200px] md:w-[300px]">{fee.name}</td>
                            {classes.map((cls) => {
                                const classFee = fee.fee_structures.find((fs) => fs.classes.id === cls.id);
                                return (
                                    <td key={cls.id} className="px-4 text-center py-2 border border-black">
                                        {classFee ? classFee.amount : '-'}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    <tr>
                        <td className="px-4 py-2 border border-black font-semibold">Total</td>
                        {classes.map((cls) => {
                            const total = classesFees.reduce((acc, fee) => {
                                const classFee = fee.fee_structures.find((fs) => fs.classes.id === cls.id);
                                return acc + (classFee ? classFee.amount : 0);
                            }, 0);
                            return (
                                <td key={cls.id} className="px-4 py-2 text-center border border-black font-semibold">
                                    {total}
                                </td>
                            );
                        })}
                    </tr>
                </tbody>
            </table>

        </div>
    )
}