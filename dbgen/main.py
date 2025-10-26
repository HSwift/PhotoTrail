import argparse
import base64
import datetime
import hashlib
import io
import json
import logging
import math
import os
from pathlib import Path
import re
import shutil
from tkinter import N
import typing

from PIL import Image
import exif
import pydantic
import reverse_geocoder

# disable exif logger
logger = logging.getLogger("exif._image")
logger.disabled = True

LOGGER = logging.getLogger(__name__)


def get_shutter_speed(raw_value: typing.Optional[float]) -> typing.Optional[str]:
    if raw_value is None:
        return None

    if raw_value >= 1:
        return f"{int(raw_value)}s"
    else:
        return f"1/{int(1 / raw_value)}s"


def get_focal(raw_value: typing.Optional[float]) -> typing.Optional[str]:
    if raw_value is None:
        return None

    return f"{int(round(raw_value))}mm"


def get_aperture(raw_value: typing.Optional[float]) -> typing.Optional[str]:
    if raw_value is None:
        return None

    aperture_value = round(raw_value, 2)
    # ends with x.00
    if math.floor(aperture_value) == aperture_value:
        return f"ƒ/{int(aperture_value)}"
    else:
        return f"ƒ/{aperture_value}"


def get_coordinate(
    raw_value: typing.Optional[typing.Tuple[float, float, float]],
) -> typing.Optional[float]:
    if raw_value is None:
        return None

    degrees, minutes, seconds = raw_value
    return degrees + minutes / 60 + seconds / 3600


def get_location_name(coordinate: typing.Tuple[float, float]) -> typing.Optional[str]:
    loc = reverse_geocoder.RGeocoder(mode=2, verbose=False).query([coordinate])[0]
    result = loc["cc"]
    last = ""
    for part in (loc["admin1"], loc["admin2"], loc["name"]):
        if len(part) > 0 and last != part:
            result += f", {part}"
            last = part
    return result


def get_datetime(raw_value: typing.Optional[str]) -> typing.Optional[str]:
    if raw_value is None:
        return None

    # 直接返回时间, 不加时区, 直接表示当地照片拍下的时间
    datetime_obj = datetime.datetime.strptime(raw_value, "%Y:%m:%d %H:%M:%S")
    return datetime_obj.strftime("%Y/%m/%d %H:%M:%S")


def get_aspect_ratio(image_path: str) -> typing.Optional[float]:
    try:
        image = Image.open(image_path)
        return round(image.width / image.height, 2)
    except Exception:
        return None


class PhotoDescriptorLocation(pydantic.BaseModel):
    lat: typing.Optional[float]
    lng: typing.Optional[float]
    name: typing.Optional[str]


class PhotoDescriptorMetadata(pydantic.BaseModel):
    camera: typing.Optional[str]
    lens: typing.Optional[str]
    focal: typing.Optional[str]
    iso: typing.Optional[int]
    aperture: typing.Optional[str]
    shutterSpeed: typing.Optional[str]


class PhotoDescriptor(pydantic.BaseModel):
    id: str
    source: str | None = None
    title: typing.Optional[str]
    caption: typing.Optional[str]
    thumbnail: typing.Optional[str]
    preview: typing.Optional[str]
    fullSize: typing.Optional[str]
    aspectRatio: typing.Optional[float]
    location: PhotoDescriptorLocation
    metadata: PhotoDescriptorMetadata
    tags: typing.List[str]
    dateTaken: typing.Optional[str]

    # 序列化时不输出source
    class Config:
        exclude = {"source"}


def get_photo_descriptor(path: str) -> PhotoDescriptor:
    with open(path, "rb") as f:
        photo_id = hashlib.sha1(f.read()).hexdigest()

    descriptor = PhotoDescriptor(
        id=photo_id,
        source=path,
        title=None,
        caption=None,
        thumbnail=None,
        preview=None,
        fullSize=None,
        aspectRatio=None,
        location=PhotoDescriptorLocation(lat=None, lng=None, name=None),
        metadata=PhotoDescriptorMetadata(
            camera=None,
            lens=None,
            focal=None,
            iso=None,
            aperture=None,
            shutterSpeed=None,
        ),
        tags=[],
        dateTaken=None,
    )
    return descriptor


def open_database(db_file: str) -> typing.List[PhotoDescriptor]:
    if not os.path.exists(db_file):
        return []

    with open(db_file, "rb") as f:
        content = f.read()
    descriptors = json.loads(content)
    return list(map(lambda x: PhotoDescriptor.model_validate(x), descriptors))


def save_database(db_file: str, db_photos: typing.List[PhotoDescriptor]):
    def compare(photo: PhotoDescriptor):
        return (
            datetime.datetime.strptime(photo.dateTaken, "%Y/%m/%d %H:%M:%S").timestamp()
            if photo.dateTaken is not None
            else 0
        )

    db_photos.sort(key=compare, reverse=False)

    with open(db_file, "w") as f:
        f.write(
            json.dumps(
                list(map(lambda x: x.model_dump(), db_photos)),
                indent=4,
                ensure_ascii=False,
            )
        )


def merge_photo(
    db_photo: PhotoDescriptor, new_photo: PhotoDescriptor
) -> PhotoDescriptor:
    # 如果 value = None, 从 new_model 中合并值
    def merge_model(model, new_model):
        if model is None:
            return
        for key in model.model_fields_set:
            exclude_keys = model.model_config.get('exclude', [])
            if key in exclude_keys:
                continue
            if getattr(model, key) is None:
                setattr(model, key, getattr(new_model, key))

    merge_model(db_photo, new_photo)
    merge_model(db_photo.metadata, new_photo.metadata)
    merge_model(db_photo.location, new_photo.location)
    return db_photo


def merge_database(
    db_photos: typing.List[PhotoDescriptor],
    new_photos: typing.Dict[str, PhotoDescriptor],
) -> typing.List[PhotoDescriptor]:
    db_photos_dict = {}
    for photo in db_photos:
        db_photos_dict[photo.id] = photo

    for key, value in new_photos.items():
        if key in db_photos_dict:
            merge_photo(db_photos_dict[key], value)
        else:
            db_photos_dict[key] = value

    db_photos = list(db_photos_dict.values())
    db_photos.sort(
        key=lambda x: (
            datetime.datetime.strptime(x.dateTaken, "%Y/%m/%d %H:%M:%S").timestamp()
            if x.dateTaken is not None
            else 0
        ),
        reverse=True,
    )
    return db_photos


def copy_photos_to_output(
    photos: typing.Dict[str, PhotoDescriptor], output_dir: Path
) -> None:
    LOGGER.info(f"开始生成原图")
    for photo_id, photo in photos.items():
        if not hasattr(photo, "source") or photo.source is None:
            LOGGER.warning(f"Photo {photo_id} has no source path, skipping copy")
            continue

        source_path = Path(photo.source)
        if not source_path.exists():
            LOGGER.warning(f"Source file {source_path} does not exist, skipping copy")
            continue

        output_filename = f"{photo_id}.webp"
        output_path = output_dir / output_filename

        try:
            with Image.open(source_path) as img:
                # Convert to RGB if necessary (for RGBA, CMYK, etc.)
                if img.mode in ("RGBA", "LA", "P"):
                    img = img.convert("RGB")
                elif img.mode == "CMYK":
                    img = img.convert("RGB")

                # Save as WebP with high quality to maintain similar quality to original
                # Use quality=90 to maintain high quality while still compressing
                img.save(
                    output_path, 
                    format="WEBP", 
                    quality=90, 
                    optimize=True,
                    method=6  # Use best compression method
                )
                size_kb = len(output_path.read_bytes()) / 1024
                LOGGER.info(f"Converted {source_path} to WebP {output_path} ({size_kb:.1f}kb)")
        except Exception as e:
            LOGGER.error(f"Failed to convert {source_path} to {output_path}: {e}")


def generate_preview_image(
    photos: typing.Dict[str, PhotoDescriptor], output_dir: Path
) -> None:
    LOGGER.info(f"开始生成预览图")
    for photo_id, photo in photos.items():
        if not hasattr(photo, "source") or photo.source is None:
            LOGGER.warning(
                f"Photo {photo_id} has no source path, skipping preview generation"
            )
            continue

        source_path = Path(photo.source)
        if not source_path.exists():
            LOGGER.warning(
                f"Source file {source_path} does not exist, skipping preview generation"
            )
            continue

        preview_filename = f"{photo_id}_preview.webp"
        preview_path = output_dir / preview_filename

        try:
            with Image.open(source_path) as img:
                # Convert to RGB if necessary (for RGBA, CMYK, etc.)
                if img.mode in ("RGBA", "LA", "P"):
                    img = img.convert("RGB")
                elif img.mode == "CMYK":
                    img = img.convert("RGB")

                # Calculate dimensions to achieve ~100kb target
                # Start with a reasonable size and adjust quality
                max_dimension = 1200
                if img.width > img.height:
                    new_width = min(max_dimension, img.width)
                    new_height = int((new_width * img.height) / img.width)
                else:
                    new_height = min(max_dimension, img.height)
                    new_width = int((new_height * img.width) / img.height)

                # Resize image
                img_resized = img.resize(
                    (new_width, new_height), Image.Resampling.LANCZOS
                )

                # Save with quality adjustment to target ~100kb
                quality = 85
                while quality > 40:
                    buffer = io.BytesIO()
                    img_resized.save(
                        buffer, format="WEBP", quality=quality, optimize=True
                    )
                    size_kb = len(buffer.getvalue()) / 1024

                    if size_kb <= 120:
                        break
                    quality -= 10

                # Save final image
                img_resized.save(
                    preview_path, format="WEBP", quality=quality, optimize=True
                )
                LOGGER.info(f"Generated preview {preview_path} ({size_kb:.1f}kb)")

        except Exception as e:
            LOGGER.error(f"Failed to generate preview for {source_path}: {e}")


def generate_thumbnail_base64(photos: typing.Dict[str, PhotoDescriptor]) -> None:
    LOGGER.info(f"开始生成缩略图")
    for photo_id, photo in photos.items():
        if not hasattr(photo, "source") or photo.source is None:
            LOGGER.warning(
                f"Photo {photo_id} has no source path, skipping thumbnail generation"
            )
            continue

        source_path = Path(photo.source)
        if not source_path.exists():
            LOGGER.warning(
                f"Source file {source_path} does not exist, skipping thumbnail generation"
            )
            continue

        try:
            with Image.open(source_path) as img:
                # Convert to RGB if necessary
                if img.mode in ("RGBA", "LA", "P"):
                    img = img.convert("RGB")
                elif img.mode == "CMYK":
                    img = img.convert("RGB")

                # Create a very small thumbnail (e.g., 8x8 or 16x16 pixels)
                thumbnail_size = (8, 8)
                img_thumbnail = img.resize(thumbnail_size, Image.Resampling.LANCZOS)

                # Convert to base64
                buffer = io.BytesIO()
                img_thumbnail.save(buffer, format="JPEG", quality=50, optimize=True)
                thumbnail_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

                # Update the photo descriptor
                photo.thumbnail = f"data:image/jpeg;base64,{thumbnail_base64}"
                LOGGER.info(f"Generated base64 thumbnail for {photo_id}")

        except Exception as e:
            LOGGER.error(f"Failed to generate thumbnail for {source_path}: {e}")


def create_image_output(
    output_dir: Path, photos: typing.Dict[str, PhotoDescriptor]
):
    output_dir.mkdir(parents=True, exist_ok=True)

    copy_photos_to_output(photos, output_dir)
    generate_preview_image(photos, output_dir)
    generate_thumbnail_base64(photos)

    for photo_id, photo in photos.items():
        if hasattr(photo, "source") and photo.source is not None:
            output_filename = f"{photo_id}.webp"
            photo.fullSize = str(output_dir / output_filename)

        # Set preview path
        preview_filename = f"{photo_id}_preview.webp"
        photo.preview = str(output_dir / preview_filename)


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-f",
        "--filter",
        help="file extension filter",
        type=str,
        default=r".+\.(png|jpe?g|tiff?|webp|heic|heif)",
    )
    parser.add_argument("image_dir", help="image dir path", type=str)
    parser.add_argument("project_name", help="project name", type=str)
    args = parser.parse_args()

    ext_filter = re.compile(args.filter, flags=re.IGNORECASE)
    image_dir = args.image_dir
    project_name = args.project_name
    output_dir = Path(project_name)
    db_file = project_name + ".json"

    db_photos = open_database(db_file)
    photos: typing.Dict[str, PhotoDescriptor] = {}

    for root, _, files in os.walk(image_dir):
        for file in files:
            if not ext_filter.fullmatch(file):
                continue

            path = os.path.join(root, file)
            photo_descriptor = get_photo_descriptor(path)
            photos[photo_descriptor.id] = photo_descriptor
            try:
                exif_info = exif.Image(path)
                if not exif_info.has_exif:
                    LOGGER.warning(f"{path} doesn't contains any exif information")
                    continue
            except Exception as e:
                LOGGER.warning(
                    f"while reading {path} exif information, exception found: {e}"
                )
                continue

            photo_descriptor.aspectRatio = get_aspect_ratio(path)

            photo_descriptor.metadata.camera = exif_info.get("model")
            photo_descriptor.metadata.lens = exif_info.get("lens_model")

            photo_descriptor.metadata.focal = get_focal(exif_info.get("focal_length"))
            photo_descriptor.metadata.aperture = get_aperture(exif_info.get("f_number"))
            iso = exif_info.get("photographic_sensitivity")
            iso_alt = exif_info.get("recommended_exposure_index")
            if iso == 65535 and iso_alt is not None:
                iso = iso_alt
            photo_descriptor.metadata.iso = iso
            photo_descriptor.metadata.shutterSpeed = get_shutter_speed(
                exif_info.get("exposure_time")
            )

            latitude = get_coordinate(exif_info.get("gps_latitude"))
            longitude = get_coordinate(exif_info.get("gps_longitude"))
            if latitude is not None and longitude is not None:
                location = get_location_name((latitude, longitude))
            else:
                location = None
            photo_descriptor.location.lat = latitude
            photo_descriptor.location.lng = longitude
            photo_descriptor.location.name = location
            photo_descriptor.dateTaken = get_datetime(
                exif_info.get("datetime_original")
            )
    LOGGER.info(f"图片元数据读取完毕, 开始生成图片输出")
    create_image_output(output_dir, photos)
    merged_photos = merge_database(db_photos, photos)
    save_database(db_file, merged_photos)
    LOGGER.info(f"项目构建完成，请编辑 {db_file} 文件，添加图片描述信息")


if __name__ == "__main__":
    main()
