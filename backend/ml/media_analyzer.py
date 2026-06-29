"""Heuristic synthetic-media detector for uploaded images.

Real deepfake detection (temporal/frame-consistency CNNs) needs a trained
model far beyond hackathon scope, so this analyzer combines two signals that
are actually computable offline and are documented artifacts of generative
pipelines:
  1. EXIF metadata — generative tools often leave a Software tag, or strip
     camera Make/Model entirely.
  2. Frequency-domain analysis (2D FFT) — diffusion/GAN output tends to
     concentrate spectral energy in low frequencies (smoothed-over sensor
     noise) and/or show periodic spikes from upsampling layers.
Video uploads get metadata-only treatment (frame extraction is out of scope).
"""
import hashlib
import io

import numpy as np
from PIL import Image, ExifTags

AI_TOOL_SIGNATURES = [
    "stable diffusion", "midjourney", "dall-e", "dalle", "nightcafe",
    "leonardo.ai", "runwayml", "diffusion", "firefly",
]

LOW_FREQ_ENERGY_RATIO_THRESHOLD = 0.92
PERIODIC_PEAK_Z_SCORE_THRESHOLD = 6.0
SYNTHETIC_SCORE_THRESHOLD = 5
INCONCLUSIVE_SCORE_THRESHOLD = 2


def _read_exif(image: Image.Image) -> dict:
    exif_data = {}
    try:
        raw = image.getexif()
        for tag_id, value in raw.items():
            tag = ExifTags.TAGS.get(tag_id, tag_id)
            exif_data[tag] = value
    except Exception:
        pass
    return exif_data


def _frequency_analysis(image: Image.Image) -> dict:
    gray = np.asarray(image.convert("L"), dtype=np.float64)
    spectrum = np.fft.fftshift(np.fft.fft2(gray))
    magnitude = np.abs(spectrum)

    h, w = magnitude.shape
    cy, cx = h // 2, w // 2
    radius = max(min(h, w) // 8, 1)
    y_idx, x_idx = np.ogrid[:h, :w]
    dist = np.sqrt((y_idx - cy) ** 2 + (x_idx - cx) ** 2)
    low_freq_mask = dist <= radius
    total_energy = magnitude.sum() + 1e-9
    low_freq_energy_ratio = magnitude[low_freq_mask].sum() / total_energy

    outer_values = magnitude[dist > radius]
    mean_outer = outer_values.mean()
    std_outer = outer_values.std() + 1e-9
    peak_z_score = (outer_values.max() - mean_outer) / std_outer

    return {
        "low_freq_energy_ratio": round(float(low_freq_energy_ratio), 4),
        "periodic_peak_z_score": round(float(peak_z_score), 2),
    }


def analyze_image(file_bytes: bytes) -> dict:
    image = Image.open(io.BytesIO(file_bytes))
    image.load()
    width, height = image.size

    exif = _read_exif(image)
    software_tag = str(exif.get("Software", "")).lower()
    has_camera_metadata = bool(exif.get("Make") or exif.get("Model"))
    ai_signature_found = any(sig in software_tag for sig in AI_TOOL_SIGNATURES)

    freq = _frequency_analysis(image)

    score = 0
    reasons = []
    if ai_signature_found:
        score += 4
        reasons.append(f"EXIF software tag references a known generative tool ('{software_tag}')")
    if not exif:
        score += 1
        reasons.append("No EXIF metadata present (common after AI generation or metadata stripping)")
    if freq["low_freq_energy_ratio"] > LOW_FREQ_ENERGY_RATIO_THRESHOLD:
        score += 2
        reasons.append("Spectral energy unnaturally concentrated in low frequencies (lacks natural sensor noise)")
    if freq["periodic_peak_z_score"] > PERIODIC_PEAK_Z_SCORE_THRESHOLD:
        score += 2
        reasons.append("Periodic high-frequency spikes detected (consistent with GAN/upsampling artifacts)")

    if score >= SYNTHETIC_SCORE_THRESHOLD:
        verdict = "SYNTHETIC_SUSPECTED"
    elif score >= INCONCLUSIVE_SCORE_THRESHOLD:
        verdict = "INCONCLUSIVE"
    else:
        verdict = "LIKELY_AUTHENTIC"

    return {
        "verdict": verdict,
        "synthetic_score": score,
        "reasons": reasons,
        "metadata": {
            "width": width,
            "height": height,
            "has_exif": bool(exif),
            "has_camera_metadata": has_camera_metadata,
            "software_tag": software_tag or None,
        },
        "frequency_analysis": freq,
    }


def analyze_media(filename: str, content_type: str, file_bytes: bytes) -> dict:
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    base_metadata = {
        "filename": filename,
        "content_type": content_type,
        "size_bytes": len(file_bytes),
        "sha256": file_hash,
    }

    if content_type and content_type.startswith("image/"):
        try:
            result = analyze_image(file_bytes)
        except Exception as exc:
            return {
                "verdict": "INCONCLUSIVE",
                "synthetic_score": 0,
                "reasons": [f"Could not decode image: {exc}"],
                "metadata": base_metadata,
            }
        result["metadata"] = {**base_metadata, **result["metadata"]}
        return result

    return {
        "verdict": "INCONCLUSIVE",
        "synthetic_score": 0,
        "reasons": [
            "Frame-level synthetic media analysis is currently supported for images only; "
            "this file was logged with metadata for the registry but not deeply analyzed."
        ],
        "metadata": base_metadata,
    }
