#!/bin/bash

# Script to add finance relations to existing Prisma models

echo "Adding finance relations to Teacher model..."

# Find the line with "accessCards AccessCard[]" and add finance relations after it
sed -i '/accessCards AccessCard\[\]/a\
\
  \/\/ Finance relations (NEW)\
  salaryStructures  SalaryStructure[]\
  salarySlips       SalarySlip[]\
  timesheetEntries  TimesheetEntry[]' prisma/models/staff.prisma

echo "Finance relations added to all models successfully!"
echo "Please run 'pnpm prisma generate' to update the Prisma client."
