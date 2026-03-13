import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as ReportLabImage
from reportlab.lib.units import inch
from PIL import Image
import requests

class PDFService:
    @staticmethod
    def generate_report_pdf(report):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        elements = []
        styles = getSampleStyleSheet()
        
        # Add custom styles
        styles.add(ParagraphStyle(name='CenterTitle', parent=styles['Heading1'], alignment=1))
        styles.add(ParagraphStyle(name='SectionHeader', parent=styles['Heading2'], spaceBefore=15, spaceAfter=5))
        
        # 1. Header
        elements.append(Paragraph("Radiology Analysis Report", styles['CenterTitle']))
        elements.append(Spacer(1, 0.25 * inch))
        elements.append(Paragraph(f"Date: {report.generated_at.strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        elements.append(Spacer(1, 0.25 * inch))
        
        # 2. Patient Information
        elements.append(Paragraph("Patient Information", styles['SectionHeader']))
        patient_data = [
            ["Patient Name:", report.image.patient_name, "Patient ID:", report.image.patient_id],
            ["Modality:", report.image.modality, "Uploaded At:", report.image.uploaded_at.strftime('%Y-%m-%d')]
        ]
        t_patient = Table(patient_data, colWidths=[1.2*inch, 2*inch, 1.2*inch, 2*inch])
        t_patient.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_patient)
        elements.append(Spacer(1, 0.25 * inch))
        
        # 3. AI Analysis
        elements.append(Paragraph("AI Analysis Results", styles['SectionHeader']))
        ai_data = [["Analysis Status", "Not Available"]]
        
        if report.diagnosis.ai_prediction:
            ai = report.diagnosis.ai_prediction
            ai_data = [
                ["Top Finding:", ai.top_finding],
                ["Confidence:", f"{ai.confidence * 100:.1f}%"]
            ]
            for cls_name, prob in ai.predictions.items():
                ai_data.append([f"Class: {cls_name}", f"{prob * 100:.1f}%"])
                
        t_ai = Table(ai_data, colWidths=[2*inch, 4.4*inch])
        t_ai.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_ai)
        elements.append(Spacer(1, 0.25 * inch))
        
        # 4. Radiologist Validation
        elements.append(Paragraph("Radiologist Validation", styles['SectionHeader']))
        val_data = [
            ["Final Finding:", report.diagnosis.final_finding],
            ["Action Taken:", report.diagnosis.action.capitalize() if report.diagnosis.action else "N/A"],
            ["Clinical Notes:", report.diagnosis.clinical_notes or "None provided"]
        ]
        t_val = Table(val_data, colWidths=[2*inch, 4.4*inch])
        t_val.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        elements.append(t_val)
        elements.append(Spacer(1, 0.25 * inch))
        
        # 5. Embedded X-ray image (thumbnail)
        elements.append(Paragraph("Medical Image", styles['SectionHeader']))
        try:
            # Download image from cloudinary URL
            img_response = requests.get(report.image.file_path)
            if img_response.status_code == 200:
                img_data = io.BytesIO(img_response.content)
                img = ReportLabImage(img_data)
                
                # Resize image while keeping aspect ratio
                max_width = 4 * inch
                max_height = 3 * inch
                
                aspect = img.imageWidth / float(img.imageHeight)
                if aspect > (max_width/max_height):
                    img.drawWidth = max_width
                    img.drawHeight = max_width / aspect
                else:
                    img.drawHeight = max_height
                    img.drawWidth = max_height * aspect
                    
                elements.append(img)
            else:
                elements.append(Paragraph(f"Image could not be loaded. Source: {report.image.file_path}", styles['Normal']))
        except Exception as e:
            elements.append(Paragraph("Image could not be loaded.", styles['Normal']))
            
        elements.append(Spacer(1, 0.5 * inch))
        
        # 6. Signature & Timestamp
        elements.append(Spacer(1, 0.5 * inch))
        sig_data = [
            ["Radiologist ID:", str(report.diagnosis.radiologist.id) if report.diagnosis.radiologist else "N/A"],
            ["Validated At:", report.diagnosis.validated_at.strftime('%Y-%m-%d %H:%M:%S') if report.diagnosis.validated_at else "N/A"]
        ]
        t_sig = Table(sig_data, colWidths=[2*inch, 4.4*inch])
        t_sig.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('LINEABOVE', (0,0), (-1,0), 1, colors.black),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_sig)
        
        # Build PDF
        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
