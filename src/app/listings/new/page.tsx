'use client';

import { useState } from 'react';
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
import { createListing, generateDescriptionAction } from '@/app/actions';
import { Loader2, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ToastAction } from '@/components/ui/toast';
import { ListingLocationPicker } from '@/components/listing-location-picker';
import { FileDragAndDrop } from '@/components/file-drag-and-drop';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  location: z.string().min(3, 'Location must be at least 3 characters.'),
  county: z.string().min(3, 'County must be at least 3 characters.'),
  price: z.coerce.number().min(1, 'Price must be a positive number.'),
  area: z.coerce.number().min(0.01, 'Area must be a positive number.'),
  size: z.string().min(2, 'Size must be at least 2 characters (e.g., "50x100").'),
  landType: z.string().min(3, 'Land type must be at least 3 characters (e.g., "Residential").'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  images: z.custom<FileList>().refine(files => files && files.length > 0, 'At least one property image is required.'),
  evidence: z.custom<FileList>().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

export default function NewListingPage() {
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
      title: '',
      location: '',
      county: '',
      price: 0,
      area: 0,
      size: '',
      landType: '',
      description: '',
      latitude: 0.0236, // Default to central Kenya
      longitude: 37.9062,
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
      Object.entries(values).forEach(([key, value]) => {
          if (value instanceof FileList) {
              Array.from(value).forEach(file => formData.append(key, file));
          } else if (value) {
              formData.append(key, String(value));
          }
      });
      
      const { id } = await createListing(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: 'Listing Submitted!',
        description: 'Your property is now pending review by our team.',
        action: <ToastAction altText="View" onClick={() => router.push(`/listings/${id}`)}>View</ToastAction>
      });

      setTimeout(() => {
        router.push(`/listings/${id}`);
      }, 1000);

    } catch (error) {
      clearInterval(progressInterval);
      setIsSubmitting(false);
      setUploadProgress(0);
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: error instanceof Error ? error.message : 'Could not create the listing. Please try again.',
      });
    }
  }

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Listing</CardTitle>
          <CardDescription>
            Fill in the details of your property. It will be reviewed by an admin before being made public.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Info */}
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

               {/* Property Details */}
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

              {/* AI Description Generator */}
              <div className="space-y-4">
                 <FormLabel>Generate Description with AI</FormLabel>
                 <p className="text-sm text-muted-foreground">
                  AI-generated text is for convenience only. Review and edit to ensure accuracy before publishing.
                 </p>
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

              {/* Description */}
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

              <ListingLocationPicker />

              <Separator />

              {/* File Uploads */}
              <FileDragAndDrop 
                  name="images"
                  label="Property Images"
                  description="The first image will be the main photo. You can upload multiple images."
                  accept="image/*"
                  multiple
              />

              <FileDragAndDrop
                name="evidence"
                label="Evidence Documents"
                description="Upload title deed, survey maps, agreements, etc. (images or PDFs)."
                multiple
              />

              {isSubmitting && (
                <div className="space-y-2">
                    <Label>Submitting for Review...</Label>
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-muted-foreground">
                      Running AI analysis on submitted materials. AI results are advisory and do not replace human review.
                    </p>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting... </> ) : ( 'Submit for Review' )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
