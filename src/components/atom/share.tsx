// @ts-nocheck
"use client"

import type { getDictionary } from "@/components/internationalization/dictionaries"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface CardsShareProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function CardsShare({ dictionary }: CardsShareProps) {
  return (
    <Card className="shadow-none border" dir={dictionary?.locale === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <CardTitle>{dictionary?.cards?.share?.title || "Share this document"}</CardTitle>
        <CardDescription>
          {dictionary?.cards?.share?.description || "Anyone with the link can view this document."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Label htmlFor="link" className="sr-only">
            {dictionary?.cards?.share?.linkLabel || "Link"}
          </Label>
          <Input
            id="link"
            value="http://example.com/link/to/document"
            readOnly
          />
          <Button className="shrink-0">{dictionary?.cards?.share?.copyLink || "Copy Link"}</Button>
        </div>
        <Separator className="my-4" />
        <div className="space-y-4">
          <div className="text-sm font-medium">{dictionary?.cards?.share?.peopleWithAccess || "People with access"}</div>
          <div className="grid gap-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Avatar>
                  <AvatarImage src="/avatars/03.png" alt="Image" />
                  <AvatarFallback>OM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">
                    Olivia Martin
                  </p>
                  <p className="text-sm text-muted-foreground">m@example.com</p>
                </div>
              </div>
              <Select defaultValue="edit">
                <SelectTrigger className="ml-auto w-[110px] rtl:mr-auto rtl:ml-0" aria-label={dictionary?.cards?.share?.editLabel || "Edit"}>
                  <SelectValue placeholder={dictionary?.cards?.share?.selectPlaceholder || "Select"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">{dictionary?.cards?.share?.canEdit || "Can edit"}</SelectItem>
                  <SelectItem value="view">{dictionary?.cards?.share?.canView || "Can view"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Avatar>
                  <AvatarImage src="/avatars/05.png" alt="Image" />
                  <AvatarFallback>IN</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">
                    Isabella Nguyen
                  </p>
                  <p className="text-sm text-muted-foreground">b@example.com</p>
                </div>
              </div>
              <Select defaultValue="view">
                <SelectTrigger className="ml-auto w-[110px] rtl:mr-auto rtl:ml-0" aria-label={dictionary?.cards?.share?.editLabel || "Edit"}>
                  <SelectValue placeholder={dictionary?.cards?.share?.selectPlaceholder || "Select"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">{dictionary?.cards?.share?.canEdit || "Can edit"}</SelectItem>
                  <SelectItem value="view">{dictionary?.cards?.share?.canView || "Can view"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Avatar>
                  <AvatarImage src="/avatars/01.png" alt="Image" />
                  <AvatarFallback>SD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">
                    Sofia Davis
                  </p>
                  <p className="text-sm text-muted-foreground">p@example.com</p>
                </div>
              </div>
              <Select defaultValue="view">
                <SelectTrigger className="ml-auto w-[110px] rtl:mr-auto rtl:ml-0" aria-label={dictionary?.cards?.share?.editLabel || "Edit"}>
                  <SelectValue placeholder={dictionary?.cards?.share?.selectPlaceholder || "Select"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">{dictionary?.cards?.share?.canEdit || "Can edit"}</SelectItem>
                  <SelectItem value="view">{dictionary?.cards?.share?.canView || "Can view"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
