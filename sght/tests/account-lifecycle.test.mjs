import test from "node:test";
import assert from "node:assert/strict";
import {consumeAccountAction,validateNewPassword} from "../engine/account-lifecycle.js";

function mockLocation(hash) {
  const location={hash,pathname:"/Offiice/sght/",search:"?view=work"};
  const calls=[];
  const history={state:{marker:1},replaceState(...args){calls.push(args);location.hash="";}};
  return {location,history,calls};
}

test("consumes invitation token from fragment and immediately removes it from URL",()=>{
 const {location,history,calls}=mockLocation("#invite=AbCdEf0123456789_-AbCdEf0123456789_-");
 const action=consumeAccountAction(location,history);
 assert.deepEqual(action,{type:"invite",token:"AbCdEf0123456789_-AbCdEf0123456789_-"});
 assert.equal(location.hash,"");
 assert.deepEqual(calls,[[{marker:1},"","/Offiice/sght/?view=work"]]);
});
test("accepts only one recognized fragment key and a URL-safe bounded token",()=>{
 for(const hash of ["#verify=short","#unknown=AbCdEf0123456789_-AbCdEf0123456789_-","#reset=AbCdEf0123456789_-AbCdEf0123456789_-&invite=AbCdEf0123456789_-AbCdEf0123456789_-","#invite=bad%0Atoken"]) {
  const x=mockLocation(hash);assert.equal(consumeAccountAction(x.location,x.history),null);assert.equal(x.location.hash,"");
 }
});
test("consumes verification and password-reset actions",()=>{
 for(const type of ["verify","reset"]){const x=mockLocation("#"+type+"=AbCdEf0123456789_-AbCdEf0123456789_-");assert.equal(consumeAccountAction(x.location,x.history).type,type);}
});
test("password policy matches server length bounds without trimming",()=>{
 assert.equal(validateNewPassword("123456789012"),true);
 assert.equal(validateNewPassword("short"),false);
 assert.equal(validateNewPassword("x".repeat(256)),true);
 assert.equal(validateNewPassword("x".repeat(257)),false);
 assert.equal(validateNewPassword("            "),true);
 assert.equal(validateNewPassword(null),false);
});
