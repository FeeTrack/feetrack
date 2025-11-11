'use client'
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer } from 'lucide-react';

export default function ClassFeesClient({ classesFees: cf, classes: cls }) {
    const [classesFees, setClassesFees] = useState(cf);
    const [classes, setClasses] = useState(cls);
    useEffect(() => {
        setClassesFees(cf);
        setClasses(cls);
    }, [cf, cls]);

    const [cfQuery, setCfQuery] = useState('');
    const [clsQuery, setClsQuery] = useState('');

    useEffect(() => {
        if (cfQuery.trim() === '') {
            setClassesFees(cf);
        } else {
            const filtered = cf.filter((fee) =>
                fee.name.toLowerCase().includes(cfQuery.toLowerCase())
            )
            setClassesFees(filtered);
        }
    }, [cfQuery]);

    useEffect(() => {
        if (clsQuery.trim() === '') {
            setClasses(cls);
        } else {
            const filtered = cls.filter((cl) =>
                cl.name.toLowerCase().includes(clsQuery.toLowerCase())
            )
            setClasses(filtered);
        }
    }, [clsQuery])

    return (
        <div>
            <Card className='w-full max-w-[calc(100vw-32px)] overflow-x-auto'>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 2-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search fee..."
                                value={cfQuery}
                                onChange={(e) => setCfQuery(e.target.value)}
                                className="pl-8 w-full max-w-64 text-sm"
                            />
                        </div>
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 2-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search class..."
                                value={clsQuery}
                                onChange={(e) => setClsQuery(e.target.value)}
                                className="pl-8 w-full max-w-64 text-sm"
                            />
                        </div>
                        <Button variant='outline' size='icon'>
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className='rounded-md border overflow-hidden'>
                        <Table className="border-collapse table-auto">
                            <TableHeader>
                                <TableRow>
                                    <TableHead rowSpan={2} className='border border-t-0 border-l-0 text-center w-[200px] md:w-[300px] font-semibold'>Fee Type</TableHead>
                                    <TableHead colSpan={classes.length} className='border border-t-0 border-r-0 text-center py-2 font-semibold'>Classes</TableHead>
                                </TableRow>
                                <TableRow>
                                    {classes.map((cls) => (
                                        <TableHead key={cls.id} className='border border-r-0 text-center font-semibold px-4 py-2'>{cls.name}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classesFees.map((fee) => (
                                    <TableRow key={fee.id}>
                                        <TableCell className="px-4 py-2 border border-l-0 w-[200px] md:w-[300px]">{fee.name}</TableCell>
                                        {classes.map((cls) => {
                                            const classFee = fee.fee_structures.find((fs) => fs.classes.id === cls.id);
                                                return (
                                                    <TableCell key={cls.id} className="px-4 text-center py-2 border border-r-0">
                                                        {classFee ? classFee.amount : '-'}
                                                    </TableCell>
                                                );
                                            })}
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell className="px-4 py-2 border border-l-0 border-b-0 font-semibold">Total</TableCell>
                                    {classes.map((cls) => {
                                        const total = classesFees.reduce((acc, fee) => {
                                            const classFee = fee.fee_structures.find((fs) => fs.classes.id === cls.id);
                                            return acc + (classFee ? classFee.amount : 0);
                                        }, 0);
                                        return (
                                            <TableCell key={cls.id} className="px-4 text-center py-2 border border-b-0 border-r-0 font-semibold">
                                                {total}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}