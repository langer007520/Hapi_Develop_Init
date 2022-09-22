/**
 * Hapi 模块的类型扩展
 */
import { ServerOptionsApp, ServerApplicationState } from '@hapi/hapi';

declare module "@hapi/hapi" {
    /**
     * server.setting.app 接口
     */
    interface ServerOptionsApp {
        hello: string;
    }
    /**
     * server.app
     */
    interface ServerApplicationState {
        hello: string;
    }
    /**
     * server.methods...
     */
    interface ServerMethods {
        hello: () => Promise<void>
    }

}

