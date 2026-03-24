from django.urls import path
from .views import RunAiPredictionView, AiPredictionsView, AllFindingsListView

urlpatterns = [
    path('all-findings/',      AllFindingsListView.as_view(), name='all-findings-list'),
    path('<str:image_id>/run/', RunAiPredictionView.as_view(), name='inference-run'),
    path('<str:image_id>/',     AiPredictionsView.as_view(), name='inference-result'),
]

