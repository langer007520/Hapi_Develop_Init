/**
 * 给hapi添加一个自定义路由函数,主要是为了提供类型安全
 */
import { Server, Util, Lifecycle, ResponseToolkit, RequestApplicationState, RequestAuth, RequestEvents, RequestLog, RequestOrig, PluginsStates, ResponseObject, RequestQuery, RequestRoute, ResponseValue, RouteOptionsAccess, RouteOptionsValidate, RouteOptionsApp, RouteOptionsCache, RouteCompressionEncoderSettings, RouteOptionsCors, Json, RouteOptionsResponse, RouteOptionsSecure, RouteRequestExtType, RouteExtObject, RouteOptionsPayload, PluginSpecificConfiguration, RouteOptionsPreArray, RouteOptionsResponseSchema } from '@hapi/hapi';
import { server } from '../service/hapi_server';
import type Podium from '@hapi/podium';
import type stream from 'stream';
import type { Boom } from '@hapi/boom';
import type http from 'http';
import type url from 'url';
import type { ValidationOptions } from 'joi';

declare module '@hapi/hapi' {
    interface Server {
        defineRoute<Params extends string, Payload, Query>(option: CustomServerRoute<Params, Payload, Query>): void;
    }
}

server.decorate("server", 'defineRoute', function (option) {
    server.route(option)
})

// 改装的自定义服务路由接口
// type CustomServerRoute<P extends string, T, K, F> = P extends `${infer R1}{${infer R2}}${infer R3}` ? RequiredKey<__CustomServerRoute<P, T, K, F>, 'options'> : __CustomServerRoute<P, T, K, F>;
interface CustomServerRoute<Params extends string, Payload, Query> {
    /**
     * (required) the absolute path used to match incoming requests (must begin with '/'). Incoming requests are compared to the configured paths based on the server's router configuration. The path
     * can include named parameters enclosed in {} which will be matched against literal values in the request as described in Path parameters. For context [See
     * docs](https://github.com/hapijs/hapi/blob/master/API.md#-serverrouteroute) For context [See docs](https://github.com/hapijs/hapi/blob/master/API.md#path-parameters)
     */
    path: Params;

    /**
     * (required) the HTTP method. Typically one of 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', or 'OPTIONS'. Any HTTP method is allowed, except for 'HEAD'. Use '*' to match against any HTTP method
     * (only when an exact match was not found, and any match with a specific method will be given a higher priority over a wildcard match). Can be assigned an array of methods which has the same
     * result as adding the same route with different methods manually.
     */
    method: Util.HTTP_METHODS_PARTIAL | Util.HTTP_METHODS_PARTIAL[]

    /**
     * (optional) a domain string or an array of domain strings for limiting the route to only requests with a matching host header field. Matching is done against the hostname part of the header
     * only (excluding the port). Defaults to all hosts.
     */
    vhost?: string | string[] | undefined;

    /**
     * (required when handler is not set) the route handler function called to generate the response after successful authentication and validation.
     */
    handler?: CustomMethod<Params, Payload, Query>

    /**
     * additional route options. The options value can be an object or a function that returns an object using the signature function(server) where server is the server the route is being added to
     * and this is bound to the current realm's bind option.
     */
    options?: CustomRouteOptions<Params, Payload, Query> | ((server: Server) => CustomRouteOptions<Params, Payload, Query>) | undefined;

    /**
     * route custom rules object. The object is passed to each rules processor registered with server.rules(). Cannot be used if route.options.rules is defined.
     */
    rules?: object | undefined;
}

type CustomMethod<Params, Payload, Query> = (request: CustomRequest<Params, Payload, Query>, h: ResponseToolkit, err?: Error) => Lifecycle.ReturnValue;

interface CustomRequest<Params, Payload, Query> extends Podium {
    /**
    * Application-specific state. Provides a safe place to store application data without potential conflicts with the framework. Should not be used by plugins which should use plugins[name].
    * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-requestapp)
    */
    app: RequestApplicationState;

    /**
     * Authentication information:
     * * artifacts - an artifact object received from the authentication strategy and used in authentication-related actions.
     * * credentials - the credential object received during the authentication process. The presence of an object does not mean successful authentication.
     * * error - the authentication error is failed and mode set to 'try'.
     * * isAuthenticated - true if the request has been successfully authenticated, otherwise false.
     * * isAuthorized - true is the request has been successfully authorized against the route authentication access configuration. If the route has not access rules defined or if the request failed
     * authorization, set to false.
     * * mode - the route authentication mode.
     * * strategy - the name of the strategy used.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-requestauth)
     */
    readonly auth: RequestAuth;

    /**
     * Access: read only and the public podium interface.
     * The request.events supports the following events:
     * * 'peek' - emitted for each chunk of payload data read from the client connection. The event method signature is function(chunk, encoding).
     * * 'finish' - emitted when the request payload finished reading. The event method signature is function ().
     * * 'disconnect' - emitted when a request errors or aborts unexpectedly.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-requestevents)
     */
    events: RequestEvents;

    /**
     * The raw request headers (references request.raw.req.headers).
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-requestheaders)
     */
    readonly headers: Util.Dictionary<string>;

    /**
     * Request information:
     * * acceptEncoding - the request preferred encoding.
     * * cors - if CORS is enabled for the route, contains the following:
     * * isOriginMatch - true if the request 'Origin' header matches the configured CORS restrictions. Set to false if no 'Origin' header is found or if it does not match. Note that this is only
     * available after the 'onRequest' extension point as CORS is configured per-route and no routing decisions are made at that point in the request lifecycle.
     * * host - content of the HTTP 'Host' header (e.g. 'example.com:8080').
     * * hostname - the hostname part of the 'Host' header (e.g. 'example.com').
     * * id - a unique request identifier (using the format '{now}:{connection.info.id}:{5 digits counter}').
     * * received - request reception timestamp.
     * * referrer - content of the HTTP 'Referrer' (or 'Referer') header.
     * * remoteAddress - remote client IP address.
     * * remotePort - remote client port.
     * * responded - request response timestamp (0 is not responded yet).
     * Note that the request.info object is not meant to be modified.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-requestinfo)
     */
    readonly info: RequestInfo;

    /**
     * An array containing the logged request events.
     * Note that this array will be empty if route log.collect is set to false.
     */
    readonly logs: RequestLog[];

    /**
     * The request method in lower case (e.g. 'get', 'post').
     */
    readonly method: Util.HTTP_METHODS_PARTIAL_LOWERCASE;

    /**
     * The parsed content-type header. Only available when payload parsing enabled and no payload error occurred.
     */
    readonly mime: string;

    /**
     * An object containing the values of params, query, and payload before any validation modifications made. Only set when input validation is performed.
     */
    readonly orig: RequestOrig;

    /**
     * An object where each key is a path parameter name with matching value as described in [Path parameters](https://github.com/hapijs/hapi/blob/master/API.md#path-parameters).
     */
    readonly params: ParsePath<Params>;

    /**
     * An array containing all the path params values in the order they appeared in the path.
     */
    readonly paramsArray: string[];

    /**
     * The request URI's pathname component.
     */
    readonly path: string;

    /**
     * The request payload based on the route payload.output and payload.parse settings.
     * TODO check this typing and add references / links.
     */
    readonly payload: ParsePayload<Payload>

    /**
     * Plugin-specific state. Provides a place to store and pass request-level plugin data. The plugins is an object where each key is a plugin name and the value is the state.
     */
    plugins: PluginsStates;

    /**
     * An object where each key is the name assigned by a route pre-handler methods function. The values are the raw values provided to the continuation function as argument. For the wrapped response
     * object, use responses.
     */
    readonly pre: Util.Dictionary<any>;

    /**
     * Access: read / write (see limitations below).
     * The response object when set. The object can be modified but must not be assigned another object. To replace the response with another from within an extension point, use reply(response) to
     * override with a different response.
     * In case of an aborted request the status code will be set to `disconnectStatusCode`.
     */
    response: ResponseObject | Boom;

    /**
     * Same as pre but represented as the response object created by the pre method.
     */
    readonly preResponses: Util.Dictionary<any>;

    /**
     * By default the object outputted from node's URL parse() method.
     */
    readonly query: ParseQuery<Query>;

    /**
     * An object containing the Node HTTP server objects. Direct interaction with these raw objects is not recommended.
     * * req - the node request object.
     * * res - the node response object.
     */
    readonly raw: {
        req: http.IncomingMessage;
        res: http.ServerResponse;
    };

    /**
     * The request route information object and method
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-requestroute)
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-requestrouteauthaccessrequest)
     */
    readonly route: RequestRoute;

    /**
     * Access: read only and the public server interface.
     * The server object.
     */
    server: Server;

    /**
     * An object containing parsed HTTP state information (cookies) where each key is the cookie name and value is the matching cookie content after processing using any registered cookie definition.
     */
    readonly state: Util.Dictionary<any>;

    /**
     * The parsed request URI.
     */
    readonly url: url.URL;

    /**
     * Returns `true` when the request is active and processing should continue and `false` when the
     *  request terminated early or completed its lifecycle. Useful when request processing is a
     * resource-intensive operation and should be terminated early if the request is no longer active
     * (e.g. client disconnected or aborted early).
     */
    active(): boolean;

    /**
     * Returns a response which you can pass into the reply interface where:
     * @param source - the value to set as the source of the reply interface, optional.
     * @param options - options for the method, optional.
     * @return ResponseObject
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-requestgenerateresponsesource-options)
     */
    /* tslint:disable-next-line:max-line-length */
    generateResponse(source: string | object | null, options?: { variety?: string | undefined; prepare?: ((response: ResponseObject) => Promise<ResponseObject>) | undefined; marshal?: ((response: ResponseObject) => Promise<ResponseValue>) | undefined; close?: ((response: ResponseObject) => void) | undefined; }): ResponseObject;

    /**
     * Logs request-specific events. When called, the server emits a 'request' event which can be used by other listeners or plugins. The arguments are:
     * @param tags - a string or an array of strings (e.g. ['error', 'database', 'read']) used to identify the event. Tags are used instead of log levels and provide a much more expressive mechanism
     *     for describing and filtering events.
     * @param data - (optional) an message string or object with the application data being logged. If data is a function, the function signature is function() and it called once to generate (return
     *     value) the actual data emitted to the listeners. Any logs generated by the server internally will be emitted only on the 'request-internal' channel and will include the event.internal flag
     *     set to true.
     * @return void
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-requestlogtags-data)
     */
    log(tags: string | string[], data?: string | object | (() => string | object)): void;

    /**
     * Changes the request method before the router begins processing the request where:
     * @param method - is the request HTTP method (e.g. 'GET').
     * @return void
     * Can only be called from an 'onRequest' extension method.
     * [See docs](https://hapijs.com/api/17.0.1#-requestsetmethodmethod)
     */
    setMethod(method: Util.HTTP_METHODS_PARTIAL): void;

    /**
     * Changes the request URI before the router begins processing the request where:
     * Can only be called from an 'onRequest' extension method.
     * @param url - the new request URI. If url is a string, it is parsed with node's URL parse() method with parseQueryString set to true. url can also be set to an object compatible with node's URL
     *     parse() method output.
     * @param stripTrailingSlash - if true, strip the trailing slash from the path. Defaults to false.
     * @return void
     * [See docs](https://hapijs.com/api/17.0.1#-requestseturlurl-striptrailingslash)
     */
    setUrl(url: string | url.URL, stripTrailingSlash?: boolean): void;
}

interface CustomRouteOptions<Params, Payload, Query> {
    /**
     * Route authentication configuration. Value can be:
     * false to disable authentication if a default strategy is set.
     * a string with the name of an authentication strategy registered with server.auth.strategy(). The strategy will be set to 'required' mode.
     * an authentication configuration object.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsapp)
     */
    auth?: false | string | RouteOptionsAccess | undefined;

    /**
    * Application-specific route configuration state. Should not be used by plugins which should use options.plugins[name] instead.
    * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsapp)
    */
    app?: RouteOptionsApp | undefined;

    /**
     * @default null.
     * An object passed back to the provided handler (via this) when called. Ignored if the method is an arrow function.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsbind)
     */
    bind?: object | null | undefined;

    /**
     * @default { privacy: 'default', statuses: [200], otherwise: 'no-cache' }.
     * If the route method is 'GET', the route can be configured to include HTTP caching directives in the response. Caching can be customized using an object with the following options:
     * privacy - determines the privacy flag included in client-side caching using the 'Cache-Control' header. Values are:
     * * * 'default' - no privacy flag.
     * * * 'public' - mark the response as suitable for public caching.
     * * * 'private' - mark the response as suitable only for private caching.
     * * expiresIn - relative expiration expressed in the number of milliseconds since the item was saved in the cache. Cannot be used together with expiresAt.
     * * expiresAt - time of day expressed in 24h notation using the 'HH:MM' format, at which point all cache records for the route expire. Cannot be used together with expiresIn.
     * * statuses - an array of HTTP response status code numbers (e.g. 200) which are allowed to include a valid caching directive.
     * * otherwise - a string with the value of the 'Cache-Control' header when caching is disabled.
     * The default Cache-Control: no-cache header can be disabled by setting cache to false.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionscache)
     */
    cache?: false | RouteOptionsCache | undefined;

    /**
     * An object where each key is a content-encoding name and each value is an object with the desired encoder settings. Note that decoder settings are set in compression.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionscompression)
     */
    compression?: Util.Dictionary<RouteCompressionEncoderSettings> | undefined;

    /**
     * @default false (no CORS headers).
     * The Cross-Origin Resource Sharing protocol allows browsers to make cross-origin API calls. CORS is required by web applications running inside a browser which are loaded from a different
     * domain than the API server. To enable, set cors to true, or to an object with the following options:
     * * origin - an array of allowed origin servers strings ('Access-Control-Allow-Origin'). The array can contain any combination of fully qualified origins along with origin strings containing a
     * wildcard '*' character, or a single '*' origin string. If set to 'ignore', any incoming Origin header is ignored (present or not) and the 'Access-Control-Allow-Origin' header is set to '*'.
     * Defaults to any origin ['*'].
     * * maxAge - number of seconds the browser should cache the CORS response ('Access-Control-Max-Age'). The greater the value, the longer it will take before the browser checks for changes in
     * policy. Defaults to 86400 (one day).
     * * headers - a strings array of allowed headers ('Access-Control-Allow-Headers'). Defaults to ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'].
     * * additionalHeaders - a strings array of additional headers to headers. Use this to keep the default headers in place.
     * * exposedHeaders - a strings array of exposed headers ('Access-Control-Expose-Headers'). Defaults to ['WWW-Authenticate', 'Server-Authorization'].
     * * additionalExposedHeaders - a strings array of additional headers to exposedHeaders. Use this to keep the default headers in place.
     * * credentials - if true, allows user credentials to be sent ('Access-Control-Allow-Credentials'). Defaults to false.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionscors)
     */
    cors?: boolean | RouteOptionsCors | undefined;

    /**
     * @default none.
     * Route description used for generating documentation (string).
     * This setting is not available when setting server route defaults using server.options.routes.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsdescription)
     */
    description?: string | undefined;

    /**
     * @default none.
     * Route-level request extension points by setting the option to an object with a key for each of the desired extension points ('onRequest' is not allowed), and the value is the same as the
     * server.ext(events) event argument.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsext)
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#request-lifecycle)
     */
    ext?: {
        [key in RouteRequestExtType]?: RouteExtObject | RouteExtObject[];
    } | undefined;

    /**
     * @default { relativeTo: '.' }.
     * Defines the behavior for accessing files:
     * * relativeTo - determines the folder relative paths are resolved against.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsfiles)
     */
    files?: {
        relativeTo: string;
    } | undefined;

    /**
     * @default none.
     * The route handler function performs the main business logic of the route and sets the response. handler can be assigned:
     * * a lifecycle method.
     * * an object with a single property using the name of a handler type registred with the server.handler() method. The matching property value is passed as options to the registered handler
     * generator. Note: handlers using a fat arrow style function cannot be bound to any bind property. Instead, the bound context is available under h.context.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionshandler)
     */
    handler?: Lifecycle.Method | object | undefined;

    /**
     * @default none.
     * An optional unique identifier used to look up the route using server.lookup(). Cannot be assigned to routes added with an array of methods.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsid)
     */
    id?: string | undefined;

    /**
     * @default false.
     * If true, the route cannot be accessed through the HTTP listener but only through the server.inject() interface with the allowInternals option set to true. Used for internal routes that should
     * not be accessible to the outside world.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsisinternal)
     */
    isInternal?: boolean | undefined;

    /**
     * @default none.
     * Optional arguments passed to JSON.stringify() when converting an object or error response to a string payload or escaping it after stringification. Supports the following:
     * * replacer - the replacer function or array. Defaults to no action.
     * * space - number of spaces to indent nested object keys. Defaults to no indentation.
     * * suffix - string suffix added after conversion to JSON string. Defaults to no suffix.
     * * escape - calls Hoek.jsonEscape() after conversion to JSON string. Defaults to false.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsjson)
     */
    json?: Json.StringifyArguments | undefined;

    /**
     * @default none.
     * Enables JSONP support by setting the value to the query parameter name containing the function name used to wrap the response payload.
     * For example, if the value is 'callback', a request comes in with 'callback=me', and the JSON response is '{ "a":"b" }', the payload will be 'me({ "a":"b" });'. Cannot be used with stream
     * responses. The 'Content-Type' response header is set to 'text/javascript' and the 'X-Content-Type-Options' response header is set to 'nosniff', and will override those headers even if
     * explicitly set by response.type().
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsjsonp)
     */
    jsonp?: string | undefined;

    /**
     * @default { collect: false }.
     * Request logging options:
     * collect - if true, request-level logs (both internal and application) are collected and accessible via request.logs.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionslog)
     */
    log?: {
        collect: boolean;
    } | undefined;

    /**
     * @default none.
     * Route notes used for generating documentation (string or array of strings).
     * This setting is not available when setting server route defaults using server.options.routes.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsnotes)
     */
    notes?: string | string[] | undefined;

    /**
     * Determines how the request payload is processed.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionspayload)
     */
    payload?: RouteOptionsPayload | undefined;

    /**
     * @default {}.
     * Plugin-specific configuration. plugins is an object where each key is a plugin name and the value is the plugin configuration.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsplugins)
     */
    plugins?: PluginSpecificConfiguration | undefined;

    /**
     * @default none.
     * The pre option allows defining methods for performing actions before the handler is called. These methods allow breaking the handler logic into smaller, reusable components that can be shared
     * ascross routes, as well as provide a cleaner error handling of prerequisite operations (e.g. load required reference data from a database). pre is assigned an ordered array of methods which
     * are called serially in order. If the pre array contains another array of methods as one of its elements, those methods are called in parallel. Note that during parallel execution, if any of
     * the methods error, return a takeover response, or abort signal, the other parallel methods will continue to execute but will be ignored once completed. pre can be assigned a mixed array of:
     * * an array containing the elements listed below, which are executed in parallel.
     * * an object with:
     * * * method - a lifecycle method.
     * * * assign - key name used to assign the response of the method to in request.pre and request.preResponses.
     * * * failAction - A failAction value which determine what to do when a pre-handler method throws an error. If assign is specified and the failAction setting is not 'error', the error will be
     * assigned.
     * * a method function - same as including an object with a single method key.
     * Note that pre-handler methods do not behave the same way other lifecycle methods do when a value is returned. Instead of the return value becoming the new response payload, the value is used
     * to assign the corresponding request.pre and request.preResponses properties. Otherwise, the handling of errors, takeover response response, or abort signal behave the same as any other
     * lifecycle methods.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionspre)
     */
    pre?: RouteOptionsPreArray | undefined;

    /**
     * Processing rules for the outgoing response.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsresponse)
     */
    response?: RouteOptionsResponse | undefined;

    /**
     * @default false (security headers disabled).
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionssecurity)
     */
    security?: RouteOptionsSecure | undefined;

    /**
     * @default { parse: true, failAction: 'error' }.
     * HTTP state management (cookies) allows the server to store information on the client which is sent back to the server with every request (as defined in RFC 6265). state supports the following
     * options: parse - determines if incoming 'Cookie' headers are parsed and stored in the request.state object. failAction - A failAction value which determines how to handle cookie parsing
     * errors. Defaults to 'error' (return a Bad Request (400) error response).
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsstate)
     */
    state?: {
        parse?: boolean | undefined;
        failAction?: Lifecycle.FailAction | undefined;
    } | undefined;

    /**
     * @default none.
     * Route tags used for generating documentation (array of strings).
     * This setting is not available when setting server route defaults using server.options.routes.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionstags)
     */
    tags?: string[] | undefined;

    /**
     * @default { server: false }.
     * Timeouts for processing durations.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionstimeout)
     */
    timeout?: {
        /**
         * Response timeout in milliseconds. Sets the maximum time allowed for the server to respond to an incoming request before giving up and responding with a Service Unavailable (503) error
         * response.
         */
        server?: boolean | number | undefined;

        /**
         * @default none (use node default of 2 minutes).
         * By default, node sockets automatically timeout after 2 minutes. Use this option to override this behavior. Set to false to disable socket timeouts.
         */
        socket?: boolean | number | undefined;
    } | undefined;

    /**
     * @default { headers: true, params: true, query: true, payload: true, failAction: 'error' }.
     * Request input validation rules for various request components.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsvalidate)
     */
    validate?: CustomRouteOptionsValidate<Params, Payload, Query> | undefined;
}

interface CustomRouteOptionsValidate<Params, Payload, Query> {
    /**
    * @default none.
    * An optional object with error fields copied into every validation error response.
    * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsvalidateerrorfields)
    */
    errorFields?: object | undefined;

    /**
     * @default 'error' (return a Bad Request (400) error response).
     * A failAction value which determines how to handle failed validations. When set to a function, the err argument includes the type of validation error under err.output.payload.validation.source.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsvalidatefailaction)
     */
    failAction?: Lifecycle.FailAction | undefined;

    /**
     * Validation rules for incoming request headers:
     * * If a value is returned, the value is used as the new request.headers value and the original value is stored in request.orig.headers. Otherwise, the headers are left unchanged. If an error
     * is thrown, the error is handled according to failAction. Note that all header field names must be in lowercase to match the headers normalized by node.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsvalidateheaders)
     * @default true
     */
    headers?: RouteOptionsResponseSchema | undefined;

    /**
     * An options object passed to the joi rules or the custom validation methods. Used for setting global options such as stripUnknown or abortEarly (the complete list is available here).
     * If a custom validation function (see headers, params, query, or payload above) is defined then options can an arbitrary object that will be passed to this function as the second parameter.
     * The values of the other inputs (i.e. headers, query, params, payload, app, and auth) are added to the options object under the validation context (accessible in rules as
     * Joi.ref('$query.key')).
     * Note that validation is performed in order (i.e. headers, params, query, and payload) and if type casting is used (e.g. converting a string to a number), the value of inputs not yet validated
     * will reflect the raw, unvalidated and unmodified values. If the validation rules for headers, params, query, and payload are defined at both the server routes level and at the route level, the
     * individual route settings override the routes defaults (the rules are not merged).
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsvalidateparams)
     * @default true
     */
    options?: ValidationOptions | object | undefined;

    /**
     * Validation rules for incoming request path parameters, after matching the path against the route, extracting any parameters, and storing them in request.params, where:
     * * true - any path parameter value allowed (no validation performed).
     * * a joi validation object.
     * * a validation function using the signature async function(value, options) where:
     * * * value - the request.params object containing the request path parameters.
     * * * options - options.
     * if a value is returned, the value is used as the new request.params value and the original value is stored in request.orig.params. Otherwise, the path parameters are left unchanged. If an
     * error is thrown, the error is handled according to failAction. Note that failing to match the validation rules to the route path parameters definition will cause all requests to fail.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsvalidateparams)
     * @default true
     */
    params?: Params | undefined;

    /**
     * Validation rules for incoming request payload (request body), where:
     * * If a value is returned, the value is used as the new request.payload value and the original value is stored in request.orig.payload. Otherwise, the payload is left unchanged. If an error is
     * thrown, the error is handled according to failAction. Note that validating large payloads and modifying them will cause memory duplication of the payload (since the original is kept), as well
     * as the significant performance cost of validating large amounts of data.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsvalidatepayload)
     * @default true
     */
    payload?: Payload | undefined;

    /**
     * Validation rules for incoming request URI query component (the key-value part of the URI between '?' and '#'). The query is parsed into its individual key-value pairs, decoded, and stored in
     * request.query prior to validation. Where:
     * * If a value is returned, the value is used as the new request.query value and the original value is stored in request.orig.query. Otherwise, the query parameters are left unchanged.
     * If an error
     * is thrown, the error is handled according to failAction. Note that changes to the query parameters will not be reflected in request.url.
     * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsvalidatequery)
     * @default true
     */
    query?: Query | undefined;

    /**
     * Validation rules for incoming cookies.
     * The cookie header is parsed and decoded into the request.state prior to validation.
     * @default true
     */
    state?: RouteOptionsResponseSchema | undefined;
}
/**
 * 解析Path类型安全
 * 有几种状态: 可选? , 数组*2
 * 配'/hello/{user?}/{age?}/'
 */
type ParsePath<T> = T extends `${infer R1}{${infer R2}}${infer R3}` ? ParsePartial<R2> & ParsePath<R3> : {};
type ParsePartial<T extends string> = T extends `${infer R1}?` ? Partial<Record<R1, string>> : Record<T, string>;
/**
 * 解析payload类型安全
 */
type ParsePayload<T> = T extends undefined ? (stream.Readable | Buffer | string | object) : T;
type ParseQuery<T> = T extends undefined ? (stream.Readable | Buffer | string | object) : T;
/**
 * 指定某个键为必选
 */

type RequiredKey<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
