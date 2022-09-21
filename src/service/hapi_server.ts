import Hapi from '@hapi/hapi';

const server = Hapi.server({
    port: process.env.PORT ?? 3000
})

const init = async () => {
    await server.start();
    console.log(`Hapi服务启动! ${server.info.uri}`);
}



export { server, init }