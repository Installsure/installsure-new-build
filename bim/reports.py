"""
PDF Report Generation using WeasyPrint (preferred) with ReportLab fallback
Following the goal: "Prefer WeasyPrint (HTML→PDF) with fallback to ReportLab"
"""

from typing import Dict, Any, Optional
import logging
from datetime import datetime
from io import BytesIO

# WeasyPrint (preferred - HTML to PDF)
try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False
    logging.warning("WeasyPrint not available, will use ReportLab fallback")

# ReportLab (fallback - direct PDF generation)
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logging.warning("ReportLab not available")

logger = logging.getLogger(__name__)


class ReportGenerator:
    """
    PDF Report Generator with WeasyPrint (preferred) and ReportLab (fallback)
    """
    
    @staticmethod
    def generate_html_template(data: Dict[str, Any]) -> str:
        """Generate HTML template for WeasyPrint"""
        project_name = data.get('project_name', 'Unknown Project')
        generated_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        quantities = data.get('quantities', [])
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Quantity Takeoff Report - {project_name}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 40px;
                    color: #333;
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #2563eb;
                    padding-bottom: 20px;
                }}
                .header h1 {{
                    color: #2563eb;
                    margin: 0;
                }}
                .meta {{
                    color: #666;
                    font-size: 14px;
                    margin-top: 10px;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }}
                th {{
                    background-color: #2563eb;
                    color: white;
                    padding: 12px;
                    text-align: left;
                }}
                td {{
                    padding: 10px;
                    border-bottom: 1px solid #ddd;
                }}
                tr:hover {{
                    background-color: #f5f5f5;
                }}
                .summary {{
                    margin-top: 30px;
                    padding: 20px;
                    background-color: #f0f9ff;
                    border-radius: 8px;
                }}
                .footer {{
                    margin-top: 40px;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Quantity Takeoff Report</h1>
                <div class="meta">
                    <strong>Project:</strong> {project_name}<br>
                    <strong>Generated:</strong> {generated_date}
                </div>
            </div>
            
            <h2>Quantities</h2>
            <table>
                <thead>
                    <tr>
                        <th>Element Type</th>
                        <th>Element Name</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Unit Cost</th>
                        <th>Total Cost</th>
                    </tr>
                </thead>
                <tbody>
        """
        
        total_cost = 0
        for qty in quantities:
            element_type = qty.get('element_type', 'N/A')
            element_name = qty.get('element_name', 'N/A')
            quantity = qty.get('quantity', 0)
            unit = qty.get('unit', '')
            unit_cost = qty.get('unit_cost', 0)
            item_total = qty.get('total_cost', 0)
            total_cost += item_total
            
            html += f"""
                    <tr>
                        <td>{element_type}</td>
                        <td>{element_name}</td>
                        <td>{quantity:.2f}</td>
                        <td>{unit}</td>
                        <td>${unit_cost:.2f}</td>
                        <td>${item_total:.2f}</td>
                    </tr>
            """
        
        html += f"""
                </tbody>
            </table>
            
            <div class="summary">
                <h3>Cost Summary</h3>
                <p><strong>Total Estimated Cost:</strong> ${total_cost:,.2f}</p>
                <p><em>Note: Costs are estimates based on current market rates and should be validated.</em></p>
            </div>
            
            <div class="footer">
                <p>Generated by InstallSure BIM Processing Service</p>
                <p>This report is confidential and intended for authorized use only.</p>
            </div>
        </body>
        </html>
        """
        
        return html
    
    @staticmethod
    def generate_with_weasyprint(data: Dict[str, Any]) -> bytes:
        """Generate PDF using WeasyPrint (HTML to PDF)"""
        if not WEASYPRINT_AVAILABLE:
            raise RuntimeError("WeasyPrint is not available")
        
        html_content = ReportGenerator.generate_html_template(data)
        
        # Convert HTML to PDF
        pdf_bytes = HTML(string=html_content).write_pdf()
        
        logger.info(f"PDF generated with WeasyPrint for project: {data.get('project_name')}")
        return pdf_bytes
    
    @staticmethod
    def generate_with_reportlab(data: Dict[str, Any]) -> bytes:
        """Generate PDF using ReportLab (fallback)"""
        if not REPORTLAB_AVAILABLE:
            raise RuntimeError("ReportLab is not available")
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2563eb'),
            spaceAfter=30,
            alignment=1  # Center
        )
        
        # Title
        project_name = data.get('project_name', 'Unknown Project')
        title = Paragraph(f"Quantity Takeoff Report<br/>{project_name}", title_style)
        elements.append(title)
        elements.append(Spacer(1, 12))
        
        # Metadata
        meta_style = styles['Normal']
        generated_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        meta = Paragraph(f"Generated: {generated_date}", meta_style)
        elements.append(meta)
        elements.append(Spacer(1, 24))
        
        # Quantities table
        quantities = data.get('quantities', [])
        
        if quantities:
            table_data = [['Element Type', 'Element Name', 'Qty', 'Unit', 'Unit Cost', 'Total']]
            
            total_cost = 0
            for qty in quantities:
                table_data.append([
                    qty.get('element_type', 'N/A'),
                    qty.get('element_name', 'N/A'),
                    f"{qty.get('quantity', 0):.2f}",
                    qty.get('unit', ''),
                    f"${qty.get('unit_cost', 0):.2f}",
                    f"${qty.get('total_cost', 0):.2f}"
                ])
                total_cost += qty.get('total_cost', 0)
            
            # Create table
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            
            elements.append(table)
            elements.append(Spacer(1, 24))
            
            # Summary
            summary = Paragraph(
                f"<b>Total Estimated Cost:</b> ${total_cost:,.2f}",
                styles['Heading2']
            )
            elements.append(summary)
        
        # Build PDF
        doc.build(elements)
        
        logger.info(f"PDF generated with ReportLab for project: {data.get('project_name')}")
        return buffer.getvalue()
    
    @staticmethod
    def generate_report(data: Dict[str, Any], use_weasyprint: bool = True) -> bytes:
        """
        Generate PDF report with automatic fallback
        
        Args:
            data: Report data dictionary
            use_weasyprint: Try WeasyPrint first (True) or go straight to ReportLab (False)
        
        Returns:
            PDF bytes
        """
        try:
            if use_weasyprint and WEASYPRINT_AVAILABLE:
                return ReportGenerator.generate_with_weasyprint(data)
            elif REPORTLAB_AVAILABLE:
                logger.info("Using ReportLab fallback for PDF generation")
                return ReportGenerator.generate_with_reportlab(data)
            else:
                raise RuntimeError("No PDF generation library available (WeasyPrint or ReportLab)")
        except Exception as e:
            logger.error(f"Error generating PDF with primary method: {e}")
            # Try fallback
            if REPORTLAB_AVAILABLE and use_weasyprint:
                logger.info("Falling back to ReportLab")
                return ReportGenerator.generate_with_reportlab(data)
            raise


# Example usage
if __name__ == "__main__":
    # Example data
    sample_data = {
        'project_name': 'Sample Construction Project',
        'quantities': [
            {
                'element_type': 'IfcWall',
                'element_name': 'Exterior Wall',
                'quantity': 150.5,
                'unit': 'm²',
                'unit_cost': 125.00,
                'total_cost': 18812.50
            },
            {
                'element_type': 'IfcSlab',
                'element_name': 'Ground Floor Slab',
                'quantity': 450.0,
                'unit': 'm²',
                'unit_cost': 85.00,
                'total_cost': 38250.00
            },
            {
                'element_type': 'IfcDoor',
                'element_name': 'Standard Door',
                'quantity': 25,
                'unit': 'units',
                'unit_cost': 450.00,
                'total_cost': 11250.00
            },
        ]
    }
    
    # Generate report
    pdf_bytes = ReportGenerator.generate_report(sample_data)
    
    # Save to file
    with open('sample_report.pdf', 'wb') as f:
        f.write(pdf_bytes)
    
    print(f"Sample report generated: sample_report.pdf ({len(pdf_bytes)} bytes)")
