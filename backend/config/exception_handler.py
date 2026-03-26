import logging
from typing import Any

from bson.errors import InvalidId
from mongoengine import ValidationError as MongoValidationError
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def _normalize_data(exc: APIException) -> dict[str, Any]:
    """
    Convert DRF exception detail into a predictable payload.
    """
    detail = exc.detail
    message = detail

    if isinstance(detail, (list, tuple)) and detail:
        message = detail[0]
    elif isinstance(detail, dict):
        # Prefer 'detail' key if present, otherwise keep dict
        message = detail.get("detail", detail)

    return {
        "code": getattr(exc, "default_code", "error"),
        "message": message,
        "detail": detail,
    }


def custom_exception_handler(exc, context):
    """
    Central DRF exception handler that:
    - Normalizes response format
    - Maps Mongo/bson validation errors to DRF ValidationError
    - Logs server errors once
    """
    if isinstance(exc, (InvalidId, MongoValidationError)):
        exc = ValidationError("Invalid identifier provided.")

    response = drf_exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled exception", exc_info=exc)
        return Response(
            {"code": "server_error", "message": "Internal server error", "detail": None},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Only log once for 5xx
    if 500 <= response.status_code < 600:
        logger.exception("Unhandled API exception", exc_info=exc)

    if isinstance(exc, APIException):
        response.data = _normalize_data(exc)

    return response
