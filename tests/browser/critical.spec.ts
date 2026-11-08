import { test, expect, type APIRequestContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function post(request: APIRequestContext, url: string, data: unknown) {
  const response = await request.post(url, { data, headers: { Origin: 'http://127.0.0.1:5173' } });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}
async function register(request: APIRequestContext, name: string) {
  const destination = `${name}-${crypto.randomUUID()}@example.com`;
  const otp = await post(request, '/api/auth/otp/request', { destination, purpose: 'register' });
  return (await post(request, '/api/auth/otp/verify', { destination, purpose: 'register', code: otp.devCode, name })).user;
}

test('organisation invitation supports check-in at six viewport widths', async ({ page, context }) => {
  await register(context.request, 'Visitor');
  const { organization } = await post(context.request, '/api/orgs', { name: 'Accessible Service Desk', kind: 'business' });
  await post(context.request, `/api/orgs/${organization.id}/desks`, { name: 'Reception' });
  const invitation = await post(context.request, '/api/guest-links', { purpose: 'org', targetId: organization.id });
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(invitation.url);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Accessible Service Desk');
    await page.getByRole('button', { name: 'Check in at Reception' }).click();
    await expect(page.getByRole('status')).toContainText('Queue position: 1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('loading earlier messages preserves the visible reading position', async ({ page, browser, context }) => {
  const alice = await register(context.request, 'Reader');
  const other = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' });
  try {
    const bob = await register(other.request, 'Sender');
    await post(context.request, '/api/contacts/invite', { userId: bob.id });
    const { contacts } = await (await other.request.get('/api/contacts')).json();
    const contact = contacts.find((item: { ownerId: string }) => item.ownerId === alice.id);
    expect(contact).toBeTruthy();
    await post(other.request, `/api/contacts/${contact.id}/accept`, {});
    const { conversation } = await post(context.request, '/api/conversations', { userId: bob.id });
    for (let i = 0; i < 65; i++) await post(context.request, `/api/conversations/${conversation.id}/messages`, { type: 'text', body: `History entry ${i}`, clientId: crypto.randomUUID() });
    await page.goto(`/chats/${conversation.id}`);
    const history = page.getByRole('log', { name: 'Message history' });
    await expect(history.getByText('History entry 64', { exact: true })).toBeVisible();
    await history.evaluate(element => { element.scrollTop = 0; });
    const anchor = history.getByText('History entry 35', { exact: true });
    const before = await anchor.boundingBox();
    expect(before).toBeTruthy();
    if (!before) throw new Error('Reading anchor is missing.');
    await page.getByRole('button', { name: 'Load earlier messages' }).click();
    await expect(history.getByText('History entry 5', { exact: true })).toHaveCount(1);
    await expect.poll(async () => Math.abs(((await anchor.boundingBox())?.y ?? Infinity) - before.y)).toBeLessThan(3);
    expect(alice.id).toBeTruthy();
  } finally {
    await other.close();
  }
});
