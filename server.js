const express=require("express");
const session=require("express-session");
const Database=require("better-sqlite3");
const crypto=require("crypto");
const path=require("path");

const app=express();
const PORT=process.env.PORT||3000;
const IS_PROD=process.env.NODE_ENV==="production";
const ADMIN_USER=process.env.ADMIN_USER||"admin";
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"change-this-password";
const db=new Database(path.join(__dirname,"my_aov.db"));

db.exec(`
CREATE TABLE IF NOT EXISTS products(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 platform TEXT NOT NULL,
 version TEXT NOT NULL,
 link TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS keys(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 key TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 used INTEGER NOT NULL DEFAULT 0
);
`);

const count=db.prepare("SELECT COUNT(*) c FROM products").get().c;
if(count===0){
 const ins=db.prepare("INSERT INTO products(name,platform,version,link,active,created_at) VALUES(?,?,?,?,1,?)");
 const now=new Date().toISOString();
 ins.run("MY AOV IOS V1","iOS","V1.0","#",now);
 ins.run("MY AOV Android","Android","V1.0","#",now);
}

app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));
app.set("trust proxy",1);
app.use(session({
 secret:process.env.SESSION_SECRET||"change-this-session-secret",
 resave:false,
 saveUninitialized:false,
 cookie:{httpOnly:true,sameSite:"lax",secure:IS_PROD,maxAge:1000*60*60*8}
}));

app.get("/api/health",(req,res)=>res.json({ok:true,time:new Date().toISOString()}));

function auth(req,res,next){
 if(!req.session.admin) return res.status(401).json({error:"Unauthorized"});
 next();
}

app.post("/api/login",(req,res)=>{
 const {username,password}=req.body||{};
 if(username===ADMIN_USER && password===ADMIN_PASSWORD){
   req.session.admin=true;
   return res.json({ok:true});
 }
 res.status(401).json({error:"Sai tài khoản hoặc mật khẩu"});
});
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/me",(req,res)=>res.json({admin:!!req.session.admin}));

app.get("/api/products",(req,res)=>{
 const q=String(req.query.q||"").trim();
 const rows=q
  ? db.prepare("SELECT * FROM products WHERE active=1 AND (name LIKE ? OR platform LIKE ?) ORDER BY id DESC").all("%"+q+"%","%"+q+"%")
  : db.prepare("SELECT * FROM products WHERE active=1 ORDER BY id DESC").all();
 res.json(rows);
});
app.get("/api/admin/products",auth,(req,res)=>{
 res.json(db.prepare("SELECT * FROM products ORDER BY id DESC").all());
});
app.post("/api/products",auth,(req,res)=>{
 const b=req.body||{};
 if(!String(b.name||"").trim()) return res.status(400).json({error:"Tên sản phẩm bắt buộc"});
 const info=db.prepare("INSERT INTO products(name,platform,version,link,active,created_at) VALUES(?,?,?,?,?,?)")
 .run(String(b.name).trim(),String(b.platform||"iOS"),String(b.version||"V1.0"),String(b.link||"#"),b.active===false?0:1,new Date().toISOString());
 res.json({id:info.lastInsertRowid});
});
app.put("/api/products/:id",auth,(req,res)=>{
 const b=req.body||{};
 const p=db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id);
 if(!p)return res.status(404).json({error:"Không tìm thấy"});
 db.prepare("UPDATE products SET name=?,platform=?,version=?,link=?,active=? WHERE id=?")
 .run(String(b.name||p.name),String(b.platform||p.platform),String(b.version||p.version),String(b.link??p.link),b.active===false?0:1,p.id);
 res.json({ok:true});
});
app.delete("/api/products/:id",auth,(req,res)=>{
 db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);
 res.json({ok:true});
});

app.post("/api/key",(req,res)=>{
 const now=new Date(), exp=new Date(now.getTime()+24*60*60*1000);
 const key="MYAOV-"+crypto.randomBytes(4).toString("hex").toUpperCase();
 db.prepare("INSERT INTO keys(key,created_at,expires_at) VALUES(?,?,?)").run(key,now.toISOString(),exp.toISOString());
 res.json({key,expiresAt:exp.toISOString()});
});
app.get("/api/keys",auth,(req,res)=>{
 res.json(db.prepare("SELECT * FROM keys ORDER BY id DESC").all());
});
app.post("/api/keys/custom",auth,(req,res)=>{
 const hours=Math.max(1,Math.min(720,Number(req.body.hours)||24));
 const now=new Date(), exp=new Date(now.getTime()+hours*60*60*1000);
 const key="MYAOV-"+crypto.randomBytes(5).toString("hex").toUpperCase();
 db.prepare("INSERT INTO keys(key,created_at,expires_at) VALUES(?,?,?)").run(key,now.toISOString(),exp.toISOString());
 res.json({key,expiresAt:exp.toISOString(),hours});
});
app.post("/api/keys/:id/revoke",auth,(req,res)=>{
 db.prepare("UPDATE keys SET expires_at=? WHERE id=?").run(new Date().toISOString(),req.params.id);
 res.json({ok:true});
});
app.delete("/api/keys/:id",auth,(req,res)=>{
 db.prepare("DELETE FROM keys WHERE id=?").run(req.params.id);
 res.json({ok:true});
});

app.listen(PORT,()=>console.log(`MY AOV v2: http://localhost:${PORT}`));
app.get("/api/stats",auth,(req,res)=>{
 const products=db.prepare("SELECT COUNT(*) c FROM products").get().c;
 const activeProducts=db.prepare("SELECT COUNT(*) c FROM products WHERE active=1").get().c;
 const keys=db.prepare("SELECT COUNT(*) c FROM keys").get().c;
 const activeKeys=db.prepare("SELECT COUNT(*) c FROM keys WHERE expires_at>datetime('now')").get().c;
 res.json({products,activeProducts,keys,activeKeys});
});
app.post("/api/keys/cleanup",auth,(req,res)=>{
 const info=db.prepare("DELETE FROM keys WHERE expires_at<=?").run(new Date().toISOString());
 res.json({deleted:info.changes});
});
