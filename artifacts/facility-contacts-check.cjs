const { chromium, expect } = require('@playwright/test');
(async()=>{
const browser=await chromium.launch({channel:'msedge'}); const page=await browser.newPage();
await page.goto('http://localhost:4173/#/intelligence/providers');
await page.getByRole('button',{name:'Add provider',exact:true}).click();
await expect(page.getByRole('tab',{name:'Facility contacts',exact:true})).toHaveCount(0);
await page.locator('.modal select').first().selectOption('Facility');
await page.getByLabel('Facility name *',{exact:true}).fill('Demo contact facility');
await page.getByLabel('Primary practice location *',{exact:true}).fill('100 Demo Way');
await page.getByRole('tab',{name:'Facility contacts',exact:true}).click();
for(const role of ['Billing','Referrals','Provider Relations']) {
await page.getByLabel(`${role} responsible person`,{exact:true}).fill(`${role} Demo Person`);
await page.getByLabel(`${role} email`,{exact:true}).fill('demo@example.test');
await page.getByLabel(`${role} phone / extension`,{exact:true}).fill('202-555-0100 ext 2');
}
await page.getByLabel('Billing email',{exact:true}).fill('invalid');
await page.getByRole('button',{name:'Save provider',exact:true}).click();
await expect(page.getByRole('alert')).toContainText('valid email');
await page.getByLabel('Billing email',{exact:true}).fill('demo@example.test');
await page.evaluate(()=>{const original=Storage.prototype.setItem; window.restoreStorage=()=>Storage.prototype.setItem=original; Storage.prototype.setItem=function(key,value){if(key==='ipa-providers')throw new Error('Full');return original.call(this,key,value)}});
await page.getByRole('button',{name:'Save provider',exact:true}).click();
await expect(page.locator('.modal').getByRole('alert')).toContainText('could not be saved');
await page.evaluate(()=>window.restoreStorage());
await page.getByRole('button',{name:'Save provider',exact:true}).click();
await expect(page.locator('.modal')).toHaveCount(0);
await page.reload();
const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('ipa-providers')).find(p=>p.name==='Demo contact facility'));
for(const key of ['billingContact','referralsContact','providerRelationsContact']){if(record.details[key+'Email']!=='demo@example.test')throw new Error('Persistence failed');}
await page.getByText('Demo contact facility',{exact:true}).click();
await expect(page.getByRole('heading',{name:'Facility contacts',exact:true})).toBeVisible();
await expect(page.locator('.provider-detail-panel')).toContainText('Billing Demo Person');
await page.getByRole('button',{name:'Edit record',exact:true}).click();
await page.getByRole('tab',{name:'Facility contacts',exact:true}).click();
await expect(page.getByLabel('Billing email',{exact:true})).toHaveValue('demo@example.test');
const missing=await page.request.get('http://localhost:4173/missing-route'); if(missing.status()!==404 && missing.status()!==200) throw new Error('Unexpected missing route status');
await expect(page.locator('body')).not.toBeEmpty();
console.log('PASS: facility contacts, email validation, failed save retention, reload, detail view, edit, missing route');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});


