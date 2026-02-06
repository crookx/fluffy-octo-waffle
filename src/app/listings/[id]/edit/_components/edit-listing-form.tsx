'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  location: z.string().min(3, 'Location must be at least 3 characters.'),
  county: z.string().min(3, 'County must be at least 3 characters.'),
  price: z.coerce.number().min(1, 'Price must be a positive number.'),
  area: z.coerce.number().min(0.01, 'Area must be a positive number.'),
  size: z.string().min(2, 'Size must be at least 2 characters (e.g., "50x100").'),
  landType: z.string().min(3, 'Land type must be at least 3 characters (e.g., "Residential").'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  mainImage: z.custom<FileList>().optional(),
  evidence: z.custom<FileList>().optional(),
});

export function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulletPoints, setBulletPoints] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

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
    },
  });

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
      Object.keys(formSchema.shape).forEach(key => {
        const valueKey = key as keyof typeof values;
        const value = values[valueKey];
        if (key === 'mainImage' && value && (value as FileList).length > 0) {
            formData.append('mainImage', (value as FileList)[0]);
        } else if (key === 'evidence' && value) {
          Array.from(value as FileList).forEach(file => formData.append('evidence', file));
        } else if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
      });
      
      const { id } = await editListingAction(listing.id, formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: 'Listing Updated!',
        description: 'Your changes have been submitted for re-approval.',
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
    <div className="container mx-auto max-w-3xl py-10">
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
                    <FormControl><Input placeholder="e.g., 5 Acres in Kitengela" {...field} /></FormControl>
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
                      <FormControl><Input placeholder="e.g., Isinya" {...field} /></FormControl>
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
                      <FormControl><Input placeholder="e.g., Kajiado County" {...field} /></FormControl>
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
                      <FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl>
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
                      <FormControl><Input placeholder="e.g., 100x100 ft" {...field} /></FormControl>
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
                      <FormControl><Input placeholder="e.g., Residential, Agricultural" {...field} /></FormControl>
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
                      <FormControl><Input type="number" placeholder="e.g., 5500000" {...field} /></FormControl>
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
                    <FormControl><Textarea placeholder="A detailed description of the property will appear here..." className="min-h-[150px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

               <FormField
                control={form.control}
                name="mainImage"
                render={({ field: { onChange, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Main Property Image</FormLabel>
                     <div className="p-4 border-2 border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Current Image:</p>
                        <Image src={listing.image} alt={listing.title} width={200} height={133} className="rounded-md object-cover" />
                    </div>
                    <FormControl><Input type="file" accept="image/*" {...rest} onChange={(e) => onChange(e.target.files)} /></FormControl>
                    <FormDescription>Upload a new image to replace the current one. Leave blank to keep the same image.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evidence"
                render={({ field: { onChange, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Evidence Documents</FormLabel>
                     {listing.evidence.length > 0 && (
                        <div className="space-y-2 p-4 border-2 border-dashed rounded-lg">
                            <p className="text-sm text-muted-foreground">Current Evidence:</p>
                            <ul className="list-disc list-inside text-sm">
                                {listing.evidence.map(doc => (
                                    <li key={doc.id} className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span>{doc.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                     )}
                    <FormControl><Input type="file" multiple {...rest} onChange={(e) => onChange(e.target.files)} /></FormControl>
                    <FormDescription>You can upload additional evidence documents (title deed, survey maps, etc.).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSubmitting && (
                <div className="space-y-2">
                    <Label>Saving Changes...</Label>
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-muted-foreground">Updating listing and running AI analysis...</p>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving... </> ) : ( 'Save Changes' )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
