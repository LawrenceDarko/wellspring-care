import { z } from "zod";

// General inquiry input (PRD §4.1 Contact). Shared by the client form (RHF
// resolver) and the server action, so no server imports. Relative imports only.

export const CONTACT_LIMITS = { name: 120, email: 320, message: 4000 } as const;

export const contactInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(CONTACT_LIMITS.name, `Please keep your name under ${CONTACT_LIMITS.name} characters.`),
  email: z
    .string()
    .trim()
    .max(CONTACT_LIMITS.email, "Please enter a valid email address.")
    .pipe(z.email("Please enter a valid email address.")),
  message: z
    .string()
    .trim()
    .min(1, "Please enter a message.")
    .max(CONTACT_LIMITS.message, `Please keep your message under ${CONTACT_LIMITS.message} characters.`),
});

export type ContactInput = z.infer<typeof contactInputSchema>;
export type ContactField = keyof ContactInput;
export const CONTACT_FIELDS = ["name", "email", "message"] as const satisfies readonly ContactField[];
