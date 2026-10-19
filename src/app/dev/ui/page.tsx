import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MotionProvider, Parallax, Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

// Tasks 1.1 + 1.9a + 1.10c: design token, component and motion preview (ADR 006, 007). 404 in production.

export const metadata: Metadata = {
  title: "Dev UI",
  robots: { index: false, follow: false },
};

const SWATCHES = [
  ["background", "bg-background text-foreground"],
  ["card", "bg-card text-card-foreground"],
  ["primary", "bg-primary text-primary-foreground"],
  ["secondary", "bg-secondary text-secondary-foreground"],
  ["muted", "bg-muted text-muted-foreground"],
  ["accent", "bg-accent text-accent-foreground"],
  ["gold", "bg-gold text-gold-foreground"],
  ["band", "band"],
  ["destructive", "bg-destructive text-white"],
] as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <MotionProvider>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl">Design system</h1>
          <p className="text-muted-foreground">
            Tokens and components (PRD §4.4). Light only. Contrast pairs are
            checked by <code>npm run check:contrast</code>.
          </p>
        </header>

        <Section title="Colour tokens">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SWATCHES.map(([name, cls]) => (
              <li key={name} className={`rounded-lg border p-4 text-sm ${cls}`}>
                {name}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Typography">
          <p className="type-display">Walking with you</p>
          <p className="font-display text-h1">Heading 1</p>
          <p className="font-display text-h2">Heading 2</p>
          <p className="font-display text-h3">Heading 3</p>
          <p className="max-w-measure text-lede">
            Lede text introduces a page in one or two sentences.
          </p>
          <p className="max-w-measure">
            Body copy uses the humanist sans at 17px and stays within about 65
            characters per line. Headings use the serif display face. Links look
            like{" "}
            <a href="#" className="text-primary underline underline-offset-4">
              this
            </a>
            .
          </p>
        </Section>

        <Section title="Forest band">
          <div className="band flex flex-col gap-4 rounded-lg p-8">
            <p className="type-display">Every season of life</p>
            <p className="max-w-measure text-band-muted">
              Secondary text on the band.
            </p>
            <div className="h-px w-24 bg-band-gold" />
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary">Request spiritual care</Button>
              <a href="#" className="rounded-sm underline underline-offset-4">
                Focus this link to see the linen ring
              </a>
            </div>
          </div>
        </Section>

        <Section title="Buttons and badges">
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-gold text-gold-foreground">Gold</Badge>
          </div>
        </Section>

        <Section title="Form controls">
          <Card>
            <CardHeader>
              <CardTitle>Sample form</CardTitle>
              <CardDescription>Not submitted anywhere.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ui-name">Name</Label>
                <Input id="ui-name" placeholder="Jane Doe" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ui-email">Email (invalid state)</Label>
                <Input
                  id="ui-email"
                  type="email"
                  aria-invalid
                  defaultValue="not-an-email"
                />
                <p className="text-sm text-destructive">
                  Enter a valid email address.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ui-service">Service</Label>
                <Select>
                  <SelectTrigger id="ui-service" className="w-full">
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chaplaincy">Chaplaincy visit</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="memorial">Memorial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ui-notes">Notes</Label>
                <Textarea id="ui-notes" placeholder="Anything we should know" />
              </div>
            </CardContent>
            <CardFooter className="gap-3">
              <Button type="button">Save</Button>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </Section>

        <Section title="Overlays">
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog title</DialogTitle>
                  <DialogDescription>
                    Dialogs trap focus and close on Escape.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button>Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet title</SheetTitle>
                  <SheetDescription>
                    Used for the mobile navigation in 1.2.
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </div>
        </Section>

        <Section title="Motion">
          <p className="max-w-measure text-muted-foreground">
            Lenis smooth scroll, reveals and parallax (ADR 007). With reduced
            motion on, or without JS, everything below is simply here.
          </p>
          <div className="band relative h-80 overflow-hidden rounded-lg">
            <Parallax
              speed={0.4}
              className="absolute inset-x-0 top-8 flex justify-center"
            >
              <div className="size-40 rounded-full bg-band-gold/40" />
            </Parallax>
            <Parallax speed={-0.2} className="absolute inset-x-0 bottom-0">
              <div className="h-24 rounded-t-[50%] bg-band-muted/30" />
            </Parallax>
            <p className="type-display relative p-8">Downstream</p>
          </div>
          {["Marriage", "Family", "Renewal", "Illness", "Loss"].map(
            (season, i) => (
              <Reveal
                key={season}
                delay={i * 0.08}
                className="rounded-lg border p-6"
              >
                <p className="font-display text-h3">{season}</p>
                <a
                  href="#"
                  className="text-primary underline underline-offset-4"
                >
                  Focusable before it reveals
                </a>
              </Reveal>
            ),
          )}
        </Section>
      </main>
    </MotionProvider>
  );
}
