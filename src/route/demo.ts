/**
 * 路由 Demo
 */
import { server } from "../service/hapi_server";
import { PersonSchema, WalletSchema } from "../validate/schema/demo";

export const register = async () => {

    server.defineRoute({
        method: "GET",
        path: "/{test}",
        handler: async (req, h) => {
            // req.payload.wallet?.eur
            console.log(req.params.test);
            // console.log(req.payload.nihao);
            req.payload.job?.businessName
            console.log(req.query.eur);
            req.server.app.hello
            return 'ok';
        },
        options: {
            description: "测试案例",
            validate: {
                payload: PersonSchema,
                query: WalletSchema
            }
        }
    })

}