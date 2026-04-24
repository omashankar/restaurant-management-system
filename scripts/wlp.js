const fs=require("fs");const out=process.argv[2];fs.writeFileSync(out,fs.readFileSync(0,"utf8"));console.log("written",out);
