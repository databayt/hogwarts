"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Printer
} from 'lucide-react';
import { useAttendanceContext } from '../core/attendance-context';
import type { Dictionary } from '@/components/internationalization/dictionaries';
import type { StudentIdentifier } from '../shared/types';

interface StudentCardsProps {
  dictionary?: Dictionary;
  locale?: string;
  schoolId: string;
}

export function StudentCards({ dictionary, locale = 'en', schoolId }: StudentCardsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<StudentIdentifier | null>(null);
  const [newCard, setNewCard] = useState({
    studentId: '',
    barcode: '',
    expiryDate: ''
  });
  const [cards, setCards] = useState<StudentIdentifier[]>([]);

  const {
    studentIdentifiers,
    fetchStudentIdentifiers,
    addStudentIdentifier,
    removeStudentIdentifier
  } = useAttendanceContext();

  useEffect(() => {
    fetchStudentIdentifiers();
  }, [fetchStudentIdentifiers]);

  useEffect(() => {
    // Filter for barcode type identifiers
    setCards(studentIdentifiers.filter(id => id.type === 'BARCODE'));
  }, [studentIdentifiers]);

  const handleAddCard = async () => {
    if (!newCard.studentId || !newCard.barcode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    try {
      await addStudentIdentifier({
        schoolId,
        studentId: newCard.studentId,
        type: 'BARCODE',
        value: newCard.barcode,
        isActive: true,
        issuedAt: new Date().toISOString(),
        expiresAt: newCard.expiryDate || undefined
      });

      toast({
        title: "Success",
        description: "Card added successfully",
      });

      setIsAddDialogOpen(false);
      setNewCard({ studentId: '', barcode: '', expiryDate: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add card"
      });
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await removeStudentIdentifier(cardId);
      toast({
        title: "Success",
        description: "Card removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove card"
      });
    }
  };

  const generateBarcode = () => {
    // Generate a random barcode
    const prefix = 'STU';
    const random = Math.floor(Math.random() * 1000000000);
    const barcode = `${prefix}${random.toString().padStart(9, '0')}`;
    setNewCard(prev => ({ ...prev, barcode }));
  };

  const printCard = (card: StudentIdentifier) => {
    // In production, this would generate a printable card
    toast({
      title: "Print Card",
      description: `Printing card for ${card.studentName || card.studentId}`,
    });
  };

  const exportCards = () => {
    // Export cards to CSV
    const csv = [
      ['Student ID', 'Student Name', 'Barcode', 'Status', 'Issued Date', 'Expiry Date'],
      ...cards.map(card => [
        card.studentId,
        card.studentName || '',
        card.value,
        card.isActive ? 'Active' : 'Inactive',
        card.issuedAt,
        card.expiresAt || 'Never'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-cards.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredCards = cards.filter(card =>
    card.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (card.studentName && card.studentName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student ID Cards</CardTitle>
              <CardDescription>
                Manage barcode assignments for student identification
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCards}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Student Card</DialogTitle>
                    <DialogDescription>
                      Assign a barcode to a student for attendance tracking
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Student ID</Label>
                      <Input
                        placeholder="Enter student ID..."
                        value={newCard.studentId}
                        onChange={(e) => setNewCard(prev => ({ ...prev, studentId: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Barcode</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter or generate barcode..."
                          value={newCard.barcode}
                          onChange={(e) => setNewCard(prev => ({ ...prev, barcode: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateBarcode}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date (Optional)</Label>
                      <Input
                        type="date"
                        value={newCard.expiryDate}
                        onChange={(e) => setNewCard(prev => ({ ...prev, expiryDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddCard}>
                      Add Card
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student ID, name, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold">{cards.length}</p>
              <p className="text-xs text-muted-foreground">Total Cards</p>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {cards.filter(c => c.isActive).length}
              </p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {cards.filter(c => !c.isActive).length}
              </p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {cards.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length}
              </p>
              <p className="text-xs text-muted-foreground">Expired</p>
            </div>
          </div>

          {/* Cards Table */}
          {filteredCards.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No cards found matching your search' : 'No cards assigned yet'}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Add Card" to assign barcodes to students
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card) => {
                    const isExpired = card.expiresAt && new Date(card.expiresAt) < new Date();
                    return (
                      <TableRow key={card.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{card.studentName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{card.studentId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-secondary rounded text-xs">
                            {card.value}
                          </code>
                        </TableCell>
                        <TableCell>
                          {isExpired ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          ) : card.isActive ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(card.issuedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {card.expiresAt
                            ? new Date(card.expiresAt).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => printCard(card)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingCard(card)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCard(card.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Import Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Import</CardTitle>
          <CardDescription>
            Import multiple cards from a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 px-4 border-2 border-dashed rounded-lg">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                Drop your CSV file here or click to browse
              </p>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                CSV format: student_id, barcode, expiry_date
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}