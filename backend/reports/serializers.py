import io
import logging
from rest_framework import serializers
from rest_framework.exceptions import NotFound, APIException
from diagnosis.models import Diagnosis
from .models import Report
from .services import PDFService
from django.contrib.auth import get_user_model



logger = logging.getLogger(__name__)

User = get_user_model()
class ReportSerializer(serializers.Serializer):
    id           = serializers.CharField(read_only=True)
    diagnosis_id = serializers.CharField(write_only=True)
    generated_by = serializers.IntegerField(read_only=True)
    generated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        diag_id = validated_data.get('diagnosis_id')
        request = self.context.get('request')
        user_id = request.user.id if request else None

        diagnosis = Diagnosis.objects(id=diag_id).first()
        if not diagnosis:
            raise NotFound("Diagnosis not found")

        # Only return existing report if it already has a valid PDF
        existing = Report.objects(diagnosis=diagnosis).first()
        if existing and existing.pdf_data:
            return existing

        # Reuse broken record or create a new one
        report = existing or Report(
            image=diagnosis.image,
            diagnosis=diagnosis,
            generated_by=user_id
        )

        # Save first so report.id is valid before PDF generation
        report.save()

        try:
            pdf_bytes = PDFService.generate_report_pdf(report)
            report.pdf_data = pdf_bytes
            report.save()
        except Exception as e:
            logger.error(f"PDF generation failed for report {report.id}: {e}", exc_info=True)
            raise APIException("Failed to generate PDF report")

        return report

    def to_representation(self, instance):
        doctor_name = f"Radiologist #{instance.generated_by}"
        if instance.generated_by:
            try:
                user = User.objects.get(id=instance.generated_by)
                if user.first_name or user.last_name:
                    doctor_name = f"Dr. {user.first_name} {user.last_name}".strip()
            except User.DoesNotExist:
                pass

        return {
            "id": str(instance.id),
            "doctor": doctor_name,
            "image": {
            "id": str(instance.image.id),
            "patient_name": instance.image.patient.full_name if instance.image and instance.image.patient else None,
            "patient": str(instance.image.patient.id) if instance.image and instance.image.patient else None,
            "modality": instance.image.modality,
        } if instance.image else None,
            "diagnosis": {
                "id": str(instance.diagnosis.id),
                "action": instance.diagnosis.action,
                "final_finding": instance.diagnosis.final_finding,
                "clinical_notes": instance.diagnosis.clinical_notes,
            } if instance.diagnosis else None,
            "generated_by": instance.generated_by,
            "generated_at": instance.generated_at.isoformat() if instance.generated_at else None,
        }
