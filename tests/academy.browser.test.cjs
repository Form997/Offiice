const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

test('Academy renders, filters, switches locale and fits a phone viewport',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  await page.goto(process.env.ACADEMY_URL||'http://127.0.0.1:4173/academy/',{waitUntil:'networkidle'});
  await page.waitForSelector('.lesson-link');
  assert.match(await page.locator('#pageTitle').innerText(),/Giáo trình/);
  assert.equal(await page.locator('.lesson-link').count(),14);
  await page.locator('#search').fill('CALC-002');
  assert.equal(await page.locator('.lesson-link').count(),1);
  assert.match(await page.locator('.lesson-link').first().innerText(),/CALC-002/);
  await page.locator('#search').fill('');
  await page.locator('#language').selectOption('en');
  assert.match(await page.locator('#pageTitle').innerText(),/Learning Guide/);
  await page.locator('.lesson-link').filter({hasText:'WRITER-002'}).click();
  assert.match(await page.locator('#lesson h2').innerText(),/Set up pages/);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  assert.equal(overflow,false,'phone layout must not overflow horizontally');
 }finally{await browser.close()}
});
