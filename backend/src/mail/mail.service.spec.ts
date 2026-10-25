import { MailService } from './mail.service';

describe('MailService — escape de HTML', () => {
  beforeAll(() => {
    process.env.RESEND_API_KEY ??= 're_test';
  });

  it('escapa nombres y notas ingresados por usuarios', async () => {
    const service = new MailService();
    const send = jest.fn().mockResolvedValue({});
    (service as any).resend = { emails: { send } };

    await service.notifyOwnerNewSale({
      ownerEmail: 'owner@test.com',
      partnerName: '<b>Juan</b>',
      productName: 'Whisky & Co',
      quantity: 2,
      date: '01/10/2026',
      notes: '<a href="https://phish.example">clic aquí</a>',
    });

    const html: string = send.mock.calls[0][0].html;
    expect(html).toContain('&lt;b&gt;Juan&lt;/b&gt;');
    expect(html).toContain('Whisky &amp; Co');
    expect(html).not.toContain('<a href="https://phish.example">');
  });
});
