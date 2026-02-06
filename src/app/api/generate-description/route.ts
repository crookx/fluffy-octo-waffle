import { NextResponse } from 'next/server';
import { generatePropertyDescription } from '@/ai/flows/generate-property-description';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bulletPoints = body?.bulletPoints;
    if (!bulletPoints) {
      return NextResponse.json({ error: 'Missing bulletPoints' }, { status: 400 });
    }

    const result = await generatePropertyDescription({ bulletPoints });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
