// @ts-nocheck
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface CardsShareProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function CardsShare({ dictionary }: CardsShareProps) {
  return (
    <Card
      className="border shadow-none"
      dir={dictionary?.locale === "ar" ? "rtl" : "ltr"}
    >
      <CardHeader className="pb-3">
        <CardTitle>
          {dictionary?.cards?.share?.title || "Share this document"}
        </CardTitle>
        <CardDescription>
          {dictionary?.cards?.share?.description ||
            "Anyone with the link can view this document."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Label htmlFor="link" className="sr-only">
            {dictionary?.cards?.share?.linkLabel || "Link"}
          </Label>
          <Input
            id="link"
            value="http://example.com/link/to/document"
            readOnly
          />
          <Button className="shrink-0">
            {dictionary?.cards?.share?.copyLink || "Copy Link"}
          </Button>
        </div>
        <Separator className="my-4" />
        <div className="space-y-4">
          <div className="text-sm font-medium">
            {dictionary?.cards?.share?.peopleWithAccess || "People with access"}
          </div>
          <div className="grid gap-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="/avatars/03.png" alt="Image" />
                  <AvatarFallback>OM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm leading-none font-medium">
                    Olivia Martin
                  </p>
                  <p className="text-muted-foreground text-sm">m@example.com</p>
                </div>
              </div>
              <Select defaultValue="edit">
                <SelectTrigger
                  className="ms-auto w-[110px]"
                  aria-label={dictionary?.cards?.share?.editLabel || "Edit"}
                >
                  <SelectValue
                    placeholder={
                      dictionary?.cards?.share?.selectPlaceholder || "Select"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">
                    {dictionary?.cards?.share?.canEdit || "Can edit"}
                  </SelectItem>
                  <SelectItem value="view">
                    {dictionary?.cards?.share?.canView || "Can view"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="/avatars/05.png" alt="Image" />
                  <AvatarFallback>IN</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm leading-none font-medium">
                    Isabella Nguyen
                  </p>
                  <p className="text-muted-foreground text-sm">b@example.com</p>
                </div>
              </div>
              <Select defaultValue="view">
                <SelectTrigger
                  className="ms-auto w-[110px]"
                  aria-label={dictionary?.cards?.share?.editLabel || "Edit"}
                >
                  <SelectValue
                    placeholder={
                      dictionary?.cards?.share?.selectPlaceholder || "Select"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">
                    {dictionary?.cards?.share?.canEdit || "Can edit"}
                  </SelectItem>
                  <SelectItem value="view">
                    {dictionary?.cards?.share?.canView || "Can view"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="/avatars/01.png" alt="Image" />
                  <AvatarFallback>SD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm leading-none font-medium">
                    Sofia Davis
                  </p>
                  <p className="text-muted-foreground text-sm">p@example.com</p>
                </div>
              </div>
              <Select defaultValue="view">
                <SelectTrigger
                  className="ms-auto w-[110px]"
                  aria-label={dictionary?.cards?.share?.editLabel || "Edit"}
                >
                  <SelectValue
                    placeholder={
                      dictionary?.cards?.share?.selectPlaceholder || "Select"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">
                    {dictionary?.cards?.share?.canEdit || "Can edit"}
                  </SelectItem>
                  <SelectItem value="view">
                    {dictionary?.cards?.share?.canView || "Can view"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
