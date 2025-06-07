import argparse
import datetime
import hashlib
import json
import logging
import math
import os
import re
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

    return f'{int(round(raw_value))}mm'


def get_aperture(raw_value: typing.Optional[float]) -> typing.Optional[str]:
    if raw_value is None:
        return None

    aperture_value = round(raw_value, 2)
    # ends with x.00
    if math.floor(aperture_value) == aperture_value:
        return f'ƒ/{int(aperture_value)}'
    else:
        return f'ƒ/{aperture_value}'


def get_coordinate(raw_value: typing.Optional[typing.Tuple[float, float, float]]) -> typing.Optional[float]:
    if raw_value is None:
        return None

    degrees, minutes, seconds = raw_value
    return degrees + minutes / 60 + seconds / 3600


def get_location_name(coordinate: typing.Tuple[float, float]) -> typing.Optional[str]:
    loc = reverse_geocoder.RGeocoder(mode=2, verbose=False).query([coordinate])[0]
    result = loc['cc']
    last = ""
    for part in (loc['admin1'], loc['admin2'], loc['name']):
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
    title: typing.Optional[str]
    caption: typing.Optional[str]
    thumbnail: typing.Optional[str]
    fullSize: typing.Optional[str]
    aspectRatio: typing.Optional[float]
    location: PhotoDescriptorLocation
    metadata: PhotoDescriptorMetadata
    tags: typing.List[str]
    dateTaken: typing.Optional[str]


def get_photo_descriptor(path: str) -> PhotoDescriptor:
    with open(path, "rb") as f:
        photo_id = hashlib.sha1(f.read()).hexdigest()

    descriptor = PhotoDescriptor(id=photo_id, title=None, caption=None, thumbnail=None, fullSize=None, aspectRatio=None,
                                 location=PhotoDescriptorLocation(lat=None, lng=None, name=None),
                                 metadata=PhotoDescriptorMetadata(camera=None, lens=None, focal=None, iso=None,
                                                                  aperture=None, shutterSpeed=None), tags=[],
                                 dateTaken=None)
    return descriptor


def open_database(db_file: str) -> typing.List[PhotoDescriptor]:
    if not os.path.exists(db_file):
        return []

    with open(db_file, "rb") as f:
        content = f.read()
    descriptors = json.loads(content)
    return list(map(lambda x: PhotoDescriptor.model_validate(x), descriptors))


def save_database(db_file: str, db_photos: typing.List[PhotoDescriptor]):
    with open(db_file, "w") as f:
        f.write(json.dumps(list(map(lambda x: x.model_dump(), db_photos)), indent=4, ensure_ascii=False))


def merge_photo(db_photo: PhotoDescriptor, new_photo: PhotoDescriptor) -> PhotoDescriptor:
    # 如果 value = None, 从 new_model 中合并值
    def merge_model(model, new_model):
        if model is None:
            return
        for key in model.model_fields_set:
            if getattr(model, key) is None:
                setattr(model, key, getattr(new_model, key))

    merge_model(db_photo, new_photo)
    merge_model(db_photo.metadata, new_photo.metadata)
    merge_model(db_photo.location, new_photo.location)
    return db_photo


def merge_database(db_photos: typing.List[PhotoDescriptor],
                   new_photos: typing.Dict[str, PhotoDescriptor]) -> \
        typing.List[PhotoDescriptor]:
    db_photos_dict = {}
    for photo in db_photos:
        db_photos_dict[photo.id] = photo

    for key, value in new_photos.items():
        if key in db_photos_dict:
            merge_photo(db_photos_dict[key], value)
        else:
            db_photos_dict[key] = value

    db_photos = list(db_photos_dict.values())
    db_photos.sort(key=lambda x: datetime.datetime.strptime(x.dateTaken,
                                                            "%Y/%m/%d %H:%M:%S").timestamp() if x.dateTaken is not None else 0,
                   reverse=True)
    return db_photos


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-f", "--filter", help="file extension filter", type=str,
                        default=r".+\.(png|jpe?g|tiff?|webp|heic|heif)")
    parser.add_argument("image_dir", help="image dir path", type=str)
    parser.add_argument("db_file", help="database file path", type=str)
    args = parser.parse_args()

    ext_filter = re.compile(args.filter, flags=re.IGNORECASE)
    image_dir = args.image_dir
    db_file = args.db_file

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
                LOGGER.warning(f"while reading {path} exif information, exception found: {e}")
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
            photo_descriptor.metadata.shutterSpeed = get_shutter_speed(exif_info.get("exposure_time"))

            latitude = get_coordinate(exif_info.get("gps_latitude"))
            longitude = get_coordinate(exif_info.get("gps_longitude"))
            if latitude is not None and longitude is not None:
                location = get_location_name((latitude, longitude))
            else:
                location = None
            photo_descriptor.location.lat = latitude
            photo_descriptor.location.lng = longitude
            photo_descriptor.location.name = location
            photo_descriptor.dateTaken = get_datetime(exif_info.get("datetime_original"))

    save_database(db_file, merge_database(db_photos, photos))


if __name__ == "__main__":
    main()
