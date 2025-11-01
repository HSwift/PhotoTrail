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
http://localhost:3000/p/project-name
```

The root path `/` redirects to `/p/default` by default.

## Environment Variables

- `STORAGE_BASE`: The base URL where your project JSON files are hosted (e.g., `https://cdn.example.com`)
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: (Optional) Your Mapbox access token for the map feature

## Create Photo Database With dbgen

`dbgen` is a tool for generating photo databases. It extracts EXIF metadata from photos (camera information, GPS location, etc.), generates WebP images and previews, and creates JSON database files.

### Prerequisites

- Python 3.10 or higher
- [uv](https://github.com/astral-sh/uv) (for dependency management)

### Installation

Navigate to the `dbgen` directory and install dependencies:

```bash
cd dbgen
uv sync
```

### Usage

Basic usage:

```bash
uv run python main.py <image_directory> <project_name>
```

Example:

```bash
# Process images in dbgen/data/t directory and generate a project named "2025-travel"
uv run python main.py data/2025-travel 2025-travel
```

Optional arguments:

- `-f, --filter`: Specify file extension filter pattern (default: `.+\.(png|jpe?g|tiff?|webp|heic|heif)`)

```bash
# Process only JPG and JPEG files
uv run python main.py -f ".*\.(jpg|jpeg)$" data/2025-travel 2025-travel
```

### Output Files

After running, the following files will be generated in the current directory:

- `<project_name>.json`: JSON database file containing all photo metadata
- `<project_name>/`: Directory containing processed image files
  - `<photo_id>.webp`: Converted original image (WebP format)
  - `<photo_id>_preview.webp`: Preview image (~100KB)

### Features

`dbgen` extracts the following information from photos:

- **Metadata**: Camera model, lens model, focal length, aperture, ISO, shutter speed
- **Location**: GPS coordinates (latitude/longitude) and reverse geocoded location name
- **Date Taken**: Original capture time from EXIF data
- **Image Properties**: Aspect ratio and other attributes

Processing workflow:

1. Scan all image files in the specified directory
2. Read EXIF data from each image
3. Generate WebP format original images and previews
4. Generate base64-encoded thumbnails (embedded in JSON)
5. Merge with existing database (if it exists)
6. Save JSON database file

### Editing the Database

After processing, you can manually edit the generated `<project_name>.json` file to add:
- Photo titles (`title`)
- Photo captions (`caption`)
- Tags (`tags`)

The database file is in JSON format, with all photos sorted by capture time.

## Deployment

This project can be easily deployed to [Vercel](https://vercel.com), the platform created by the Next.js team.

### Deploy with Vercel CLI

1. Install the Vercel CLI globally:

```bash
npm i -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

3. Deploy to production:

```bash
vercel --prod
```

Follow the prompts to link your project to an existing Vercel project or create a new one.

### Deploy with GitHub Integration

1. Push your code to a GitHub repository

2. Import your repository on [Vercel](https://vercel.com/new):
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js and configure the build settings

3. Configure environment variables:
   - Go to your project settings on Vercel
   - Navigate to the "Environment Variables" section
   - Add the following variables:
     - `STORAGE_BASE`: The base URL where your project JSON files are hosted
     - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: (Optional) Your Mapbox access token

4. Deploy:
   - Vercel will automatically deploy on every push to your main branch
   - You can also trigger manual deployments from the Vercel dashboard

### Environment Variables for Production

Make sure to set these environment variables in your Vercel project settings:

- `STORAGE_BASE`: Required - The base URL where your project JSON files are hosted (e.g., `https://cdn.example.com`)
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: Optional - Your Mapbox access token for map functionality

### Build Settings

Vercel will automatically detect Next.js and use the following build settings:
- **Build Command**: `pnpm build` (or `npm run build`)
- **Output Directory**: `.next`
- **Install Command**: `pnpm install` (or `npm install`)

If you're using `pnpm`, make sure to create a `.npmrc` file in your project root (if not already present) to ensure Vercel uses `pnpm`:

```
package-manager=pnpm
```

### Custom Domain

After deployment, you can add a custom domain in your Vercel project settings under the "Domains" section.

