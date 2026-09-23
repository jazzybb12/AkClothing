const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Prisma}=require('@prisma/client');
const {errorHandler}=require('../dist/middleware/errorHandler');
for(const [code,status] of [['P2002',409],['P2003',409],['P2014',409],['P2025',404]]){
 test(code+' returns actionable client error',()=>{
 let actual,body;
 const res={status(n){actual=n;return this},json(b){body=b;return this}};
 errorHandler(new Prisma.PrismaClientKnownRequestError('private database details',{code,clientVersion:'5.22.0'}),{},res,()=>{});
 assert.equal(actual,status);assert.ok(body.error);assert.ok(!body.error.includes('private database details'));
 });
}
