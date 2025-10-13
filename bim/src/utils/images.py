import cv2
import numpy as np


def load_image(file_path: str) -> np.ndarray:
    """Load image file"""
    return cv2.imread(file_path)


def extract_features(image: np.ndarray) -> np.ndarray:
    """Extract features from image"""
    # Placeholder for feature extraction
    return np.random.rand(512)
