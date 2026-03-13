from rest_framework import serializers
from rest_framework.exceptions import NotFound
from diagnosis.models import Diagnosis
from .models import Report
from .services import PDFService
import cloudinary.uploader
import io

class ReportSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    image_id = serializers.CharField(source='image.id', read_only=True)
    diagnosis_id = serializers.CharField(write_only=True)
    generated_by = serializers.IntegerField(read_only=True)
    pdf_path = serializers.CharField(read_only=True)
    generated_at = serializers.DateTimeField(read_only=True)

    def to_representation(self, instance):
        repr = super().to_representation(instance)
        repr['id'] = str(instance.id)
        if instance.image:
            repr['image_id'] = str(instance.image.id)
            repr['patient_name'] = instance.image.patient_name
        if instance.diagnosis:
            repr['diagnosis_id'] = str(instance.diagnosis.id)
        return repr

    def create(self, validated_data):
        diag_id = validated_data.get('diagnosis_id')
        request = self.context.get('request')
        user_id = request.user.id if request and hasattr(request, 'user') else None

        diagnosis = Diagnosis.objects(id=diag_id).first()
        if not diagnosis:
            raise NotFound("Diagnosis not found")

        # Check if report already exists
        existing_report = Report.objects(diagnosis=diagnosis).first()
        if existing_report:
            return existing_report

        # Create report object
        report = Report(
            image=diagnosis.image,
            diagnosis=diagnosis,
            generated_by=user_id
        )

        # Generate PDF
        pdf_bytes = PDFService.generate_report_pdf(report)

        # Upload to Cloudinary
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_file.name = f"report_{diagnosis.id}.pdf"
        upload_result = cloudinary.uploader.upload(
            pdf_file,
            resource_type="raw",
            folder="radiology_reports",
            public_id=f"report_{diagnosis.id}"
        )

        report.pdf_path = upload_result.get('secure_url')
        report.save()

        return report
