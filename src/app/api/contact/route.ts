import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ message: 'Name, email, and message are required.' }, { status: 400 });
    }

    const messageRef = await adminDb.collection('contactMessages').add({
      name,
      email,
      message,
      createdAt: FieldValue.serverTimestamp(),
      status: 'new',
    });

    await adminDb.collection('emailQueue').add({
      to: email,
      template: 'contact-confirmation',
      subject: 'Thanks for contacting Kenya Land Trust',
      payload: {
        name,
        messageId: messageRef.id,
      },
      createdAt: FieldValue.serverTimestamp(),
      status: 'queued',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contact form submission failed:', error);
    return NextResponse.json({ message: 'Failed to submit message.' }, { status: 500 });
  }
}
