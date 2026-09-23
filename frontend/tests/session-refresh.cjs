const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const code = ts.transpileModule(fs.readFileSync(require("node:path").join(__dirname, "../src/lib/api.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const jwt = (sub, version) => "x." + Buffer.from(JSON.stringify({sub, version})).toString("base64url") + ".x";
function setup(handler) {
 const data = new Map();
 const session = new Map();
 const window = new EventTarget();
 window.localStorage = { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) };
 window.sessionStorage = { getItem: k => session.get(k) ?? null, setItem: (k,v) => session.set(k,v), removeItem: k => session.delete(k) };
 const context = { exports: {}, process: {env:{}}, fetch:handler, window, Event, Headers, DOMException, atob, console };
 vm.runInNewContext(code, context);
 return {...context.exports, data, session};
}
test("parallel expired requests share renewal and retry original payload", async () => {
 let refreshes=0, retries=0;
 const old=jwt("admin",1), fresh=jwt("admin",2);
 const app=setup(async (url, init) => {
  if(url.endsWith("/auth/refresh")) { refreshes++; await new Promise(r=>setTimeout(r,10)); return Response.json({accessToken:fresh}); }
  if(init.headers.get("Authorization")==="Bearer "+old) return new Response("",{status:401});
  retries++; assert.equal(init.body,'{"name":"Kurta"}'); return Response.json({ok:true});
 });
 app.data.set("admin-access-token",old);
 await Promise.all([1,2,3].map(()=>app.apiFetch("/categories",{token:old,method:"POST",body:'{"name":"Kurta"}'})));
 assert.equal(refreshes,1); assert.equal(retries,3); assert.equal(app.data.get("admin-access-token"),fresh);
});
test("invalid refresh clears session",async()=>{
 const old=jwt("a",1); const app=setup(async()=>new Response("",{status:401}));
 app.data.set("admin-access-token",old);
 await assert.rejects(app.apiFetch("/admin/orders",{token:old}));
 assert.equal(app.data.has("admin-access-token"),false);
});
test("different account cookie cannot replace admin identity",async()=>{
 const old=jwt("admin",1);const app=setup(async url=>url.endsWith("/auth/refresh")?Response.json({accessToken:jwt("customer",2)}):new Response("",{status:401}));
 app.data.set("admin-access-token",old);
 await assert.rejects(app.apiFetch("/categories",{token:old}));
 assert.equal(app.data.has("admin-access-token"),false);
});
test("server errors do not refresh or clear session",async()=>{
 let calls=0;const old=jwt("a",1);const app=setup(async()=>{calls++;return Response.json({error:"Unavailable"},{status:503});});
 app.data.set("admin-access-token",old);
 await assert.rejects(app.apiFetch("/categories",{token:old}));
 assert.equal(calls,1);assert.equal(app.data.get("admin-access-token"),old);
});
test("logout during renewal cannot restore session or retry mutation",async()=>{
 const old=jwt("a",1);let calls=0;
 const app=setup(async url=>{calls++;if(url.endsWith("/auth/refresh")){app.data.clear();return Response.json({accessToken:jwt("a",2)});}return new Response("",{status:401});});
 app.data.set("admin-access-token",old);
 await assert.rejects(app.apiFetch("/categories",{token:old,method:"POST"}));
 assert.equal(calls,2);assert.equal(app.data.size,0);
});
test("CSV download renews token too",async()=>{
 const old=jwt("a",1),fresh=jwt("a",2);
 const app=setup(async(url,init)=>url.endsWith("/auth/refresh")?Response.json({accessToken:fresh}):init.headers.get("Authorization")==="Bearer "+old?new Response("",{status:401}):new Response("order,total"));
 app.data.set("admin-access-token",old);
 assert.equal(await (await app.apiFetchBlob("/export",{token:old})).text(),"order,total");
});

test("remember choice selects storage and clears previous persistence",()=>{
 const app=setup(async()=>Response.json({}));
 app.saveSessionToken("admin-access-token","remembered",true);
 assert.equal(app.data.get("admin-access-token"),"remembered");
 app.saveSessionToken("admin-access-token","temporary",false);
 assert.equal(app.data.has("admin-access-token"),false);
 assert.equal(app.session.get("admin-access-token"),"temporary");
 app.clearSessionToken("admin-access-token");
 assert.equal(app.getSessionToken("admin-access-token"),null);
});
test("renewal preserves session-only sign-in",async()=>{
 const old=jwt("a",1),fresh=jwt("a",2);
 const app=setup(async(url,init)=>url.endsWith("/auth/refresh")?Response.json({accessToken:fresh}):init.headers.get("Authorization")==="Bearer "+old?new Response("",{status:401}):Response.json({ok:true}));
 app.saveSessionToken("admin-access-token",old,false);
 await app.apiFetch("/categories",{token:old});
 assert.equal(app.session.get("admin-access-token"),fresh);
 assert.equal(app.data.has("admin-access-token"),false);
});
