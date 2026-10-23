import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();
await page.goto('http://127.0.0.1:4173/#/intelligence/membership');
await page.getByRole('heading',{name:'Membership',exact:true}).waitFor();
const names=await page.locator('tbody button:visible').allTextContents();
if(names.some(name=>/\d$/.test(name)))throw Error('Numbered member name');
await page.locator('tbody button:visible').first().click();
await page.getByRole('heading',{name:names[0],exact:true}).waitFor();
for(const width of [1440,390]){
 await page.setViewportSize({width,height:900});
 const size=await page.getByRole('button',{name:'Back to Membership',exact:true}).boundingBox();
 if(size.height>36||size.width>200)throw Error(JSON.stringify(size));
 console.log(JSON.stringify({viewport:width,button:size}));
}
await page.reload();
await page.getByRole('heading',{name:names[0],exact:true}).waitFor();
await page.getByRole('button',{name:'Back to Membership',exact:true}).click();
await page.getByRole('heading',{name:'Membership',exact:true}).waitFor();
const missing=await page.request.get('http://127.0.0.1:4173/missing-route');
if(missing.status()!==404)throw Error('Missing route');
console.log('Member names, details, reload, back navigation, mobile sizing, and missing route passed.');
await browser.close();
