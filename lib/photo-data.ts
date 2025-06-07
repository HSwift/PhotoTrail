export interface PhotoData {
  id: string;
  title: string;
  caption: string;
  thumbnail: string;
  fullSize: string;
  aspectRatio: number;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  metadata: {
    camera: string;
    lens: string;
    focal: string;
    iso: number;
    aperture: string;
    shutterSpeed: string;
  };
  tags: string[];
  dateTaken: string;
}

export const photoData: PhotoData[] = [
  {
    id: "1",
    title: "Golden Gate Bridge",
    caption: "Iconic bridge shrouded in morning fog",
    thumbnail: "https://picsum.photos/1800/1200?t=1",
    fullSize: "https://picsum.photos/1800/1200?t=1",
    aspectRatio: 1.5,
    location: {
      lat: 37.8199,
      lng: -122.4783,
      name: "San Francisco, CA",
    },
    metadata: {
      camera: "Canon EOS R5",
      lens: "24-70mm f/2.8",
      focal: "24mm",
      iso: 100,
      aperture: "f/8",
      shutterSpeed: "1/125s",
    },
    tags: ["architecture", "bridge", "fog", "morning"],
    dateTaken: "2024-01-15T08:30:00Z",
  },
  {
    id: "2",
    title: "Central Park Autumn",
    caption: "Fall colors painting the park in warm hues",
    thumbnail: "https://picsum.photos/1800/1200?t=2",
    fullSize: "https://picsum.photos/1800/1200?t=2",
    aspectRatio: 1.5,
    location: {
      lat: 40.7829,
      lng: -73.9654,
      name: "New York, NY",
    },
    metadata: {
      camera: "Sony A7R IV",
      lens: "85mm f/1.4",
      focal: "85mm",
      iso: 200,
      aperture: "f/2.8",
      shutterSpeed: "1/250s",
    },
    tags: ["nature", "autumn", "park", "trees"],
    dateTaken: "2024-02-20T14:15:00Z",
  },
  {
    id: "3",
    title: "Santorini Sunset",
    caption: "Blue domes against the Aegean Sea",
    thumbnail: "https://picsum.photos/1200/1800?t=4",
    fullSize: "https://picsum.photos/1200/1800?t=4",
    aspectRatio: 0.667,
    location: {
      lat: 36.3932,
      lng: 25.4615,
      name: "Santorini, Greece",
    },
    metadata: {
      camera: "Nikon D850",
      lens: "14-24mm f/2.8",
      focal: "16mm",
      iso: 64,
      aperture: "f/11",
      shutterSpeed: "1/30s",
    },
    tags: ["sunset", "architecture", "sea", "travel"],
    dateTaken: "2024-04-05T19:30:00Z",
  },
  {
    id: "4",
    title: "Tokyo Neon Nights",
    caption: "Vibrant street life in Shibuya district",
    thumbnail: "https://picsum.photos/1200/1800?t=3",
    fullSize: "https://picsum.photos/1200/1800?t=3",
    aspectRatio: 0.667,
    location: {
      lat: 35.6762,
      lng: 139.6503,
      name: "Tokyo, Japan",
    },
    metadata: {
      camera: "Fujifilm X-T4",
      lens: "35mm f/1.4",
      focal: "35mm",
      iso: 800,
      aperture: "f/1.8",
      shutterSpeed: "1/60s",
    },
    tags: ["street", "night", "neon", "urban"],
    dateTaken: "2024-03-10T21:45:00Z",
  },

  {
    id: "5",
    title: "Banff Lake Louise",
    caption: "Pristine mountain lake reflecting snow-capped peaks",
    thumbnail: "https://picsum.photos/1800/1200?t=5",
    fullSize: "https://picsum.photos/1800/1200?t=5",
    aspectRatio: 1.5,
    location: {
      lat: 51.4254,
      lng: -116.1773,
      name: "Banff, Canada",
    },
    metadata: {
      camera: "Canon EOS R6",
      lens: "16-35mm f/2.8",
      focal: "20mm",
      iso: 100,
      aperture: "f/8",
      shutterSpeed: "1/125s",
    },
    tags: ["landscape", "mountains", "lake", "nature"],
    dateTaken: "2024-05-12T07:00:00Z",
  },
  {
    id: "6",
    title: "Patagonia Wilderness",
    caption: "Dramatic peaks of Torres del Paine",
    thumbnail: "https://picsum.photos/1200/1800?t=6",
    fullSize: "https://picsum.photos/1200/1800?t=6",
    aspectRatio: 0.667,
    location: {
      lat: -50.9423,
      lng: -73.4068,
      name: "Torres del Paine, Chile",
    },
    metadata: {
      camera: "Sony A7R V",
      lens: "70-200mm f/2.8",
      focal: "135mm",
      iso: 200,
      aperture: "f/8",
      shutterSpeed: "1/250s",
    },
    tags: ["mountains", "wilderness", "dramatic", "patagonia"],
    dateTaken: "2024-06-18T16:20:00Z",
  },
];
