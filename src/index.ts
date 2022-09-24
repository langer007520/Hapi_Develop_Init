// process环境初始化
import DotEnv from 'dotenv';
DotEnv.config();
import { init } from "./service/hapi_server";
import "./util/hapi_extension";
import { register as routeRegistry } from "./route/demo";
import { prisma } from './service/prisma_client';


console.log(process.env.MODE)

async function main() {
    // 注册插件

    // 注册 路由
    await routeRegistry();

    await init();
}

main();

process.on('unhandledRejection', (err: Error) => {
    console.log(err.message);
    console.log('unhandledRejection');
})
