import { NextResponse } from 'next/server';
import { createListing } from '@/app/actions';

export async function POST(req: Request) {
  try {
    // Expect a multipart/form-data request from the client
    const formData = await req.formData();
    const result = await createListing(formData as any);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('API /api/listings error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
