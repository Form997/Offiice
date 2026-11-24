import test from "node:test";
import assert from "node:assert/strict";
import {suggestFormulaRepairs,validateRepairApproval} from "../engine/formula-fix-suggestions.js";
const functions=["SUM","AVERAGE","MIN","MAX","SQRT","ROUND"];
test("suggests a unique close supported function name for #NAME?",()=>{
 const result=suggestFormulaRepairs({formula:"=SUMM(A1:A4)",errorCode:"#NAME?",availableFunctions:functions});
 assert.equal(result.available,true);assert.equal(result.suggestions[0].name,"SUM");assert.equal(result.suggestions[0].formula,"=SUM(A1:A4)");
});
test("does not suggest when nearest names are ambiguous or too far",()=>{
 assert.equal(suggestFormulaRepairs({formula:"=SOMETHING(A1)",errorCode:"#NAME?",availableFunctions:functions}).available,false);
 assert.equal(suggestFormulaRepairs({formula:"=ROUN(A1)",errorCode:"#NAME?",availableFunctions:["ROUND","ROUNS"]}).available,false);
});
test("does not invent fixes for other error classes or malformed formula shapes",()=>{
 assert.equal(suggestFormulaRepairs({formula:"=A1/0",errorCode:"#DIV/0!",availableFunctions:functions}).available,false);
 assert.equal(suggestFormulaRepairs({formula:"=UNKNOWN+1",errorCode:"#NAME?",availableFunctions:functions}).available,false);
});
test("approval requires successful preview and unchanged original formula",()=>{
 assert.equal(validateRepairApproval({currentFormula:"=SUMM(A1)",expectedFormula:"=SUMM(A1)",candidateFormula:"=SUM(A1)",previewSucceeded:true}),true);
 assert.equal(validateRepairApproval({currentFormula:"=SUMM(A2)",expectedFormula:"=SUMM(A1)",candidateFormula:"=SUM(A1)",previewSucceeded:true}),false);
 assert.equal(validateRepairApproval({currentFormula:"=SUMM(A1)",expectedFormula:"=SUMM(A1)",candidateFormula:"=SUM(A1)",previewSucceeded:false}),false);
});
