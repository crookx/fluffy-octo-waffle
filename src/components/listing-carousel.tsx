'use client';

import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { ListingImage } from '@/lib/types';

interface ListingCarouselProps {
    images: ListingImage[];
    title: string;
    className?: string;
}

export function ListingCarousel({ images, title, className }: ListingCarouselProps) {
    if (!images || images.length === 0) {
        return (
             <Image
                src={'https://picsum.photos/seed/fallback/1200/800'}
                alt={`${title} - placeholder image`}
                width={1200}
                height={800}
                className="aspect-video w-full object-cover"
                data-ai-hint={'landscape placeholder'}
                priority
            />
        )
    }

    return (
        <Carousel className={className}>
            <CarouselContent>
            {images.map((image, index) => (
                <CarouselItem key={index}>
                <Image
                    src={image.url}
                    alt={`${title} - image ${index + 1}`}
                    width={1200}
                    height={800}
                    className="aspect-video w-full object-cover"
                    data-ai-hint={image.hint}
                    priority={index === 0}
                />
                </CarouselItem>
            ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-4" />
            <CarouselNext className="absolute right-4" />
        </Carousel>
    );
}
