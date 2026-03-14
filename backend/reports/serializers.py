from rest_framework import serializers
from rest_framework.exceptions import NotFound, APIException
from diagnosis.models import Diagnosis
from .models import Report
from .services import PDFService
import cloudinary.uploader
import io


class ReportSerializer(serializers.Serializer):
    id           = serializers.CharField(read_only=True)
    diagnosis_id = serializers.CharField(write_only=True)
    generated_by = serializers.IntegerField(read_only=True)
    pdf_path     = serializers.CharField(read_only=True)
    generated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        diag_id = validated_data.get('diagnosis_id')

        request = self.context.get('request')
        user_id = request.user.id if request else None

        diagnosis = Diagnosis.objects(id=diag_id).first()
        if not diagnosis:
            raise NotFound("Diagnosis not found")

        existing = Report.objects(diagnosis=diagnosis).first()
        if existing:
            return existing

        report = Report(
            image=diagnosis.image,
            diagnosis=diagnosis,
            generated_by=user_id
        )

        pdf_bytes = PDFService.generate_report_pdf(report)

        pdf_file = io.BytesIO(pdf_bytes)
        pdf_file.name = f"report_{diagnosis.id}.pdf"

        try:
            upload_result = cloudinary.uploader.upload(
                pdf_file,
                resource_type="raw",
                folder="radiology_reports",
                public_id=f"report_{diagnosis.id}"
            )
            report.pdf_path = upload_result.get('secure_url')
        except Exception:
            raise APIException("Failed to upload PDF report")

        report.save()
        return report

    def to_representation(self, instance):
        return {
            "id": str(instance.id),
            "image": {
                "id": str(instance.image.id),
                "patient_name": instance.image.patient.full_name if instance.image and instance.image.patient else None,
                "patient_id": instance.image.patient.patient_id if instance.image and instance.image.patient else None,
                "modality": instance.image.modality,
            } if instance.image else None,
            "diagnosis": {
                "id": str(instance.diagnosis.id),
                "action": instance.diagnosis.action,
                "final_finding": instance.diagnosis.final_finding,
                "clinical_notes": instance.diagnosis.clinical_notes,
            } if instance.diagnosis else None,
            "generated_by": instance.generated_by,
            "pdf_path": instance.pdf_path,
            "generated_at": instance.generated_at.isoformat() if instance.generated_at else None,
        }
