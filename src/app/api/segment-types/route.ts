import { NextResponse } from 'next/server';
import { SEGMENT_TYPE_SCHEMAS } from '../../../lib/segment-schemas';

export const runtime = 'nodejs';

export async function GET() {
  const segmentTypes = SEGMENT_TYPE_SCHEMAS.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    props: s.props,
    defaults: s.defaults,
  }));

  return NextResponse.json({ segmentTypes });
}
