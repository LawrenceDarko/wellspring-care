"use server";

import { headers } from "next/headers";
import { submitContactForm, type ContactState } from "@/server/contact";

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  return submitContactForm(formData, { headers: await headers() });
}
