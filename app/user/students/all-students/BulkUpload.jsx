"use client";

import { useState, useRef } from "react";
import ExcelJS from "exceljs";
import { createClientSupabase } from "@/utils/supabase/client";
import { bulkInsertAction } from "./actions";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import toast from "react-hot-toast";
import { checkFeatureLimit } from "@/utils/supabase/supabaseQueries";

export default function BulkUpload({onCancel, classes, sections, transportRoutes, profile, currentSession}) {
  const [students, setStudents] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false)
  const [submitDisabled, setSubmitDisabled] = useState(false)
  const fileInputRef = useRef(null)

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Worksheet");
    const metaSheet = workbook.addWorksheet("meta");
    const instructionsSheet = workbook.addWorksheet("Instructions");

    const classOptions = classes.map(c => c.name)
    const routeOptions = transportRoutes.map(route => route.name)

    // Populate meta sheet
    classOptions.forEach((v, i) => {
      metaSheet.getCell(`A${i + 1}`).value = v;
    });

    routeOptions.forEach((v, i) => {
      metaSheet.getCell(`B${i + 1}`).value = v;
    })

    metaSheet.state = 'hidden';

    // Create Instructions Sheet
    instructionsSheet.columns = [
      { header: "Column Name", key: "column", width: 25 },
      { header: "Description", key: "description", width: 50 },
      { header: "Valid Values", key: "values", width: 50 }
    ];

    // Style the header
    instructionsSheet.getRow(1).font = { bold: true, size: 12 };
    instructionsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add instructions
    const instructions = [
      { 
        column: "Name", 
        description: "Full name of the student. *Mandatory*", 
        values: "Text"
      },
      { 
        column: "Class", 
        description: "Select student's class from dropdown. *Mandatory*", 
        values: "Select from dropdown"
      },
      { 
        column: "Section", 
        description: "Student's section", 
        values: "Text"
      },
      { 
        column: "Father's Name", 
        description: "Father's full name. *Mandatory*", 
        values: "Text"
      },
      { 
        column: "Mother's Name", 
        description: "Mother's full name. *Mandatory*", 
        values: "Text"
      },
      { 
        column: "Admission Date", 
        description: "Student's admission date. *Mandatory*", 
        values: "Date"
      },
      { 
        column: "Roll No.", 
        description: "Student's roll number", 
        values: "Number"
      },
      { 
        column: "Mobile No.", 
        description: "Parent's contact number. *Mandatory*", 
        values: "10-digit mobile number"
      },
      { 
        column: "Apply Monthly Fees From", 
        description: "When should monthly fees start calculating? *Mandatory*", 
        values: "Only 1 or 2. 1 = Session Start, 2 = Admission Date"
      },
      { 
        column: "Avail Transport", 
        description: "Does student use school transport? *Mandatory*", 
        values: "Only 0 or 1. 0 = No, 1 = Yes"
      },
      { 
        column: "Transport Route", 
        description: "Select transport route if applicable otherwise leave empty", 
        values: "Select from dropdown (if avail transport = 1)"
      },
      { 
        column: "Generate Fee", 
        description: "Should system generate fee for this student? *Mandatory*", 
        values: "Only 0 or 1. 0 = No, 1 = Yes"
      }
    ];

    instructions.forEach(inst => {
      instructionsSheet.addRow(inst);
    });

    // Apply styling to all data rows
    instructionsSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'top', wrapText: true };
        row.height = 30;
      }
    });

    // Add a title at the top
    instructionsSheet.insertRow(1, ['Student Bulk Upload - Instructions Guide']);
    instructionsSheet.mergeCells('A1:C1');
    instructionsSheet.getCell('A1').font = { bold: true, size: 14 };
    instructionsSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    instructionsSheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF203864' }
    };
    instructionsSheet.getCell('A1').font.color = { argb: 'FFFFFFFF' };
    instructionsSheet.getRow(1).height = 25;

    // Define columns for main worksheet
    sheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Class", key: "class", width: 10 },
      { header: "Section", key: "section", width: 10 },
      { header: "Father's Name", key: "father_name", width: 30 },
      { header: "Mother's Name", key: "mother_name", width: 30 },
      { header: "Admission Date", key: "adm_date", width:20 },
      { header: "Admission No.", key: "adm_no", width:15 },
      { header: "Roll No.", key: "roll_no", width: 10 },
      { header: "Mobile No.", key: "parent_mobile", width: 20 },
      { header: "Apply Monthly Fees From", key: "month_fee_from", width: 25 },
      { header: "Avail Transport", key: "avail_transport", width: 20 },
      { header: "Transport Route", key: "selected_route", width: 30 },
      { header: "Generate Fee", key: "gen_fee", width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };

    // Add empty rows so validation can be applied
    const numRows = 250;
    for (let i = 2; i <= numRows; i++) {
      sheet.addRow({});
    }

    // Apply validations
    
    // Date validation for Admission Date
    for (let i = 2; i <= numRows; i++) {
      sheet.getCell(`F${i}`).dataValidation = {
        type: 'date',
        showErrorMessage: true,
        errorTitle: 'Invalid Date',
        error: 'Cell type should be date'
      };
    }

    // Class dropdown
    for (let i = 2; i <= numRows; i++) {
      sheet.getCell(`B${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`meta!$A$1:$A$${classOptions.length}`],
        showErrorMessage: true,
        errorTitle: 'Invalid Class',
        error: 'Select class from dropdown'
      };
    }

    // Route dropdown
    for (let i = 2; i <= numRows; i++) {
      sheet.getCell(`L${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`meta!$B$1:$B$${routeOptions.length}`],
        showErrorMessage: true,
        errorTitle: 'Invalid Route',
        error: 'Select route from dropdown'
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Students_Bulk_Add_Template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const supabase  = createClientSupabase()
  
  const handleUpload = async (e) => {
    const {data: admNos, error: admNoError} = await supabase
      .from('students')
      .select('adm_no')
      .eq('school_id', profile.school_id);
    if (admNoError) {
      console.error(admNoError.message)
    }
  
    const {data: rollNos, error: rollNoError} = await supabase
      .from('students')
      .select('classes(name), sections(name), roll_no')
      .eq('school_id', profile.school_id)
    if (rollNoError) {
      console.error(rollNoError.message)
    }
    
    const file = e.target.files[0];
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet("Worksheet");
    const parsedStudents = [];
    const validationErrors = [];

    sheet.eachRow((row, index) => {
      if (index === 1) return; // Skip header

      // Helper to extract text from cell (handles hyperlinks/formulas)
      const getCellText = (cell) => {
        const value = cell.value;
        if (!value && value !== 0) return ""; // Handle 0 explicitly
        
        // If it's a hyperlink object, extract the text
        if (typeof value === "object" && value.text) {
          return value.text.toString().trim();
        }
        
        // If it's a formula result
        if (typeof value === "object" && value.result) {
          return value.result.toString().trim();
        }
        
        // Plain text
        return value.toString().trim();
      };

      // Extract raw values first to distinguish between empty cells and 0
      const rawAdmNo = getCellText(row.getCell(7));
      const rawRollNo = getCellText(row.getCell(8));
      const rawMonthFeeFrom = getCellText(row.getCell(10));
      const rawAvailTransport = getCellText(row.getCell(11));
      const rawGenFee = getCellText(row.getCell(13));

      const data = {
        name: getCellText(row.getCell(1)),
        class: getCellText(row.getCell(2)),
        section: getCellText(row.getCell(3)),
        father_name: getCellText(row.getCell(4)),
        mother_name: getCellText(row.getCell(5)),
        adm_date: getCellText(row.getCell(6)),
        adm_no: rawAdmNo === "" ? null : Number(rawAdmNo),
        roll_no: rawRollNo === "" ? null : Number(rawRollNo),
        parent_mobile: getCellText(row.getCell(9)),
        month_fee_from: rawMonthFeeFrom === "" ? null : Number(rawMonthFeeFrom),
        avail_transport: rawAvailTransport === "" ? null : Number(rawAvailTransport),
        selected_route: getCellText(row.getCell(12)),
        gen_fee: rawGenFee === "" ? null : Number(rawGenFee),
      };

      // Simple validation
      let rowErrors = [];
      if (!data.name) rowErrors.push("Name is required");

      const properClass = classes.some(c => c.name === data.class)
      if (!data.class || !properClass) rowErrors.push("Invalid Class");
      let rowClass = ''
      if (properClass) {
        rowClass = classes.find(c => c.name === data.class).id
      }

      const filteredSections = sections.filter(s => s.class_id === rowClass)
      const properSection = filteredSections.some(s => s.name === data.section)
      if (filteredSections.length > 0 && !properSection) rowErrors.push("Invalid Section");
      
      if (!data.father_name) rowErrors.push("Father's name is required");
      if (!data.mother_name) rowErrors.push("Mother's name is required");

      if (!data.adm_date) rowErrors.push("Admission date is required");
      data.adm_date = new Date(data.adm_date).toISOString().split("T")[0]

      const existingAdmNoSet = new Set(admNos?.map(a => Number(a.adm_no)))
      const excelAdmNoSet = new Set()
      if (isNaN(data.adm_no) || data.adm_no === 0) {
        rowErrors.push('Invalid Admission No')
      } else if (!data.adm_no) {
        rowErrors.push("Admission No is required")
      } else if (existingAdmNoSet.has(data.adm_no)) {
        rowErrors.push('Admission No already exists: ' + data.adm_no)
      } else if (excelAdmNoSet.has(data)) {
        rowErrors.push('Duplicate Admission No in excel file: ' + data.adm_no)
      } else {
        excelAdmNoSet.add(data.adm_no)
      }

      const existingRollNoMap = new Map()
      rollNos?.forEach(student => {
        const className = student.classes?.name
        const sectionName = student.sections?.name
        const rollNo = student.roll_no

        if (className && sectionName && rollNo) {
          existingRollNoMap.set(`${className}-${sectionName}-${rollNo}`, true)
        }
      })
      const excelRollNoMap = new Map()
      const rollNoKey = `${data.class}-${data.section}-${data.roll_no}`
      if (isNaN(data.roll_no) || data.roll_no === 0) {
        rowErrors.push("Invalid roll no")
      } else if (existingRollNoMap.has(rollNoKey)) {
        rowErrors.push(`Roll No ${data.roll_no} already exists for entered class-section`)
      } else if (excelRollNoMap.has(rollNoKey)) {
        rowErrors.push(`Duplicate Roll No ${data.roll_no} in excel file for entered class-section`)
      } else {
        excelRollNoMap.set(rollNoKey, true)
      }      

      if (!data.parent_mobile || (data.parent_mobile.length !== 10)) rowErrors.push("Invalid Mobile No.");

      if (data.month_fee_from !== 1 && data.month_fee_from !== 2) rowErrors.push("Invalid apply monthly fees from value")
      data.month_fee_from = data.month_fee_from === 1 ? 'session_start'
      : data.month_fee_from === 2 ? 'adm_date'
      : ''

      if (data.avail_transport !== 0 && data.avail_transport !== 1) rowErrors.push("Invalid avail transport value")

      if (data.avail_transport === true && !data.selected_route) rowErrors.push('Select transport route if availed transport')

      if (data.gen_fee !== 0 && data.gen_fee !== 1) rowErrors.push("Invalid generate fee value")

      if (rowErrors.length > 0) {
        validationErrors.push({
          row: index - 1,
          errors: rowErrors.join(", "),
        });
      }

      parsedStudents.push(data);
    });

    const limitCheck = await checkFeatureLimit(profile.school_id, 'students')
    const limit = limitCheck.limit
    if (limit && parsedStudents.length > limit) {
      toast.error('Student records exceed plan limit. Kindly upgrade to add more students.')
      setSubmitDisabled(true)
      return
    }

    setStudents(parsedStudents);
    setErrors(validationErrors);
  };

  const submitToBackend = async () => {
    setLoading(true)

    try {
      const classIdMap = new Map(classes.map(c => [c.name, c.id]))
      const sectionIdMap = new Map(sections.map(s => [`${s.class_id}:${s.name}`, s.id]))
      const routeIdMap = new Map(transportRoutes.map(route => [route.name, route.id]))
  
      const studentsData = students.map(s => {
        const classId = classIdMap.get(s.class)
        const sectionId = sectionIdMap.get(`${classId}:${s.section}`)
        
        let routeId = null
        if (s.avail_transport) {
          routeId = routeIdMap.get(s.selected_route)
        }
  
        const schoolId = profile.school_id
        const sessionId = currentSession.id
  
        return {
          school_id: schoolId,
          session_id: sessionId,
          name: s.name,
          class_id: classId,
          section_id: sectionId,
          adm_no: s.adm_no,
          roll_no: s.roll_no || null,
          father_name: s.father_name,
          mother_name: s.mother_name,
          parent_mobile: s.parent_mobile,
          adm_date: s.adm_date,
          month_fee_from: s.month_fee_from,
          type: 'new',
          route_id: routeId,
          gen_fee: s.gen_fee,
          class_name: s.class,
          currentSession
        }
      })
  
      const res = await bulkInsertAction(studentsData)
  
      if (res.error) {
        if (res.error.message) {
          toast.error(res.error.message)
          return
        }
        console.error(res.error)
        toast.error('Failed to bulk insert students.')
        return
      }

      if (res.success) {
        toast.success('Students bulk inserted successfully.')
        setStudents([])
        fileInputRef.current.value = ""
        return
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to bulk insert students')
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
          <p>Fill data in the template and upload the file. See Instructions worksheet in the excel file to correctly fill data.</p>

          <button className="primary-btn shrink-0" onClick={downloadTemplate}>
            Download Excel Template
          </button>
        </div>
      </div>

      <div>
        <label className="block font-medium mb-1">Upload File</label>
        <input type="file" accept=".xlsx" ref={fileInputRef} className="w-full border rounded px-2 py-1" onChange={handleUpload} />
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            Validation Errors
          </h3>
          <ul className="space-y-1">
            {errors.map((e) => (
              <li key={e.row} className="text-sm text-red-700">
                <span className="font-medium">Row {e.row}:</span> {e.errors}
              </li>
            ))}
          </ul>
        </div>
      )}

      {students.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Preview ({students.length} records)</h4>

          <div className="rounded-md border border-gray-300 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className='border-gray-300'>
                  <TableHead>Sr.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Father's Name</TableHead>
                  <TableHead>Mother's Name</TableHead>
                  <TableHead>Admission Date</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Mobile No.</TableHead>
                  <TableHead>Apply Monthly Fees From</TableHead>
                  <TableHead>Avail Transport</TableHead>
                  <TableHead>Transport Route</TableHead>
                  <TableHead>Generate Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s, index) => (
                  <TableRow key={index} className='border-gray-300'>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.class}</TableCell>
                    <TableCell>{s.section}</TableCell>
                    <TableCell>{s.father_name}</TableCell>
                    <TableCell>{s.mother_name}</TableCell>
                    <TableCell>{new Date(s.adm_date).toLocaleDateString('en-IN', {day: '2-digit', month: '2-digit', year: 'numeric'}).split('T')[0]}</TableCell>
                    <TableCell>{s.adm_no}</TableCell>
                    <TableCell>{s.roll_no}</TableCell>
                    <TableCell>{s.parent_mobile}</TableCell>
                    <TableCell>{s.month_fee_from}</TableCell>
                    <TableCell>{s.avail_transport}</TableCell>
                    <TableCell>{s.selected_route}</TableCell>
                    <TableCell>{s.gen_fee}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='px-2 py-2 flex justify-end gap-2'>
            <button
              type='button'
              onClick={onCancel}
              className="primary-btn bg-gray-200 hover:bg-gray-300 text-black"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submitToBackend}
              className="primary-btn disabled:cursor-not-allowed"
              disabled={submitDisabled || students.length === 0 || errors.length != 0 || loading}
            >
              {loading ? 'Submitting…' : 'Submit to Database'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}