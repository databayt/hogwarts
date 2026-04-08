"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Form } from "@/components/ui/form"
import { useModal } from "@/components/atom/modal/context"
import { ModalFooter } from "@/components/atom/modal/modal-footer"
import { ModalFormLayout } from "@/components/atom/modal/modal-form-layout"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  createAnnouncement,
  getAnnouncement,
  updateAnnouncement,
} from "@/components/school-dashboard/listings/announcements/actions"
import {
  announcementCreateSchema,
  type AnnouncementFormValues,
} from "@/components/school-dashboard/listings/announcements/validation"
import { detectLanguage } from "@/components/translation/util"

import { InformationStep } from "./information"
import { ScopeStep } from "./scope"

interface AnnouncementCreateFormProps {
  dictionary: Dictionary["school"]["announcements"]
  lang: Locale
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void
}

export function AnnouncementCreateForm({
  dictionary,
  lang,
  onSuccess,
}: AnnouncementCreateFormProps) {
  const { modal, closeModal } = useModal()
  const router = useRouter()
  const t = dictionary

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementCreateSchema) as any,
    defaultValues: {
      title: "",
      body: "",
      lang: lang === "ar" ? "ar" : "en",
      scope: "school",
      classId: "",
      role: "",
      published: false,
      priority: "normal",
    },
  })

  const isView = !!(modal.id && modal.id.startsWith("view:"))
  const currentId = modal.id
    ? modal.id.startsWith("view:")
      ? modal.id.split(":")[1]
      : modal.id
    : undefined

  useEffect(() => {
    const load = async () => {
      if (!currentId) return
      const res = await getAnnouncement({ id: currentId, displayLang: lang })
      if (!res.success || !res.data) return
      const a = res.data
      form.reset({
        title: a.title ?? "",
        body: a.body ?? "",
        lang: (a.lang as "ar" | "en") ?? "ar",
        scope: (a.scope as "school" | "class" | "role") ?? "school",
        classId: a.classId ?? "",
        role: a.role ?? "",
        published: a.published ?? false,
        priority:
          (a.priority as "low" | "normal" | "high" | "urgent") ?? "normal",
      })
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  async function onSubmit(values: AnnouncementFormValues) {
    // Detect actual content language from title text
    const detectedLang = detectLanguage(values.title || "")
    values.lang = detectedLang

    const res = currentId
      ? await updateAnnouncement({ id: currentId, ...values })
      : await createAnnouncement(values)

    if (res?.success) {
      toast.success(currentId ? t.announcementUpdated : t.announcementCreated)
      closeModal()
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } else {
      toast.error(currentId ? t.failedToUpdate : t.failedToCreate)
    }
  }

  const handleSubmit = async () => {
    await form.handleSubmit(onSubmit)()
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={
            isView
              ? t.viewAnnouncement
              : currentId
                ? t.editAnnouncement
                : t.createAnnouncement
          }
          description={
            isView
              ? t.viewAnnouncementDetails
              : currentId
                ? t.updateAnnouncementDetails
                : t.createNewAnnouncement
          }
        >
          <InformationStep
            form={form}
            isView={isView}
            dictionary={dictionary}
            lang={lang}
          />
          <ScopeStep
            form={form}
            isView={isView}
            dictionary={dictionary}
            lang={lang}
          />
        </ModalFormLayout>

        <ModalFooter
          currentStep={1}
          totalSteps={1}
          stepLabel={t.createAnnouncement}
          isView={isView}
          isEdit={!!currentId}
          isDirty={form.formState.isDirty}
          isSubmitting={false}
          onBack={closeModal}
          onNext={handleSubmit}
          labels={{
            cancel: t.cancel,
            save: t.save,
            create: t.create,
          }}
        />
      </form>
    </Form>
  )
}

export default AnnouncementCreateForm
