import { createPool, createSghtAuthServer } from "./server.mjs";
const {DATABASE_URL,SGHT_ALLOWED_ORIGIN,PORT="8080",HOST="0.0.0.0"}=process.env;
if(!DATABASE_URL||!SGHT_ALLOWED_ORIGIN)throw new Error("DATABASE_URL and SGHT_ALLOWED_ORIGIN are required.");
const pool=createPool(DATABASE_URL);
await pool.query("SELECT 1");
const server=createSghtAuthServer({pool,allowedOrigin:SGHT_ALLOWED_ORIGIN,secureCookies:true});
server.listen(Number(PORT),HOST,()=>process.stdout.write(`SGHT Auth API listening on ${HOST}:${PORT}\n`));
for(const signal of ["SIGINT","SIGTERM"])process.on(signal,()=>server.close(async()=>{await pool.end();process.exit(0);}));
