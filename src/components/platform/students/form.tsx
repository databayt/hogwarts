"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
import { toast } from "sonner";
import { createStudent, getStudent, updateStudent } from "@/components/platform/students/actions";
import { studentCreateSchema } from "@/components/platform/students/validation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";

export function StudentCreateForm() {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const form = useForm<z.infer<typeof studentCreateSchema>>({
    resolver: zodResolver(studentCreateSchema),
    defaultValues: {
      givenName: "",
      middleName: "",
      surname: "",
      dateOfBirth: "",
      gender: undefined as unknown as "male" | "female" | undefined,
      enrollmentDate: "",
      userId: "",
    },
  });

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getStudent({ id: currentId });
      const s = res.student as any;
      if (!s) return;
      form.reset({
        givenName: s.givenName ?? "",
        middleName: s.middleName ?? "",
        surname: s.surname ?? "",
        dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().slice(0, 10) : "",
        gender: ((s.gender ?? "") as string).toLowerCase() === "female" ? "female" : "male",
        enrollmentDate: s.enrollmentDate ? new Date(s.enrollmentDate).toISOString().slice(0, 10) : "",
        userId: s.userId ?? "",
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  async function onSubmit(values: z.infer<typeof studentCreateSchema>) {
    const res = currentId
      ? await updateStudent({ id: currentId, ...values })
      : await createStudent(values);
    if (res?.success) {
      toast.success("Student created");
      closeModal();
      router.refresh();
    } else {
      toast.error("Failed to create student");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{isView ? "View Student" : currentId ? "Edit Student" : "Create Student"}</h2>
        <p className="text-sm text-muted-foreground">{isView ? "View student details" : currentId ? "Update student details" : "Add a new student to your school"}</p>
      </div>
      <Form {...form}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="givenName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Given name</FormLabel>
                <FormControl>
                  <Input placeholder="Harry" disabled={isView} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Middle name</FormLabel>
                <FormControl>
                  <Input placeholder="James" disabled={isView} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="surname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Surname</FormLabel>
                <FormControl>
                  <Input placeholder="Potter" disabled={isView} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of birth</FormLabel>
                <FormControl>
                  <Input type="date" placeholder="YYYY-MM-DD" disabled={isView} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                  <FormControl>
                    <SelectTrigger disabled={isView}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enrollmentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enrollment date</FormLabel>
                <FormControl>
                  <Input type="date" placeholder="YYYY-MM-DD" disabled={isView} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User ID (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Link to user account" disabled={isView} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mt-2 flex items-center gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            {!isView && (
              <Button type="submit">{currentId ? "Save changes" : "Create"}</Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

export default StudentCreateForm;

