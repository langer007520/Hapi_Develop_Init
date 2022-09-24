import Hapi from '@hapi/hapi';

let optionsTmp = {
    port: process.env.PORT ?? 3000
};
let options = process.env.MODE === 'development' ? {
    ...optionsTmp, debug: {
        log: ["error"],
        request: ["error"]
    }
} : optionsTmp;

const server = Hapi.server(options)

const init = async () => {
    await server.start();
    console.log(`Hapi服务启动! ${server.info.uri}`);
}



export { server, init }