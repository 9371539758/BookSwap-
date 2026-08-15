import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { env } from "./src/config/env.js";
import http from "http";
import { initSocket } from "./src/config/socket.js";
const startServer = async()=>{
    try{
       await  connectDB();
        console.log("database is connect");
        const httpServer = http.createServer(app);
        initSocket(httpServer);
        httpServer.listen(env.PORT,()=>{
            console.log("serveris running port 3000");
        })
    }catch(error){
        console.log(error);
    }
}
startServer();
