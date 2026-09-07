// Approximate centroids for the 8 countries Shortlisted supports — used to
// place a marker on the world map when a country is selected in the profile
// form. Not surveying-grade, just visually reasonable pin locations.
export const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number; label: string }> = {
  US: { lat: 39.8283, lng: -98.5795, label: 'USA' },
  UK: { lat: 54.5, lng: -3, label: 'UK' },
  AU: { lat: -25.2744, lng: 133.7751, label: 'Australia' },
  SG: { lat: 1.3521, lng: 103.8198, label: 'Singapore' },
  HK: { lat: 22.3193, lng: 114.1694, label: 'Hong Kong' },
  IN: { lat: 22.5937, lng: 78.9629, label: 'India' },
  DE: { lat: 51.1657, lng: 10.4515, label: 'Germany' },
  FR: { lat: 46.2276, lng: 2.2137, label: 'France' },
}
