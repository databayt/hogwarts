"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconEdit, IconTrash, IconCopy } from "@tabler/icons-react";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface FeeStructure {
  id: string;
  name: string;
  academicYear: string;
  totalAmount: any;
  installments: number;
  isActive: boolean;
  class?: {
    name: string;
  } | null;
}

interface Props {
  structures: FeeStructure[];
  dictionary?: Dictionary;
}

export function FeeStructuresList({ structures, dictionary }: Props) {
  const formatCurrency = (amount: any) => {
    const value = typeof amount === 'object' ? amount.toNumber() : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Fee Structures</CardTitle>
          <CardDescription>
            Configure fee structures for different classes and academic years
          </CardDescription>
        </div>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Structure
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Installments</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {structures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No fee structures found
                </TableCell>
              </TableRow>
            ) : (
              structures.map((structure) => (
                <TableRow key={structure.id}>
                  <TableCell className="font-medium">{structure.name}</TableCell>
                  <TableCell>{structure.class?.name || "All Classes"}</TableCell>
                  <TableCell>{structure.academicYear}</TableCell>
                  <TableCell>{formatCurrency(structure.totalAmount)}</TableCell>
                  <TableCell>{structure.installments}</TableCell>
                  <TableCell>
                    <Badge variant={structure.isActive ? "default" : "secondary"}>
                      {structure.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <IconCopy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <IconTrash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}