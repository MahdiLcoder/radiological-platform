import os
import logging
from tensorflow import keras

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.dirname(__file__)
MODELS_DIR = os.path.join(MODELS_DIR, 'models')

_LOADED_MODELS = {}

MODEL_FILES = {
    "MRI": "brain_tumor_densenet121.keras",
    "X-Ray": "covid19_densenet121.keras",
    "CT": "lung_cancer_densenet121.keras"
}

def get_model(modality):
    
    if modality not in MODEL_FILES:
        raise ValueError(f"No model available for modality: {modality}")

    if modality not in _LOADED_MODELS:
        model_path = os.path.join(MODELS_DIR, MODEL_FILES[modality])
        logger.info(f"Loading {modality} model from {model_path}...")
        try:
            model = keras.models.load_model(model_path)
            _LOADED_MODELS[modality] = model
            logger.info(f"Successfully loaded {modality} model.")
        except Exception as e:
            logger.error(f"Error loading {modality} model: {e}")
            raise

    return _LOADED_MODELS[modality]
