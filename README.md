# Photo Trail

A photo gallery application that displays photos with location information on an interactive map.

## Features

- 🖼️ Responsive photo gallery with masonry layout
- 🗺️ Interactive map showing photo locations
- 📷 Detailed photo metadata (camera settings, location, date)
- 🔍 Full-size photo viewer
- 📱 Mobile-friendly design

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env.local` file with your configuration:
```bash
# Storage base URL for loading project JSON files
STORAGE_BASE=https://your-storage-base-url.com

# Optional: Mapbox access token for map functionality
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

3. Run the development server:
```bash
pnpm dev
```

## Usage

The app loads project data from a remote storage location. Access a project using the path:

```
http://localhost:3000/2025-eu
```

The root path `/` redirects to `/2025-eu` by default.

## Environment Variables

- `STORAGE_BASE`: The base URL where your project JSON files are hosted (e.g., `https://cdn.example.com`)
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: (Optional) Your Mapbox access token for the map feature

## Project Data Format

Each project requires a JSON file named `{project}.json` in the following format:

```json
{
  "name": "project-name",
  "title": "Project Title",
  "description": "Project description",
  "photos": [
    [
      {
        "id": "unique-photo-id",
        "title": "Photo title",
        "caption": "Photo caption",
        "thumbnail": "base64-encoded-thumbnail or URL",
        "fullSize": "url-to-full-size-image",
        "aspectRatio": 1.5,
        "location": {
          "lat": 41.902193,
          "lng": 12.454711,
          "name": "Location name"
        },
        "metadata": {
          "camera": "Camera model",
          "lens": "Lens model",
          "focal": "50mm",
          "iso": 100,
          "aperture": "ƒ/2.8",
          "shutterSpeed": "1/125s"
        },
        "tags": ["tag1", "tag2"],
        "dateTaken": "2025/09/30 07:39:03"
      }
    ]
  ]
}
```

Note: The `photos` field is a 2D array where each inner array represents a group of photos.

