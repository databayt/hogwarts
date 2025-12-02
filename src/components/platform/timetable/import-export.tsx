'use client'

import React, { useState, useRef } from 'react'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, Upload, FileSpreadsheet, FileText, FileJson, Image, Calendar, CircleAlert, CircleCheck, FileDown, FileUp } from "lucide-react"
import {
  TimetableSlot,
  Period,
  TimetableExportOptions,
  TimetableImportData,
  TeacherInfo,
  SubjectInfo,
  ClassroomInfo,
  ClassInfo
} from './types'
import { exportToCSV, parseCSVImport, generateICalEvent } from './utils'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ImportExportProps {
  slots: TimetableSlot[]
  periods: Period[]
  workingDays: number[]
  teachers: TeacherInfo[]
  subjects: SubjectInfo[]
  classrooms: ClassroomInfo[]
  classes: ClassInfo[]
  onImport: (data: Partial<TimetableSlot>[]) => Promise<void>
  dictionary?: any
}

export function ImportExportDialog({
  slots,
  periods,
  workingDays,
  teachers,
  subjects,
  classrooms,
  classes,
  onImport,
  dictionary = {}
}: ImportExportProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('export')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  // Export states
  const [exportFormat, setExportFormat] = useState<TimetableExportOptions['format']>('pdf')
  const [exportViewType, setExportViewType] = useState<TimetableExportOptions['viewType']>('class')
  const [includeSubstitutes, setIncludeSubstitutes] = useState(true)
  const [includeNotes, setIncludeNotes] = useState(true)

  // Import states
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importFormat, setImportFormat] = useState<'excel' | 'csv' | 'json'>('excel')
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [validateConflicts, setValidateConflicts] = useState(true)
  const [importPreview, setImportPreview] = useState<any[]>([])

  const handleExport = async () => {
    setIsProcessing(true)
    setProgress(0)

    try {
      switch (exportFormat) {
        case 'pdf':
          await exportToPDF()
          break
        case 'excel':
          await exportToExcel()
          break
        case 'csv':
          await exportToCSVFile()
          break
        case 'image':
          await exportToImage()
          break
        case 'ical':
          await exportToICal()
          break
      }

      toast({
        title: 'Export Successful',
        description: `Timetable exported as ${exportFormat.toUpperCase()}`,
      })
      setShowDialog(false)
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export timetable'
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const exportToPDF = async () => {
    setProgress(20)
    const element = document.getElementById('timetable-grid')
    if (!element) throw new Error('Timetable grid not found')

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    })
    setProgress(60)

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const imgWidth = 280
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
    setProgress(90)

    pdf.save('timetable.pdf')
    setProgress(100)
  }

  const exportToExcel = async () => {
    setProgress(20)

    const workbook = XLSX.utils.book_new()
    const worksheetData: any[][] = []

    // Headers
    const headers = ['Period/Day', ...workingDays.map(d => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return dayNames[d]
    })]
    worksheetData.push(headers)

    // Data rows
    periods.forEach(period => {
      const row = [period.name]
      workingDays.forEach(day => {
        const slot = slots.find(s => s.periodId === period.id && s.dayOfWeek === day)
        if (slot) {
          const subject = subjects.find(s => s.id === slot.subjectId)
          const teacher = teachers.find(t => t.id === slot.teacherId)
          const room = classrooms.find(r => r.id === slot.classroomId)

          let cellContent = subject?.name || ''
          if (includeNotes && teacher) {
            cellContent += `\n${teacher.firstName} ${teacher.lastName}`
          }
          if (includeNotes && room) {
            cellContent += `\n${room.name}`
          }
          row.push(cellContent)
        } else {
          row.push('')
        }
      })
      worksheetData.push(row)
    })

    setProgress(60)

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable')

    // Add metadata sheet
    const metadataSheet = XLSX.utils.aoa_to_sheet([
      ['Export Date', new Date().toLocaleDateString()],
      ['Total Slots', slots.length],
      ['Working Days', workingDays.join(', ')],
      ['Periods', periods.length]
    ])
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Info')

    setProgress(90)

    XLSX.writeFile(workbook, 'timetable.xlsx')
    setProgress(100)
  }

  const exportToCSVFile = async () => {
    setProgress(50)
    const csvContent = exportToCSV(slots, periods, workingDays)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'timetable.csv'
    link.click()
    URL.revokeObjectURL(url)
    setProgress(100)
  }

  const exportToImage = async () => {
    setProgress(20)
    const element = document.getElementById('timetable-grid')
    if (!element) throw new Error('Timetable grid not found')

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    })
    setProgress(80)

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'timetable.png'
        link.click()
        URL.revokeObjectURL(url)
      }
    })
    setProgress(100)
  }

  const exportToICal = async () => {
    setProgress(20)
    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//School Timetable//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:School Timetable
X-WR-TIMEZONE:UTC
`

    const today = new Date()
    const mondayOfWeek = new Date(today)
    mondayOfWeek.setDate(today.getDate() - today.getDay() + 1)

    slots.forEach((slot, index) => {
      const period = periods.find(p => p.id === slot.periodId)
      if (period) {
        const slotDate = new Date(mondayOfWeek)
        slotDate.setDate(mondayOfWeek.getDate() + slot.dayOfWeek - 1)

        icalContent += generateICalEvent(slot, period, slotDate)
      }
      setProgress(20 + (index / slots.length) * 60)
    })

    icalContent += 'END:VCALENDAR'

    const blob = new Blob([icalContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'timetable.ics'
    link.click()
    URL.revokeObjectURL(url)
    setProgress(100)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
      previewImport(file)
    }
  }

  const previewImport = async (file: File) => {
    setIsProcessing(true)
    setProgress(20)

    try {
      let data: any[] = []

      if (importFormat === 'csv') {
        const text = await file.text()
        const result = parseCSVImport(text)
        if (result.valid && result.data) {
          data = result.data
        }
      } else if (importFormat === 'excel') {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        data = XLSX.utils.sheet_to_json(worksheet)
      } else if (importFormat === 'json') {
        const text = await file.text()
        data = JSON.parse(text)
      }

      setProgress(80)
      setImportPreview(data.slice(0, 5)) // Show first 5 rows as preview
      setProgress(100)
    } catch (error) {
      toast({
        title: 'Preview Failed',
        description: 'Failed to preview import file'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) return

    setIsProcessing(true)
    setProgress(0)

    try {
      let data: Partial<TimetableSlot>[] = []

      // Parse file based on format
      if (importFormat === 'csv') {
        const text = await importFile.text()
        const result = parseCSVImport(text)
        if (result.valid && result.data) {
          data = mapImportDataToSlots(result.data)
        }
      } else if (importFormat === 'excel') {
        const buffer = await importFile.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawData = XLSX.utils.sheet_to_json(worksheet)
        data = mapImportDataToSlots(rawData)
      } else if (importFormat === 'json') {
        const text = await importFile.text()
        data = JSON.parse(text)
      }

      setProgress(50)

      // Validate and import
      if (validateConflicts) {
        // Validate conflicts before importing
        // This would be implemented based on your validation logic
      }

      await onImport(data)
      setProgress(100)

      toast({
        title: 'Import Successful',
        description: `Imported ${data.length} timetable slots`,
      })
      setShowDialog(false)
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import timetable'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const mapImportDataToSlots = (rawData: any[]): Partial<TimetableSlot>[] => {
    return rawData.map(row => ({
      dayOfWeek: parseInt(row.dayOfWeek || row.Day || '0'),
      periodId: row.periodId || row.Period || '',
      classId: row.classId || row.Class || '',
      subjectId: row.subjectId || row.Subject || '',
      teacherId: row.teacherId || row.Teacher || '',
      classroomId: row.classroomId || row.Room || '',
      notes: row.notes || row.Notes || ''
    }))
  }

  const downloadTemplate = () => {
    const template = [
      {
        Day: 1,
        Period: 'P1',
        Class: 'Grade 10A',
        Subject: 'Mathematics',
        Teacher: 'John Doe',
        Room: 'Room 101',
        Notes: 'Advanced Algebra'
      }
    ]

    if (importFormat === 'csv') {
      const csv = 'Day,Period,Class,Subject,Teacher,Room,Notes\n' +
        '1,P1,Grade 10A,Mathematics,John Doe,Room 101,Advanced Algebra'
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'timetable_template.csv'
      link.click()
    } else if (importFormat === 'excel') {
      const ws = XLSX.utils.json_to_sheet(template)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Template')
      XLSX.writeFile(wb, 'timetable_template.xlsx')
    } else {
      const json = JSON.stringify(template, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'timetable_template.json'
      link.click()
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        className="gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Import/Export
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle><h4>Import/Export Timetable</h4></DialogTitle>
            <DialogDescription>
              <p className="muted">Import timetable data from a file or export the current timetable</p>
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'import' | 'export')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-2">
                <Upload className="h-4 w-4" />
                Import
              </TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as TimetableExportOptions['format'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PDF Document
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel Spreadsheet
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          CSV File
                        </div>
                      </SelectItem>
                      <SelectItem value="image">
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          PNG Image
                        </div>
                      </SelectItem>
                      <SelectItem value="ical">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Calendar (iCal)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>View Type</Label>
                  <Select value={exportViewType} onValueChange={(value) => setExportViewType(value as TimetableExportOptions['viewType'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class">Class View</SelectItem>
                      <SelectItem value="teacher">Teacher View</SelectItem>
                      <SelectItem value="room">Room View</SelectItem>
                      <SelectItem value="student">Student View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-substitutes"
                    checked={includeSubstitutes}
                    onCheckedChange={(checked) => setIncludeSubstitutes(checked as boolean)}
                  />
                  <Label htmlFor="include-substitutes">Include substitute teachers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-notes"
                    checked={includeNotes}
                    onCheckedChange={(checked) => setIncludeNotes(checked as boolean)}
                  />
                  <Label htmlFor="include-notes">Include notes and comments</Label>
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="muted text-center">
                    <small>Exporting... {progress}%</small>
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Import Format</Label>
                  <Select value={importFormat} onValueChange={(value) => setImportFormat(value as 'excel' | 'csv' | 'json')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="json">JSON (.json)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select File</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept={
                        importFormat === 'excel' ? '.xlsx,.xls' :
                        importFormat === 'csv' ? '.csv' : '.json'
                      }
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadTemplate}
                    >
                      <FileDown className="h-4 w-4 me-2" />
                      Template
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overwrite"
                      checked={overwriteExisting}
                      onCheckedChange={(checked) => setOverwriteExisting(checked as boolean)}
                    />
                    <Label htmlFor="overwrite">Overwrite existing timetable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="validate"
                      checked={validateConflicts}
                      onCheckedChange={(checked) => setValidateConflicts(checked as boolean)}
                    />
                    <Label htmlFor="validate">Validate for conflicts</Label>
                  </div>
                </div>

                {importPreview.length > 0 && (
                  <div className="space-y-2">
                    <Label>Preview (first 5 rows)</Label>
                    <div className="border rounded-lg p-2 max-h-40 overflow-auto">
                      <pre>
                        <small>{JSON.stringify(importPreview, null, 2)}</small>
                      </pre>
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="muted text-center">
                      <small>Processing... {progress}%</small>
                    </p>
                  </div>
                )}

                {importFile && (
                  <Alert>
                    <CircleCheck className="h-4 w-4" />
                    <AlertDescription>
                      File selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            {activeTab === 'export' ? (
              <Button onClick={handleExport} disabled={isProcessing}>
                <Download className="h-4 w-4 me-2" />
                Export
              </Button>
            ) : (
              <Button onClick={handleImport} disabled={!importFile || isProcessing}>
                <Upload className="h-4 w-4 me-2" />
                Import
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}