import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import { Pool } from "pg";
const scrypt=promisify(scryptCb);
const email=String(process.env.SGHT_ADMIN_EMAIL||"").trim().toLowerCase();
const name=String(process.env.SGHT_ADMIN_NAME||"SGHT Administrator").trim();
const password=process.env.SGHT_ADMIN_PASSWORD||"";
if(!process.env.DATABASE_URL||!email||!/^\S+@\S+\.\S+$/.test(email)||password.length<16||password.length>256)throw new Error("Set DATABASE_URL, SGHT_ADMIN_EMAIL, and SGHT_ADMIN_PASSWORD (16–256 chars) in a private deployment environment.");
const salt=randomBytes(16).toString("hex"),derived=await scrypt(password,salt,64);
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true}});
try{
 const client=await pool.connect();
 try{await client.query("BEGIN");const exists=await client.query("SELECT id FROM sght_users WHERE role='admin' AND status='active' LIMIT 1");if(exists.rowCount)throw new Error("An active administrator already exists; bootstrap is one-time only.");
 await client.query("INSERT INTO sght_users(email_normalized,display_name,password_hash,password_salt,role,status,email_verified_at) VALUES($1,$2,$3,$4,'admin','active',now())",[email,name,derived.toString("hex"),salt]);
 await client.query("COMMIT");process.stdout.write("Initial administrator created. Remove bootstrap secrets from the deployment environment.\n");}
 catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
}finally{await pool.end();}
