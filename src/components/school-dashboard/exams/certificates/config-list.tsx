"use client"

import { useState } from "react"
import { Edit, MoreHorizontal, Trash2 } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { deleteCertificateConfig } from "./actions"
import type { CertificateConfigSummary } from "./actions/types"

export function CertificateConfigList({
  configs,
}: {
  configs: CertificateConfigSummary[]
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setLoading(id)
    const result = await deleteCertificateConfig(id)
    setLoading(null)

    if (result.success) {
      toast({ title: "Template deleted" })
    } else if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  if (configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium">No templates yet</h3>
        <p className="text-muted-foreground text-sm">
          Create a certificate template to get started.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Style</TableHead>
          <TableHead>Issued</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {configs.map((config) => (
          <TableRow key={config.id}>
            <TableCell className="font-medium">{config.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{config.type}</Badge>
            </TableCell>
            <TableCell className="capitalize">{config.templateStyle}</TableCell>
            <TableCell>{config.certificateCount}</TableCell>
            <TableCell>
              {new Date(config.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loading === config.id}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={`certificates/configs/${config.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(config.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default CertificateConfigList
