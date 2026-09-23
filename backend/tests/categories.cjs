const {test}=require('node:test');
const assert=require('node:assert/strict');
process.env.DATABASE_URL='mysql://test:test@localhost:3306/test';
process.env.JWT_ACCESS_SECRET='test-access';
process.env.JWT_REFRESH_SECRET='test-refresh';
process.env.NODE_ENV='production';
const {prisma}=require('../dist/config/prisma');
const router=require('../dist/modules/categories/categories.routes').default;
function invoke(method,body={}) {
 const route=router.stack.find(layer=>layer.route?.methods[method]).route;
 return new Promise((resolve,reject)=>{
 const res={status(){return this},json:resolve,send:resolve};
 route.stack.at(-1).handle({params:{id:'category-1'},body},res,reject);
 });
}
test('category deletion preserves linked products and children',async()=>{
 let deleted=false;
 prisma.category.delete=async()=>{deleted=true};
 prisma.category.findUnique=async()=>({_count:{products:1,children:0}});
 await assert.rejects(invoke('delete'),/Move this category's products/);
 assert.equal(deleted,false);
 prisma.category.findUnique=async()=>({_count:{products:0,children:1}});
 await assert.rejects(invoke('delete'),/subcategories/);
 prisma.category.findUnique=async()=>({_count:{products:0,children:0}});
 await invoke('delete');assert.equal(deleted,true);
});
test('duplicate category creation gives conflict',async()=>{
 prisma.category.findFirst=async()=>({id:'existing'});
 await assert.rejects(invoke('post',{name:'Kurta'}),error=>error.statusCode===409);
});
test('proxy trusts closest hop, not client-supplied earlier entries',()=>{
 const {createApp}=require('../dist/app');
 const app=createApp();
 assert.equal(app.get('trust proxy'),1);
 const req=Object.create(app.request);
 req.connection={remoteAddress:'127.0.0.1'};
 req.headers={'x-forwarded-for':'198.51.100.99, 203.0.113.20'};
 assert.equal(req.ip,'203.0.113.20');
});
