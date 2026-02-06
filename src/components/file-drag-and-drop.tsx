'use client';

import { DragEvent, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { FileText, Trash2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface FileDragAndDropProps {
  name: string;
  label: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
}

export function FileDragAndDrop({ name, label, description, accept, multiple = true }: FileDragAndDropProps) {
  const { setValue, watch } = useFormContext();
  const existingFiles: FileList | undefined = watch(name);
  const [isDragOver, setIsDragOver] = useState(false);

  const files = existingFiles ? Array.from(existingFiles) : [];

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (!droppedFiles.length) return;

    const newFiles = multiple ? [...files, ...droppedFiles] : droppedFiles;
    
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    setValue(name, dataTransfer.files, { shouldValidate: true });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
     if (!selectedFiles.length) return;

    const newFiles = multiple ? [...files, ...selectedFiles] : selectedFiles;
    
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    setValue(name, dataTransfer.files, { shouldValidate: true });
  };

  const removeFile = (indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    setValue(name, newFiles.length > 0 ? dataTransfer.files : undefined, { shouldValidate: true });
  };

  const FilePreview = ({ file, index }: { file: File; index: number }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    useEffect(() => {
      let objectUrl: string | null = null;
      if (file.type.startsWith('image/')) {
        objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      }
      
      return () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    }, [file]);

    return (
      <div className="flex items-start p-2 border rounded-lg bg-secondary/50 justify-between">
        <div className="flex items-start gap-3 overflow-hidden">
          {previewUrl ? (
            <div className="relative w-12 h-12 aspect-square rounded-md overflow-hidden flex-shrink-0">
                <Image src={previewUrl} alt={file.name} fill className="object-cover"/>
            </div>
          ) : (
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-secondary rounded-md border">
                <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 text-sm overflow-hidden">
            <p className="font-medium truncate" title={file.name}>{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => removeFile(index)}
          className="p-1.5 text-destructive rounded-md hover:bg-destructive/10 flex-shrink-0"
          aria-label={`Remove ${file.name}`}
        >
          <Trash2 className="w-4 w-4" />
        </button>
      </div>
    );
  };
  
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
            'relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            isDragOver ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'
            )}
        >
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-center text-muted-foreground">
            Drag & drop files here, or click to select
            </p>
            <input
                id={name}
                name={name}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </div>
      
      {files.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {files.map((file, index) => (
                  <FilePreview key={`${file.name}-${index}`} file={file} index={index} />
              ))}
          </div>
      )}

      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}
