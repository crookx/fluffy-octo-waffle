'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { editListingAction, generateDescriptionAction } from '@/app/actions';
import { Loader2, Sparkles, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ToastAction } from '@/components/ui/toast';
import type { Listing } from '@/lib/types';
import Image from 'next/image';
import { ListingLocationPicker } from '@/components/listing-location-picker';
import { FileDragAndDrop } from '@/components/file-drag-and-drop';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  location: z.string().min(3, 'Location must be at least 3 characters.'),
  county: z.string().min(3, 'County must be at least 3 characters.'),
  price: z.coerce.number().min(1, 'Price must be a positive number.'),
  area: z.coerce.number().min(0.01, 'Area must be a positive number.'),
  size: z.string().min(2, 'Size must be at least 2 characters (e.g., "50x100").'),
  landType: z.string().min(3, 'Land type must be at least 3 characters (e.g., "Residential").'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  images: z.custom<FileList>().optional(),
  evidence: z.custom<FileList>().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

export function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulletPoints, setBulletPoints] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const draftKey = `seller:edit-listing:draft:${listing.id}`;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: listing.title,
      location: listing.location,
      county: listing.county,
      price: listing.price,
      area: listing.area,
      size: listing.size,
      landType: listing.landType,
      description: listing.description,
      latitude: listing.latitude,
      longitude: listing.longitude,
    },
  });

  const watchedValues = form.watch();

  const completeness = useMemo(() => {
    const checks = [
      Boolean(watchedValues.title?.trim()),
      Boolean(watchedValues.location?.trim()),
      Boolean(watchedValues.county?.trim()),
      Number(watchedValues.price) > 0,
      Number(watchedValues.area) > 0,
      Boolean(watchedValues.landType?.trim()),
      Boolean(watchedValues.description?.trim() && watchedValues.description.trim().length >= 20),
      Number(watchedValues.latitude) !== 0 || Number(watchedValues.longitude) !== 0,
    ];
    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  }, [watchedValues]);

  useEffect(() => {
    const draftRaw = localStorage.getItem(draftKey);
    if (!draftRaw) return;
    try {
      const parsed = JSON.parse(draftRaw) as Partial<z.infer<typeof formSchema>>;
      form.reset({ ...form.getValues(), ...parsed });
      toast({ title: 'Draft restored', description: 'Recovered unsaved edits from this browser.' });
    } catch {
      // ignore invalid draft
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!form.formState.isDirty || isSubmitting) return;
      const values = form.getValues();
      const draftPayload = {
        title: values.title,
        location: values.location,
        county: values.county,
        price: values.price,
        area: values.area,
        size: values.size,
        landType: values.landType,
        description: values.description,
        latitude: values.latitude,
        longitude: values.longitude,
      };
      localStorage.setItem(draftKey, JSON.stringify(draftPayload));
    }, 1500);
    return () => clearInterval(interval);
  }, [draftKey, form, form.formState.isDirty, isSubmitting]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!form.formState.isDirty || isSubmitting) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [form.formState.isDirty, isSubmitting]);

  const handleGenerateDescription = async () => {
    if (!bulletPoints) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please provide some key features.' });
        return;
    }
    setIsGenerating(true);
    setGeneratedDescription('');
    try {
        const result = await generateDescriptionAction(bulletPoints);
        setGeneratedDescription(result.description);
        toast({ title: 'Description generated!', description: 'You can now use or edit the description below.' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'AI Error', description: e.message });
    } finally {
        setIsGenerating(false);
    }
  }

  const useGeneratedDescription = () => {
    if (generatedDescription) {
        form.setValue('description', generatedDescription, { shouldValidate: true });
        setGeneratedDescription('');
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);

    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
          if (value instanceof FileList) {
              Array.from(value).forEach(file => formData.append(key, file));
          } else if (value !== undefined && value !== null) {
              formData.append(key, String(value));
          }
      });
      
      const { id } = await editListingAction(listing.id, formData);
      localStorage.removeItem(draftKey);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: 'Listing Updated!',
        description: 'Your listing has been successfully updated.',
        action: <ToastAction altText="View" onClick={() => router.push(`/listings/${id}`)}>View</ToastAction>
      });

      setTimeout(() => {
        router.push(`/listings/${id}`);
        router.refresh();
      }, 1000);

    } catch (error) {
      clearInterval(progressInterval);
      setIsSubmitting(false);
      setUploadProgress(0);
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: error instanceof Error ? error.message : 'Could not update the listing. Please try again.',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Listing</CardTitle>
        <CardDescription>
          Update the details of your property. Your listing will be re-submitted for review after saving changes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Title</FormLabel>
                    <Input placeholder="e.g., 5 Acres in Kitengela" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Location</FormLabel>
                      <Input placeholder="e.g., Isinya" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="county"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>County</FormLabel>
                      <Input placeholder="e.g., Kajiado County" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area (in Acres)</FormLabel>
                      <Input type="number" placeholder="e.g., 5" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plot Dimensions</FormLabel>
                      <Input placeholder="e.g., 100x100 ft" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <FormField
                  control={form.control}
                  name="landType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Land Type</FormLabel>
                      <Input placeholder="e.g., Residential, Agricultural" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (Ksh)</FormLabel>
                      <Input type="number" placeholder="e.g., 5500000" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                 <FormLabel>Generate Description with AI</FormLabel>
                 <Textarea 
                    placeholder="Enter key features as bullet points...&#10;- 5 acres prime land&#10;- Ready title deed&#10;- Water and electricity on site"
                    className="min-h-[100px]"
                    value={bulletPoints}
                    onChange={(e) => setBulletPoints(e.target.value)}
                 />
                 <Button type="button" variant="outline" onClick={handleGenerateDescription} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate Description
                 </Button>
                 {generatedDescription && (
                    <Card className="bg-secondary/50">
                        <CardHeader>
                            <CardTitle className="text-lg">AI Generated Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-secondary-foreground">{generatedDescription}</p>
                        </CardContent>
                        <CardFooter>
                            <Button type="button" size="sm" onClick={useGeneratedDescription}>Use this description</Button>
                        </CardFooter>
                    </Card>
                 )}
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Description</FormLabel>
                    <Textarea placeholder="A detailed description of the property will appear here..." className="min-h-[150px]" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="rounded-md border bg-muted/30 p-3 text-sm">Step 3 of 4 · Location</div>
              <ListingLocationPicker initialPosition={{ lat: listing.latitude, lon: listing.longitude }} />

              <Separator />

              <div className="space-y-2">
                <FormLabel>Current Property Images</FormLabel>
                <div className="p-4 border-2 border-dashed rounded-lg space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {listing.images.map((image, index) => (
                            <div key={index} className="relative aspect-video">
                                <Image src={image.url} alt={`Property image ${index + 1}`} fill className="rounded-md object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 p-3 text-sm">Step 4 of 4 · Documents & review</div>
              <FileDragAndDrop 
                  name="images"
                  label="Upload New Property Images"
                  description="Upload new images to replace all current images. Drag and drop or click to select."
                  accept="image/*"
                  multiple
              />

              <div className="space-y-2">
                <FormLabel>Current Evidence</FormLabel>
                 {listing.evidence.length > 0 ? (
                    <div className="space-y-2 p-4 border-2 border-dashed rounded-lg">
                        <ul className="list-disc list-inside text-sm">
                            {listing.evidence.map(doc => (
                                <li key={doc.id} className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span>{doc.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                 ) : (
                    <p className="text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg">No evidence documents have been uploaded yet.</p>
                 )}
              </div>

              <FileDragAndDrop
                name="evidence"
                label="Add More Evidence"
                description="You can upload additional evidence documents (title deed, survey maps, etc.). Existing documents will be kept."
                multiple
              />

              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-semibold">Badge target guidance</p>
                <ul className="mt-2 list-disc ml-5 space-y-1 text-muted-foreground">
                  <li><strong>Bronze:</strong> title deed + basic location proof.</li>
                  <li><strong>Silver:</strong> add updated survey + clearer photos.</li>
                  <li><strong>Gold:</strong> complete deed, survey, ownership match, and strong photo evidence.</li>
                </ul>
              </div>

              {isSubmitting && (
                <div className="space-y-2">
                    <Label>Saving Changes...</Label>
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-muted-foreground">Updating listing and running AI analysis...</p>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} variant="accent" className="font-semibold">
                {isSubmitting ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving... </> ) : ( 'Save Changes' )}
              </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
