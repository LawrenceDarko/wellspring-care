"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_LIMITS, contactInputSchema, type ContactField, type ContactInput } from "@/domain/contact";
import type { ContactState } from "@/server/contact";
import { sendContactMessage } from "./actions";

// Client checks mirror the server schema; the server action re-validates everything.
// Without JS the form still posts to the action (progressive enhancement).

const initialState: ContactState = { status: "idle" };

export function ContactForm({ guard }: { guard: ReactNode }) {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialState);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactInput>({ resolver: zodResolver(contactInputSchema), defaultValues: { name: "", email: "", message: "" } });

  if (state.status === "sent") {
    return (
      <p role="status" className="rounded border p-4">
        Thank you. Your message was received. We will reply by email.
      </p>
    );
  }

  const errorFor = (field: ContactField) =>
    errors[field]?.message ?? (state.status === "invalid" ? state.fieldErrors[field] : undefined);
  const describedBy = (field: ContactField) => (errorFor(field) ? `${field}-error` : undefined);

  const fields: { name: ContactField; label: string; type?: string; autoComplete?: string }[] = [
    { name: "name", label: "Your name", autoComplete: "name" },
    { name: "email", label: "Email address", type: "email", autoComplete: "email" },
  ];

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const form = event.currentTarget;
        void handleSubmit(() => startTransition(() => formAction(new FormData(form))))(event);
      }}
      noValidate
      className="relative flex flex-col gap-4"
    >
      {state.status === "error" && (
        <p role="alert" className="rounded border border-destructive p-3 text-sm">
          {state.message}
        </p>
      )}
      {guard}
      {fields.map((f) => (
        <div key={f.name} className="flex flex-col gap-2">
          <Label htmlFor={f.name}>{f.label}</Label>
          <Input
            id={f.name}
            type={f.type ?? "text"}
            autoComplete={f.autoComplete}
            maxLength={CONTACT_LIMITS[f.name]}
            aria-invalid={errorFor(f.name) ? true : undefined}
            aria-describedby={describedBy(f.name)}
            className="min-h-11"
            {...register(f.name)}
          />
          {errorFor(f.name) && (
            <p id={`${f.name}-error`} className="text-sm text-destructive">
              {errorFor(f.name)}
            </p>
          )}
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Message</Label>
        <p id="message-hint" className="text-sm text-muted-foreground">
          Please share only what is needed for us to reply. Private details can wait until we talk.
        </p>
        <Textarea
          id="message"
          rows={6}
          maxLength={CONTACT_LIMITS.message}
          aria-invalid={errorFor("message") ? true : undefined}
          aria-describedby={["message-hint", describedBy("message")].filter(Boolean).join(" ")}
          {...register("message")}
        />
        {errorFor("message") && (
          <p id="message-error" className="text-sm text-destructive">
            {errorFor("message")}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="min-h-11 self-start">
        {pending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
