"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditCard, Users, Search, ListFilter, Printer, Download, Settings, Palette, FileText, CircleCheck, CircleX } from "lucide-react";
import { IDCardPreview } from "./id-card-preview";
import { idCardTemplates, defaultTemplate } from "./templates";
import type { IDCardData, IDCardTemplate, IDCardGenerationOptions } from "./types";
import type { Student } from "../registration/types";
import { format, addYears } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { IDCardTemplateComponent } from "./id-card-template";
import { toast } from "sonner";

interface IDCardGeneratorProps {
  students: Student[];
  schoolInfo: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    website?: string;
  };
}

export function IDCardGenerator({ students, schoolInfo }: IDCardGeneratorProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<IDCardTemplate>(defaultTemplate);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // ListFilter students based on search and filters
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.givenName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.surname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.grNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = filterClass === "all" || true; // Replace with actual class check
    const matchesStatus = filterStatus === "all" || student.status === filterStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  // Select all filtered students
  const selectAll = () => {
    const allIds = new Set(filteredStudents.map(s => s.id));
    setSelectedStudents(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedStudents(new Set());
  };

  // Get preview data for the first selected student
  const getPreviewData = (): IDCardData | null => {
    if (selectedStudents.size === 0) return null;

    const firstStudentId = Array.from(selectedStudents)[0];
    const student = students.find(s => s.id === firstStudentId);

    if (!student) return null;

    return {
      studentId: student.id,
      grNumber: student.grNumber || "N/A",
      studentName: [student.givenName, student.middleName, student.surname]
        .filter(Boolean)
        .join(" "),
      profilePhotoUrl: student.profilePhotoUrl,
      class: "Grade 10", // Replace with actual class
      section: "A",
      academicYear: "2024-2025",
      dateOfBirth: student.dateOfBirth!,
      bloodGroup: student.bloodGroup,
      mobileNumber: student.mobileNumber,
      emergencyContact: student.emergencyContactPhone,
      schoolName: schoolInfo.name,
      schoolLogo: schoolInfo.logo,
      schoolAddress: schoolInfo.address,
      schoolPhone: schoolInfo.phone,
      schoolWebsite: schoolInfo.website,
      issueDate: new Date(),
      validUntil: addYears(new Date(), 1),
      cardNumber: `CARD-${student.grNumber}`,
      barcode: student.grNumber,
    };
  };

  // Generate PDF for all selected students
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF({
        orientation: selectedTemplate.orientation,
        unit: "mm",
        format: [selectedTemplate.size.width, selectedTemplate.size.height],
      });

      let isFirstPage = true;

      for (const studentId of Array.from(selectedStudents)) {
        const student = students.find(s => s.id === studentId);
        if (!student) continue;

        const cardData: IDCardData = {
          studentId: student.id,
          grNumber: student.grNumber || "N/A",
          studentName: [student.givenName, student.middleName, student.surname]
            .filter(Boolean)
            .join(" "),
          profilePhotoUrl: student.profilePhotoUrl,
          class: "Grade 10", // Replace with actual
          section: "A",
          academicYear: "2024-2025",
          dateOfBirth: student.dateOfBirth!,
          bloodGroup: student.bloodGroup,
          mobileNumber: student.mobileNumber,
          emergencyContact: student.emergencyContactPhone,
          schoolName: schoolInfo.name,
          schoolLogo: schoolInfo.logo,
          schoolAddress: schoolInfo.address,
          schoolPhone: schoolInfo.phone,
          schoolWebsite: schoolInfo.website,
          issueDate: new Date(),
          validUntil: addYears(new Date(), 1),
          cardNumber: `CARD-${student.grNumber}`,
          barcode: student.grNumber,
        };

        if (!isFirstPage) {
          pdf.addPage();
        }

        // Create temporary element for rendering
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        document.body.appendChild(container);

        // Render front side
        const frontCard = document.createElement("div");
        container.appendChild(frontCard);
        // Note: In production, you'd use React's renderToStaticMarkup here

        // Capture as image
        const frontCanvas = await html2canvas(frontCard, {
          scale: 2,
          useCORS: true,
        });

        pdf.addImage(
          frontCanvas.toDataURL("image/png"),
          "PNG",
          0,
          0,
          selectedTemplate.size.width,
          selectedTemplate.size.height
        );

        // Add back side on next page
        pdf.addPage();

        // Render back side
        const backCard = document.createElement("div");
        container.appendChild(backCard);

        const backCanvas = await html2canvas(backCard, {
          scale: 2,
          useCORS: true,
        });

        pdf.addImage(
          backCanvas.toDataURL("image/png"),
          "PNG",
          0,
          0,
          selectedTemplate.size.width,
          selectedTemplate.size.height
        );

        // Clean up
        document.body.removeChild(container);
        isFirstPage = false;
      }

      // Download PDF
      pdf.save(`student-id-cards-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success(`Generated ID cards for ${selectedStudents.size} students`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate ID cards");
    } finally {
      setIsGenerating(false);
    }
  };

  // Print cards
  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  const previewData = getPreviewData();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CircleCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{selectedStudents.size}</p>
                <p className="text-sm text-muted-foreground">Selected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{idCardTemplates.length}</p>
                <p className="text-sm text-muted-foreground">Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Printer className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">Ready</p>
                <p className="text-sm text-muted-foreground">Print Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-[400px]">
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-2" />
            Students
          </TabsTrigger>
          <TabsTrigger value="template">
            <Palette className="h-4 w-4 mr-2" />
            Template
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={selectedStudents.size === 0}>
            <FileText className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Students Selection Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Students</CardTitle>
              <CardDescription>
                Choose which students to generate ID cards for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or GR number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="grade-10">Grade 10</SelectItem>
                    <SelectItem value="grade-11">Grade 11</SelectItem>
                    <SelectItem value="grade-12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selection Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All ({filteredStudents.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedStudents.size} of {filteredStudents.length} students selected
                </p>
              </div>

              {/* Students List */}
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-2">
                  {filteredStudents.map((student) => {
                    const isSelected = selectedStudents.has(student.id);
                    const fullName = [student.givenName, student.middleName, student.surname]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div
                        key={student.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                          isSelected ? "bg-blue-50 border-blue-200" : ""
                        }`}
                        onClick={() => toggleStudentSelection(student.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.profilePhotoUrl} alt={fullName} />
                          <AvatarFallback>
                            {student.givenName?.[0]}
                            {student.surname?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{fullName}</p>
                          <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>{student.grNumber}</span>
                            <span>•</span>
                            <span>Grade 10-A</span>
                          </div>
                        </div>
                        <Badge variant={student.status === "ACTIVE" ? "default" : "secondary"}>
                          {student.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template Selection Tab */}
        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose Template</CardTitle>
              <CardDescription>
                Select a design template for the ID cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedTemplate.id}
                onValueChange={(value) => {
                  const template = idCardTemplates.find(t => t.id === value);
                  if (template) setSelectedTemplate(template);
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  {idCardTemplates.map((template) => (
                    <div key={template.id} className="flex items-start space-x-3">
                      <RadioGroupItem value={template.id} id={template.id} />
                      <Label htmlFor={template.id} className="flex-1 cursor-pointer">
                        <Card className={selectedTemplate.id === template.id ? "border-primary" : ""}>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <h4 className="font-medium">{template.name}</h4>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Orientation: {template.orientation}</p>
                                <p>Size: {template.size.width}x{template.size.height}{template.size.unit}</p>
                                <div className="flex gap-2">
                                  {template.includeBarcode && (
                                    <Badge variant="outline" className="text-xs">Barcode</Badge>
                                  )}
                                  {template.includeQRCode && (
                                    <Badge variant="outline" className="text-xs">QR Code</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <div
                                  className="w-6 h-6 rounded"
                                  style={{ backgroundColor: template.primaryColor }}
                                />
                                <div
                                  className="w-6 h-6 rounded"
                                  style={{ backgroundColor: template.secondaryColor }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          {previewData ? (
            <IDCardPreview
              data={previewData}
              template={selectedTemplate}
              onPrint={handlePrint}
              onDownload={(format) => {
                if (format === "pdf") {
                  generatePDF();
                } else {
                  toast.info("Image export coming soon");
                }
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CircleX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Please select at least one student to preview ID cards
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Generate Actions */}
      {selectedStudents.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ready to Generate</p>
                <p className="text-sm text-muted-foreground">
                  {selectedStudents.size} ID cards will be generated using the {selectedTemplate.name} template
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => generatePDF()}
                  disabled={isGenerating}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
                <Button
                  onClick={handlePrint}
                  disabled={isGenerating}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}