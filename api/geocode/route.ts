import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const KEY=process.env.NEXT_GEOLOCATION_API_KEY
  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${KEY}`
    );
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Geocoding errorrrr:', error);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}