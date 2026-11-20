import test from "node:test";
import assert from "node:assert/strict";
import { buildAccountLink, createSghtMailer, createSmtpMailer } from "./mailer.mjs";

test("account links require HTTPS and put one-time tokens in URL fragments",()=>{
 const link=buildAccountLink("https://example.test/Offiice","invite","secret-token");
 const url=new URL(link);
 assert.equal(url.origin,"https://example.test");
 assert.equal(url.pathname,"/Offiice/sght/");
 assert.equal(url.search,"");
 assert.equal(url.hash,"#invite=secret-token");
 assert.throws(()=>buildAccountLink("http://example.test","reset","x"),/HTTPS/);
 assert.throws(()=>buildAccountLink("https://example.test/?x=1","reset","x"),/HTTPS/);
});
test("mailer sends invitation and reset messages without exposing tokens in API output",async()=>{
 const sent=[];
 const mailer=createSghtMailer({transport:{sendMail:async message=>sent.push(message)},from:"SGHT <noreply@example.test>",publicAppUrl:"https://example.test/Offiice"});
 await mailer.sendInvitation({to:"person@example.test",displayName:"A <B>",role:"viewer",token:"invite-secret"});
 await mailer.sendPasswordReset({to:"person@example.test",displayName:"A",token:"reset-secret"});
 await mailer.sendEmailVerification({to:"person@example.test",displayName:"A",token:"verify-secret"});
 assert.equal(sent.length,3);
 assert.equal(sent[0].to,"person@example.test");
 assert.match(sent[0].text,/#invite=invite-secret/);
 assert.match(sent[0].html,/A &lt;B&gt;/);
 assert.match(sent[1].text,/#reset=reset-secret/);
 assert.match(sent[2].text,/#verify=verify-secret/);
 assert.equal(sent[0].from,"SGHT <noreply@example.test>");
});
test("SMTP is optional but partial configuration fails closed",async()=>{
 assert.equal(await createSmtpMailer({}),null);
 await assert.rejects(()=>createSmtpMailer({SMTP_HOST:"smtp.example.test"}),/must all be configured/);
});
