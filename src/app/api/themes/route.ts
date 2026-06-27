import { NextResponse } from 'next/server';
import { THEMES } from '../../../lib/themes';

export const runtime = 'nodejs';

export async function GET() {
  const themes = Object.values(THEMES).map((t) => ({
    id: t.id,
    name: t.name,
  }));

  return NextResponse.json({ themes });
}
