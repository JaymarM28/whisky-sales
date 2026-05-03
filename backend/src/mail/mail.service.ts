import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend = new Resend(process.env.RESEND_API_KEY);
  private from = process.env.EMAIL_FROM ?? 'Whisky Sales <noreply@example.com>';

  async notifyOwnerNewSale(data: {
    ownerEmail: string;
    partnerName: string;
    productName: string;
    quantity: number;
    date: string;
    notes?: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: data.ownerEmail,
        subject: `Nueva venta reportada — ${data.partnerName}`,
        html: this.saleTemplate(data),
      });
    } catch (err) {
      this.logger.error('Error al enviar notificación de venta', err);
    }
  }

  async notifyOwnerNewTransfer(data: {
    ownerEmail: string;
    fromPartnerName: string;
    toPartnerName: string;
    productName: string;
    quantity: number;
    date: string;
    notes?: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: data.ownerEmail,
        subject: `Traspaso registrado — ${data.fromPartnerName} → ${data.toPartnerName}`,
        html: this.transferTemplate(data),
      });
    } catch (err) {
      this.logger.error('Error al enviar notificación de traspaso', err);
    }
  }

  async notifyPartnerCommission(data: {
    partnerEmail: string;
    partnerName: string;
    amount: number;
    reference?: string;
    date: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: data.partnerEmail,
        subject: 'Pago de comisión registrado',
        html: this.commissionTemplate(data),
      });
    } catch (err) {
      this.logger.error('Error al enviar notificación de comisión', err);
    }
  }

  private saleTemplate(data: {
    partnerName: string;
    productName: string;
    quantity: number;
    date: string;
    notes?: string;
  }): string {
    return `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#1e293b;padding:24px 32px">
          <h2 style="color:#f8fafc;margin:0;font-size:18px">🥃 Nueva venta reportada</h2>
        </div>
        <div style="padding:24px 32px;background:#fff">
          <p style="color:#374151;margin:0 0 16px">Se ha reportado una nueva venta pendiente de revisión:</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280;width:40%">Socio</td>
              <td style="padding:10px 0;color:#111827;font-weight:600">${data.partnerName}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280">Producto</td>
              <td style="padding:10px 0;color:#111827;font-weight:600">${data.productName}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280">Cantidad</td>
              <td style="padding:10px 0;color:#111827;font-weight:600">${data.quantity}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280">Fecha</td>
              <td style="padding:10px 0;color:#111827;font-weight:600">${data.date}</td>
            </tr>
            ${data.notes ? `
            <tr>
              <td style="padding:10px 0;color:#6b7280;vertical-align:top">Notas</td>
              <td style="padding:10px 0;color:#111827">${data.notes}</td>
            </tr>` : ''}
          </table>
          <p style="margin:24px 0 0;font-size:13px;color:#9ca3af">Ingresa al panel para confirmar o rechazar la venta.</p>
        </div>
      </div>
    `;
  }

  private transferTemplate(data: {
    fromPartnerName: string;
    toPartnerName: string;
    productName: string;
    quantity: number;
    date: string;
    notes?: string;
  }): string {
    return `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#1e293b;padding:24px 32px">
          <h2 style="color:#f8fafc;margin:0;font-size:18px">🔄 Traspaso registrado</h2>
        </div>
        <div style="padding:24px 32px;background:#fff">
          <p style="color:#374151;margin:0 0 16px">Se ha registrado un traspaso de inventario:</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280;width:40%">De</td>
              <td style="padding:10px 0;color:#111827;font-weight:600">${data.fromPartnerName}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280">A</td>
              <td style="padding:10px 0;color:#111827;font-weight:600">${data.toPartnerName}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280">Producto</td>
              <td style="padding:10px 0;color:#111827;font-weight:600">${data.productName}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280">Cantidad</td>
              <td style="padding:10px 0;color:#111827;font-weight:600">${data.quantity}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280">Fecha</td>
              <td style="padding:10px 0;color:#111827;font-weight:600">${data.date}</td>
            </tr>
            ${data.notes ? `
            <tr>
              <td style="padding:10px 0;color:#6b7280;vertical-align:top">Notas</td>
              <td style="padding:10px 0;color:#111827">${data.notes}</td>
            </tr>` : ''}
          </table>
        </div>
      </div>
    `;
  }

  private commissionTemplate(data: {
    partnerName: string;
    amount: number;
    reference?: string;
    date: string;
  }): string {
    const formatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(data.amount);
    return `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#1e293b;padding:24px 32px">
          <h2 style="color:#f8fafc;margin:0;font-size:18px">💰 Pago de comisión registrado</h2>
        </div>
        <div style="padding:24px 32px;background:#fff">
          <p style="color:#374151;margin:0 0 16px">Hola <strong>${data.partnerName}</strong>, se ha registrado un pago de comisión a tu nombre:</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280;width:40%">Monto</td>
              <td style="padding:10px 0;color:#16a34a;font-weight:700;font-size:18px">${formatted}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280">Fecha</td>
              <td style="padding:10px 0;color:#111827;font-weight:600">${data.date}</td>
            </tr>
            ${data.reference ? `
            <tr>
              <td style="padding:10px 0;color:#6b7280">Referencia</td>
              <td style="padding:10px 0;color:#111827;font-weight:600">${data.reference}</td>
            </tr>` : ''}
          </table>
          <p style="margin:24px 0 0;font-size:13px;color:#9ca3af">Puedes consultar tu historial completo de comisiones en la app.</p>
        </div>
      </div>
    `;
  }
}
