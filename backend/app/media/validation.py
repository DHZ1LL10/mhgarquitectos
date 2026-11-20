import warnings
from io import BytesIO

from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError

TYPES = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}


def validate_image(content: bytes, content_type: str, max_bytes: int) -> tuple[int, int, str]:
    if not content or len(content) > max_bytes:
        raise HTTPException(413, "La fotografía excede el tamaño permitido.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as image:
                if TYPES.get(image.format) != content_type or content_type not in TYPES.values():
                    raise HTTPException(415, "Usa fotografías JPEG, PNG o WebP.")
                if image.width * image.height > 40_000_000 or getattr(image, "n_frames", 1) != 1:
                    raise HTTPException(415, "Usa una imagen estática de hasta 40 megapíxeles.")
                image.verify()
                return image.width, image.height, image.format.lower()
    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ):
        raise HTTPException(415, "La fotografía no es válida.") from None
