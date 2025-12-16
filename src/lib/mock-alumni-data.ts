export interface AlumniLocation {
  location: [number, number] // [latitude, longitude]
  size: number
  name?: string
  country?: string
}

export interface AlumniData {
  locations: AlumniLocation[]
  jobTypes: { type: string; count: number }[]
  countries: { country: string; count: number }[]
  roles: { role: string; count: number }[]
}

// Major cities around the world with their coordinates
const MAJOR_CITIES: Array<{ name: string; lat: number; lng: number; country: string }> = [
  // Middle East
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, country: 'UAE' },
  { name: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, country: 'UAE' },
  { name: 'Riyadh', lat: 24.7136, lng: 46.6753, country: 'Saudi Arabia' },
  { name: 'Doha', lat: 25.2854, lng: 51.5310, country: 'Qatar' },
  { name: 'Kuwait City', lat: 29.3759, lng: 47.9774, country: 'Kuwait' },
  { name: 'Manama', lat: 26.0667, lng: 50.5577, country: 'Bahrain' },
  { name: 'Muscat', lat: 23.5859, lng: 58.4059, country: 'Oman' },
  { name: 'Beirut', lat: 33.8938, lng: 35.5018, country: 'Lebanon' },
  { name: 'Amman', lat: 31.9539, lng: 35.9106, country: 'Jordan' },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, country: 'Egypt' },
  
  // Europe
  { name: 'London', lat: 51.5074, lng: -0.1278, country: 'UK' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France' },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, country: 'Germany' },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
  { name: 'Zurich', lat: 47.3769, lng: 8.5417, country: 'Switzerland' },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038, country: 'Spain' },
  { name: 'Rome', lat: 41.9028, lng: 12.4964, country: 'Italy' },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686, country: 'Sweden' },
  
  // North America
  { name: 'New York', lat: 40.7128, lng: -74.0060, country: 'USA' },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, country: 'USA' },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, country: 'USA' },
  { name: 'Boston', lat: 42.3601, lng: -71.0589, country: 'USA' },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, country: 'USA' },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, country: 'Canada' },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207, country: 'Canada' },
  
  // Asia
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, country: 'Singapore' },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, country: 'Hong Kong' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'Japan' },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780, country: 'South Korea' },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737, country: 'China' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, country: 'India' },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, country: 'India' },
  { name: 'Manila', lat: 14.5995, lng: 120.9842, country: 'Philippines' },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, country: 'Thailand' },
  
  // Australia
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia' },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631, country: 'Australia' },
]

const JOB_TYPES = [
  'Consulting',
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Engineering',
  'Marketing',
  'Research',
  'Entrepreneurship',
  'Government',
]

const ROLES = [
  'Analyst',
  'Consultant',
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'Business Development',
  'Marketing Manager',
  'Research Associate',
  'Project Manager',
  'Senior Manager',
  'Director',
  'Founder/CEO',
]

export function generateMockAlumniData(institutionSlug: string): AlumniData {
  // Generate random locations (selecting 30-50 cities)
  const numLocations = 30 + Math.floor(Math.random() * 21)
  const selectedCities = [...MAJOR_CITIES]
    .sort(() => Math.random() - 0.5)
    .slice(0, numLocations)
  
  const locations: AlumniLocation[] = selectedCities.map(city => ({
    location: [city.lat, city.lng],
    size: 0.03 + Math.random() * 0.07, // Size between 0.03 and 0.1
    name: city.name,
    country: city.country,
  }))

  // Generate job types distribution
  const jobTypes = JOB_TYPES.map(type => ({
    type,
    count: Math.floor(Math.random() * 50) + 10, // 10-60 alumni per job type
  })).sort((a, b) => b.count - a.count)

  // Generate countries distribution from selected cities
  const countryCounts: Record<string, number> = {}
  selectedCities.forEach(city => {
    countryCounts[city.country] = (countryCounts[city.country] || 0) + 1
  })
  
  const countries = Object.entries(countryCounts)
    .map(([country, count]) => ({
      country,
      count: count + Math.floor(Math.random() * 5), // Add some variance
    }))
    .sort((a, b) => b.count - a.count)

  // Generate roles distribution
  const roles = ROLES.map(role => ({
    role,
    count: Math.floor(Math.random() * 40) + 5, // 5-45 alumni per role
  })).sort((a, b) => b.count - a.count)

  return {
    locations,
    jobTypes,
    countries,
    roles,
  }
}

