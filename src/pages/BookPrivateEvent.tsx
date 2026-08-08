import { useState, type FormEvent } from 'react';
import { useSeoMeta } from '@unhead/react';
import { CalendarDays, Check, Loader2, Mail, Music, Users, Wine } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { ResponsiveImage } from '@/components/ResponsiveImage';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/useToast';

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  occasion: string;
  eventType: string;
  date: string;
  guestCount: string;
  preferredSpace: string;
  hostedBar: boolean;
  hostedBarAmount: string;
  food: boolean;
  entertainment: boolean;
  band: boolean;
  dj: boolean;
  otherEntertainment: boolean;
  otherEntertainmentDetails: string;
  details: string;
}

const initialForm: BookingForm = {
  name: '',
  email: '',
  phone: '',
  occasion: '',
  eventType: '',
  date: '',
  guestCount: '',
  preferredSpace: '',
  hostedBar: false,
  hostedBarAmount: '',
  food: false,
  entertainment: false,
  band: false,
  dj: false,
  otherEntertainment: false,
  otherEntertainmentDetails: '',
  details: '',
};

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function getAustinDateMinimum(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function createInquiryMailto(form: BookingForm): string {
  const body = [
    'I tried to submit a private event inquiry through the website.',
    '',
    `Name: ${form.name.slice(0, 120)}`,
    `Phone: ${form.phone.slice(0, 40)}`,
    `Occasion: ${form.occasion.slice(0, 160)}`,
    `Desired date: ${form.date}`,
    `Guest count: ${form.guestCount}`,
    '',
    'Please contact me to complete the inquiry.',
  ].join('\n');

  return `mailto:info@maggiemaesaustin.com?subject=${encodeURIComponent(
    `Private Event Inquiry - ${form.occasion}`,
  )}&body=${encodeURIComponent(body)}`;
}

export default function BookPrivateEvent() {
  useSeoMeta({
    title: "Book a Private Event - Maggie Mae's Bar Austin",
    description:
      "Plan a private party, corporate event, wedding after-party, or showcase at Maggie Mae's on Sixth Street in Austin.",
  });

  const [form, setForm] = useState<BookingForm>(initialForm);
  const [serviceError, setServiceError] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const update = <K extends keyof BookingForm>(field: K, value: BookingForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServiceError('');
    setSubmitError('');
    setSubmitSucceeded(false);

    if (form.hostedBar && !form.hostedBarAmount.trim()) {
      setServiceError('Tell us how much you would like to host for the bar.');
      toast({
        title: 'Hosted bar amount required',
        description: 'Tell us how much you would like to host for the bar.',
        variant: 'destructive',
      });
      return;
    }

    if (form.entertainment && !form.band && !form.dj && !form.otherEntertainment) {
      setServiceError('Select band, DJ, or other entertainment.');
      toast({
        title: 'Choose entertainment',
        description: 'Select band, DJ, or other entertainment.',
        variant: 'destructive',
      });
      return;
    }

    if (form.entertainment && form.otherEntertainment && !form.otherEntertainmentDetails.trim()) {
      setServiceError('Please specify the other entertainment you have in mind.');
      toast({
        title: 'Entertainment details required',
        description: 'Please specify the other entertainment you have in mind.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/private-event-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, bookingReference }),
        signal: AbortSignal.timeout(45_000),
      });

      if (!response.ok) {
        throw new Error('Inquiry request failed');
      }

      setForm(initialForm);
      setBookingReference('');
      setSubmitSucceeded(true);
      toast({
        title: 'Inquiry sent',
        description: 'Our events team will follow up with you soon.',
      });
    } catch {
      setSubmitError('We could not send your inquiry right now. You can email the same details directly instead.');
      toast({
        title: 'Inquiry not sent',
        description: 'Please try again or use the email fallback.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="relative isolate overflow-hidden pb-20 pt-32">
        <div className="absolute inset-0 -z-10">
          <ResponsiveImage
            baseName="bar-interior"
            alt=""
            className="h-full w-full object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-background/85 to-background" />
        </div>
        <div className="container mx-auto px-4 text-center md:px-8">
          <p className="mb-3 font-display text-xs uppercase tracking-[0.3em] text-primary">
            Your Night, Your Way
          </p>
          <h1 className="mb-5 font-serif text-5xl font-black text-foreground md:text-6xl">
            Book a <span className="gold-text">Private Event</span>
          </h1>
          <p className="mx-auto max-w-2xl font-serif text-lg leading-relaxed text-muted-foreground">
            Tell us what you are planning. Our events team will help shape the space, bar, food,
            and entertainment around your crowd.
          </p>
        </div>
      </section>

      <section className="bg-background pb-24">
        <div className="container mx-auto grid gap-8 px-4 md:px-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-border bg-card p-6 shadow-xl shadow-black/10 md:p-8"
          >
            <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <Label htmlFor="booking-reference">Leave this field blank</Label>
              <Input
                id="booking-reference"
                name="booking-reference"
                tabIndex={-1}
                autoComplete="off"
                value={bookingReference}
                onChange={(event) => setBookingReference(event.target.value)}
              />
            </div>
            <div className="mb-8 border-b border-border pb-6">
              <p className="font-display text-xs uppercase tracking-[0.25em] text-primary">
                Event Inquiry
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-foreground">Start planning</h2>
              <p className="mt-2 text-sm text-muted-foreground">Fields marked with * are required.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" autoComplete="name" maxLength={120} required value={form.name} onChange={(event) => update('name', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" autoComplete="email" maxLength={254} required value={form.email} onChange={(event) => update('email', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" type="tel" autoComplete="tel" maxLength={40} required value={form.phone} onChange={(event) => update('phone', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occasion">What's the occasion? *</Label>
                <Input id="occasion" maxLength={160} required placeholder="Birthday, company celebration..." value={form.occasion} onChange={(event) => update('occasion', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-type">Event type</Label>
                <select id="event-type" className={selectClassName} value={form.eventType} onChange={(event) => update('eventType', event.target.value)}>
                  <option value="">Select an event type</option>
                  <option>Corporate event</option>
                  <option>Birthday or celebration</option>
                  <option>Wedding after-party</option>
                  <option>Band showcase</option>
                  <option>Full venue buyout</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Desired date *</Label>
                <Input id="date" type="date" min={getAustinDateMinimum()} required value={form.date} onChange={(event) => update('date', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-count">Estimated guest count *</Label>
                <Input id="guest-count" type="number" min="1" max="987" required placeholder="100" value={form.guestCount} onChange={(event) => update('guestCount', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="space">Preferred space</Label>
                <select id="space" className={selectClassName} value={form.preferredSpace} onChange={(event) => update('preferredSpace', event.target.value)}>
                  <option value="">No preference</option>
                  <option>Rooftop Patio</option>
                  <option>Disco Room</option>
                  <option>Piano Room</option>
                  <option>Gibson Room</option>
                  <option>The Pub</option>
                  <option>Full venue</option>
                </select>
              </div>
            </div>

            <fieldset
              className="mt-8 border-t border-border pt-8"
              aria-invalid={serviceError ? true : undefined}
              aria-describedby={serviceError ? 'service-error' : undefined}
            >
              <legend className="pr-4 font-serif text-2xl font-bold text-foreground">
                What services would you like?
              </legend>
              <p className="mt-2 text-sm text-muted-foreground">Select everything you would like us to include.</p>

              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox id="hosted-bar" checked={form.hostedBar} onCheckedChange={(checked) => update('hostedBar', checked === true)} />
                    <Label htmlFor="hosted-bar" className="cursor-pointer font-serif text-base">Hosted bar</Label>
                  </div>
                  {form.hostedBar && (
                    <div className="mt-4 space-y-2 pl-7">
                      <Label htmlFor="hosted-bar-amount">How much would you like to host? *</Label>
                      <Input id="hosted-bar-amount" maxLength={160} required placeholder="$2,000, first two drinks, open bar..." value={form.hostedBarAmount} onChange={(event) => update('hostedBarAmount', event.target.value)} />
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox id="food" checked={form.food} onCheckedChange={(checked) => update('food', checked === true)} />
                    <Label htmlFor="food" className="cursor-pointer font-serif text-base">Food</Label>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox id="entertainment" checked={form.entertainment} onCheckedChange={(checked) => update('entertainment', checked === true)} />
                    <Label htmlFor="entertainment" className="cursor-pointer font-serif text-base">Entertainment</Label>
                  </div>
                  {form.entertainment && (
                    <div className="mt-4 space-y-4 border-l border-primary/30 pl-7">
                      <div className="flex flex-wrap gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox id="band" checked={form.band} onCheckedChange={(checked) => update('band', checked === true)} />
                          <Label htmlFor="band" className="cursor-pointer">Band</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="dj" checked={form.dj} onCheckedChange={(checked) => update('dj', checked === true)} />
                          <Label htmlFor="dj" className="cursor-pointer">DJ</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="other-entertainment" checked={form.otherEntertainment} onCheckedChange={(checked) => update('otherEntertainment', checked === true)} />
                          <Label htmlFor="other-entertainment" className="cursor-pointer">Other</Label>
                        </div>
                      </div>
                      {form.otherEntertainment && (
                        <div className="space-y-2">
                          <Label htmlFor="other-entertainment-details">Please specify *</Label>
                          <Input id="other-entertainment-details" maxLength={300} required placeholder="Comedian, karaoke, dancers..." value={form.otherEntertainmentDetails} onChange={(event) => update('otherEntertainmentDetails', event.target.value)} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {serviceError && (
                <p id="service-error" role="alert" className="mt-4 text-sm font-medium text-destructive">
                  {serviceError}
                </p>
              )}
            </fieldset>

            <div className="mt-8 space-y-2">
              <Label htmlFor="details">Anything else we should know?</Label>
              <Textarea id="details" rows={5} maxLength={4000} placeholder="Timing, setup needs, theme, accessibility needs, or other details..." value={form.details} onChange={(event) => update('details', event.target.value)} />
            </div>

            {submitSucceeded && (
              <div role="status" className="mt-6 rounded-lg border border-primary/40 bg-primary/10 p-4 text-foreground">
                <p className="font-serif font-bold">Your inquiry was sent.</p>
                <p className="mt-1 text-sm text-muted-foreground">Our events team will follow up with you soon.</p>
              </div>
            )}

            {submitError && (
              <div role="alert" className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-foreground">
                <p>{submitError}</p>
                <a href={createInquiryMailto(form)} className="mt-2 inline-block font-semibold text-primary underline underline-offset-4">
                  Email this inquiry directly
                </a>
              </div>
            )}

            <Button type="submit" size="lg" disabled={isSubmitting} className="mt-8 w-full font-display uppercase tracking-widest md:w-auto">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Sending Inquiry' : 'Send Event Inquiry'}
            </Button>
          </form>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-lg border border-primary/30 bg-card p-6">
              <Wine className="mb-4 h-8 w-8 text-primary" />
              <h2 className="font-serif text-2xl font-bold text-foreground">A Sixth Street original</h2>
              <p className="mt-3 font-serif leading-relaxed text-muted-foreground">
                Five distinct spaces across 11,000 square feet, with room for intimate gatherings or up to 987 guests.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {['Flexible room configurations', 'Full venue buyouts', 'Bar, food, and entertainment options', 'Dedicated event planning support'].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: CalendarDays, label: 'Flexible dates' },
                { icon: Users, label: 'Up to 987' },
                { icon: Music, label: 'Live sound' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-lg border border-border bg-card p-3 text-center">
                  <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              <p className="font-display text-xs uppercase tracking-widest text-primary">Prefer to talk?</p>
              <a href="tel:+15124788541" className="mt-2 block font-serif text-xl font-bold text-foreground hover:text-primary">512-478-8541</a>
              <p className="mt-2">Our team will follow up to confirm availability and details.</p>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
