"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  ACCEPT_IMAGES,
  FileUploader,
  type UploadedFileResult,
} from "@/components/file"

type Product = {
  id: string
  name: string
  category: string
  price: number
  description?: string
  image?: string
}

const formSchema = z.object({
  image: z.string().min(1, "Image is required."),
  name: z.string().min(2, {
    message: "Product name must be at least 2 characters.",
  }),
  category: z.string(),
  price: z.number(),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
})

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ProductForm({
  initialData,
  pageTitle,
  dictionary,
}: {
  initialData: Product | null
  pageTitle: string
  dictionary?: any
}) {
  const p = dictionary?.operator?.products
  const defaultValues = {
    image: initialData?.image || "",
    name: initialData?.name || "",
    category: initialData?.category || "",
    price: initialData?.price || 0,
    description: initialData?.description || "",
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: defaultValues,
  })

  const handleUploadComplete = (files: UploadedFileResult[]) => {
    if (files.length > 0) {
      form.setValue("image", files[0].url)
    }
  }

  function onSubmit(_: z.infer<typeof formSchema>) {}

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-start text-2xl font-bold">
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="image"
              render={() => (
                <div className="space-y-6">
                  <FormItem className="w-full">
                    <FormLabel>Images</FormLabel>
                    <FormControl>
                      <FileUploader
                        accept={ACCEPT_IMAGES}
                        maxFiles={4}
                        maxSize={4 * 1024 * 1024}
                        onUploadComplete={handleUploadComplete}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={p?.enterName || "Enter product name"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value[field.value.length - 1]}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              p?.selectCategories || "Select categories"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beauty">
                          {p?.categories?.beautyProducts || "Beauty Products"}
                        </SelectItem>
                        <SelectItem value="electronics">
                          {p?.categories?.electronics || "Electronics"}
                        </SelectItem>
                        <SelectItem value="clothing">
                          {p?.categories?.clothing || "Clothing"}
                        </SelectItem>
                        <SelectItem value="home">
                          {p?.categories?.homeAndGarden || "Home & Garden"}
                        </SelectItem>
                        <SelectItem value="sports">
                          {p?.categories?.sportsAndOutdoors ||
                            "Sports & Outdoors"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={p?.enterPrice || "Enter price"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        p?.enterDescription || "Enter product description"
                      }
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Add Product</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
