from django.urls import path
from .views import RunInferenceView, AiPredictionsView

urlpatterns = [
    path('<str:image_id>/run/', RunInferenceView.as_view(), name='inference-run'),
    path('<str:image_id>/',     AiPredictionsView.as_view(), name='inference-result'),
]
