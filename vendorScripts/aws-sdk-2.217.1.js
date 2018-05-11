_xamzrequire = function() {
    function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof _xamzrequire == "function" && _xamzrequire;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f;
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function(e) {
                    var n = t[o][1][e];
                    return s(n ? n : e);
                }, l, l.exports, e, t, n, r);
            }
            return n[o].exports;
        }
        var i = typeof _xamzrequire == "function" && _xamzrequire;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s;
    }
    return e;
}()({
    194: [ function(require, module, exports) {
        var AWS = {
            util: require("./util")
        };
        var _hidden = {};
        _hidden.toString();
        module.exports = AWS;
        AWS.util.update(AWS, {
            VERSION: "2.217.1",
            Signers: {},
            Protocol: {
                Json: require("./protocol/json"),
                Query: require("./protocol/query"),
                Rest: require("./protocol/rest"),
                RestJson: require("./protocol/rest_json"),
                RestXml: require("./protocol/rest_xml")
            },
            XML: {
                Builder: require("./xml/builder"),
                Parser: null
            },
            JSON: {
                Builder: require("./json/builder"),
                Parser: require("./json/parser")
            },
            Model: {
                Api: require("./model/api"),
                Operation: require("./model/operation"),
                Shape: require("./model/shape"),
                Paginator: require("./model/paginator"),
                ResourceWaiter: require("./model/resource_waiter")
            },
            apiLoader: require("./api_loader")
        });
        require("./service");
        require("./config");
        require("./http");
        require("./sequential_executor");
        require("./event_listeners");
        require("./request");
        require("./response");
        require("./resource_waiter");
        require("./signers/request_signer");
        require("./param_validator");
        AWS.events = new AWS.SequentialExecutor();
    }, {
        "./api_loader": 183,
        "./config": 193,
        "./event_listeners": 207,
        "./http": 208,
        "./json/builder": 210,
        "./json/parser": 211,
        "./model/api": 212,
        "./model/operation": 214,
        "./model/paginator": 215,
        "./model/resource_waiter": 216,
        "./model/shape": 217,
        "./param_validator": 218,
        "./protocol/json": 220,
        "./protocol/query": 221,
        "./protocol/rest": 222,
        "./protocol/rest_json": 223,
        "./protocol/rest_xml": 224,
        "./request": 229,
        "./resource_waiter": 230,
        "./response": 231,
        "./sequential_executor": 233,
        "./service": 234,
        "./signers/request_signer": 253,
        "./util": 261,
        "./xml/builder": 263
    } ],
    263: [ function(require, module, exports) {
        var util = require("../util");
        var builder = require("xmlbuilder");
        function XmlBuilder() {}
        XmlBuilder.prototype.toXML = function(params, shape, rootElement, noEmpty) {
            var xml = builder.create(rootElement);
            applyNamespaces(xml, shape);
            serialize(xml, params, shape);
            return xml.children.length > 0 || noEmpty ? xml.root().toString() : "";
        };
        function serialize(xml, value, shape) {
            switch (shape.type) {
              case "structure":
                return serializeStructure(xml, value, shape);

              case "map":
                return serializeMap(xml, value, shape);

              case "list":
                return serializeList(xml, value, shape);

              default:
                return serializeScalar(xml, value, shape);
            }
        }
        function serializeStructure(xml, params, shape) {
            util.arrayEach(shape.memberNames, function(memberName) {
                var memberShape = shape.members[memberName];
                if (memberShape.location !== "body") return;
                var value = params[memberName];
                var name = memberShape.name;
                if (value !== undefined && value !== null) {
                    if (memberShape.isXmlAttribute) {
                        xml.att(name, value);
                    } else if (memberShape.flattened) {
                        serialize(xml, value, memberShape);
                    } else {
                        var element = xml.ele(name);
                        applyNamespaces(element, memberShape);
                        serialize(element, value, memberShape);
                    }
                }
            });
        }
        function serializeMap(xml, map, shape) {
            var xmlKey = shape.key.name || "key";
            var xmlValue = shape.value.name || "value";
            util.each(map, function(key, value) {
                var entry = xml.ele(shape.flattened ? shape.name : "entry");
                serialize(entry.ele(xmlKey), key, shape.key);
                serialize(entry.ele(xmlValue), value, shape.value);
            });
        }
        function serializeList(xml, list, shape) {
            if (shape.flattened) {
                util.arrayEach(list, function(value) {
                    var name = shape.member.name || shape.name;
                    var element = xml.ele(name);
                    serialize(element, value, shape.member);
                });
            } else {
                util.arrayEach(list, function(value) {
                    var name = shape.member.name || "member";
                    var element = xml.ele(name);
                    serialize(element, value, shape.member);
                });
            }
        }
        function serializeScalar(xml, value, shape) {
            xml.txt(shape.toWireFormat(value));
        }
        function applyNamespaces(xml, shape) {
            var uri, prefix = "xmlns";
            if (shape.xmlNamespaceUri) {
                uri = shape.xmlNamespaceUri;
                if (shape.xmlNamespacePrefix) prefix += ":" + shape.xmlNamespacePrefix;
            } else if (xml.isRoot && shape.api.xmlNamespaceUri) {
                uri = shape.api.xmlNamespaceUri;
            }
            if (uri) xml.att(prefix, uri);
        }
        module.exports = XmlBuilder;
    }, {
        "../util": 261,
        xmlbuilder: 181
    } ],
    253: [ function(require, module, exports) {
        var AWS = require("../core");
        var inherit = AWS.util.inherit;
        AWS.Signers.RequestSigner = inherit({
            constructor: function RequestSigner(request) {
                this.request = request;
            },
            setServiceClientId: function setServiceClientId(id) {
                this.serviceClientId = id;
            },
            getServiceClientId: function getServiceClientId() {
                return this.serviceClientId;
            }
        });
        AWS.Signers.RequestSigner.getVersion = function getVersion(version) {
            switch (version) {
              case "v2":
                return AWS.Signers.V2;

              case "v3":
                return AWS.Signers.V3;

              case "v4":
                return AWS.Signers.V4;

              case "s3":
                return AWS.Signers.S3;

              case "v3https":
                return AWS.Signers.V3Https;
            }
            throw new Error("Unknown signing version " + version);
        };
        require("./v2");
        require("./v3");
        require("./v3https");
        require("./v4");
        require("./s3");
        require("./presign");
    }, {
        "../core": 194,
        "./presign": 252,
        "./s3": 254,
        "./v2": 255,
        "./v3": 256,
        "./v3https": 257,
        "./v4": 258
    } ],
    258: [ function(require, module, exports) {
        var AWS = require("../core");
        var v4Credentials = require("./v4_credentials");
        var inherit = AWS.util.inherit;
        var expiresHeader = "presigned-expires";
        AWS.Signers.V4 = inherit(AWS.Signers.RequestSigner, {
            constructor: function V4(request, serviceName, options) {
                AWS.Signers.RequestSigner.call(this, request);
                this.serviceName = serviceName;
                options = options || {};
                this.signatureCache = typeof options.signatureCache === "boolean" ? options.signatureCache : true;
                this.operation = options.operation;
            },
            algorithm: "AWS4-HMAC-SHA256",
            addAuthorization: function addAuthorization(credentials, date) {
                var datetime = AWS.util.date.iso8601(date).replace(/[:\-]|\.\d{3}/g, "");
                if (this.isPresigned()) {
                    this.updateForPresigned(credentials, datetime);
                } else {
                    this.addHeaders(credentials, datetime);
                }
                this.request.headers["Authorization"] = this.authorization(credentials, datetime);
            },
            addHeaders: function addHeaders(credentials, datetime) {
                this.request.headers["X-Amz-Date"] = datetime;
                if (credentials.sessionToken) {
                    this.request.headers["x-amz-security-token"] = credentials.sessionToken;
                }
            },
            updateForPresigned: function updateForPresigned(credentials, datetime) {
                var credString = this.credentialString(datetime);
                var qs = {
                    "X-Amz-Date": datetime,
                    "X-Amz-Algorithm": this.algorithm,
                    "X-Amz-Credential": credentials.accessKeyId + "/" + credString,
                    "X-Amz-Expires": this.request.headers[expiresHeader],
                    "X-Amz-SignedHeaders": this.signedHeaders()
                };
                if (credentials.sessionToken) {
                    qs["X-Amz-Security-Token"] = credentials.sessionToken;
                }
                if (this.request.headers["Content-Type"]) {
                    qs["Content-Type"] = this.request.headers["Content-Type"];
                }
                if (this.request.headers["Content-MD5"]) {
                    qs["Content-MD5"] = this.request.headers["Content-MD5"];
                }
                if (this.request.headers["Cache-Control"]) {
                    qs["Cache-Control"] = this.request.headers["Cache-Control"];
                }
                AWS.util.each.call(this, this.request.headers, function(key, value) {
                    if (key === expiresHeader) return;
                    if (this.isSignableHeader(key)) {
                        var lowerKey = key.toLowerCase();
                        if (lowerKey.indexOf("x-amz-meta-") === 0) {
                            qs[lowerKey] = value;
                        } else if (lowerKey.indexOf("x-amz-") === 0) {
                            qs[key] = value;
                        }
                    }
                });
                var sep = this.request.path.indexOf("?") >= 0 ? "&" : "?";
                this.request.path += sep + AWS.util.queryParamsToString(qs);
            },
            authorization: function authorization(credentials, datetime) {
                var parts = [];
                var credString = this.credentialString(datetime);
                parts.push(this.algorithm + " Credential=" + credentials.accessKeyId + "/" + credString);
                parts.push("SignedHeaders=" + this.signedHeaders());
                parts.push("Signature=" + this.signature(credentials, datetime));
                return parts.join(", ");
            },
            signature: function signature(credentials, datetime) {
                var signingKey = v4Credentials.getSigningKey(credentials, datetime.substr(0, 8), this.request.region, this.serviceName, this.signatureCache);
                return AWS.util.crypto.hmac(signingKey, this.stringToSign(datetime), "hex");
            },
            stringToSign: function stringToSign(datetime) {
                var parts = [];
                parts.push("AWS4-HMAC-SHA256");
                parts.push(datetime);
                parts.push(this.credentialString(datetime));
                parts.push(this.hexEncodedHash(this.canonicalString()));
                return parts.join("\n");
            },
            canonicalString: function canonicalString() {
                var parts = [], pathname = this.request.pathname();
                if (this.serviceName !== "s3") pathname = AWS.util.uriEscapePath(pathname);
                parts.push(this.request.method);
                parts.push(pathname);
                parts.push(this.request.search());
                parts.push(this.canonicalHeaders() + "\n");
                parts.push(this.signedHeaders());
                parts.push(this.hexEncodedBodyHash());
                return parts.join("\n");
            },
            canonicalHeaders: function canonicalHeaders() {
                var headers = [];
                AWS.util.each.call(this, this.request.headers, function(key, item) {
                    headers.push([ key, item ]);
                });
                headers.sort(function(a, b) {
                    return a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1;
                });
                var parts = [];
                AWS.util.arrayEach.call(this, headers, function(item) {
                    var key = item[0].toLowerCase();
                    if (this.isSignableHeader(key)) {
                        var value = item[1];
                        if (typeof value === "undefined" || value === null || typeof value.toString !== "function") {
                            throw AWS.util.error(new Error("Header " + key + " contains invalid value"), {
                                code: "InvalidHeader"
                            });
                        }
                        parts.push(key + ":" + this.canonicalHeaderValues(value.toString()));
                    }
                });
                return parts.join("\n");
            },
            canonicalHeaderValues: function canonicalHeaderValues(values) {
                return values.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
            },
            signedHeaders: function signedHeaders() {
                var keys = [];
                AWS.util.each.call(this, this.request.headers, function(key) {
                    key = key.toLowerCase();
                    if (this.isSignableHeader(key)) keys.push(key);
                });
                return keys.sort().join(";");
            },
            credentialString: function credentialString(datetime) {
                return v4Credentials.createScope(datetime.substr(0, 8), this.request.region, this.serviceName);
            },
            hexEncodedHash: function hash(string) {
                return AWS.util.crypto.sha256(string, "hex");
            },
            hexEncodedBodyHash: function hexEncodedBodyHash() {
                var request = this.request;
                if (this.isPresigned() && this.serviceName === "s3" && !request.body) {
                    return "UNSIGNED-PAYLOAD";
                } else if (request.headers["X-Amz-Content-Sha256"]) {
                    return request.headers["X-Amz-Content-Sha256"];
                } else {
                    return this.hexEncodedHash(this.request.body || "");
                }
            },
            unsignableHeaders: [ "authorization", "content-type", "content-length", "user-agent", expiresHeader, "expect", "x-amzn-trace-id" ],
            isSignableHeader: function isSignableHeader(key) {
                if (key.toLowerCase().indexOf("x-amz-") === 0) return true;
                return this.unsignableHeaders.indexOf(key) < 0;
            },
            isPresigned: function isPresigned() {
                return this.request.headers[expiresHeader] ? true : false;
            }
        });
        module.exports = AWS.Signers.V4;
    }, {
        "../core": 194,
        "./v4_credentials": 259
    } ],
    259: [ function(require, module, exports) {
        var AWS = require("../core");
        var cachedSecret = {};
        var cacheQueue = [];
        var maxCacheEntries = 50;
        var v4Identifier = "aws4_request";
        module.exports = {
            createScope: function createScope(date, region, serviceName) {
                return [ date.substr(0, 8), region, serviceName, v4Identifier ].join("/");
            },
            getSigningKey: function getSigningKey(credentials, date, region, service, shouldCache) {
                var credsIdentifier = AWS.util.crypto.hmac(credentials.secretAccessKey, credentials.accessKeyId, "base64");
                var cacheKey = [ credsIdentifier, date, region, service ].join("_");
                shouldCache = shouldCache !== false;
                if (shouldCache && cacheKey in cachedSecret) {
                    return cachedSecret[cacheKey];
                }
                var kDate = AWS.util.crypto.hmac("AWS4" + credentials.secretAccessKey, date, "buffer");
                var kRegion = AWS.util.crypto.hmac(kDate, region, "buffer");
                var kService = AWS.util.crypto.hmac(kRegion, service, "buffer");
                var signingKey = AWS.util.crypto.hmac(kService, v4Identifier, "buffer");
                if (shouldCache) {
                    cachedSecret[cacheKey] = signingKey;
                    cacheQueue.push(cacheKey);
                    if (cacheQueue.length > maxCacheEntries) {
                        delete cachedSecret[cacheQueue.shift()];
                    }
                }
                return signingKey;
            },
            emptyCache: function emptyCache() {
                cachedSecret = {};
                cacheQueue = [];
            }
        };
    }, {
        "../core": 194
    } ],
    257: [ function(require, module, exports) {
        var AWS = require("../core");
        var inherit = AWS.util.inherit;
        require("./v3");
        AWS.Signers.V3Https = inherit(AWS.Signers.V3, {
            authorization: function authorization(credentials) {
                return "AWS3-HTTPS " + "AWSAccessKeyId=" + credentials.accessKeyId + "," + "Algorithm=HmacSHA256," + "Signature=" + this.signature(credentials);
            },
            stringToSign: function stringToSign() {
                return this.request.headers["X-Amz-Date"];
            }
        });
        module.exports = AWS.Signers.V3Https;
    }, {
        "../core": 194,
        "./v3": 256
    } ],
    256: [ function(require, module, exports) {
        var AWS = require("../core");
        var inherit = AWS.util.inherit;
        AWS.Signers.V3 = inherit(AWS.Signers.RequestSigner, {
            addAuthorization: function addAuthorization(credentials, date) {
                var datetime = AWS.util.date.rfc822(date);
                this.request.headers["X-Amz-Date"] = datetime;
                if (credentials.sessionToken) {
                    this.request.headers["x-amz-security-token"] = credentials.sessionToken;
                }
                this.request.headers["X-Amzn-Authorization"] = this.authorization(credentials, datetime);
            },
            authorization: function authorization(credentials) {
                return "AWS3 " + "AWSAccessKeyId=" + credentials.accessKeyId + "," + "Algorithm=HmacSHA256," + "SignedHeaders=" + this.signedHeaders() + "," + "Signature=" + this.signature(credentials);
            },
            signedHeaders: function signedHeaders() {
                var headers = [];
                AWS.util.arrayEach(this.headersToSign(), function iterator(h) {
                    headers.push(h.toLowerCase());
                });
                return headers.sort().join(";");
            },
            canonicalHeaders: function canonicalHeaders() {
                var headers = this.request.headers;
                var parts = [];
                AWS.util.arrayEach(this.headersToSign(), function iterator(h) {
                    parts.push(h.toLowerCase().trim() + ":" + String(headers[h]).trim());
                });
                return parts.sort().join("\n") + "\n";
            },
            headersToSign: function headersToSign() {
                var headers = [];
                AWS.util.each(this.request.headers, function iterator(k) {
                    if (k === "Host" || k === "Content-Encoding" || k.match(/^X-Amz/i)) {
                        headers.push(k);
                    }
                });
                return headers;
            },
            signature: function signature(credentials) {
                return AWS.util.crypto.hmac(credentials.secretAccessKey, this.stringToSign(), "base64");
            },
            stringToSign: function stringToSign() {
                var parts = [];
                parts.push(this.request.method);
                parts.push("/");
                parts.push("");
                parts.push(this.canonicalHeaders());
                parts.push(this.request.body);
                return AWS.util.crypto.sha256(parts.join("\n"));
            }
        });
        module.exports = AWS.Signers.V3;
    }, {
        "../core": 194
    } ],
    255: [ function(require, module, exports) {
        var AWS = require("../core");
        var inherit = AWS.util.inherit;
        AWS.Signers.V2 = inherit(AWS.Signers.RequestSigner, {
            addAuthorization: function addAuthorization(credentials, date) {
                if (!date) date = AWS.util.date.getDate();
                var r = this.request;
                r.params.Timestamp = AWS.util.date.iso8601(date);
                r.params.SignatureVersion = "2";
                r.params.SignatureMethod = "HmacSHA256";
                r.params.AWSAccessKeyId = credentials.accessKeyId;
                if (credentials.sessionToken) {
                    r.params.SecurityToken = credentials.sessionToken;
                }
                delete r.params.Signature;
                r.params.Signature = this.signature(credentials);
                r.body = AWS.util.queryParamsToString(r.params);
                r.headers["Content-Length"] = r.body.length;
            },
            signature: function signature(credentials) {
                return AWS.util.crypto.hmac(credentials.secretAccessKey, this.stringToSign(), "base64");
            },
            stringToSign: function stringToSign() {
                var parts = [];
                parts.push(this.request.method);
                parts.push(this.request.endpoint.host.toLowerCase());
                parts.push(this.request.pathname());
                parts.push(AWS.util.queryParamsToString(this.request.params));
                return parts.join("\n");
            }
        });
        module.exports = AWS.Signers.V2;
    }, {
        "../core": 194
    } ],
    254: [ function(require, module, exports) {
        var AWS = require("../core");
        var inherit = AWS.util.inherit;
        AWS.Signers.S3 = inherit(AWS.Signers.RequestSigner, {
            subResources: {
                acl: 1,
                accelerate: 1,
                analytics: 1,
                cors: 1,
                lifecycle: 1,
                delete: 1,
                inventory: 1,
                location: 1,
                logging: 1,
                metrics: 1,
                notification: 1,
                partNumber: 1,
                policy: 1,
                requestPayment: 1,
                replication: 1,
                restore: 1,
                tagging: 1,
                torrent: 1,
                uploadId: 1,
                uploads: 1,
                versionId: 1,
                versioning: 1,
                versions: 1,
                website: 1
            },
            responseHeaders: {
                "response-content-type": 1,
                "response-content-language": 1,
                "response-expires": 1,
                "response-cache-control": 1,
                "response-content-disposition": 1,
                "response-content-encoding": 1
            },
            addAuthorization: function addAuthorization(credentials, date) {
                if (!this.request.headers["presigned-expires"]) {
                    this.request.headers["X-Amz-Date"] = AWS.util.date.rfc822(date);
                }
                if (credentials.sessionToken) {
                    this.request.headers["x-amz-security-token"] = credentials.sessionToken;
                }
                var signature = this.sign(credentials.secretAccessKey, this.stringToSign());
                var auth = "AWS " + credentials.accessKeyId + ":" + signature;
                this.request.headers["Authorization"] = auth;
            },
            stringToSign: function stringToSign() {
                var r = this.request;
                var parts = [];
                parts.push(r.method);
                parts.push(r.headers["Content-MD5"] || "");
                parts.push(r.headers["Content-Type"] || "");
                parts.push(r.headers["presigned-expires"] || "");
                var headers = this.canonicalizedAmzHeaders();
                if (headers) parts.push(headers);
                parts.push(this.canonicalizedResource());
                return parts.join("\n");
            },
            canonicalizedAmzHeaders: function canonicalizedAmzHeaders() {
                var amzHeaders = [];
                AWS.util.each(this.request.headers, function(name) {
                    if (name.match(/^x-amz-/i)) amzHeaders.push(name);
                });
                amzHeaders.sort(function(a, b) {
                    return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
                });
                var parts = [];
                AWS.util.arrayEach.call(this, amzHeaders, function(name) {
                    parts.push(name.toLowerCase() + ":" + String(this.request.headers[name]));
                });
                return parts.join("\n");
            },
            canonicalizedResource: function canonicalizedResource() {
                var r = this.request;
                var parts = r.path.split("?");
                var path = parts[0];
                var querystring = parts[1];
                var resource = "";
                if (r.virtualHostedBucket) resource += "/" + r.virtualHostedBucket;
                resource += path;
                if (querystring) {
                    var resources = [];
                    AWS.util.arrayEach.call(this, querystring.split("&"), function(param) {
                        var name = param.split("=")[0];
                        var value = param.split("=")[1];
                        if (this.subResources[name] || this.responseHeaders[name]) {
                            var subresource = {
                                name: name
                            };
                            if (value !== undefined) {
                                if (this.subResources[name]) {
                                    subresource.value = value;
                                } else {
                                    subresource.value = decodeURIComponent(value);
                                }
                            }
                            resources.push(subresource);
                        }
                    });
                    resources.sort(function(a, b) {
                        return a.name < b.name ? -1 : 1;
                    });
                    if (resources.length) {
                        querystring = [];
                        AWS.util.arrayEach(resources, function(res) {
                            if (res.value === undefined) {
                                querystring.push(res.name);
                            } else {
                                querystring.push(res.name + "=" + res.value);
                            }
                        });
                        resource += "?" + querystring.join("&");
                    }
                }
                return resource;
            },
            sign: function sign(secret, string) {
                return AWS.util.crypto.hmac(secret, string, "base64", "sha1");
            }
        });
        module.exports = AWS.Signers.S3;
    }, {
        "../core": 194
    } ],
    252: [ function(require, module, exports) {
        var AWS = require("../core");
        var inherit = AWS.util.inherit;
        var expiresHeader = "presigned-expires";
        function signedUrlBuilder(request) {
            var expires = request.httpRequest.headers[expiresHeader];
            var signerClass = request.service.getSignerClass(request);
            delete request.httpRequest.headers["User-Agent"];
            delete request.httpRequest.headers["X-Amz-User-Agent"];
            if (signerClass === AWS.Signers.V4) {
                if (expires > 604800) {
                    var message = "Presigning does not support expiry time greater " + "than a week with SigV4 signing.";
                    throw AWS.util.error(new Error(), {
                        code: "InvalidExpiryTime",
                        message: message,
                        retryable: false
                    });
                }
                request.httpRequest.headers[expiresHeader] = expires;
            } else if (signerClass === AWS.Signers.S3) {
                var now = request.service ? request.service.getSkewCorrectedDate() : AWS.util.date.getDate();
                request.httpRequest.headers[expiresHeader] = parseInt(AWS.util.date.unixTimestamp(now) + expires, 10).toString();
            } else {
                throw AWS.util.error(new Error(), {
                    message: "Presigning only supports S3 or SigV4 signing.",
                    code: "UnsupportedSigner",
                    retryable: false
                });
            }
        }
        function signedUrlSigner(request) {
            var endpoint = request.httpRequest.endpoint;
            var parsedUrl = AWS.util.urlParse(request.httpRequest.path);
            var queryParams = {};
            if (parsedUrl.search) {
                queryParams = AWS.util.queryStringParse(parsedUrl.search.substr(1));
            }
            var auth = request.httpRequest.headers["Authorization"].split(" ");
            if (auth[0] === "AWS") {
                auth = auth[1].split(":");
                queryParams["AWSAccessKeyId"] = auth[0];
                queryParams["Signature"] = auth[1];
                AWS.util.each(request.httpRequest.headers, function(key, value) {
                    if (key === expiresHeader) key = "Expires";
                    if (key.indexOf("x-amz-meta-") === 0) {
                        delete queryParams[key];
                        key = key.toLowerCase();
                    }
                    queryParams[key] = value;
                });
                delete request.httpRequest.headers[expiresHeader];
                delete queryParams["Authorization"];
                delete queryParams["Host"];
            } else if (auth[0] === "AWS4-HMAC-SHA256") {
                auth.shift();
                var rest = auth.join(" ");
                var signature = rest.match(/Signature=(.*?)(?:,|\s|\r?\n|$)/)[1];
                queryParams["X-Amz-Signature"] = signature;
                delete queryParams["Expires"];
            }
            endpoint.pathname = parsedUrl.pathname;
            endpoint.search = AWS.util.queryParamsToString(queryParams);
        }
        AWS.Signers.Presign = inherit({
            sign: function sign(request, expireTime, callback) {
                request.httpRequest.headers[expiresHeader] = expireTime || 3600;
                request.on("build", signedUrlBuilder);
                request.on("sign", signedUrlSigner);
                request.removeListener("afterBuild", AWS.EventListeners.Core.SET_CONTENT_LENGTH);
                request.removeListener("afterBuild", AWS.EventListeners.Core.COMPUTE_SHA256);
                request.emit("beforePresign", [ request ]);
                if (callback) {
                    request.build(function() {
                        if (this.response.error) callback(this.response.error); else {
                            callback(null, AWS.util.urlFormat(request.httpRequest.endpoint));
                        }
                    });
                } else {
                    request.build();
                    if (request.response.error) throw request.response.error;
                    return AWS.util.urlFormat(request.httpRequest.endpoint);
                }
            }
        });
        module.exports = AWS.Signers.Presign;
    }, {
        "../core": 194
    } ],
    234: [ function(require, module, exports) {
        var AWS = require("./core");
        var Api = require("./model/api");
        var regionConfig = require("./region_config");
        var inherit = AWS.util.inherit;
        var clientCount = 0;
        AWS.Service = inherit({
            constructor: function Service(config) {
                if (!this.loadServiceClass) {
                    throw AWS.util.error(new Error(), "Service must be constructed with `new' operator");
                }
                var ServiceClass = this.loadServiceClass(config || {});
                if (ServiceClass) {
                    var originalConfig = AWS.util.copy(config);
                    var svc = new ServiceClass(config);
                    Object.defineProperty(svc, "_originalConfig", {
                        get: function() {
                            return originalConfig;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    svc._clientId = ++clientCount;
                    return svc;
                }
                this.initialize(config);
            },
            initialize: function initialize(config) {
                var svcConfig = AWS.config[this.serviceIdentifier];
                this.config = new AWS.Config(AWS.config);
                if (svcConfig) this.config.update(svcConfig, true);
                if (config) this.config.update(config, true);
                this.validateService();
                if (!this.config.endpoint) regionConfig(this);
                this.config.endpoint = this.endpointFromTemplate(this.config.endpoint);
                this.setEndpoint(this.config.endpoint);
            },
            validateService: function validateService() {},
            loadServiceClass: function loadServiceClass(serviceConfig) {
                var config = serviceConfig;
                if (!AWS.util.isEmpty(this.api)) {
                    return null;
                } else if (config.apiConfig) {
                    return AWS.Service.defineServiceApi(this.constructor, config.apiConfig);
                } else if (!this.constructor.services) {
                    return null;
                } else {
                    config = new AWS.Config(AWS.config);
                    config.update(serviceConfig, true);
                    var version = config.apiVersions[this.constructor.serviceIdentifier];
                    version = version || config.apiVersion;
                    return this.getLatestServiceClass(version);
                }
            },
            getLatestServiceClass: function getLatestServiceClass(version) {
                version = this.getLatestServiceVersion(version);
                if (this.constructor.services[version] === null) {
                    AWS.Service.defineServiceApi(this.constructor, version);
                }
                return this.constructor.services[version];
            },
            getLatestServiceVersion: function getLatestServiceVersion(version) {
                if (!this.constructor.services || this.constructor.services.length === 0) {
                    throw new Error("No services defined on " + this.constructor.serviceIdentifier);
                }
                if (!version) {
                    version = "latest";
                } else if (AWS.util.isType(version, Date)) {
                    version = AWS.util.date.iso8601(version).split("T")[0];
                }
                if (Object.hasOwnProperty(this.constructor.services, version)) {
                    return version;
                }
                var keys = Object.keys(this.constructor.services).sort();
                var selectedVersion = null;
                for (var i = keys.length - 1; i >= 0; i--) {
                    if (keys[i][keys[i].length - 1] !== "*") {
                        selectedVersion = keys[i];
                    }
                    if (keys[i].substr(0, 10) <= version) {
                        return selectedVersion;
                    }
                }
                throw new Error("Could not find " + this.constructor.serviceIdentifier + " API to satisfy version constraint `" + version + "'");
            },
            api: {},
            defaultRetryCount: 3,
            customizeRequests: function customizeRequests(callback) {
                if (!callback) {
                    this.customRequestHandler = null;
                } else if (typeof callback === "function") {
                    this.customRequestHandler = callback;
                } else {
                    throw new Error("Invalid callback type '" + typeof callback + "' provided in customizeRequests");
                }
            },
            makeRequest: function makeRequest(operation, params, callback) {
                if (typeof params === "function") {
                    callback = params;
                    params = null;
                }
                params = params || {};
                if (this.config.params) {
                    var rules = this.api.operations[operation];
                    if (rules) {
                        params = AWS.util.copy(params);
                        AWS.util.each(this.config.params, function(key, value) {
                            if (rules.input.members[key]) {
                                if (params[key] === undefined || params[key] === null) {
                                    params[key] = value;
                                }
                            }
                        });
                    }
                }
                var request = new AWS.Request(this, operation, params);
                this.addAllRequestListeners(request);
                if (callback) request.send(callback);
                return request;
            },
            makeUnauthenticatedRequest: function makeUnauthenticatedRequest(operation, params, callback) {
                if (typeof params === "function") {
                    callback = params;
                    params = {};
                }
                var request = this.makeRequest(operation, params).toUnauthenticated();
                return callback ? request.send(callback) : request;
            },
            waitFor: function waitFor(state, params, callback) {
                var waiter = new AWS.ResourceWaiter(this, state);
                return waiter.wait(params, callback);
            },
            addAllRequestListeners: function addAllRequestListeners(request) {
                var list = [ AWS.events, AWS.EventListeners.Core, this.serviceInterface(), AWS.EventListeners.CorePost ];
                for (var i = 0; i < list.length; i++) {
                    if (list[i]) request.addListeners(list[i]);
                }
                if (!this.config.paramValidation) {
                    request.removeListener("validate", AWS.EventListeners.Core.VALIDATE_PARAMETERS);
                }
                if (this.config.logger) {
                    request.addListeners(AWS.EventListeners.Logger);
                }
                this.setupRequestListeners(request);
                if (typeof this.constructor.prototype.customRequestHandler === "function") {
                    this.constructor.prototype.customRequestHandler(request);
                }
                if (Object.prototype.hasOwnProperty.call(this, "customRequestHandler") && typeof this.customRequestHandler === "function") {
                    this.customRequestHandler(request);
                }
            },
            setupRequestListeners: function setupRequestListeners() {},
            getSignerClass: function getSignerClass(request) {
                var version;
                var operation = null;
                var authtype = "";
                if (request) {
                    var operations = request.service.api.operations || {};
                    operation = operations[request.operation] || null;
                    authtype = operation ? operation.authtype : "";
                }
                if (this.config.signatureVersion) {
                    version = this.config.signatureVersion;
                } else if (authtype === "v4" || authtype === "v4-unsigned-body") {
                    version = "v4";
                } else {
                    version = this.api.signatureVersion;
                }
                return AWS.Signers.RequestSigner.getVersion(version);
            },
            serviceInterface: function serviceInterface() {
                switch (this.api.protocol) {
                  case "ec2":
                    return AWS.EventListeners.Query;

                  case "query":
                    return AWS.EventListeners.Query;

                  case "json":
                    return AWS.EventListeners.Json;

                  case "rest-json":
                    return AWS.EventListeners.RestJson;

                  case "rest-xml":
                    return AWS.EventListeners.RestXml;
                }
                if (this.api.protocol) {
                    throw new Error("Invalid service `protocol' " + this.api.protocol + " in API config");
                }
            },
            successfulResponse: function successfulResponse(resp) {
                return resp.httpResponse.statusCode < 300;
            },
            numRetries: function numRetries() {
                if (this.config.maxRetries !== undefined) {
                    return this.config.maxRetries;
                } else {
                    return this.defaultRetryCount;
                }
            },
            retryDelays: function retryDelays(retryCount) {
                return AWS.util.calculateRetryDelay(retryCount, this.config.retryDelayOptions);
            },
            retryableError: function retryableError(error) {
                if (this.timeoutError(error)) return true;
                if (this.networkingError(error)) return true;
                if (this.expiredCredentialsError(error)) return true;
                if (this.throttledError(error)) return true;
                if (error.statusCode >= 500) return true;
                return false;
            },
            networkingError: function networkingError(error) {
                return error.code === "NetworkingError";
            },
            timeoutError: function timeoutError(error) {
                return error.code === "TimeoutError";
            },
            expiredCredentialsError: function expiredCredentialsError(error) {
                return error.code === "ExpiredTokenException";
            },
            clockSkewError: function clockSkewError(error) {
                switch (error.code) {
                  case "RequestTimeTooSkewed":
                  case "RequestExpired":
                  case "InvalidSignatureException":
                  case "SignatureDoesNotMatch":
                  case "AuthFailure":
                  case "RequestInTheFuture":
                    return true;

                  default:
                    return false;
                }
            },
            getSkewCorrectedDate: function getSkewCorrectedDate() {
                return new Date(Date.now() + this.config.systemClockOffset);
            },
            applyClockOffset: function applyClockOffset(newServerTime) {
                if (newServerTime) {
                    this.config.systemClockOffset = newServerTime - Date.now();
                }
            },
            isClockSkewed: function isClockSkewed(newServerTime) {
                if (newServerTime) {
                    return Math.abs(this.getSkewCorrectedDate().getTime() - newServerTime) >= 3e4;
                }
            },
            throttledError: function throttledError(error) {
                switch (error.code) {
                  case "ProvisionedThroughputExceededException":
                  case "Throttling":
                  case "ThrottlingException":
                  case "RequestLimitExceeded":
                  case "RequestThrottled":
                    return true;

                  default:
                    return false;
                }
            },
            endpointFromTemplate: function endpointFromTemplate(endpoint) {
                if (typeof endpoint !== "string") return endpoint;
                var e = endpoint;
                e = e.replace(/\{service\}/g, this.api.endpointPrefix);
                e = e.replace(/\{region\}/g, this.config.region);
                e = e.replace(/\{scheme\}/g, this.config.sslEnabled ? "https" : "http");
                return e;
            },
            setEndpoint: function setEndpoint(endpoint) {
                this.endpoint = new AWS.Endpoint(endpoint, this.config);
            },
            paginationConfig: function paginationConfig(operation, throwException) {
                var paginator = this.api.operations[operation].paginator;
                if (!paginator) {
                    if (throwException) {
                        var e = new Error();
                        throw AWS.util.error(e, "No pagination configuration for " + operation);
                    }
                    return null;
                }
                return paginator;
            }
        });
        AWS.util.update(AWS.Service, {
            defineMethods: function defineMethods(svc) {
                AWS.util.each(svc.prototype.api.operations, function iterator(method) {
                    if (svc.prototype[method]) return;
                    var operation = svc.prototype.api.operations[method];
                    if (operation.authtype === "none") {
                        svc.prototype[method] = function(params, callback) {
                            return this.makeUnauthenticatedRequest(method, params, callback);
                        };
                    } else {
                        svc.prototype[method] = function(params, callback) {
                            return this.makeRequest(method, params, callback);
                        };
                    }
                });
            },
            defineService: function defineService(serviceIdentifier, versions, features) {
                AWS.Service._serviceMap[serviceIdentifier] = true;
                if (!Array.isArray(versions)) {
                    features = versions;
                    versions = [];
                }
                var svc = inherit(AWS.Service, features || {});
                if (typeof serviceIdentifier === "string") {
                    AWS.Service.addVersions(svc, versions);
                    var identifier = svc.serviceIdentifier || serviceIdentifier;
                    svc.serviceIdentifier = identifier;
                } else {
                    svc.prototype.api = serviceIdentifier;
                    AWS.Service.defineMethods(svc);
                }
                return svc;
            },
            addVersions: function addVersions(svc, versions) {
                if (!Array.isArray(versions)) versions = [ versions ];
                svc.services = svc.services || {};
                for (var i = 0; i < versions.length; i++) {
                    if (svc.services[versions[i]] === undefined) {
                        svc.services[versions[i]] = null;
                    }
                }
                svc.apiVersions = Object.keys(svc.services).sort();
            },
            defineServiceApi: function defineServiceApi(superclass, version, apiConfig) {
                var svc = inherit(superclass, {
                    serviceIdentifier: superclass.serviceIdentifier
                });
                function setApi(api) {
                    if (api.isApi) {
                        svc.prototype.api = api;
                    } else {
                        svc.prototype.api = new Api(api);
                    }
                }
                if (typeof version === "string") {
                    if (apiConfig) {
                        setApi(apiConfig);
                    } else {
                        try {
                            setApi(AWS.apiLoader(superclass.serviceIdentifier, version));
                        } catch (err) {
                            throw AWS.util.error(err, {
                                message: "Could not find API configuration " + superclass.serviceIdentifier + "-" + version
                            });
                        }
                    }
                    if (!Object.prototype.hasOwnProperty.call(superclass.services, version)) {
                        superclass.apiVersions = superclass.apiVersions.concat(version).sort();
                    }
                    superclass.services[version] = svc;
                } else {
                    setApi(version);
                }
                AWS.Service.defineMethods(svc);
                return svc;
            },
            hasService: function(identifier) {
                return Object.prototype.hasOwnProperty.call(AWS.Service._serviceMap, identifier);
            },
            _serviceMap: {}
        });
        module.exports = AWS.Service;
    }, {
        "./core": 194,
        "./model/api": 212,
        "./region_config": 227
    } ],
    227: [ function(require, module, exports) {
        var util = require("./util");
        var regionConfig = require("./region_config_data.json");
        function generateRegionPrefix(region) {
            if (!region) return null;
            var parts = region.split("-");
            if (parts.length < 3) return null;
            return parts.slice(0, parts.length - 2).join("-") + "-*";
        }
        function derivedKeys(service) {
            var region = service.config.region;
            var regionPrefix = generateRegionPrefix(region);
            var endpointPrefix = service.api.endpointPrefix;
            return [ [ region, endpointPrefix ], [ regionPrefix, endpointPrefix ], [ region, "*" ], [ regionPrefix, "*" ], [ "*", endpointPrefix ], [ "*", "*" ] ].map(function(item) {
                return item[0] && item[1] ? item.join("/") : null;
            });
        }
        function applyConfig(service, config) {
            util.each(config, function(key, value) {
                if (key === "globalEndpoint") return;
                if (service.config[key] === undefined || service.config[key] === null) {
                    service.config[key] = value;
                }
            });
        }
        function configureEndpoint(service) {
            var keys = derivedKeys(service);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (!key) continue;
                if (Object.prototype.hasOwnProperty.call(regionConfig.rules, key)) {
                    var config = regionConfig.rules[key];
                    if (typeof config === "string") {
                        config = regionConfig.patterns[config];
                    }
                    if (service.config.useDualstack && util.isDualstackAvailable(service)) {
                        config = util.copy(config);
                        config.endpoint = "{service}.dualstack.{region}.amazonaws.com";
                    }
                    service.isGlobalEndpoint = !!config.globalEndpoint;
                    if (!config.signatureVersion) config.signatureVersion = "v4";
                    applyConfig(service, config);
                    return;
                }
            }
        }
        module.exports = configureEndpoint;
    }, {
        "./region_config_data.json": 228,
        "./util": 261
    } ],
    228: [ function(require, module, exports) {
        module.exports = {
            rules: {
                "*/*": {
                    endpoint: "{service}.{region}.amazonaws.com"
                },
                "cn-*/*": {
                    endpoint: "{service}.{region}.amazonaws.com.cn"
                },
                "*/budgets": "globalSSL",
                "*/cloudfront": "globalSSL",
                "*/iam": "globalSSL",
                "*/sts": "globalSSL",
                "*/importexport": {
                    endpoint: "{service}.amazonaws.com",
                    signatureVersion: "v2",
                    globalEndpoint: true
                },
                "*/route53": {
                    endpoint: "https://{service}.amazonaws.com",
                    signatureVersion: "v3https",
                    globalEndpoint: true
                },
                "*/waf": "globalSSL",
                "us-gov-*/iam": "globalGovCloud",
                "us-gov-*/sts": {
                    endpoint: "{service}.{region}.amazonaws.com"
                },
                "us-gov-west-1/s3": "s3signature",
                "us-west-1/s3": "s3signature",
                "us-west-2/s3": "s3signature",
                "eu-west-1/s3": "s3signature",
                "ap-southeast-1/s3": "s3signature",
                "ap-southeast-2/s3": "s3signature",
                "ap-northeast-1/s3": "s3signature",
                "sa-east-1/s3": "s3signature",
                "us-east-1/s3": {
                    endpoint: "{service}.amazonaws.com",
                    signatureVersion: "s3"
                },
                "us-east-1/sdb": {
                    endpoint: "{service}.amazonaws.com",
                    signatureVersion: "v2"
                },
                "*/sdb": {
                    endpoint: "{service}.{region}.amazonaws.com",
                    signatureVersion: "v2"
                }
            },
            patterns: {
                globalSSL: {
                    endpoint: "https://{service}.amazonaws.com",
                    globalEndpoint: true
                },
                globalGovCloud: {
                    endpoint: "{service}.us-gov.amazonaws.com"
                },
                s3signature: {
                    endpoint: "{service}.{region}.amazonaws.com",
                    signatureVersion: "s3"
                }
            }
        };
    }, {} ],
    231: [ function(require, module, exports) {
        var AWS = require("./core");
        var inherit = AWS.util.inherit;
        var jmespath = require("jmespath");
        AWS.Response = inherit({
            constructor: function Response(request) {
                this.request = request;
                this.data = null;
                this.error = null;
                this.retryCount = 0;
                this.redirectCount = 0;
                this.httpResponse = new AWS.HttpResponse();
                if (request) {
                    this.maxRetries = request.service.numRetries();
                    this.maxRedirects = request.service.config.maxRedirects;
                }
            },
            nextPage: function nextPage(callback) {
                var config;
                var service = this.request.service;
                var operation = this.request.operation;
                try {
                    config = service.paginationConfig(operation, true);
                } catch (e) {
                    this.error = e;
                }
                if (!this.hasNextPage()) {
                    if (callback) callback(this.error, null); else if (this.error) throw this.error;
                    return null;
                }
                var params = AWS.util.copy(this.request.params);
                if (!this.nextPageTokens) {
                    return callback ? callback(null, null) : null;
                } else {
                    var inputTokens = config.inputToken;
                    if (typeof inputTokens === "string") inputTokens = [ inputTokens ];
                    for (var i = 0; i < inputTokens.length; i++) {
                        params[inputTokens[i]] = this.nextPageTokens[i];
                    }
                    return service.makeRequest(this.request.operation, params, callback);
                }
            },
            hasNextPage: function hasNextPage() {
                this.cacheNextPageTokens();
                if (this.nextPageTokens) return true;
                if (this.nextPageTokens === undefined) return undefined; else return false;
            },
            cacheNextPageTokens: function cacheNextPageTokens() {
                if (Object.prototype.hasOwnProperty.call(this, "nextPageTokens")) return this.nextPageTokens;
                this.nextPageTokens = undefined;
                var config = this.request.service.paginationConfig(this.request.operation);
                if (!config) return this.nextPageTokens;
                this.nextPageTokens = null;
                if (config.moreResults) {
                    if (!jmespath.search(this.data, config.moreResults)) {
                        return this.nextPageTokens;
                    }
                }
                var exprs = config.outputToken;
                if (typeof exprs === "string") exprs = [ exprs ];
                AWS.util.arrayEach.call(this, exprs, function(expr) {
                    var output = jmespath.search(this.data, expr);
                    if (output) {
                        this.nextPageTokens = this.nextPageTokens || [];
                        this.nextPageTokens.push(output);
                    }
                });
                return this.nextPageTokens;
            }
        });
    }, {
        "./core": 194,
        jmespath: 7
    } ],
    230: [ function(require, module, exports) {
        var AWS = require("./core");
        var inherit = AWS.util.inherit;
        var jmespath = require("jmespath");
        function CHECK_ACCEPTORS(resp) {
            var waiter = resp.request._waiter;
            var acceptors = waiter.config.acceptors;
            var acceptorMatched = false;
            var state = "retry";
            acceptors.forEach(function(acceptor) {
                if (!acceptorMatched) {
                    var matcher = waiter.matchers[acceptor.matcher];
                    if (matcher && matcher(resp, acceptor.expected, acceptor.argument)) {
                        acceptorMatched = true;
                        state = acceptor.state;
                    }
                }
            });
            if (!acceptorMatched && resp.error) state = "failure";
            if (state === "success") {
                waiter.setSuccess(resp);
            } else {
                waiter.setError(resp, state === "retry");
            }
        }
        AWS.ResourceWaiter = inherit({
            constructor: function constructor(service, state) {
                this.service = service;
                this.state = state;
                this.loadWaiterConfig(this.state);
            },
            service: null,
            state: null,
            config: null,
            matchers: {
                path: function(resp, expected, argument) {
                    try {
                        var result = jmespath.search(resp.data, argument);
                    } catch (err) {
                        return false;
                    }
                    return jmespath.strictDeepEqual(result, expected);
                },
                pathAll: function(resp, expected, argument) {
                    try {
                        var results = jmespath.search(resp.data, argument);
                    } catch (err) {
                        return false;
                    }
                    if (!Array.isArray(results)) results = [ results ];
                    var numResults = results.length;
                    if (!numResults) return false;
                    for (var ind = 0; ind < numResults; ind++) {
                        if (!jmespath.strictDeepEqual(results[ind], expected)) {
                            return false;
                        }
                    }
                    return true;
                },
                pathAny: function(resp, expected, argument) {
                    try {
                        var results = jmespath.search(resp.data, argument);
                    } catch (err) {
                        return false;
                    }
                    if (!Array.isArray(results)) results = [ results ];
                    var numResults = results.length;
                    for (var ind = 0; ind < numResults; ind++) {
                        if (jmespath.strictDeepEqual(results[ind], expected)) {
                            return true;
                        }
                    }
                    return false;
                },
                status: function(resp, expected) {
                    var statusCode = resp.httpResponse.statusCode;
                    return typeof statusCode === "number" && statusCode === expected;
                },
                error: function(resp, expected) {
                    if (typeof expected === "string" && resp.error) {
                        return expected === resp.error.code;
                    }
                    return expected === !!resp.error;
                }
            },
            listeners: new AWS.SequentialExecutor().addNamedListeners(function(add) {
                add("RETRY_CHECK", "retry", function(resp) {
                    var waiter = resp.request._waiter;
                    if (resp.error && resp.error.code === "ResourceNotReady") {
                        resp.error.retryDelay = (waiter.config.delay || 0) * 1e3;
                    }
                });
                add("CHECK_OUTPUT", "extractData", CHECK_ACCEPTORS);
                add("CHECK_ERROR", "extractError", CHECK_ACCEPTORS);
            }),
            wait: function wait(params, callback) {
                if (typeof params === "function") {
                    callback = params;
                    params = undefined;
                }
                if (params && params.$waiter) {
                    params = AWS.util.copy(params);
                    if (typeof params.$waiter.delay === "number") {
                        this.config.delay = params.$waiter.delay;
                    }
                    if (typeof params.$waiter.maxAttempts === "number") {
                        this.config.maxAttempts = params.$waiter.maxAttempts;
                    }
                    delete params.$waiter;
                }
                var request = this.service.makeRequest(this.config.operation, params);
                request._waiter = this;
                request.response.maxRetries = this.config.maxAttempts;
                request.addListeners(this.listeners);
                if (callback) request.send(callback);
                return request;
            },
            setSuccess: function setSuccess(resp) {
                resp.error = null;
                resp.data = resp.data || {};
                resp.request.removeAllListeners("extractData");
            },
            setError: function setError(resp, retryable) {
                resp.data = null;
                resp.error = AWS.util.error(resp.error || new Error(), {
                    code: "ResourceNotReady",
                    message: "Resource is not in the state " + this.state,
                    retryable: retryable
                });
            },
            loadWaiterConfig: function loadWaiterConfig(state) {
                if (!this.service.api.waiters[state]) {
                    throw new AWS.util.error(new Error(), {
                        code: "StateNotFoundError",
                        message: "State " + state + " not found."
                    });
                }
                this.config = AWS.util.copy(this.service.api.waiters[state]);
            }
        });
    }, {
        "./core": 194,
        jmespath: 7
    } ],
    229: [ function(require, module, exports) {
        (function(process) {
            var AWS = require("./core");
            var AcceptorStateMachine = require("./state_machine");
            var inherit = AWS.util.inherit;
            var domain = AWS.util.domain;
            var jmespath = require("jmespath");
            var hardErrorStates = {
                success: 1,
                error: 1,
                complete: 1
            };
            function isTerminalState(machine) {
                return Object.prototype.hasOwnProperty.call(hardErrorStates, machine._asm.currentState);
            }
            var fsm = new AcceptorStateMachine();
            fsm.setupStates = function() {
                var transition = function(_, done) {
                    var self = this;
                    self._haltHandlersOnError = false;
                    self.emit(self._asm.currentState, function(err) {
                        if (err) {
                            if (isTerminalState(self)) {
                                if (domain && self.domain instanceof domain.Domain) {
                                    err.domainEmitter = self;
                                    err.domain = self.domain;
                                    err.domainThrown = false;
                                    self.domain.emit("error", err);
                                } else {
                                    throw err;
                                }
                            } else {
                                self.response.error = err;
                                done(err);
                            }
                        } else {
                            done(self.response.error);
                        }
                    });
                };
                this.addState("validate", "build", "error", transition);
                this.addState("build", "afterBuild", "restart", transition);
                this.addState("afterBuild", "sign", "restart", transition);
                this.addState("sign", "send", "retry", transition);
                this.addState("retry", "afterRetry", "afterRetry", transition);
                this.addState("afterRetry", "sign", "error", transition);
                this.addState("send", "validateResponse", "retry", transition);
                this.addState("validateResponse", "extractData", "extractError", transition);
                this.addState("extractError", "extractData", "retry", transition);
                this.addState("extractData", "success", "retry", transition);
                this.addState("restart", "build", "error", transition);
                this.addState("success", "complete", "complete", transition);
                this.addState("error", "complete", "complete", transition);
                this.addState("complete", null, null, transition);
            };
            fsm.setupStates();
            AWS.Request = inherit({
                constructor: function Request(service, operation, params) {
                    var endpoint = service.endpoint;
                    var region = service.config.region;
                    var customUserAgent = service.config.customUserAgent;
                    if (service.isGlobalEndpoint) region = "us-east-1";
                    this.domain = domain && domain.active;
                    this.service = service;
                    this.operation = operation;
                    this.params = params || {};
                    this.httpRequest = new AWS.HttpRequest(endpoint, region);
                    this.httpRequest.appendToUserAgent(customUserAgent);
                    this.startTime = service.getSkewCorrectedDate();
                    this.response = new AWS.Response(this);
                    this._asm = new AcceptorStateMachine(fsm.states, "validate");
                    this._haltHandlersOnError = false;
                    AWS.SequentialExecutor.call(this);
                    this.emit = this.emitEvent;
                },
                send: function send(callback) {
                    if (callback) {
                        this.httpRequest.appendToUserAgent("callback");
                        this.on("complete", function(resp) {
                            callback.call(resp, resp.error, resp.data);
                        });
                    }
                    this.runTo();
                    return this.response;
                },
                build: function build(callback) {
                    return this.runTo("send", callback);
                },
                runTo: function runTo(state, done) {
                    this._asm.runTo(state, done, this);
                    return this;
                },
                abort: function abort() {
                    this.removeAllListeners("validateResponse");
                    this.removeAllListeners("extractError");
                    this.on("validateResponse", function addAbortedError(resp) {
                        resp.error = AWS.util.error(new Error("Request aborted by user"), {
                            code: "RequestAbortedError",
                            retryable: false
                        });
                    });
                    if (this.httpRequest.stream && !this.httpRequest.stream.didCallback) {
                        this.httpRequest.stream.abort();
                        if (this.httpRequest._abortCallback) {
                            this.httpRequest._abortCallback();
                        } else {
                            this.removeAllListeners("send");
                        }
                    }
                    return this;
                },
                eachPage: function eachPage(callback) {
                    callback = AWS.util.fn.makeAsync(callback, 3);
                    function wrappedCallback(response) {
                        callback.call(response, response.error, response.data, function(result) {
                            if (result === false) return;
                            if (response.hasNextPage()) {
                                response.nextPage().on("complete", wrappedCallback).send();
                            } else {
                                callback.call(response, null, null, AWS.util.fn.noop);
                            }
                        });
                    }
                    this.on("complete", wrappedCallback).send();
                },
                eachItem: function eachItem(callback) {
                    var self = this;
                    function wrappedCallback(err, data) {
                        if (err) return callback(err, null);
                        if (data === null) return callback(null, null);
                        var config = self.service.paginationConfig(self.operation);
                        var resultKey = config.resultKey;
                        if (Array.isArray(resultKey)) resultKey = resultKey[0];
                        var items = jmespath.search(data, resultKey);
                        var continueIteration = true;
                        AWS.util.arrayEach(items, function(item) {
                            continueIteration = callback(null, item);
                            if (continueIteration === false) {
                                return AWS.util.abort;
                            }
                        });
                        return continueIteration;
                    }
                    this.eachPage(wrappedCallback);
                },
                isPageable: function isPageable() {
                    return this.service.paginationConfig(this.operation) ? true : false;
                },
                createReadStream: function createReadStream() {
                    var streams = AWS.util.stream;
                    var req = this;
                    var stream = null;
                    if (AWS.HttpClient.streamsApiVersion === 2) {
                        stream = new streams.PassThrough();
                        process.nextTick(function() {
                            req.send();
                        });
                    } else {
                        stream = new streams.Stream();
                        stream.readable = true;
                        stream.sent = false;
                        stream.on("newListener", function(event) {
                            if (!stream.sent && event === "data") {
                                stream.sent = true;
                                process.nextTick(function() {
                                    req.send();
                                });
                            }
                        });
                    }
                    this.on("error", function(err) {
                        stream.emit("error", err);
                    });
                    this.on("httpHeaders", function streamHeaders(statusCode, headers, resp) {
                        if (statusCode < 300) {
                            req.removeListener("httpData", AWS.EventListeners.Core.HTTP_DATA);
                            req.removeListener("httpError", AWS.EventListeners.Core.HTTP_ERROR);
                            req.on("httpError", function streamHttpError(error) {
                                resp.error = error;
                                resp.error.retryable = false;
                            });
                            var shouldCheckContentLength = false;
                            var expectedLen;
                            if (req.httpRequest.method !== "HEAD") {
                                expectedLen = parseInt(headers["content-length"], 10);
                            }
                            if (expectedLen !== undefined && !isNaN(expectedLen) && expectedLen >= 0) {
                                shouldCheckContentLength = true;
                                var receivedLen = 0;
                            }
                            var checkContentLengthAndEmit = function checkContentLengthAndEmit() {
                                if (shouldCheckContentLength && receivedLen !== expectedLen) {
                                    stream.emit("error", AWS.util.error(new Error("Stream content length mismatch. Received " + receivedLen + " of " + expectedLen + " bytes."), {
                                        code: "StreamContentLengthMismatch"
                                    }));
                                } else if (AWS.HttpClient.streamsApiVersion === 2) {
                                    stream.end();
                                } else {
                                    stream.emit("end");
                                }
                            };
                            var httpStream = resp.httpResponse.createUnbufferedStream();
                            if (AWS.HttpClient.streamsApiVersion === 2) {
                                if (shouldCheckContentLength) {
                                    var lengthAccumulator = new streams.PassThrough();
                                    lengthAccumulator._write = function(chunk) {
                                        if (chunk && chunk.length) {
                                            receivedLen += chunk.length;
                                        }
                                        return streams.PassThrough.prototype._write.apply(this, arguments);
                                    };
                                    lengthAccumulator.on("end", checkContentLengthAndEmit);
                                    stream.on("error", function(err) {
                                        shouldCheckContentLength = false;
                                        httpStream.unpipe(lengthAccumulator);
                                        lengthAccumulator.emit("end");
                                        lengthAccumulator.end();
                                    });
                                    httpStream.pipe(lengthAccumulator).pipe(stream, {
                                        end: false
                                    });
                                } else {
                                    httpStream.pipe(stream);
                                }
                            } else {
                                if (shouldCheckContentLength) {
                                    httpStream.on("data", function(arg) {
                                        if (arg && arg.length) {
                                            receivedLen += arg.length;
                                        }
                                    });
                                }
                                httpStream.on("data", function(arg) {
                                    stream.emit("data", arg);
                                });
                                httpStream.on("end", checkContentLengthAndEmit);
                            }
                            httpStream.on("error", function(err) {
                                shouldCheckContentLength = false;
                                stream.emit("error", err);
                            });
                        }
                    });
                    return stream;
                },
                emitEvent: function emit(eventName, args, done) {
                    if (typeof args === "function") {
                        done = args;
                        args = null;
                    }
                    if (!done) done = function() {};
                    if (!args) args = this.eventParameters(eventName, this.response);
                    var origEmit = AWS.SequentialExecutor.prototype.emit;
                    origEmit.call(this, eventName, args, function(err) {
                        if (err) this.response.error = err;
                        done.call(this, err);
                    });
                },
                eventParameters: function eventParameters(eventName) {
                    switch (eventName) {
                      case "restart":
                      case "validate":
                      case "sign":
                      case "build":
                      case "afterValidate":
                      case "afterBuild":
                        return [ this ];

                      case "error":
                        return [ this.response.error, this.response ];

                      default:
                        return [ this.response ];
                    }
                },
                presign: function presign(expires, callback) {
                    if (!callback && typeof expires === "function") {
                        callback = expires;
                        expires = null;
                    }
                    return new AWS.Signers.Presign().sign(this.toGet(), expires, callback);
                },
                isPresigned: function isPresigned() {
                    return Object.prototype.hasOwnProperty.call(this.httpRequest.headers, "presigned-expires");
                },
                toUnauthenticated: function toUnauthenticated() {
                    this.removeListener("validate", AWS.EventListeners.Core.VALIDATE_CREDENTIALS);
                    this.removeListener("sign", AWS.EventListeners.Core.SIGN);
                    return this;
                },
                toGet: function toGet() {
                    if (this.service.api.protocol === "query" || this.service.api.protocol === "ec2") {
                        this.removeListener("build", this.buildAsGet);
                        this.addListener("build", this.buildAsGet);
                    }
                    return this;
                },
                buildAsGet: function buildAsGet(request) {
                    request.httpRequest.method = "GET";
                    request.httpRequest.path = request.service.endpoint.path + "?" + request.httpRequest.body;
                    request.httpRequest.body = "";
                    delete request.httpRequest.headers["Content-Length"];
                    delete request.httpRequest.headers["Content-Type"];
                },
                haltHandlersOnError: function haltHandlersOnError() {
                    this._haltHandlersOnError = true;
                }
            });
            AWS.Request.addPromisesToClass = function addPromisesToClass(PromiseDependency) {
                this.prototype.promise = function promise() {
                    var self = this;
                    this.httpRequest.appendToUserAgent("promise");
                    return new PromiseDependency(function(resolve, reject) {
                        self.on("complete", function(resp) {
                            if (resp.error) {
                                reject(resp.error);
                            } else {
                                resolve(Object.defineProperty(resp.data || {}, "$response", {
                                    value: resp
                                }));
                            }
                        });
                        self.runTo();
                    });
                };
            };
            AWS.Request.deletePromisesFromClass = function deletePromisesFromClass() {
                delete this.prototype.promise;
            };
            AWS.util.addPromises(AWS.Request);
            AWS.util.mixin(AWS.Request, AWS.SequentialExecutor);
        }).call(this, require("_process"));
    }, {
        "./core": 194,
        "./state_machine": 260,
        _process: 148,
        jmespath: 7
    } ],
    260: [ function(require, module, exports) {
        function AcceptorStateMachine(states, state) {
            this.currentState = state || null;
            this.states = states || {};
        }
        AcceptorStateMachine.prototype.runTo = function runTo(finalState, done, bindObject, inputError) {
            if (typeof finalState === "function") {
                inputError = bindObject;
                bindObject = done;
                done = finalState;
                finalState = null;
            }
            var self = this;
            var state = self.states[self.currentState];
            state.fn.call(bindObject || self, inputError, function(err) {
                if (err) {
                    if (state.fail) self.currentState = state.fail; else return done ? done.call(bindObject, err) : null;
                } else {
                    if (state.accept) self.currentState = state.accept; else return done ? done.call(bindObject) : null;
                }
                if (self.currentState === finalState) {
                    return done ? done.call(bindObject, err) : null;
                }
                self.runTo(finalState, done, bindObject, err);
            });
        };
        AcceptorStateMachine.prototype.addState = function addState(name, acceptState, failState, fn) {
            if (typeof acceptState === "function") {
                fn = acceptState;
                acceptState = null;
                failState = null;
            } else if (typeof failState === "function") {
                fn = failState;
                failState = null;
            }
            if (!this.currentState) this.currentState = name;
            this.states[name] = {
                accept: acceptState,
                fail: failState,
                fn: fn
            };
            return this;
        };
        module.exports = AcceptorStateMachine;
    }, {} ],
    218: [ function(require, module, exports) {
        var AWS = require("./core");
        AWS.ParamValidator = AWS.util.inherit({
            constructor: function ParamValidator(validation) {
                if (validation === true || validation === undefined) {
                    validation = {
                        min: true
                    };
                }
                this.validation = validation;
            },
            validate: function validate(shape, params, context) {
                this.errors = [];
                this.validateMember(shape, params || {}, context || "params");
                if (this.errors.length > 1) {
                    var msg = this.errors.join("\n* ");
                    msg = "There were " + this.errors.length + " validation errors:\n* " + msg;
                    throw AWS.util.error(new Error(msg), {
                        code: "MultipleValidationErrors",
                        errors: this.errors
                    });
                } else if (this.errors.length === 1) {
                    throw this.errors[0];
                } else {
                    return true;
                }
            },
            fail: function fail(code, message) {
                this.errors.push(AWS.util.error(new Error(message), {
                    code: code
                }));
            },
            validateStructure: function validateStructure(shape, params, context) {
                this.validateType(params, context, [ "object" ], "structure");
                var paramName;
                for (var i = 0; shape.required && i < shape.required.length; i++) {
                    paramName = shape.required[i];
                    var value = params[paramName];
                    if (value === undefined || value === null) {
                        this.fail("MissingRequiredParameter", "Missing required key '" + paramName + "' in " + context);
                    }
                }
                for (paramName in params) {
                    if (!Object.prototype.hasOwnProperty.call(params, paramName)) continue;
                    var paramValue = params[paramName], memberShape = shape.members[paramName];
                    if (memberShape !== undefined) {
                        var memberContext = [ context, paramName ].join(".");
                        this.validateMember(memberShape, paramValue, memberContext);
                    } else {
                        this.fail("UnexpectedParameter", "Unexpected key '" + paramName + "' found in " + context);
                    }
                }
                return true;
            },
            validateMember: function validateMember(shape, param, context) {
                switch (shape.type) {
                  case "structure":
                    return this.validateStructure(shape, param, context);

                  case "list":
                    return this.validateList(shape, param, context);

                  case "map":
                    return this.validateMap(shape, param, context);

                  default:
                    return this.validateScalar(shape, param, context);
                }
            },
            validateList: function validateList(shape, params, context) {
                if (this.validateType(params, context, [ Array ])) {
                    this.validateRange(shape, params.length, context, "list member count");
                    for (var i = 0; i < params.length; i++) {
                        this.validateMember(shape.member, params[i], context + "[" + i + "]");
                    }
                }
            },
            validateMap: function validateMap(shape, params, context) {
                if (this.validateType(params, context, [ "object" ], "map")) {
                    var mapCount = 0;
                    for (var param in params) {
                        if (!Object.prototype.hasOwnProperty.call(params, param)) continue;
                        this.validateMember(shape.key, param, context + "[key='" + param + "']");
                        this.validateMember(shape.value, params[param], context + "['" + param + "']");
                        mapCount++;
                    }
                    this.validateRange(shape, mapCount, context, "map member count");
                }
            },
            validateScalar: function validateScalar(shape, value, context) {
                switch (shape.type) {
                  case null:
                  case undefined:
                  case "string":
                    return this.validateString(shape, value, context);

                  case "base64":
                  case "binary":
                    return this.validatePayload(value, context);

                  case "integer":
                  case "float":
                    return this.validateNumber(shape, value, context);

                  case "boolean":
                    return this.validateType(value, context, [ "boolean" ]);

                  case "timestamp":
                    return this.validateType(value, context, [ Date, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/, "number" ], "Date object, ISO-8601 string, or a UNIX timestamp");

                  default:
                    return this.fail("UnkownType", "Unhandled type " + shape.type + " for " + context);
                }
            },
            validateString: function validateString(shape, value, context) {
                var validTypes = [ "string" ];
                if (shape.isJsonValue) {
                    validTypes = validTypes.concat([ "number", "object", "boolean" ]);
                }
                if (value !== null && this.validateType(value, context, validTypes)) {
                    this.validateEnum(shape, value, context);
                    this.validateRange(shape, value.length, context, "string length");
                    this.validatePattern(shape, value, context);
                }
            },
            validatePattern: function validatePattern(shape, value, context) {
                if (this.validation["pattern"] && shape["pattern"] !== undefined) {
                    if (!new RegExp(shape["pattern"]).test(value)) {
                        this.fail("PatternMatchError", 'Provided value "' + value + '" ' + "does not match regex pattern /" + shape["pattern"] + "/ for " + context);
                    }
                }
            },
            validateRange: function validateRange(shape, value, context, descriptor) {
                if (this.validation["min"]) {
                    if (shape["min"] !== undefined && value < shape["min"]) {
                        this.fail("MinRangeError", "Expected " + descriptor + " >= " + shape["min"] + ", but found " + value + " for " + context);
                    }
                }
                if (this.validation["max"]) {
                    if (shape["max"] !== undefined && value > shape["max"]) {
                        this.fail("MaxRangeError", "Expected " + descriptor + " <= " + shape["max"] + ", but found " + value + " for " + context);
                    }
                }
            },
            validateEnum: function validateRange(shape, value, context) {
                if (this.validation["enum"] && shape["enum"] !== undefined) {
                    if (shape["enum"].indexOf(value) === -1) {
                        this.fail("EnumError", "Found string value of " + value + ", but " + "expected " + shape["enum"].join("|") + " for " + context);
                    }
                }
            },
            validateType: function validateType(value, context, acceptedTypes, type) {
                if (value === null || value === undefined) return false;
                var foundInvalidType = false;
                for (var i = 0; i < acceptedTypes.length; i++) {
                    if (typeof acceptedTypes[i] === "string") {
                        if (typeof value === acceptedTypes[i]) return true;
                    } else if (acceptedTypes[i] instanceof RegExp) {
                        if ((value || "").toString().match(acceptedTypes[i])) return true;
                    } else {
                        if (value instanceof acceptedTypes[i]) return true;
                        if (AWS.util.isType(value, acceptedTypes[i])) return true;
                        if (!type && !foundInvalidType) acceptedTypes = acceptedTypes.slice();
                        acceptedTypes[i] = AWS.util.typeName(acceptedTypes[i]);
                    }
                    foundInvalidType = true;
                }
                var acceptedType = type;
                if (!acceptedType) {
                    acceptedType = acceptedTypes.join(", ").replace(/,([^,]+)$/, ", or$1");
                }
                var vowel = acceptedType.match(/^[aeiou]/i) ? "n" : "";
                this.fail("InvalidParameterType", "Expected " + context + " to be a" + vowel + " " + acceptedType);
                return false;
            },
            validateNumber: function validateNumber(shape, value, context) {
                if (value === null || value === undefined) return;
                if (typeof value === "string") {
                    var castedValue = parseFloat(value);
                    if (castedValue.toString() === value) value = castedValue;
                }
                if (this.validateType(value, context, [ "number" ])) {
                    this.validateRange(shape, value, context, "numeric value");
                }
            },
            validatePayload: function validatePayload(value, context) {
                if (value === null || value === undefined) return;
                if (typeof value === "string") return;
                if (value && typeof value.byteLength === "number") return;
                if (AWS.util.isNode()) {
                    var Stream = AWS.util.stream.Stream;
                    if (AWS.util.Buffer.isBuffer(value) || value instanceof Stream) return;
                }
                var types = [ "Buffer", "Stream", "File", "Blob", "ArrayBuffer", "DataView" ];
                if (value) {
                    for (var i = 0; i < types.length; i++) {
                        if (AWS.util.isType(value, types[i])) return;
                        if (AWS.util.typeName(value.constructor) === types[i]) return;
                    }
                }
                this.fail("InvalidParameterType", "Expected " + context + " to be a " + "string, Buffer, Stream, Blob, or typed array object");
            }
        });
    }, {
        "./core": 194
    } ],
    212: [ function(require, module, exports) {
        var Collection = require("./collection");
        var Operation = require("./operation");
        var Shape = require("./shape");
        var Paginator = require("./paginator");
        var ResourceWaiter = require("./resource_waiter");
        var util = require("../util");
        var property = util.property;
        var memoizedProperty = util.memoizedProperty;
        function Api(api, options) {
            api = api || {};
            options = options || {};
            options.api = this;
            api.metadata = api.metadata || {};
            property(this, "isApi", true, false);
            property(this, "apiVersion", api.metadata.apiVersion);
            property(this, "endpointPrefix", api.metadata.endpointPrefix);
            property(this, "signingName", api.metadata.signingName);
            property(this, "globalEndpoint", api.metadata.globalEndpoint);
            property(this, "signatureVersion", api.metadata.signatureVersion);
            property(this, "jsonVersion", api.metadata.jsonVersion);
            property(this, "targetPrefix", api.metadata.targetPrefix);
            property(this, "protocol", api.metadata.protocol);
            property(this, "timestampFormat", api.metadata.timestampFormat);
            property(this, "xmlNamespaceUri", api.metadata.xmlNamespace);
            property(this, "abbreviation", api.metadata.serviceAbbreviation);
            property(this, "fullName", api.metadata.serviceFullName);
            memoizedProperty(this, "className", function() {
                var name = api.metadata.serviceAbbreviation || api.metadata.serviceFullName;
                if (!name) return null;
                name = name.replace(/^Amazon|AWS\s*|\(.*|\s+|\W+/g, "");
                if (name === "ElasticLoadBalancing") name = "ELB";
                return name;
            });
            property(this, "operations", new Collection(api.operations, options, function(name, operation) {
                return new Operation(name, operation, options);
            }, util.string.lowerFirst));
            property(this, "shapes", new Collection(api.shapes, options, function(name, shape) {
                return Shape.create(shape, options);
            }));
            property(this, "paginators", new Collection(api.paginators, options, function(name, paginator) {
                return new Paginator(name, paginator, options);
            }));
            property(this, "waiters", new Collection(api.waiters, options, function(name, waiter) {
                return new ResourceWaiter(name, waiter, options);
            }, util.string.lowerFirst));
            if (options.documentation) {
                property(this, "documentation", api.documentation);
                property(this, "documentationUrl", api.documentationUrl);
            }
        }
        module.exports = Api;
    }, {
        "../util": 261,
        "./collection": 213,
        "./operation": 214,
        "./paginator": 215,
        "./resource_waiter": 216,
        "./shape": 217
    } ],
    216: [ function(require, module, exports) {
        var util = require("../util");
        var property = util.property;
        function ResourceWaiter(name, waiter, options) {
            options = options || {};
            property(this, "name", name);
            property(this, "api", options.api, false);
            if (waiter.operation) {
                property(this, "operation", util.string.lowerFirst(waiter.operation));
            }
            var self = this;
            var keys = [ "type", "description", "delay", "maxAttempts", "acceptors" ];
            keys.forEach(function(key) {
                var value = waiter[key];
                if (value) {
                    property(self, key, value);
                }
            });
        }
        module.exports = ResourceWaiter;
    }, {
        "../util": 261
    } ],
    215: [ function(require, module, exports) {
        var property = require("../util").property;
        function Paginator(name, paginator) {
            property(this, "inputToken", paginator.input_token);
            property(this, "limitKey", paginator.limit_key);
            property(this, "moreResults", paginator.more_results);
            property(this, "outputToken", paginator.output_token);
            property(this, "resultKey", paginator.result_key);
        }
        module.exports = Paginator;
    }, {
        "../util": 261
    } ],
    214: [ function(require, module, exports) {
        var Shape = require("./shape");
        var util = require("../util");
        var property = util.property;
        var memoizedProperty = util.memoizedProperty;
        function Operation(name, operation, options) {
            var self = this;
            options = options || {};
            property(this, "name", operation.name || name);
            property(this, "api", options.api, false);
            operation.http = operation.http || {};
            property(this, "httpMethod", operation.http.method || "POST");
            property(this, "httpPath", operation.http.requestUri || "/");
            property(this, "authtype", operation.authtype || "");
            memoizedProperty(this, "input", function() {
                if (!operation.input) {
                    return new Shape.create({
                        type: "structure"
                    }, options);
                }
                return Shape.create(operation.input, options);
            });
            memoizedProperty(this, "output", function() {
                if (!operation.output) {
                    return new Shape.create({
                        type: "structure"
                    }, options);
                }
                return Shape.create(operation.output, options);
            });
            memoizedProperty(this, "errors", function() {
                var list = [];
                if (!operation.errors) return null;
                for (var i = 0; i < operation.errors.length; i++) {
                    list.push(Shape.create(operation.errors[i], options));
                }
                return list;
            });
            memoizedProperty(this, "paginator", function() {
                return options.api.paginators[name];
            });
            if (options.documentation) {
                property(this, "documentation", operation.documentation);
                property(this, "documentationUrl", operation.documentationUrl);
            }
            memoizedProperty(this, "idempotentMembers", function() {
                var idempotentMembers = [];
                var input = self.input;
                var members = input.members;
                if (!input.members) {
                    return idempotentMembers;
                }
                for (var name in members) {
                    if (!members.hasOwnProperty(name)) {
                        continue;
                    }
                    if (members[name].isIdempotent === true) {
                        idempotentMembers.push(name);
                    }
                }
                return idempotentMembers;
            });
        }
        module.exports = Operation;
    }, {
        "../util": 261,
        "./shape": 217
    } ],
    208: [ function(require, module, exports) {
        var AWS = require("./core");
        var inherit = AWS.util.inherit;
        AWS.Endpoint = inherit({
            constructor: function Endpoint(endpoint, config) {
                AWS.util.hideProperties(this, [ "slashes", "auth", "hash", "search", "query" ]);
                if (typeof endpoint === "undefined" || endpoint === null) {
                    throw new Error("Invalid endpoint: " + endpoint);
                } else if (typeof endpoint !== "string") {
                    return AWS.util.copy(endpoint);
                }
                if (!endpoint.match(/^http/)) {
                    var useSSL = config && config.sslEnabled !== undefined ? config.sslEnabled : AWS.config.sslEnabled;
                    endpoint = (useSSL ? "https" : "http") + "://" + endpoint;
                }
                AWS.util.update(this, AWS.util.urlParse(endpoint));
                if (this.port) {
                    this.port = parseInt(this.port, 10);
                } else {
                    this.port = this.protocol === "https:" ? 443 : 80;
                }
            }
        });
        AWS.HttpRequest = inherit({
            constructor: function HttpRequest(endpoint, region) {
                endpoint = new AWS.Endpoint(endpoint);
                this.method = "POST";
                this.path = endpoint.path || "/";
                this.headers = {};
                this.body = "";
                this.endpoint = endpoint;
                this.region = region;
                this._userAgent = "";
                this.setUserAgent();
            },
            setUserAgent: function setUserAgent() {
                this._userAgent = this.headers[this.getUserAgentHeaderName()] = AWS.util.userAgent();
            },
            getUserAgentHeaderName: function getUserAgentHeaderName() {
                var prefix = AWS.util.isBrowser() ? "X-Amz-" : "";
                return prefix + "User-Agent";
            },
            appendToUserAgent: function appendToUserAgent(agentPartial) {
                if (typeof agentPartial === "string" && agentPartial) {
                    this._userAgent += " " + agentPartial;
                }
                this.headers[this.getUserAgentHeaderName()] = this._userAgent;
            },
            getUserAgent: function getUserAgent() {
                return this._userAgent;
            },
            pathname: function pathname() {
                return this.path.split("?", 1)[0];
            },
            search: function search() {
                var query = this.path.split("?", 2)[1];
                if (query) {
                    query = AWS.util.queryStringParse(query);
                    return AWS.util.queryParamsToString(query);
                }
                return "";
            }
        });
        AWS.HttpResponse = inherit({
            constructor: function HttpResponse() {
                this.statusCode = undefined;
                this.headers = {};
                this.body = undefined;
                this.streaming = false;
                this.stream = null;
            },
            createUnbufferedStream: function createUnbufferedStream() {
                this.streaming = true;
                return this.stream;
            }
        });
        AWS.HttpClient = inherit({});
        AWS.HttpClient.getInstance = function getInstance() {
            if (this.singleton === undefined) {
                this.singleton = new this();
            }
            return this.singleton;
        };
    }, {
        "./core": 194
    } ],
    207: [ function(require, module, exports) {
        var AWS = require("./core");
        var SequentialExecutor = require("./sequential_executor");
        AWS.EventListeners = {
            Core: {}
        };
        function getOperationAuthtype(req) {
            if (!req.service.api.operations) {
                return "";
            }
            var operation = req.service.api.operations[req.operation];
            return operation ? operation.authtype : "";
        }
        AWS.EventListeners = {
            Core: new SequentialExecutor().addNamedListeners(function(add, addAsync) {
                addAsync("VALIDATE_CREDENTIALS", "validate", function VALIDATE_CREDENTIALS(req, done) {
                    if (!req.service.api.signatureVersion) return done();
                    req.service.config.getCredentials(function(err) {
                        if (err) {
                            req.response.error = AWS.util.error(err, {
                                code: "CredentialsError",
                                message: "Missing credentials in config"
                            });
                        }
                        done();
                    });
                });
                add("VALIDATE_REGION", "validate", function VALIDATE_REGION(req) {
                    if (!req.service.config.region && !req.service.isGlobalEndpoint) {
                        req.response.error = AWS.util.error(new Error(), {
                            code: "ConfigError",
                            message: "Missing region in config"
                        });
                    }
                });
                add("BUILD_IDEMPOTENCY_TOKENS", "validate", function BUILD_IDEMPOTENCY_TOKENS(req) {
                    if (!req.service.api.operations) {
                        return;
                    }
                    var operation = req.service.api.operations[req.operation];
                    if (!operation) {
                        return;
                    }
                    var idempotentMembers = operation.idempotentMembers;
                    if (!idempotentMembers.length) {
                        return;
                    }
                    var params = AWS.util.copy(req.params);
                    for (var i = 0, iLen = idempotentMembers.length; i < iLen; i++) {
                        if (!params[idempotentMembers[i]]) {
                            params[idempotentMembers[i]] = AWS.util.uuid.v4();
                        }
                    }
                    req.params = params;
                });
                add("VALIDATE_PARAMETERS", "validate", function VALIDATE_PARAMETERS(req) {
                    if (!req.service.api.operations) {
                        return;
                    }
                    var rules = req.service.api.operations[req.operation].input;
                    var validation = req.service.config.paramValidation;
                    new AWS.ParamValidator(validation).validate(rules, req.params);
                });
                addAsync("COMPUTE_SHA256", "afterBuild", function COMPUTE_SHA256(req, done) {
                    req.haltHandlersOnError();
                    if (!req.service.api.operations) {
                        return;
                    }
                    var operation = req.service.api.operations[req.operation];
                    var authtype = operation ? operation.authtype : "";
                    if (!req.service.api.signatureVersion && !authtype) return done();
                    if (req.service.getSignerClass(req) === AWS.Signers.V4) {
                        var body = req.httpRequest.body || "";
                        if (authtype.indexOf("unsigned-body") >= 0) {
                            req.httpRequest.headers["X-Amz-Content-Sha256"] = "UNSIGNED-PAYLOAD";
                            return done();
                        }
                        AWS.util.computeSha256(body, function(err, sha) {
                            if (err) {
                                done(err);
                            } else {
                                req.httpRequest.headers["X-Amz-Content-Sha256"] = sha;
                                done();
                            }
                        });
                    } else {
                        done();
                    }
                });
                add("SET_CONTENT_LENGTH", "afterBuild", function SET_CONTENT_LENGTH(req) {
                    var authtype = getOperationAuthtype(req);
                    if (req.httpRequest.headers["Content-Length"] === undefined && authtype.indexOf("unsigned-body") === -1) {
                        var length = AWS.util.string.byteLength(req.httpRequest.body);
                        req.httpRequest.headers["Content-Length"] = length;
                    }
                });
                add("SET_HTTP_HOST", "afterBuild", function SET_HTTP_HOST(req) {
                    req.httpRequest.headers["Host"] = req.httpRequest.endpoint.host;
                });
                add("RESTART", "restart", function RESTART() {
                    var err = this.response.error;
                    if (!err || !err.retryable) return;
                    this.httpRequest = new AWS.HttpRequest(this.service.endpoint, this.service.region);
                    if (this.response.retryCount < this.service.config.maxRetries) {
                        this.response.retryCount++;
                    } else {
                        this.response.error = null;
                    }
                });
                addAsync("SIGN", "sign", function SIGN(req, done) {
                    var service = req.service;
                    var operations = req.service.api.operations || {};
                    var operation = operations[req.operation];
                    var authtype = operation ? operation.authtype : "";
                    if (!service.api.signatureVersion && !authtype) return done();
                    service.config.getCredentials(function(err, credentials) {
                        if (err) {
                            req.response.error = err;
                            return done();
                        }
                        try {
                            var date = service.getSkewCorrectedDate();
                            var SignerClass = service.getSignerClass(req);
                            var signer = new SignerClass(req.httpRequest, service.api.signingName || service.api.endpointPrefix, {
                                signatureCache: service.config.signatureCache,
                                operation: operation
                            });
                            signer.setServiceClientId(service._clientId);
                            delete req.httpRequest.headers["Authorization"];
                            delete req.httpRequest.headers["Date"];
                            delete req.httpRequest.headers["X-Amz-Date"];
                            signer.addAuthorization(credentials, date);
                            req.signedAt = date;
                        } catch (e) {
                            req.response.error = e;
                        }
                        done();
                    });
                });
                add("VALIDATE_RESPONSE", "validateResponse", function VALIDATE_RESPONSE(resp) {
                    if (this.service.successfulResponse(resp, this)) {
                        resp.data = {};
                        resp.error = null;
                    } else {
                        resp.data = null;
                        resp.error = AWS.util.error(new Error(), {
                            code: "UnknownError",
                            message: "An unknown error occurred."
                        });
                    }
                });
                addAsync("SEND", "send", function SEND(resp, done) {
                    resp.httpResponse._abortCallback = done;
                    resp.error = null;
                    resp.data = null;
                    function callback(httpResp) {
                        resp.httpResponse.stream = httpResp;
                        var stream = resp.request.httpRequest.stream;
                        httpResp.on("headers", function onHeaders(statusCode, headers, statusMessage) {
                            resp.request.emit("httpHeaders", [ statusCode, headers, resp, statusMessage ]);
                            if (!resp.httpResponse.streaming) {
                                if (AWS.HttpClient.streamsApiVersion === 2) {
                                    httpResp.on("readable", function onReadable() {
                                        var data = httpResp.read();
                                        if (data !== null) {
                                            resp.request.emit("httpData", [ data, resp ]);
                                        }
                                    });
                                } else {
                                    httpResp.on("data", function onData(data) {
                                        resp.request.emit("httpData", [ data, resp ]);
                                    });
                                }
                            }
                        });
                        httpResp.on("end", function onEnd() {
                            if (!stream || !stream.didCallback) {
                                resp.request.emit("httpDone");
                                done();
                            }
                        });
                    }
                    function progress(httpResp) {
                        httpResp.on("sendProgress", function onSendProgress(value) {
                            resp.request.emit("httpUploadProgress", [ value, resp ]);
                        });
                        httpResp.on("receiveProgress", function onReceiveProgress(value) {
                            resp.request.emit("httpDownloadProgress", [ value, resp ]);
                        });
                    }
                    function error(err) {
                        if (err.code !== "RequestAbortedError") {
                            var errCode = err.code === "TimeoutError" ? err.code : "NetworkingError";
                            err = AWS.util.error(err, {
                                code: errCode,
                                region: resp.request.httpRequest.region,
                                hostname: resp.request.httpRequest.endpoint.hostname,
                                retryable: true
                            });
                        }
                        resp.error = err;
                        resp.request.emit("httpError", [ resp.error, resp ], function() {
                            done();
                        });
                    }
                    function executeSend() {
                        var http = AWS.HttpClient.getInstance();
                        var httpOptions = resp.request.service.config.httpOptions || {};
                        try {
                            var stream = http.handleRequest(resp.request.httpRequest, httpOptions, callback, error);
                            progress(stream);
                        } catch (err) {
                            error(err);
                        }
                    }
                    var timeDiff = (resp.request.service.getSkewCorrectedDate() - this.signedAt) / 1e3;
                    if (timeDiff >= 60 * 10) {
                        this.emit("sign", [ this ], function(err) {
                            if (err) done(err); else executeSend();
                        });
                    } else {
                        executeSend();
                    }
                });
                add("HTTP_HEADERS", "httpHeaders", function HTTP_HEADERS(statusCode, headers, resp, statusMessage) {
                    resp.httpResponse.statusCode = statusCode;
                    resp.httpResponse.statusMessage = statusMessage;
                    resp.httpResponse.headers = headers;
                    resp.httpResponse.body = new AWS.util.Buffer("");
                    resp.httpResponse.buffers = [];
                    resp.httpResponse.numBytes = 0;
                    var dateHeader = headers.date || headers.Date;
                    var service = resp.request.service;
                    if (dateHeader) {
                        var serverTime = Date.parse(dateHeader);
                        if (service.config.correctClockSkew && service.isClockSkewed(serverTime)) {
                            service.applyClockOffset(serverTime);
                        }
                    }
                });
                add("HTTP_DATA", "httpData", function HTTP_DATA(chunk, resp) {
                    if (chunk) {
                        if (AWS.util.isNode()) {
                            resp.httpResponse.numBytes += chunk.length;
                            var total = resp.httpResponse.headers["content-length"];
                            var progress = {
                                loaded: resp.httpResponse.numBytes,
                                total: total
                            };
                            resp.request.emit("httpDownloadProgress", [ progress, resp ]);
                        }
                        resp.httpResponse.buffers.push(new AWS.util.Buffer(chunk));
                    }
                });
                add("HTTP_DONE", "httpDone", function HTTP_DONE(resp) {
                    if (resp.httpResponse.buffers && resp.httpResponse.buffers.length > 0) {
                        var body = AWS.util.buffer.concat(resp.httpResponse.buffers);
                        resp.httpResponse.body = body;
                    }
                    delete resp.httpResponse.numBytes;
                    delete resp.httpResponse.buffers;
                });
                add("FINALIZE_ERROR", "retry", function FINALIZE_ERROR(resp) {
                    if (resp.httpResponse.statusCode) {
                        resp.error.statusCode = resp.httpResponse.statusCode;
                        if (resp.error.retryable === undefined) {
                            resp.error.retryable = this.service.retryableError(resp.error, this);
                        }
                    }
                });
                add("INVALIDATE_CREDENTIALS", "retry", function INVALIDATE_CREDENTIALS(resp) {
                    if (!resp.error) return;
                    switch (resp.error.code) {
                      case "RequestExpired":
                      case "ExpiredTokenException":
                      case "ExpiredToken":
                        resp.error.retryable = true;
                        resp.request.service.config.credentials.expired = true;
                    }
                });
                add("EXPIRED_SIGNATURE", "retry", function EXPIRED_SIGNATURE(resp) {
                    var err = resp.error;
                    if (!err) return;
                    if (typeof err.code === "string" && typeof err.message === "string") {
                        if (err.code.match(/Signature/) && err.message.match(/expired/)) {
                            resp.error.retryable = true;
                        }
                    }
                });
                add("CLOCK_SKEWED", "retry", function CLOCK_SKEWED(resp) {
                    if (!resp.error) return;
                    if (this.service.clockSkewError(resp.error) && this.service.config.correctClockSkew) {
                        resp.error.retryable = true;
                    }
                });
                add("REDIRECT", "retry", function REDIRECT(resp) {
                    if (resp.error && resp.error.statusCode >= 300 && resp.error.statusCode < 400 && resp.httpResponse.headers["location"]) {
                        this.httpRequest.endpoint = new AWS.Endpoint(resp.httpResponse.headers["location"]);
                        this.httpRequest.headers["Host"] = this.httpRequest.endpoint.host;
                        resp.error.redirect = true;
                        resp.error.retryable = true;
                    }
                });
                add("RETRY_CHECK", "retry", function RETRY_CHECK(resp) {
                    if (resp.error) {
                        if (resp.error.redirect && resp.redirectCount < resp.maxRedirects) {
                            resp.error.retryDelay = 0;
                        } else if (resp.retryCount < resp.maxRetries) {
                            resp.error.retryDelay = this.service.retryDelays(resp.retryCount) || 0;
                        }
                    }
                });
                addAsync("RESET_RETRY_STATE", "afterRetry", function RESET_RETRY_STATE(resp, done) {
                    var delay, willRetry = false;
                    if (resp.error) {
                        delay = resp.error.retryDelay || 0;
                        if (resp.error.retryable && resp.retryCount < resp.maxRetries) {
                            resp.retryCount++;
                            willRetry = true;
                        } else if (resp.error.redirect && resp.redirectCount < resp.maxRedirects) {
                            resp.redirectCount++;
                            willRetry = true;
                        }
                    }
                    if (willRetry) {
                        resp.error = null;
                        setTimeout(done, delay);
                    } else {
                        done();
                    }
                });
            }),
            CorePost: new SequentialExecutor().addNamedListeners(function(add) {
                add("EXTRACT_REQUEST_ID", "extractData", AWS.util.extractRequestId);
                add("EXTRACT_REQUEST_ID", "extractError", AWS.util.extractRequestId);
                add("ENOTFOUND_ERROR", "httpError", function ENOTFOUND_ERROR(err) {
                    if (err.code === "NetworkingError" && err.errno === "ENOTFOUND") {
                        var message = "Inaccessible host: `" + err.hostname + "'. This service may not be available in the `" + err.region + "' region.";
                        this.response.error = AWS.util.error(new Error(message), {
                            code: "UnknownEndpoint",
                            region: err.region,
                            hostname: err.hostname,
                            retryable: true,
                            originalError: err
                        });
                    }
                });
            }),
            Logger: new SequentialExecutor().addNamedListeners(function(add) {
                add("LOG_REQUEST", "complete", function LOG_REQUEST(resp) {
                    var req = resp.request;
                    var logger = req.service.config.logger;
                    if (!logger) return;
                    function filterSensitiveLog(inputShape, shape) {
                        if (!shape) {
                            return shape;
                        }
                        switch (inputShape.type) {
                          case "structure":
                            var struct = {};
                            AWS.util.each(shape, function(subShapeName, subShape) {
                                if (Object.prototype.hasOwnProperty.call(inputShape.members, subShapeName)) {
                                    struct[subShapeName] = filterSensitiveLog(inputShape.members[subShapeName], subShape);
                                } else {
                                    struct[subShapeName] = subShape;
                                }
                            });
                            return struct;

                          case "list":
                            var list = [];
                            AWS.util.arrayEach(shape, function(subShape, index) {
                                list.push(filterSensitiveLog(inputShape.member, subShape));
                            });
                            return list;

                          case "map":
                            var map = {};
                            AWS.util.each(shape, function(key, value) {
                                map[key] = filterSensitiveLog(inputShape.value, value);
                            });
                            return map;

                          default:
                            if (inputShape.isSensitive) {
                                return "***SensitiveInformation***";
                            } else {
                                return shape;
                            }
                        }
                    }
                    function buildMessage() {
                        var time = resp.request.service.getSkewCorrectedDate().getTime();
                        var delta = (time - req.startTime.getTime()) / 1e3;
                        var ansi = logger.isTTY ? true : false;
                        var status = resp.httpResponse.statusCode;
                        var censoredParams = req.params;
                        if (req.service.api.operations && req.service.api.operations[req.operation] && req.service.api.operations[req.operation].input) {
                            var inputShape = req.service.api.operations[req.operation].input;
                            censoredParams = filterSensitiveLog(inputShape, req.params);
                        }
                        var params = require("util").inspect(censoredParams, true, null);
                        var message = "";
                        if (ansi) message += "[33m";
                        message += "[AWS " + req.service.serviceIdentifier + " " + status;
                        message += " " + delta.toString() + "s " + resp.retryCount + " retries]";
                        if (ansi) message += "[0;1m";
                        message += " " + AWS.util.string.lowerFirst(req.operation);
                        message += "(" + params + ")";
                        if (ansi) message += "[0m";
                        return message;
                    }
                    var line = buildMessage();
                    if (typeof logger.log === "function") {
                        logger.log(line);
                    } else if (typeof logger.write === "function") {
                        logger.write(line + "\n");
                    }
                });
            }),
            Json: new SequentialExecutor().addNamedListeners(function(add) {
                var svc = require("./protocol/json");
                add("BUILD", "build", svc.buildRequest);
                add("EXTRACT_DATA", "extractData", svc.extractData);
                add("EXTRACT_ERROR", "extractError", svc.extractError);
            }),
            Rest: new SequentialExecutor().addNamedListeners(function(add) {
                var svc = require("./protocol/rest");
                add("BUILD", "build", svc.buildRequest);
                add("EXTRACT_DATA", "extractData", svc.extractData);
                add("EXTRACT_ERROR", "extractError", svc.extractError);
            }),
            RestJson: new SequentialExecutor().addNamedListeners(function(add) {
                var svc = require("./protocol/rest_json");
                add("BUILD", "build", svc.buildRequest);
                add("EXTRACT_DATA", "extractData", svc.extractData);
                add("EXTRACT_ERROR", "extractError", svc.extractError);
            }),
            RestXml: new SequentialExecutor().addNamedListeners(function(add) {
                var svc = require("./protocol/rest_xml");
                add("BUILD", "build", svc.buildRequest);
                add("EXTRACT_DATA", "extractData", svc.extractData);
                add("EXTRACT_ERROR", "extractError", svc.extractError);
            }),
            Query: new SequentialExecutor().addNamedListeners(function(add) {
                var svc = require("./protocol/query");
                add("BUILD", "build", svc.buildRequest);
                add("EXTRACT_DATA", "extractData", svc.extractData);
                add("EXTRACT_ERROR", "extractError", svc.extractError);
            })
        };
    }, {
        "./core": 194,
        "./protocol/json": 220,
        "./protocol/query": 221,
        "./protocol/rest": 222,
        "./protocol/rest_json": 223,
        "./protocol/rest_xml": 224,
        "./sequential_executor": 233,
        util: 159
    } ],
    233: [ function(require, module, exports) {
        var AWS = require("./core");
        AWS.SequentialExecutor = AWS.util.inherit({
            constructor: function SequentialExecutor() {
                this._events = {};
            },
            listeners: function listeners(eventName) {
                return this._events[eventName] ? this._events[eventName].slice(0) : [];
            },
            on: function on(eventName, listener) {
                if (this._events[eventName]) {
                    this._events[eventName].push(listener);
                } else {
                    this._events[eventName] = [ listener ];
                }
                return this;
            },
            onAsync: function onAsync(eventName, listener) {
                listener._isAsync = true;
                return this.on(eventName, listener);
            },
            removeListener: function removeListener(eventName, listener) {
                var listeners = this._events[eventName];
                if (listeners) {
                    var length = listeners.length;
                    var position = -1;
                    for (var i = 0; i < length; ++i) {
                        if (listeners[i] === listener) {
                            position = i;
                        }
                    }
                    if (position > -1) {
                        listeners.splice(position, 1);
                    }
                }
                return this;
            },
            removeAllListeners: function removeAllListeners(eventName) {
                if (eventName) {
                    delete this._events[eventName];
                } else {
                    this._events = {};
                }
                return this;
            },
            emit: function emit(eventName, eventArgs, doneCallback) {
                if (!doneCallback) doneCallback = function() {};
                var listeners = this.listeners(eventName);
                var count = listeners.length;
                this.callListeners(listeners, eventArgs, doneCallback);
                return count > 0;
            },
            callListeners: function callListeners(listeners, args, doneCallback, prevError) {
                var self = this;
                var error = prevError || null;
                function callNextListener(err) {
                    if (err) {
                        error = AWS.util.error(error || new Error(), err);
                        if (self._haltHandlersOnError) {
                            return doneCallback.call(self, error);
                        }
                    }
                    self.callListeners(listeners, args, doneCallback, error);
                }
                while (listeners.length > 0) {
                    var listener = listeners.shift();
                    if (listener._isAsync) {
                        listener.apply(self, args.concat([ callNextListener ]));
                        return;
                    } else {
                        try {
                            listener.apply(self, args);
                        } catch (err) {
                            error = AWS.util.error(error || new Error(), err);
                        }
                        if (error && self._haltHandlersOnError) {
                            doneCallback.call(self, error);
                            return;
                        }
                    }
                }
                doneCallback.call(self, error);
            },
            addListeners: function addListeners(listeners) {
                var self = this;
                if (listeners._events) listeners = listeners._events;
                AWS.util.each(listeners, function(event, callbacks) {
                    if (typeof callbacks === "function") callbacks = [ callbacks ];
                    AWS.util.arrayEach(callbacks, function(callback) {
                        self.on(event, callback);
                    });
                });
                return self;
            },
            addNamedListener: function addNamedListener(name, eventName, callback) {
                this[name] = callback;
                this.addListener(eventName, callback);
                return this;
            },
            addNamedAsyncListener: function addNamedAsyncListener(name, eventName, callback) {
                callback._isAsync = true;
                return this.addNamedListener(name, eventName, callback);
            },
            addNamedListeners: function addNamedListeners(callback) {
                var self = this;
                callback(function() {
                    self.addNamedListener.apply(self, arguments);
                }, function() {
                    self.addNamedAsyncListener.apply(self, arguments);
                });
                return this;
            }
        });
        AWS.SequentialExecutor.prototype.addListener = AWS.SequentialExecutor.prototype.on;
        module.exports = AWS.SequentialExecutor;
    }, {
        "./core": 194
    } ],
    224: [ function(require, module, exports) {
        var AWS = require("../core");
        var util = require("../util");
        var Rest = require("./rest");
        function populateBody(req) {
            var input = req.service.api.operations[req.operation].input;
            var builder = new AWS.XML.Builder();
            var params = req.params;
            var payload = input.payload;
            if (payload) {
                var payloadMember = input.members[payload];
                params = params[payload];
                if (params === undefined) return;
                if (payloadMember.type === "structure") {
                    var rootElement = payloadMember.name;
                    req.httpRequest.body = builder.toXML(params, payloadMember, rootElement, true);
                } else {
                    req.httpRequest.body = params;
                }
            } else {
                req.httpRequest.body = builder.toXML(params, input, input.name || input.shape || util.string.upperFirst(req.operation) + "Request");
            }
        }
        function buildRequest(req) {
            Rest.buildRequest(req);
            if ([ "GET", "HEAD" ].indexOf(req.httpRequest.method) < 0) {
                populateBody(req);
            }
        }
        function extractError(resp) {
            Rest.extractError(resp);
            var data;
            try {
                data = new AWS.XML.Parser().parse(resp.httpResponse.body.toString());
            } catch (e) {
                data = {
                    Code: resp.httpResponse.statusCode,
                    Message: resp.httpResponse.statusMessage
                };
            }
            if (data.Errors) data = data.Errors;
            if (data.Error) data = data.Error;
            if (data.Code) {
                resp.error = util.error(new Error(), {
                    code: data.Code,
                    message: data.Message
                });
            } else {
                resp.error = util.error(new Error(), {
                    code: resp.httpResponse.statusCode,
                    message: null
                });
            }
        }
        function extractData(resp) {
            Rest.extractData(resp);
            var parser;
            var req = resp.request;
            var body = resp.httpResponse.body;
            var operation = req.service.api.operations[req.operation];
            var output = operation.output;
            var payload = output.payload;
            if (payload) {
                var payloadMember = output.members[payload];
                if (payloadMember.type === "structure") {
                    parser = new AWS.XML.Parser();
                    resp.data[payload] = parser.parse(body.toString(), payloadMember);
                } else if (payloadMember.type === "binary" || payloadMember.isStreaming) {
                    resp.data[payload] = body;
                } else {
                    resp.data[payload] = payloadMember.toType(body);
                }
            } else if (body.length > 0) {
                parser = new AWS.XML.Parser();
                var data = parser.parse(body.toString(), output);
                util.update(resp.data, data);
            }
        }
        module.exports = {
            buildRequest: buildRequest,
            extractError: extractError,
            extractData: extractData
        };
    }, {
        "../core": 194,
        "../util": 261,
        "./rest": 222
    } ],
    223: [ function(require, module, exports) {
        var util = require("../util");
        var Rest = require("./rest");
        var Json = require("./json");
        var JsonBuilder = require("../json/builder");
        var JsonParser = require("../json/parser");
        function populateBody(req) {
            var builder = new JsonBuilder();
            var input = req.service.api.operations[req.operation].input;
            if (input.payload) {
                var params = {};
                var payloadShape = input.members[input.payload];
                params = req.params[input.payload];
                if (params === undefined) return;
                if (payloadShape.type === "structure") {
                    req.httpRequest.body = builder.build(params, payloadShape);
                    applyContentTypeHeader(req);
                } else {
                    req.httpRequest.body = params;
                    if (payloadShape.type === "binary" || payloadShape.isStreaming) {
                        applyContentTypeHeader(req, true);
                    }
                }
            } else {
                req.httpRequest.body = builder.build(req.params, input);
                applyContentTypeHeader(req);
            }
        }
        function applyContentTypeHeader(req, isBinary) {
            var operation = req.service.api.operations[req.operation];
            var input = operation.input;
            if (!req.httpRequest.headers["Content-Type"]) {
                var type = isBinary ? "binary/octet-stream" : "application/json";
                req.httpRequest.headers["Content-Type"] = type;
            }
        }
        function buildRequest(req) {
            Rest.buildRequest(req);
            if ([ "GET", "HEAD", "DELETE" ].indexOf(req.httpRequest.method) < 0) {
                populateBody(req);
            }
        }
        function extractError(resp) {
            Json.extractError(resp);
        }
        function extractData(resp) {
            Rest.extractData(resp);
            var req = resp.request;
            var rules = req.service.api.operations[req.operation].output || {};
            if (rules.payload) {
                var payloadMember = rules.members[rules.payload];
                var body = resp.httpResponse.body;
                if (payloadMember.type === "structure" || payloadMember.type === "list") {
                    var parser = new JsonParser();
                    resp.data[rules.payload] = parser.parse(body, payloadMember);
                } else if (payloadMember.type === "binary" || payloadMember.isStreaming) {
                    resp.data[rules.payload] = body;
                } else {
                    resp.data[rules.payload] = payloadMember.toType(body);
                }
            } else {
                var data = resp.data;
                Json.extractData(resp);
                resp.data = util.merge(data, resp.data);
            }
        }
        module.exports = {
            buildRequest: buildRequest,
            extractError: extractError,
            extractData: extractData
        };
    }, {
        "../json/builder": 210,
        "../json/parser": 211,
        "../util": 261,
        "./json": 220,
        "./rest": 222
    } ],
    222: [ function(require, module, exports) {
        var util = require("../util");
        function populateMethod(req) {
            req.httpRequest.method = req.service.api.operations[req.operation].httpMethod;
        }
        function generateURI(endpointPath, operationPath, input, params) {
            var uri = [ endpointPath, operationPath ].join("/");
            uri = uri.replace(/\/+/g, "/");
            var queryString = {}, queryStringSet = false;
            util.each(input.members, function(name, member) {
                var paramValue = params[name];
                if (paramValue === null || paramValue === undefined) return;
                if (member.location === "uri") {
                    var regex = new RegExp("\\{" + member.name + "(\\+)?\\}");
                    uri = uri.replace(regex, function(_, plus) {
                        var fn = plus ? util.uriEscapePath : util.uriEscape;
                        return fn(String(paramValue));
                    });
                } else if (member.location === "querystring") {
                    queryStringSet = true;
                    if (member.type === "list") {
                        queryString[member.name] = paramValue.map(function(val) {
                            return util.uriEscape(String(val));
                        });
                    } else if (member.type === "map") {
                        util.each(paramValue, function(key, value) {
                            if (Array.isArray(value)) {
                                queryString[key] = value.map(function(val) {
                                    return util.uriEscape(String(val));
                                });
                            } else {
                                queryString[key] = util.uriEscape(String(value));
                            }
                        });
                    } else {
                        queryString[member.name] = util.uriEscape(String(paramValue));
                    }
                }
            });
            if (queryStringSet) {
                uri += uri.indexOf("?") >= 0 ? "&" : "?";
                var parts = [];
                util.arrayEach(Object.keys(queryString).sort(), function(key) {
                    if (!Array.isArray(queryString[key])) {
                        queryString[key] = [ queryString[key] ];
                    }
                    for (var i = 0; i < queryString[key].length; i++) {
                        parts.push(util.uriEscape(String(key)) + "=" + queryString[key][i]);
                    }
                });
                uri += parts.join("&");
            }
            return uri;
        }
        function populateURI(req) {
            var operation = req.service.api.operations[req.operation];
            var input = operation.input;
            var uri = generateURI(req.httpRequest.endpoint.path, operation.httpPath, input, req.params);
            req.httpRequest.path = uri;
        }
        function populateHeaders(req) {
            var operation = req.service.api.operations[req.operation];
            util.each(operation.input.members, function(name, member) {
                var value = req.params[name];
                if (value === null || value === undefined) return;
                if (member.location === "headers" && member.type === "map") {
                    util.each(value, function(key, memberValue) {
                        req.httpRequest.headers[member.name + key] = memberValue;
                    });
                } else if (member.location === "header") {
                    value = member.toWireFormat(value).toString();
                    if (member.isJsonValue) {
                        value = util.base64.encode(value);
                    }
                    req.httpRequest.headers[member.name] = value;
                }
            });
        }
        function buildRequest(req) {
            populateMethod(req);
            populateURI(req);
            populateHeaders(req);
        }
        function extractError() {}
        function extractData(resp) {
            var req = resp.request;
            var data = {};
            var r = resp.httpResponse;
            var operation = req.service.api.operations[req.operation];
            var output = operation.output;
            var headers = {};
            util.each(r.headers, function(k, v) {
                headers[k.toLowerCase()] = v;
            });
            util.each(output.members, function(name, member) {
                var header = (member.name || name).toLowerCase();
                if (member.location === "headers" && member.type === "map") {
                    data[name] = {};
                    var location = member.isLocationName ? member.name : "";
                    var pattern = new RegExp("^" + location + "(.+)", "i");
                    util.each(r.headers, function(k, v) {
                        var result = k.match(pattern);
                        if (result !== null) {
                            data[name][result[1]] = v;
                        }
                    });
                } else if (member.location === "header") {
                    if (headers[header] !== undefined) {
                        var value = member.isJsonValue ? util.base64.decode(headers[header]) : headers[header];
                        data[name] = member.toType(value);
                    }
                } else if (member.location === "statusCode") {
                    data[name] = parseInt(r.statusCode, 10);
                }
            });
            resp.data = data;
        }
        module.exports = {
            buildRequest: buildRequest,
            extractError: extractError,
            extractData: extractData,
            generateURI: generateURI
        };
    }, {
        "../util": 261
    } ],
    221: [ function(require, module, exports) {
        var AWS = require("../core");
        var util = require("../util");
        var QueryParamSerializer = require("../query/query_param_serializer");
        var Shape = require("../model/shape");
        function buildRequest(req) {
            var operation = req.service.api.operations[req.operation];
            var httpRequest = req.httpRequest;
            httpRequest.headers["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
            httpRequest.params = {
                Version: req.service.api.apiVersion,
                Action: operation.name
            };
            var builder = new QueryParamSerializer();
            builder.serialize(req.params, operation.input, function(name, value) {
                httpRequest.params[name] = value;
            });
            httpRequest.body = util.queryParamsToString(httpRequest.params);
        }
        function extractError(resp) {
            var data, body = resp.httpResponse.body.toString();
            if (body.match("<UnknownOperationException")) {
                data = {
                    Code: "UnknownOperation",
                    Message: "Unknown operation " + resp.request.operation
                };
            } else {
                try {
                    data = new AWS.XML.Parser().parse(body);
                } catch (e) {
                    data = {
                        Code: resp.httpResponse.statusCode,
                        Message: resp.httpResponse.statusMessage
                    };
                }
            }
            if (data.requestId && !resp.requestId) resp.requestId = data.requestId;
            if (data.Errors) data = data.Errors;
            if (data.Error) data = data.Error;
            if (data.Code) {
                resp.error = util.error(new Error(), {
                    code: data.Code,
                    message: data.Message
                });
            } else {
                resp.error = util.error(new Error(), {
                    code: resp.httpResponse.statusCode,
                    message: null
                });
            }
        }
        function extractData(resp) {
            var req = resp.request;
            var operation = req.service.api.operations[req.operation];
            var shape = operation.output || {};
            var origRules = shape;
            if (origRules.resultWrapper) {
                var tmp = Shape.create({
                    type: "structure"
                });
                tmp.members[origRules.resultWrapper] = shape;
                tmp.memberNames = [ origRules.resultWrapper ];
                util.property(shape, "name", shape.resultWrapper);
                shape = tmp;
            }
            var parser = new AWS.XML.Parser();
            if (shape && shape.members && !shape.members._XAMZRequestId) {
                var requestIdShape = Shape.create({
                    type: "string"
                }, {
                    api: {
                        protocol: "query"
                    }
                }, "requestId");
                shape.members._XAMZRequestId = requestIdShape;
            }
            var data = parser.parse(resp.httpResponse.body.toString(), shape);
            resp.requestId = data._XAMZRequestId || data.requestId;
            if (data._XAMZRequestId) delete data._XAMZRequestId;
            if (origRules.resultWrapper) {
                if (data[origRules.resultWrapper]) {
                    util.update(data, data[origRules.resultWrapper]);
                    delete data[origRules.resultWrapper];
                }
            }
            resp.data = data;
        }
        module.exports = {
            buildRequest: buildRequest,
            extractError: extractError,
            extractData: extractData
        };
    }, {
        "../core": 194,
        "../model/shape": 217,
        "../query/query_param_serializer": 225,
        "../util": 261
    } ],
    225: [ function(require, module, exports) {
        var util = require("../util");
        function QueryParamSerializer() {}
        QueryParamSerializer.prototype.serialize = function(params, shape, fn) {
            serializeStructure("", params, shape, fn);
        };
        function ucfirst(shape) {
            if (shape.isQueryName || shape.api.protocol !== "ec2") {
                return shape.name;
            } else {
                return shape.name[0].toUpperCase() + shape.name.substr(1);
            }
        }
        function serializeStructure(prefix, struct, rules, fn) {
            util.each(rules.members, function(name, member) {
                var value = struct[name];
                if (value === null || value === undefined) return;
                var memberName = ucfirst(member);
                memberName = prefix ? prefix + "." + memberName : memberName;
                serializeMember(memberName, value, member, fn);
            });
        }
        function serializeMap(name, map, rules, fn) {
            var i = 1;
            util.each(map, function(key, value) {
                var prefix = rules.flattened ? "." : ".entry.";
                var position = prefix + i++ + ".";
                var keyName = position + (rules.key.name || "key");
                var valueName = position + (rules.value.name || "value");
                serializeMember(name + keyName, key, rules.key, fn);
                serializeMember(name + valueName, value, rules.value, fn);
            });
        }
        function serializeList(name, list, rules, fn) {
            var memberRules = rules.member || {};
            if (list.length === 0) {
                fn.call(this, name, null);
                return;
            }
            util.arrayEach(list, function(v, n) {
                var suffix = "." + (n + 1);
                if (rules.api.protocol === "ec2") {
                    suffix = suffix + "";
                } else if (rules.flattened) {
                    if (memberRules.name) {
                        var parts = name.split(".");
                        parts.pop();
                        parts.push(ucfirst(memberRules));
                        name = parts.join(".");
                    }
                } else {
                    suffix = "." + (memberRules.name ? memberRules.name : "member") + suffix;
                }
                serializeMember(name + suffix, v, memberRules, fn);
            });
        }
        function serializeMember(name, value, rules, fn) {
            if (value === null || value === undefined) return;
            if (rules.type === "structure") {
                serializeStructure(name, value, rules, fn);
            } else if (rules.type === "list") {
                serializeList(name, value, rules, fn);
            } else if (rules.type === "map") {
                serializeMap(name, value, rules, fn);
            } else {
                fn(name, rules.toWireFormat(value).toString());
            }
        }
        module.exports = QueryParamSerializer;
    }, {
        "../util": 261
    } ],
    217: [ function(require, module, exports) {
        var Collection = require("./collection");
        var util = require("../util");
        function property(obj, name, value) {
            if (value !== null && value !== undefined) {
                util.property.apply(this, arguments);
            }
        }
        function memoizedProperty(obj, name) {
            if (!obj.constructor.prototype[name]) {
                util.memoizedProperty.apply(this, arguments);
            }
        }
        function Shape(shape, options, memberName) {
            options = options || {};
            property(this, "shape", shape.shape);
            property(this, "api", options.api, false);
            property(this, "type", shape.type);
            property(this, "enum", shape.enum);
            property(this, "min", shape.min);
            property(this, "max", shape.max);
            property(this, "pattern", shape.pattern);
            property(this, "location", shape.location || this.location || "body");
            property(this, "name", this.name || shape.xmlName || shape.queryName || shape.locationName || memberName);
            property(this, "isStreaming", shape.streaming || this.isStreaming || false);
            property(this, "isComposite", shape.isComposite || false);
            property(this, "isShape", true, false);
            property(this, "isQueryName", Boolean(shape.queryName), false);
            property(this, "isLocationName", Boolean(shape.locationName), false);
            property(this, "isIdempotent", shape.idempotencyToken === true);
            property(this, "isJsonValue", shape.jsonvalue === true);
            property(this, "isSensitive", shape.sensitive === true || shape.prototype && shape.prototype.sensitive === true);
            if (options.documentation) {
                property(this, "documentation", shape.documentation);
                property(this, "documentationUrl", shape.documentationUrl);
            }
            if (shape.xmlAttribute) {
                property(this, "isXmlAttribute", shape.xmlAttribute || false);
            }
            property(this, "defaultValue", null);
            this.toWireFormat = function(value) {
                if (value === null || value === undefined) return "";
                return value;
            };
            this.toType = function(value) {
                return value;
            };
        }
        Shape.normalizedTypes = {
            character: "string",
            double: "float",
            long: "integer",
            short: "integer",
            biginteger: "integer",
            bigdecimal: "float",
            blob: "binary"
        };
        Shape.types = {
            structure: StructureShape,
            list: ListShape,
            map: MapShape,
            boolean: BooleanShape,
            timestamp: TimestampShape,
            float: FloatShape,
            integer: IntegerShape,
            string: StringShape,
            base64: Base64Shape,
            binary: BinaryShape
        };
        Shape.resolve = function resolve(shape, options) {
            if (shape.shape) {
                var refShape = options.api.shapes[shape.shape];
                if (!refShape) {
                    throw new Error("Cannot find shape reference: " + shape.shape);
                }
                return refShape;
            } else {
                return null;
            }
        };
        Shape.create = function create(shape, options, memberName) {
            if (shape.isShape) return shape;
            var refShape = Shape.resolve(shape, options);
            if (refShape) {
                var filteredKeys = Object.keys(shape);
                if (!options.documentation) {
                    filteredKeys = filteredKeys.filter(function(name) {
                        return !name.match(/documentation/);
                    });
                }
                var InlineShape = function() {
                    refShape.constructor.call(this, shape, options, memberName);
                };
                InlineShape.prototype = refShape;
                return new InlineShape();
            } else {
                if (!shape.type) {
                    if (shape.members) shape.type = "structure"; else if (shape.member) shape.type = "list"; else if (shape.key) shape.type = "map"; else shape.type = "string";
                }
                var origType = shape.type;
                if (Shape.normalizedTypes[shape.type]) {
                    shape.type = Shape.normalizedTypes[shape.type];
                }
                if (Shape.types[shape.type]) {
                    return new Shape.types[shape.type](shape, options, memberName);
                } else {
                    throw new Error("Unrecognized shape type: " + origType);
                }
            }
        };
        function CompositeShape(shape) {
            Shape.apply(this, arguments);
            property(this, "isComposite", true);
            if (shape.flattened) {
                property(this, "flattened", shape.flattened || false);
            }
        }
        function StructureShape(shape, options) {
            var requiredMap = null, firstInit = !this.isShape;
            CompositeShape.apply(this, arguments);
            if (firstInit) {
                property(this, "defaultValue", function() {
                    return {};
                });
                property(this, "members", {});
                property(this, "memberNames", []);
                property(this, "required", []);
                property(this, "isRequired", function() {
                    return false;
                });
            }
            if (shape.members) {
                property(this, "members", new Collection(shape.members, options, function(name, member) {
                    return Shape.create(member, options, name);
                }));
                memoizedProperty(this, "memberNames", function() {
                    return shape.xmlOrder || Object.keys(shape.members);
                });
            }
            if (shape.required) {
                property(this, "required", shape.required);
                property(this, "isRequired", function(name) {
                    if (!requiredMap) {
                        requiredMap = {};
                        for (var i = 0; i < shape.required.length; i++) {
                            requiredMap[shape.required[i]] = true;
                        }
                    }
                    return requiredMap[name];
                }, false, true);
            }
            property(this, "resultWrapper", shape.resultWrapper || null);
            if (shape.payload) {
                property(this, "payload", shape.payload);
            }
            if (typeof shape.xmlNamespace === "string") {
                property(this, "xmlNamespaceUri", shape.xmlNamespace);
            } else if (typeof shape.xmlNamespace === "object") {
                property(this, "xmlNamespacePrefix", shape.xmlNamespace.prefix);
                property(this, "xmlNamespaceUri", shape.xmlNamespace.uri);
            }
        }
        function ListShape(shape, options) {
            var self = this, firstInit = !this.isShape;
            CompositeShape.apply(this, arguments);
            if (firstInit) {
                property(this, "defaultValue", function() {
                    return [];
                });
            }
            if (shape.member) {
                memoizedProperty(this, "member", function() {
                    return Shape.create(shape.member, options);
                });
            }
            if (this.flattened) {
                var oldName = this.name;
                memoizedProperty(this, "name", function() {
                    return self.member.name || oldName;
                });
            }
        }
        function MapShape(shape, options) {
            var firstInit = !this.isShape;
            CompositeShape.apply(this, arguments);
            if (firstInit) {
                property(this, "defaultValue", function() {
                    return {};
                });
                property(this, "key", Shape.create({
                    type: "string"
                }, options));
                property(this, "value", Shape.create({
                    type: "string"
                }, options));
            }
            if (shape.key) {
                memoizedProperty(this, "key", function() {
                    return Shape.create(shape.key, options);
                });
            }
            if (shape.value) {
                memoizedProperty(this, "value", function() {
                    return Shape.create(shape.value, options);
                });
            }
        }
        function TimestampShape(shape) {
            var self = this;
            Shape.apply(this, arguments);
            if (this.location === "header") {
                property(this, "timestampFormat", "rfc822");
            } else if (shape.timestampFormat) {
                property(this, "timestampFormat", shape.timestampFormat);
            } else if (!this.timestampFormat && this.api) {
                if (this.api.timestampFormat) {
                    property(this, "timestampFormat", this.api.timestampFormat);
                } else {
                    switch (this.api.protocol) {
                      case "json":
                      case "rest-json":
                        property(this, "timestampFormat", "unixTimestamp");
                        break;

                      case "rest-xml":
                      case "query":
                      case "ec2":
                        property(this, "timestampFormat", "iso8601");
                        break;
                    }
                }
            }
            this.toType = function(value) {
                if (value === null || value === undefined) return null;
                if (typeof value.toUTCString === "function") return value;
                return typeof value === "string" || typeof value === "number" ? util.date.parseTimestamp(value) : null;
            };
            this.toWireFormat = function(value) {
                return util.date.format(value, self.timestampFormat);
            };
        }
        function StringShape() {
            Shape.apply(this, arguments);
            var nullLessProtocols = [ "rest-xml", "query", "ec2" ];
            this.toType = function(value) {
                value = this.api && nullLessProtocols.indexOf(this.api.protocol) > -1 ? value || "" : value;
                if (this.isJsonValue) {
                    return JSON.parse(value);
                }
                return value && typeof value.toString === "function" ? value.toString() : value;
            };
            this.toWireFormat = function(value) {
                return this.isJsonValue ? JSON.stringify(value) : value;
            };
        }
        function FloatShape() {
            Shape.apply(this, arguments);
            this.toType = function(value) {
                if (value === null || value === undefined) return null;
                return parseFloat(value);
            };
            this.toWireFormat = this.toType;
        }
        function IntegerShape() {
            Shape.apply(this, arguments);
            this.toType = function(value) {
                if (value === null || value === undefined) return null;
                return parseInt(value, 10);
            };
            this.toWireFormat = this.toType;
        }
        function BinaryShape() {
            Shape.apply(this, arguments);
            this.toType = util.base64.decode;
            this.toWireFormat = util.base64.encode;
        }
        function Base64Shape() {
            BinaryShape.apply(this, arguments);
        }
        function BooleanShape() {
            Shape.apply(this, arguments);
            this.toType = function(value) {
                if (typeof value === "boolean") return value;
                if (value === null || value === undefined) return null;
                return value === "true";
            };
        }
        Shape.shapes = {
            StructureShape: StructureShape,
            ListShape: ListShape,
            MapShape: MapShape,
            StringShape: StringShape,
            BooleanShape: BooleanShape,
            Base64Shape: Base64Shape
        };
        module.exports = Shape;
    }, {
        "../util": 261,
        "./collection": 213
    } ],
    213: [ function(require, module, exports) {
        var memoizedProperty = require("../util").memoizedProperty;
        function memoize(name, value, fn, nameTr) {
            memoizedProperty(this, nameTr(name), function() {
                return fn(name, value);
            });
        }
        function Collection(iterable, options, fn, nameTr) {
            nameTr = nameTr || String;
            var self = this;
            for (var id in iterable) {
                if (Object.prototype.hasOwnProperty.call(iterable, id)) {
                    memoize.call(self, id, iterable[id], fn, nameTr);
                }
            }
        }
        module.exports = Collection;
    }, {
        "../util": 261
    } ],
    220: [ function(require, module, exports) {
        var util = require("../util");
        var JsonBuilder = require("../json/builder");
        var JsonParser = require("../json/parser");
        function buildRequest(req) {
            var httpRequest = req.httpRequest;
            var api = req.service.api;
            var target = api.targetPrefix + "." + api.operations[req.operation].name;
            var version = api.jsonVersion || "1.0";
            var input = api.operations[req.operation].input;
            var builder = new JsonBuilder();
            if (version === 1) version = "1.0";
            httpRequest.body = builder.build(req.params || {}, input);
            httpRequest.headers["Content-Type"] = "application/x-amz-json-" + version;
            httpRequest.headers["X-Amz-Target"] = target;
        }
        function extractError(resp) {
            var error = {};
            var httpResponse = resp.httpResponse;
            error.code = httpResponse.headers["x-amzn-errortype"] || "UnknownError";
            if (typeof error.code === "string") {
                error.code = error.code.split(":")[0];
            }
            if (httpResponse.body.length > 0) {
                try {
                    var e = JSON.parse(httpResponse.body.toString());
                    if (e.__type || e.code) {
                        error.code = (e.__type || e.code).split("#").pop();
                    }
                    if (error.code === "RequestEntityTooLarge") {
                        error.message = "Request body must be less than 1 MB";
                    } else {
                        error.message = e.message || e.Message || null;
                    }
                } catch (e) {
                    error.statusCode = httpResponse.statusCode;
                    error.message = httpResponse.statusMessage;
                }
            } else {
                error.statusCode = httpResponse.statusCode;
                error.message = httpResponse.statusCode.toString();
            }
            resp.error = util.error(new Error(), error);
        }
        function extractData(resp) {
            var body = resp.httpResponse.body.toString() || "{}";
            if (resp.request.service.config.convertResponseTypes === false) {
                resp.data = JSON.parse(body);
            } else {
                var operation = resp.request.service.api.operations[resp.request.operation];
                var shape = operation.output || {};
                var parser = new JsonParser();
                resp.data = parser.parse(body, shape);
            }
        }
        module.exports = {
            buildRequest: buildRequest,
            extractError: extractError,
            extractData: extractData
        };
    }, {
        "../json/builder": 210,
        "../json/parser": 211,
        "../util": 261
    } ],
    211: [ function(require, module, exports) {
        var util = require("../util");
        function JsonParser() {}
        JsonParser.prototype.parse = function(value, shape) {
            return translate(JSON.parse(value), shape);
        };
        function translate(value, shape) {
            if (!shape || value === undefined) return undefined;
            switch (shape.type) {
              case "structure":
                return translateStructure(value, shape);

              case "map":
                return translateMap(value, shape);

              case "list":
                return translateList(value, shape);

              default:
                return translateScalar(value, shape);
            }
        }
        function translateStructure(structure, shape) {
            if (structure == null) return undefined;
            var struct = {};
            var shapeMembers = shape.members;
            util.each(shapeMembers, function(name, memberShape) {
                var locationName = memberShape.isLocationName ? memberShape.name : name;
                if (Object.prototype.hasOwnProperty.call(structure, locationName)) {
                    var value = structure[locationName];
                    var result = translate(value, memberShape);
                    if (result !== undefined) struct[name] = result;
                }
            });
            return struct;
        }
        function translateList(list, shape) {
            if (list == null) return undefined;
            var out = [];
            util.arrayEach(list, function(value) {
                var result = translate(value, shape.member);
                if (result === undefined) out.push(null); else out.push(result);
            });
            return out;
        }
        function translateMap(map, shape) {
            if (map == null) return undefined;
            var out = {};
            util.each(map, function(key, value) {
                var result = translate(value, shape.value);
                if (result === undefined) out[key] = null; else out[key] = result;
            });
            return out;
        }
        function translateScalar(value, shape) {
            return shape.toType(value);
        }
        module.exports = JsonParser;
    }, {
        "../util": 261
    } ],
    210: [ function(require, module, exports) {
        var util = require("../util");
        function JsonBuilder() {}
        JsonBuilder.prototype.build = function(value, shape) {
            return JSON.stringify(translate(value, shape));
        };
        function translate(value, shape) {
            if (!shape || value === undefined || value === null) return undefined;
            switch (shape.type) {
              case "structure":
                return translateStructure(value, shape);

              case "map":
                return translateMap(value, shape);

              case "list":
                return translateList(value, shape);

              default:
                return translateScalar(value, shape);
            }
        }
        function translateStructure(structure, shape) {
            var struct = {};
            util.each(structure, function(name, value) {
                var memberShape = shape.members[name];
                if (memberShape) {
                    if (memberShape.location !== "body") return;
                    var locationName = memberShape.isLocationName ? memberShape.name : name;
                    var result = translate(value, memberShape);
                    if (result !== undefined) struct[locationName] = result;
                }
            });
            return struct;
        }
        function translateList(list, shape) {
            var out = [];
            util.arrayEach(list, function(value) {
                var result = translate(value, shape.member);
                if (result !== undefined) out.push(result);
            });
            return out;
        }
        function translateMap(map, shape) {
            var out = {};
            util.each(map, function(key, value) {
                var result = translate(value, shape.value);
                if (result !== undefined) out[key] = result;
            });
            return out;
        }
        function translateScalar(value, shape) {
            return shape.toWireFormat(value);
        }
        module.exports = JsonBuilder;
    }, {
        "../util": 261
    } ],
    261: [ function(require, module, exports) {
        (function(process) {
            var AWS;
            var util = {
                environment: "nodejs",
                engine: function engine() {
                    if (util.isBrowser() && typeof navigator !== "undefined") {
                        return navigator.userAgent;
                    } else {
                        var engine = process.platform + "/" + process.version;
                        if (process.env.AWS_EXECUTION_ENV) {
                            engine += " exec-env/" + process.env.AWS_EXECUTION_ENV;
                        }
                        return engine;
                    }
                },
                userAgent: function userAgent() {
                    var name = util.environment;
                    var agent = "aws-sdk-" + name + "/" + require("./core").VERSION;
                    if (name === "nodejs") agent += " " + util.engine();
                    return agent;
                },
                isBrowser: function isBrowser() {
                    return process && process.browser;
                },
                isNode: function isNode() {
                    return !util.isBrowser();
                },
                uriEscape: function uriEscape(string) {
                    var output = encodeURIComponent(string);
                    output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape);
                    output = output.replace(/[*]/g, function(ch) {
                        return "%" + ch.charCodeAt(0).toString(16).toUpperCase();
                    });
                    return output;
                },
                uriEscapePath: function uriEscapePath(string) {
                    var parts = [];
                    util.arrayEach(string.split("/"), function(part) {
                        parts.push(util.uriEscape(part));
                    });
                    return parts.join("/");
                },
                urlParse: function urlParse(url) {
                    return util.url.parse(url);
                },
                urlFormat: function urlFormat(url) {
                    return util.url.format(url);
                },
                queryStringParse: function queryStringParse(qs) {
                    return util.querystring.parse(qs);
                },
                queryParamsToString: function queryParamsToString(params) {
                    var items = [];
                    var escape = util.uriEscape;
                    var sortedKeys = Object.keys(params).sort();
                    util.arrayEach(sortedKeys, function(name) {
                        var value = params[name];
                        var ename = escape(name);
                        var result = ename + "=";
                        if (Array.isArray(value)) {
                            var vals = [];
                            util.arrayEach(value, function(item) {
                                vals.push(escape(item));
                            });
                            result = ename + "=" + vals.sort().join("&" + ename + "=");
                        } else if (value !== undefined && value !== null) {
                            result = ename + "=" + escape(value);
                        }
                        items.push(result);
                    });
                    return items.join("&");
                },
                readFileSync: function readFileSync(path) {
                    if (util.isBrowser()) return null;
                    return require("fs").readFileSync(path, "utf-8");
                },
                base64: {
                    encode: function encode64(string) {
                        if (typeof string === "number") {
                            throw util.error(new Error("Cannot base64 encode number " + string));
                        }
                        if (string === null || typeof string === "undefined") {
                            return string;
                        }
                        var buf = typeof util.Buffer.from === "function" && util.Buffer.from !== Uint8Array.from ? util.Buffer.from(string) : new util.Buffer(string);
                        return buf.toString("base64");
                    },
                    decode: function decode64(string) {
                        if (typeof string === "number") {
                            throw util.error(new Error("Cannot base64 decode number " + string));
                        }
                        if (string === null || typeof string === "undefined") {
                            return string;
                        }
                        return typeof util.Buffer.from === "function" && util.Buffer.from !== Uint8Array.from ? util.Buffer.from(string, "base64") : new util.Buffer(string, "base64");
                    }
                },
                buffer: {
                    toStream: function toStream(buffer) {
                        if (!util.Buffer.isBuffer(buffer)) buffer = new util.Buffer(buffer);
                        var readable = new util.stream.Readable();
                        var pos = 0;
                        readable._read = function(size) {
                            if (pos >= buffer.length) return readable.push(null);
                            var end = pos + size;
                            if (end > buffer.length) end = buffer.length;
                            readable.push(buffer.slice(pos, end));
                            pos = end;
                        };
                        return readable;
                    },
                    concat: function(buffers) {
                        var length = 0, offset = 0, buffer = null, i;
                        for (i = 0; i < buffers.length; i++) {
                            length += buffers[i].length;
                        }
                        buffer = new util.Buffer(length);
                        for (i = 0; i < buffers.length; i++) {
                            buffers[i].copy(buffer, offset);
                            offset += buffers[i].length;
                        }
                        return buffer;
                    }
                },
                string: {
                    byteLength: function byteLength(string) {
                        if (string === null || string === undefined) return 0;
                        if (typeof string === "string") string = new util.Buffer(string);
                        if (typeof string.byteLength === "number") {
                            return string.byteLength;
                        } else if (typeof string.length === "number") {
                            return string.length;
                        } else if (typeof string.size === "number") {
                            return string.size;
                        } else if (typeof string.path === "string") {
                            return require("fs").lstatSync(string.path).size;
                        } else {
                            throw util.error(new Error("Cannot determine length of " + string), {
                                object: string
                            });
                        }
                    },
                    upperFirst: function upperFirst(string) {
                        return string[0].toUpperCase() + string.substr(1);
                    },
                    lowerFirst: function lowerFirst(string) {
                        return string[0].toLowerCase() + string.substr(1);
                    }
                },
                ini: {
                    parse: function string(ini) {
                        var currentSection, map = {};
                        util.arrayEach(ini.split(/\r?\n/), function(line) {
                            line = line.split(/(^|\s)[;#]/)[0];
                            var section = line.match(/^\s*\[([^\[\]]+)\]\s*$/);
                            if (section) {
                                currentSection = section[1];
                            } else if (currentSection) {
                                var item = line.match(/^\s*(.+?)\s*=\s*(.+?)\s*$/);
                                if (item) {
                                    map[currentSection] = map[currentSection] || {};
                                    map[currentSection][item[1]] = item[2];
                                }
                            }
                        });
                        return map;
                    }
                },
                fn: {
                    noop: function() {},
                    makeAsync: function makeAsync(fn, expectedArgs) {
                        if (expectedArgs && expectedArgs <= fn.length) {
                            return fn;
                        }
                        return function() {
                            var args = Array.prototype.slice.call(arguments, 0);
                            var callback = args.pop();
                            var result = fn.apply(null, args);
                            callback(result);
                        };
                    }
                },
                date: {
                    getDate: function getDate() {
                        if (!AWS) AWS = require("./core");
                        if (AWS.config.systemClockOffset) {
                            return new Date(new Date().getTime() + AWS.config.systemClockOffset);
                        } else {
                            return new Date();
                        }
                    },
                    iso8601: function iso8601(date) {
                        if (date === undefined) {
                            date = util.date.getDate();
                        }
                        return date.toISOString().replace(/\.\d{3}Z$/, "Z");
                    },
                    rfc822: function rfc822(date) {
                        if (date === undefined) {
                            date = util.date.getDate();
                        }
                        return date.toUTCString();
                    },
                    unixTimestamp: function unixTimestamp(date) {
                        if (date === undefined) {
                            date = util.date.getDate();
                        }
                        return date.getTime() / 1e3;
                    },
                    from: function format(date) {
                        if (typeof date === "number") {
                            return new Date(date * 1e3);
                        } else {
                            return new Date(date);
                        }
                    },
                    format: function format(date, formatter) {
                        if (!formatter) formatter = "iso8601";
                        return util.date[formatter](util.date.from(date));
                    },
                    parseTimestamp: function parseTimestamp(value) {
                        if (typeof value === "number") {
                            return new Date(value * 1e3);
                        } else if (value.match(/^\d+$/)) {
                            return new Date(value * 1e3);
                        } else if (value.match(/^\d{4}/)) {
                            return new Date(value);
                        } else if (value.match(/^\w{3},/)) {
                            return new Date(value);
                        } else {
                            throw util.error(new Error("unhandled timestamp format: " + value), {
                                code: "TimestampParserError"
                            });
                        }
                    }
                },
                crypto: {
                    crc32Table: [ 0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035, 249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049, 498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639, 325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317, 997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443, 901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665, 651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303, 671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565, 1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059, 2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297, 1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223, 1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405, 1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995, 1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649, 1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015, 1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989, 3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523, 3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377, 4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879, 4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637, 3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859, 3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161, 3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815, 3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221, 2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371, 2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881, 2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567, 2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701, 2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035, 2932959818, 3654703836, 1088359270, 936918e3, 2847714899, 3736837829, 1202900863, 817233897, 3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431, 3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117 ],
                    crc32: function crc32(data) {
                        var tbl = util.crypto.crc32Table;
                        var crc = 0 ^ -1;
                        if (typeof data === "string") {
                            data = new util.Buffer(data);
                        }
                        for (var i = 0; i < data.length; i++) {
                            var code = data.readUInt8(i);
                            crc = crc >>> 8 ^ tbl[(crc ^ code) & 255];
                        }
                        return (crc ^ -1) >>> 0;
                    },
                    hmac: function hmac(key, string, digest, fn) {
                        if (!digest) digest = "binary";
                        if (digest === "buffer") {
                            digest = undefined;
                        }
                        if (!fn) fn = "sha256";
                        if (typeof string === "string") string = new util.Buffer(string);
                        return util.crypto.lib.createHmac(fn, key).update(string).digest(digest);
                    },
                    md5: function md5(data, digest, callback) {
                        return util.crypto.hash("md5", data, digest, callback);
                    },
                    sha256: function sha256(data, digest, callback) {
                        return util.crypto.hash("sha256", data, digest, callback);
                    },
                    hash: function(algorithm, data, digest, callback) {
                        var hash = util.crypto.createHash(algorithm);
                        if (!digest) {
                            digest = "binary";
                        }
                        if (digest === "buffer") {
                            digest = undefined;
                        }
                        if (typeof data === "string") data = new util.Buffer(data);
                        var sliceFn = util.arraySliceFn(data);
                        var isBuffer = util.Buffer.isBuffer(data);
                        if (util.isBrowser() && typeof ArrayBuffer !== "undefined" && data && data.buffer instanceof ArrayBuffer) isBuffer = true;
                        if (callback && typeof data === "object" && typeof data.on === "function" && !isBuffer) {
                            data.on("data", function(chunk) {
                                hash.update(chunk);
                            });
                            data.on("error", function(err) {
                                callback(err);
                            });
                            data.on("end", function() {
                                callback(null, hash.digest(digest));
                            });
                        } else if (callback && sliceFn && !isBuffer && typeof FileReader !== "undefined") {
                            var index = 0, size = 1024 * 512;
                            var reader = new FileReader();
                            reader.onerror = function() {
                                callback(new Error("Failed to read data."));
                            };
                            reader.onload = function() {
                                var buf = new util.Buffer(new Uint8Array(reader.result));
                                hash.update(buf);
                                index += buf.length;
                                reader._continueReading();
                            };
                            reader._continueReading = function() {
                                if (index >= data.size) {
                                    callback(null, hash.digest(digest));
                                    return;
                                }
                                var back = index + size;
                                if (back > data.size) back = data.size;
                                reader.readAsArrayBuffer(sliceFn.call(data, index, back));
                            };
                            reader._continueReading();
                        } else {
                            if (util.isBrowser() && typeof data === "object" && !isBuffer) {
                                data = new util.Buffer(new Uint8Array(data));
                            }
                            var out = hash.update(data).digest(digest);
                            if (callback) callback(null, out);
                            return out;
                        }
                    },
                    toHex: function toHex(data) {
                        var out = [];
                        for (var i = 0; i < data.length; i++) {
                            out.push(("0" + data.charCodeAt(i).toString(16)).substr(-2, 2));
                        }
                        return out.join("");
                    },
                    createHash: function createHash(algorithm) {
                        return util.crypto.lib.createHash(algorithm);
                    }
                },
                abort: {},
                each: function each(object, iterFunction) {
                    for (var key in object) {
                        if (Object.prototype.hasOwnProperty.call(object, key)) {
                            var ret = iterFunction.call(this, key, object[key]);
                            if (ret === util.abort) break;
                        }
                    }
                },
                arrayEach: function arrayEach(array, iterFunction) {
                    for (var idx in array) {
                        if (Object.prototype.hasOwnProperty.call(array, idx)) {
                            var ret = iterFunction.call(this, array[idx], parseInt(idx, 10));
                            if (ret === util.abort) break;
                        }
                    }
                },
                update: function update(obj1, obj2) {
                    util.each(obj2, function iterator(key, item) {
                        obj1[key] = item;
                    });
                    return obj1;
                },
                merge: function merge(obj1, obj2) {
                    return util.update(util.copy(obj1), obj2);
                },
                copy: function copy(object) {
                    if (object === null || object === undefined) return object;
                    var dupe = {};
                    for (var key in object) {
                        dupe[key] = object[key];
                    }
                    return dupe;
                },
                isEmpty: function isEmpty(obj) {
                    for (var prop in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                            return false;
                        }
                    }
                    return true;
                },
                arraySliceFn: function arraySliceFn(obj) {
                    var fn = obj.slice || obj.webkitSlice || obj.mozSlice;
                    return typeof fn === "function" ? fn : null;
                },
                isType: function isType(obj, type) {
                    if (typeof type === "function") type = util.typeName(type);
                    return Object.prototype.toString.call(obj) === "[object " + type + "]";
                },
                typeName: function typeName(type) {
                    if (Object.prototype.hasOwnProperty.call(type, "name")) return type.name;
                    var str = type.toString();
                    var match = str.match(/^\s*function (.+)\(/);
                    return match ? match[1] : str;
                },
                error: function error(err, options) {
                    var originalError = null;
                    if (typeof err.message === "string" && err.message !== "") {
                        if (typeof options === "string" || options && options.message) {
                            originalError = util.copy(err);
                            originalError.message = err.message;
                        }
                    }
                    err.message = err.message || null;
                    if (typeof options === "string") {
                        err.message = options;
                    } else if (typeof options === "object" && options !== null) {
                        util.update(err, options);
                        if (options.message) err.message = options.message;
                        if (options.code || options.name) err.code = options.code || options.name;
                        if (options.stack) err.stack = options.stack;
                    }
                    if (typeof Object.defineProperty === "function") {
                        Object.defineProperty(err, "name", {
                            writable: true,
                            enumerable: false
                        });
                        Object.defineProperty(err, "message", {
                            enumerable: true
                        });
                    }
                    err.name = options && options.name || err.name || err.code || "Error";
                    err.time = new Date();
                    if (originalError) err.originalError = originalError;
                    return err;
                },
                inherit: function inherit(klass, features) {
                    var newObject = null;
                    if (features === undefined) {
                        features = klass;
                        klass = Object;
                        newObject = {};
                    } else {
                        var ctor = function ConstructorWrapper() {};
                        ctor.prototype = klass.prototype;
                        newObject = new ctor();
                    }
                    if (features.constructor === Object) {
                        features.constructor = function() {
                            if (klass !== Object) {
                                return klass.apply(this, arguments);
                            }
                        };
                    }
                    features.constructor.prototype = newObject;
                    util.update(features.constructor.prototype, features);
                    features.constructor.__super__ = klass;
                    return features.constructor;
                },
                mixin: function mixin() {
                    var klass = arguments[0];
                    for (var i = 1; i < arguments.length; i++) {
                        for (var prop in arguments[i].prototype) {
                            var fn = arguments[i].prototype[prop];
                            if (prop !== "constructor") {
                                klass.prototype[prop] = fn;
                            }
                        }
                    }
                    return klass;
                },
                hideProperties: function hideProperties(obj, props) {
                    if (typeof Object.defineProperty !== "function") return;
                    util.arrayEach(props, function(key) {
                        Object.defineProperty(obj, key, {
                            enumerable: false,
                            writable: true,
                            configurable: true
                        });
                    });
                },
                property: function property(obj, name, value, enumerable, isValue) {
                    var opts = {
                        configurable: true,
                        enumerable: enumerable !== undefined ? enumerable : true
                    };
                    if (typeof value === "function" && !isValue) {
                        opts.get = value;
                    } else {
                        opts.value = value;
                        opts.writable = true;
                    }
                    Object.defineProperty(obj, name, opts);
                },
                memoizedProperty: function memoizedProperty(obj, name, get, enumerable) {
                    var cachedValue = null;
                    util.property(obj, name, function() {
                        if (cachedValue === null) {
                            cachedValue = get();
                        }
                        return cachedValue;
                    }, enumerable);
                },
                hoistPayloadMember: function hoistPayloadMember(resp) {
                    var req = resp.request;
                    var operation = req.operation;
                    var output = req.service.api.operations[operation].output;
                    if (output.payload) {
                        var payloadMember = output.members[output.payload];
                        var responsePayload = resp.data[output.payload];
                        if (payloadMember.type === "structure") {
                            util.each(responsePayload, function(key, value) {
                                util.property(resp.data, key, value, false);
                            });
                        }
                    }
                },
                computeSha256: function computeSha256(body, done) {
                    if (util.isNode()) {
                        var Stream = util.stream.Stream;
                        var fs = require("fs");
                        if (body instanceof Stream) {
                            if (typeof body.path === "string") {
                                var settings = {};
                                if (typeof body.start === "number") {
                                    settings.start = body.start;
                                }
                                if (typeof body.end === "number") {
                                    settings.end = body.end;
                                }
                                body = fs.createReadStream(body.path, settings);
                            } else {
                                return done(new Error("Non-file stream objects are " + "not supported with SigV4"));
                            }
                        }
                    }
                    util.crypto.sha256(body, "hex", function(err, sha) {
                        if (err) done(err); else done(null, sha);
                    });
                },
                isClockSkewed: function isClockSkewed(serverTime) {
                    if (serverTime) {
                        util.property(AWS.config, "isClockSkewed", Math.abs(new Date().getTime() - serverTime) >= 3e5, false);
                        return AWS.config.isClockSkewed;
                    }
                },
                applyClockOffset: function applyClockOffset(serverTime) {
                    if (serverTime) AWS.config.systemClockOffset = serverTime - new Date().getTime();
                },
                extractRequestId: function extractRequestId(resp) {
                    var requestId = resp.httpResponse.headers["x-amz-request-id"] || resp.httpResponse.headers["x-amzn-requestid"];
                    if (!requestId && resp.data && resp.data.ResponseMetadata) {
                        requestId = resp.data.ResponseMetadata.RequestId;
                    }
                    if (requestId) {
                        resp.requestId = requestId;
                    }
                    if (resp.error) {
                        resp.error.requestId = requestId;
                    }
                },
                addPromises: function addPromises(constructors, PromiseDependency) {
                    if (PromiseDependency === undefined && AWS && AWS.config) {
                        PromiseDependency = AWS.config.getPromisesDependency();
                    }
                    if (PromiseDependency === undefined && typeof Promise !== "undefined") {
                        PromiseDependency = Promise;
                    }
                    if (typeof PromiseDependency !== "function") var deletePromises = true;
                    if (!Array.isArray(constructors)) constructors = [ constructors ];
                    for (var ind = 0; ind < constructors.length; ind++) {
                        var constructor = constructors[ind];
                        if (deletePromises) {
                            if (constructor.deletePromisesFromClass) {
                                constructor.deletePromisesFromClass();
                            }
                        } else if (constructor.addPromisesToClass) {
                            constructor.addPromisesToClass(PromiseDependency);
                        }
                    }
                },
                promisifyMethod: function promisifyMethod(methodName, PromiseDependency) {
                    return function promise() {
                        var self = this;
                        return new PromiseDependency(function(resolve, reject) {
                            self[methodName](function(err, data) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(data);
                                }
                            });
                        });
                    };
                },
                isDualstackAvailable: function isDualstackAvailable(service) {
                    if (!service) return false;
                    var metadata = require("../apis/metadata.json");
                    if (typeof service !== "string") service = service.serviceIdentifier;
                    if (typeof service !== "string" || !metadata.hasOwnProperty(service)) return false;
                    return !!metadata[service].dualstackAvailable;
                },
                calculateRetryDelay: function calculateRetryDelay(retryCount, retryDelayOptions) {
                    if (!retryDelayOptions) retryDelayOptions = {};
                    var customBackoff = retryDelayOptions.customBackoff || null;
                    if (typeof customBackoff === "function") {
                        return customBackoff(retryCount);
                    }
                    var base = typeof retryDelayOptions.base === "number" ? retryDelayOptions.base : 100;
                    var delay = Math.random() * (Math.pow(2, retryCount) * base);
                    return delay;
                },
                handleRequestWithRetries: function handleRequestWithRetries(httpRequest, options, cb) {
                    if (!options) options = {};
                    var http = AWS.HttpClient.getInstance();
                    var httpOptions = options.httpOptions || {};
                    var retryCount = 0;
                    var errCallback = function(err) {
                        var maxRetries = options.maxRetries || 0;
                        if (err && err.code === "TimeoutError") err.retryable = true;
                        if (err && err.retryable && retryCount < maxRetries) {
                            retryCount++;
                            var delay = util.calculateRetryDelay(retryCount, options.retryDelayOptions);
                            setTimeout(sendRequest, delay + (err.retryAfter || 0));
                        } else {
                            cb(err);
                        }
                    };
                    var sendRequest = function() {
                        var data = "";
                        http.handleRequest(httpRequest, httpOptions, function(httpResponse) {
                            httpResponse.on("data", function(chunk) {
                                data += chunk.toString();
                            });
                            httpResponse.on("end", function() {
                                var statusCode = httpResponse.statusCode;
                                if (statusCode < 300) {
                                    cb(null, data);
                                } else {
                                    var retryAfter = parseInt(httpResponse.headers["retry-after"], 10) * 1e3 || 0;
                                    var err = util.error(new Error(), {
                                        retryable: statusCode >= 500 || statusCode === 429
                                    });
                                    if (retryAfter && err.retryable) err.retryAfter = retryAfter;
                                    errCallback(err);
                                }
                            });
                        }, errCallback);
                    };
                    AWS.util.defer(sendRequest);
                },
                uuid: {
                    v4: function uuidV4() {
                        return require("uuid").v4();
                    }
                },
                convertPayloadToString: function convertPayloadToString(resp) {
                    var req = resp.request;
                    var operation = req.operation;
                    var rules = req.service.api.operations[operation].output || {};
                    if (rules.payload && resp.data[rules.payload]) {
                        resp.data[rules.payload] = resp.data[rules.payload].toString();
                    }
                },
                defer: function defer(callback) {
                    if (typeof process === "object" && typeof process.nextTick === "function") {
                        process.nextTick(callback);
                    } else if (typeof setImmediate === "function") {
                        setImmediate(callback);
                    } else {
                        setTimeout(callback, 0);
                    }
                },
                defaultProfile: "default",
                configOptInEnv: "AWS_SDK_LOAD_CONFIG",
                sharedCredentialsFileEnv: "AWS_SHARED_CREDENTIALS_FILE",
                sharedConfigFileEnv: "AWS_CONFIG_FILE",
                imdsDisabledEnv: "AWS_EC2_METADATA_DISABLED"
            };
            module.exports = util;
        }).call(this, require("_process"));
    }, {
        "../apis/metadata.json": 182,
        "./core": 194,
        _process: 148,
        fs: 2,
        uuid: 160
    } ],
    193: [ function(require, module, exports) {
        var AWS = require("./core");
        require("./credentials");
        require("./credentials/credential_provider_chain");
        var PromisesDependency;
        AWS.Config = AWS.util.inherit({
            constructor: function Config(options) {
                if (options === undefined) options = {};
                options = this.extractCredentials(options);
                AWS.util.each.call(this, this.keys, function(key, value) {
                    this.set(key, options[key], value);
                });
            },
            getCredentials: function getCredentials(callback) {
                var self = this;
                function finish(err) {
                    callback(err, err ? null : self.credentials);
                }
                function credError(msg, err) {
                    return new AWS.util.error(err || new Error(), {
                        code: "CredentialsError",
                        message: msg,
                        name: "CredentialsError"
                    });
                }
                function getAsyncCredentials() {
                    self.credentials.get(function(err) {
                        if (err) {
                            var msg = "Could not load credentials from " + self.credentials.constructor.name;
                            err = credError(msg, err);
                        }
                        finish(err);
                    });
                }
                function getStaticCredentials() {
                    var err = null;
                    if (!self.credentials.accessKeyId || !self.credentials.secretAccessKey) {
                        err = credError("Missing credentials");
                    }
                    finish(err);
                }
                if (self.credentials) {
                    if (typeof self.credentials.get === "function") {
                        getAsyncCredentials();
                    } else {
                        getStaticCredentials();
                    }
                } else if (self.credentialProvider) {
                    self.credentialProvider.resolve(function(err, creds) {
                        if (err) {
                            err = credError("Could not load credentials from any providers", err);
                        }
                        self.credentials = creds;
                        finish(err);
                    });
                } else {
                    finish(credError("No credentials to load"));
                }
            },
            update: function update(options, allowUnknownKeys) {
                allowUnknownKeys = allowUnknownKeys || false;
                options = this.extractCredentials(options);
                AWS.util.each.call(this, options, function(key, value) {
                    if (allowUnknownKeys || Object.prototype.hasOwnProperty.call(this.keys, key) || AWS.Service.hasService(key)) {
                        this.set(key, value);
                    }
                });
            },
            loadFromPath: function loadFromPath(path) {
                this.clear();
                var options = JSON.parse(AWS.util.readFileSync(path));
                var fileSystemCreds = new AWS.FileSystemCredentials(path);
                var chain = new AWS.CredentialProviderChain();
                chain.providers.unshift(fileSystemCreds);
                chain.resolve(function(err, creds) {
                    if (err) throw err; else options.credentials = creds;
                });
                this.constructor(options);
                return this;
            },
            clear: function clear() {
                AWS.util.each.call(this, this.keys, function(key) {
                    delete this[key];
                });
                this.set("credentials", undefined);
                this.set("credentialProvider", undefined);
            },
            set: function set(property, value, defaultValue) {
                if (value === undefined) {
                    if (defaultValue === undefined) {
                        defaultValue = this.keys[property];
                    }
                    if (typeof defaultValue === "function") {
                        this[property] = defaultValue.call(this);
                    } else {
                        this[property] = defaultValue;
                    }
                } else if (property === "httpOptions" && this[property]) {
                    this[property] = AWS.util.merge(this[property], value);
                } else {
                    this[property] = value;
                }
            },
            keys: {
                credentials: null,
                credentialProvider: null,
                region: null,
                logger: null,
                apiVersions: {},
                apiVersion: null,
                endpoint: undefined,
                httpOptions: {
                    timeout: 12e4
                },
                maxRetries: undefined,
                maxRedirects: 10,
                paramValidation: true,
                sslEnabled: true,
                s3ForcePathStyle: false,
                s3BucketEndpoint: false,
                s3DisableBodySigning: true,
                computeChecksums: true,
                convertResponseTypes: true,
                correctClockSkew: false,
                customUserAgent: null,
                dynamoDbCrc32: true,
                systemClockOffset: 0,
                signatureVersion: null,
                signatureCache: true,
                retryDelayOptions: {},
                useAccelerateEndpoint: false
            },
            extractCredentials: function extractCredentials(options) {
                if (options.accessKeyId && options.secretAccessKey) {
                    options = AWS.util.copy(options);
                    options.credentials = new AWS.Credentials(options);
                }
                return options;
            },
            setPromisesDependency: function setPromisesDependency(dep) {
                PromisesDependency = dep;
                if (dep === null && typeof Promise === "function") {
                    PromisesDependency = Promise;
                }
                var constructors = [ AWS.Request, AWS.Credentials, AWS.CredentialProviderChain ];
                if (AWS.S3 && AWS.S3.ManagedUpload) constructors.push(AWS.S3.ManagedUpload);
                AWS.util.addPromises(constructors, PromisesDependency);
            },
            getPromisesDependency: function getPromisesDependency() {
                return PromisesDependency;
            }
        });
        AWS.config = new AWS.Config();
    }, {
        "./core": 194,
        "./credentials": 195,
        "./credentials/credential_provider_chain": 197
    } ],
    197: [ function(require, module, exports) {
        var AWS = require("../core");
        AWS.CredentialProviderChain = AWS.util.inherit(AWS.Credentials, {
            constructor: function CredentialProviderChain(providers) {
                if (providers) {
                    this.providers = providers;
                } else {
                    this.providers = AWS.CredentialProviderChain.defaultProviders.slice(0);
                }
            },
            resolve: function resolve(callback) {
                if (this.providers.length === 0) {
                    callback(new Error("No providers"));
                    return this;
                }
                var index = 0;
                var providers = this.providers.slice(0);
                function resolveNext(err, creds) {
                    if (!err && creds || index === providers.length) {
                        callback(err, creds);
                        return;
                    }
                    var provider = providers[index++];
                    if (typeof provider === "function") {
                        creds = provider.call();
                    } else {
                        creds = provider;
                    }
                    if (creds.get) {
                        creds.get(function(getErr) {
                            resolveNext(getErr, getErr ? null : creds);
                        });
                    } else {
                        resolveNext(null, creds);
                    }
                }
                resolveNext();
                return this;
            }
        });
        AWS.CredentialProviderChain.defaultProviders = [];
        AWS.CredentialProviderChain.addPromisesToClass = function addPromisesToClass(PromiseDependency) {
            this.prototype.resolvePromise = AWS.util.promisifyMethod("resolve", PromiseDependency);
        };
        AWS.CredentialProviderChain.deletePromisesFromClass = function deletePromisesFromClass() {
            delete this.prototype.resolvePromise;
        };
        AWS.util.addPromises(AWS.CredentialProviderChain);
    }, {
        "../core": 194
    } ],
    195: [ function(require, module, exports) {
        var AWS = require("./core");
        AWS.Credentials = AWS.util.inherit({
            constructor: function Credentials() {
                AWS.util.hideProperties(this, [ "secretAccessKey" ]);
                this.expired = false;
                this.expireTime = null;
                if (arguments.length === 1 && typeof arguments[0] === "object") {
                    var creds = arguments[0].credentials || arguments[0];
                    this.accessKeyId = creds.accessKeyId;
                    this.secretAccessKey = creds.secretAccessKey;
                    this.sessionToken = creds.sessionToken;
                } else {
                    this.accessKeyId = arguments[0];
                    this.secretAccessKey = arguments[1];
                    this.sessionToken = arguments[2];
                }
            },
            expiryWindow: 15,
            needsRefresh: function needsRefresh() {
                var currentTime = AWS.util.date.getDate().getTime();
                var adjustedTime = new Date(currentTime + this.expiryWindow * 1e3);
                if (this.expireTime && adjustedTime > this.expireTime) {
                    return true;
                } else {
                    return this.expired || !this.accessKeyId || !this.secretAccessKey;
                }
            },
            get: function get(callback) {
                var self = this;
                if (this.needsRefresh()) {
                    this.refresh(function(err) {
                        if (!err) self.expired = false;
                        if (callback) callback(err);
                    });
                } else if (callback) {
                    callback();
                }
            },
            refresh: function refresh(callback) {
                this.expired = false;
                callback();
            }
        });
        AWS.Credentials.addPromisesToClass = function addPromisesToClass(PromiseDependency) {
            this.prototype.getPromise = AWS.util.promisifyMethod("get", PromiseDependency);
            this.prototype.refreshPromise = AWS.util.promisifyMethod("refresh", PromiseDependency);
        };
        AWS.Credentials.deletePromisesFromClass = function deletePromisesFromClass() {
            delete this.prototype.getPromise;
            delete this.prototype.refreshPromise;
        };
        AWS.util.addPromises(AWS.Credentials);
    }, {
        "./core": 194
    } ],
    183: [ function(require, module, exports) {
        function apiLoader(svc, version) {
            if (!apiLoader.services.hasOwnProperty(svc)) {
                throw new Error("InvalidService: Failed to load api for " + svc);
            }
            return apiLoader.services[svc][version];
        }
        apiLoader.services = {};
        module.exports = apiLoader;
    }, {} ],
    182: [ function(require, module, exports) {
        module.exports = {
            acm: {
                name: "ACM",
                cors: true
            },
            apigateway: {
                name: "APIGateway",
                cors: true
            },
            applicationautoscaling: {
                prefix: "application-autoscaling",
                name: "ApplicationAutoScaling",
                cors: true
            },
            appstream: {
                name: "AppStream"
            },
            autoscaling: {
                name: "AutoScaling",
                cors: true
            },
            batch: {
                name: "Batch"
            },
            budgets: {
                name: "Budgets"
            },
            clouddirectory: {
                name: "CloudDirectory"
            },
            cloudformation: {
                name: "CloudFormation",
                cors: true
            },
            cloudfront: {
                name: "CloudFront",
                versions: [ "2013-05-12*", "2013-11-11*", "2014-05-31*", "2014-10-21*", "2014-11-06*", "2015-04-17*", "2015-07-27*", "2015-09-17*", "2016-01-13*", "2016-01-28*", "2016-08-01*", "2016-08-20*", "2016-09-07*", "2016-09-29*", "2016-11-25*" ],
                cors: true
            },
            cloudhsm: {
                name: "CloudHSM",
                cors: true
            },
            cloudsearch: {
                name: "CloudSearch"
            },
            cloudsearchdomain: {
                name: "CloudSearchDomain"
            },
            cloudtrail: {
                name: "CloudTrail",
                cors: true
            },
            cloudwatch: {
                prefix: "monitoring",
                name: "CloudWatch",
                cors: true
            },
            cloudwatchevents: {
                prefix: "events",
                name: "CloudWatchEvents",
                versions: [ "2014-02-03*" ],
                cors: true
            },
            cloudwatchlogs: {
                prefix: "logs",
                name: "CloudWatchLogs",
                cors: true
            },
            codebuild: {
                name: "CodeBuild"
            },
            codecommit: {
                name: "CodeCommit",
                cors: true
            },
            codedeploy: {
                name: "CodeDeploy",
                cors: true
            },
            codepipeline: {
                name: "CodePipeline",
                cors: true
            },
            cognitoidentity: {
                prefix: "cognito-identity",
                name: "CognitoIdentity",
                cors: true
            },
            cognitoidentityserviceprovider: {
                prefix: "cognito-idp",
                name: "CognitoIdentityServiceProvider",
                cors: true
            },
            cognitosync: {
                prefix: "cognito-sync",
                name: "CognitoSync",
                cors: true
            },
            configservice: {
                prefix: "config",
                name: "ConfigService",
                cors: true
            },
            cur: {
                name: "CUR",
                cors: true
            },
            datapipeline: {
                name: "DataPipeline"
            },
            devicefarm: {
                name: "DeviceFarm",
                cors: true
            },
            directconnect: {
                name: "DirectConnect",
                cors: true
            },
            directoryservice: {
                prefix: "ds",
                name: "DirectoryService"
            },
            discovery: {
                name: "Discovery"
            },
            dms: {
                name: "DMS"
            },
            dynamodb: {
                name: "DynamoDB",
                cors: true
            },
            dynamodbstreams: {
                prefix: "streams.dynamodb",
                name: "DynamoDBStreams",
                cors: true
            },
            ec2: {
                name: "EC2",
                versions: [ "2013-06-15*", "2013-10-15*", "2014-02-01*", "2014-05-01*", "2014-06-15*", "2014-09-01*", "2014-10-01*", "2015-03-01*", "2015-04-15*", "2015-10-01*", "2016-04-01*", "2016-09-15*" ],
                cors: true
            },
            ecr: {
                name: "ECR",
                cors: true
            },
            ecs: {
                name: "ECS",
                cors: true
            },
            efs: {
                prefix: "elasticfilesystem",
                name: "EFS",
                cors: true
            },
            elasticache: {
                name: "ElastiCache",
                versions: [ "2012-11-15*", "2014-03-24*", "2014-07-15*", "2014-09-30*" ],
                cors: true
            },
            elasticbeanstalk: {
                name: "ElasticBeanstalk",
                cors: true
            },
            elb: {
                prefix: "elasticloadbalancing",
                name: "ELB",
                cors: true
            },
            elbv2: {
                prefix: "elasticloadbalancingv2",
                name: "ELBv2",
                cors: true
            },
            emr: {
                prefix: "elasticmapreduce",
                name: "EMR",
                cors: true
            },
            es: {
                name: "ES"
            },
            elastictranscoder: {
                name: "ElasticTranscoder",
                cors: true
            },
            firehose: {
                name: "Firehose",
                cors: true
            },
            gamelift: {
                name: "GameLift",
                cors: true
            },
            glacier: {
                name: "Glacier"
            },
            health: {
                name: "Health"
            },
            iam: {
                name: "IAM"
            },
            importexport: {
                name: "ImportExport"
            },
            inspector: {
                name: "Inspector",
                versions: [ "2015-08-18*" ],
                cors: true
            },
            iot: {
                name: "Iot",
                cors: true
            },
            iotdata: {
                prefix: "iot-data",
                name: "IotData",
                cors: true
            },
            kinesis: {
                name: "Kinesis",
                cors: true
            },
            kinesisanalytics: {
                name: "KinesisAnalytics"
            },
            kms: {
                name: "KMS",
                cors: true
            },
            lambda: {
                name: "Lambda",
                cors: true
            },
            lexruntime: {
                prefix: "runtime.lex",
                name: "LexRuntime",
                cors: true
            },
            lightsail: {
                name: "Lightsail"
            },
            machinelearning: {
                name: "MachineLearning",
                cors: true
            },
            marketplacecommerceanalytics: {
                name: "MarketplaceCommerceAnalytics",
                cors: true
            },
            marketplacemetering: {
                prefix: "meteringmarketplace",
                name: "MarketplaceMetering"
            },
            mturk: {
                prefix: "mturk-requester",
                name: "MTurk",
                cors: true
            },
            mobileanalytics: {
                name: "MobileAnalytics",
                cors: true
            },
            opsworks: {
                name: "OpsWorks",
                cors: true
            },
            opsworkscm: {
                name: "OpsWorksCM"
            },
            organizations: {
                name: "Organizations"
            },
            pinpoint: {
                name: "Pinpoint"
            },
            polly: {
                name: "Polly",
                cors: true
            },
            rds: {
                name: "RDS",
                versions: [ "2014-09-01*" ],
                cors: true
            },
            redshift: {
                name: "Redshift",
                cors: true
            },
            rekognition: {
                name: "Rekognition",
                cors: true
            },
            resourcegroupstaggingapi: {
                name: "ResourceGroupsTaggingAPI"
            },
            route53: {
                name: "Route53",
                cors: true
            },
            route53domains: {
                name: "Route53Domains",
                cors: true
            },
            s3: {
                name: "S3",
                dualstackAvailable: true,
                cors: true
            },
            servicecatalog: {
                name: "ServiceCatalog",
                cors: true
            },
            ses: {
                prefix: "email",
                name: "SES",
                cors: true
            },
            shield: {
                name: "Shield"
            },
            simpledb: {
                prefix: "sdb",
                name: "SimpleDB"
            },
            sms: {
                name: "SMS"
            },
            snowball: {
                name: "Snowball"
            },
            sns: {
                name: "SNS",
                cors: true
            },
            sqs: {
                name: "SQS",
                cors: true
            },
            ssm: {
                name: "SSM",
                cors: true
            },
            storagegateway: {
                name: "StorageGateway",
                cors: true
            },
            stepfunctions: {
                prefix: "states",
                name: "StepFunctions"
            },
            sts: {
                name: "STS",
                cors: true
            },
            support: {
                name: "Support"
            },
            swf: {
                name: "SWF"
            },
            xray: {
                name: "XRay"
            },
            waf: {
                name: "WAF",
                cors: true
            },
            wafregional: {
                prefix: "waf-regional",
                name: "WAFRegional"
            },
            workdocs: {
                name: "WorkDocs",
                cors: true
            },
            workspaces: {
                name: "WorkSpaces"
            },
            codestar: {
                name: "CodeStar"
            },
            lexmodelbuildingservice: {
                prefix: "lex-models",
                name: "LexModelBuildingService",
                cors: true
            },
            marketplaceentitlementservice: {
                prefix: "entitlement.marketplace",
                name: "MarketplaceEntitlementService"
            },
            athena: {
                name: "Athena"
            },
            greengrass: {
                name: "Greengrass"
            },
            dax: {
                name: "DAX"
            },
            migrationhub: {
                prefix: "AWSMigrationHub",
                name: "MigrationHub"
            },
            cloudhsmv2: {
                name: "CloudHSMV2"
            },
            glue: {
                name: "Glue"
            },
            mobile: {
                name: "Mobile"
            },
            pricing: {
                name: "Pricing"
            },
            costexplorer: {
                prefix: "ce",
                name: "CostExplorer"
            },
            mediaconvert: {
                name: "MediaConvert"
            },
            medialive: {
                name: "MediaLive"
            },
            mediapackage: {
                name: "MediaPackage"
            },
            mediastore: {
                name: "MediaStore"
            },
            mediastoredata: {
                prefix: "mediastore-data",
                name: "MediaStoreData"
            },
            appsync: {
                name: "AppSync"
            },
            guardduty: {
                name: "GuardDuty"
            },
            mq: {
                name: "MQ"
            },
            comprehend: {
                name: "Comprehend"
            },
            iotjobsdataplane: {
                prefix: "iot-jobs-data",
                name: "IoTJobsDataPlane"
            },
            kinesisvideoarchivedmedia: {
                prefix: "kinesis-video-archived-media",
                name: "KinesisVideoArchivedMedia"
            },
            kinesisvideomedia: {
                prefix: "kinesis-video-media",
                name: "KinesisVideoMedia"
            },
            kinesisvideo: {
                name: "KinesisVideo"
            },
            sagemakerruntime: {
                prefix: "runtime.sagemaker",
                name: "SageMakerRuntime"
            },
            sagemaker: {
                name: "SageMaker"
            },
            translate: {
                name: "Translate"
            },
            resourcegroups: {
                prefix: "resource-groups",
                name: "ResourceGroups"
            },
            alexaforbusiness: {
                name: "AlexaForBusiness"
            },
            cloud9: {
                name: "Cloud9"
            },
            serverlessapplicationrepository: {
                prefix: "serverlessrepo",
                name: "ServerlessApplicationRepository"
            },
            servicediscovery: {
                name: "ServiceDiscovery"
            },
            workmail: {
                name: "WorkMail"
            },
            autoscalingplans: {
                prefix: "autoscaling-plans",
                name: "AutoScalingPlans"
            },
            transcribeservice: {
                prefix: "transcribe",
                name: "TranscribeService"
            }
        };
    }, {} ],
    181: [ function(require, module, exports) {
        (function() {
            var XMLBuilder, assign;
            assign = require("lodash/assign");
            XMLBuilder = require("./XMLBuilder");
            module.exports.create = function(name, xmldec, doctype, options) {
                options = assign({}, xmldec, doctype, options);
                return new XMLBuilder(name, options).root();
            };
        }).call(this);
    }, {
        "./XMLBuilder": 166,
        "lodash/assign": 123
    } ],
    166: [ function(require, module, exports) {
        (function() {
            var XMLBuilder, XMLDeclaration, XMLDocType, XMLElement, XMLStringifier;
            XMLStringifier = require("./XMLStringifier");
            XMLDeclaration = require("./XMLDeclaration");
            XMLDocType = require("./XMLDocType");
            XMLElement = require("./XMLElement");
            module.exports = XMLBuilder = function() {
                function XMLBuilder(name, options) {
                    var root, temp;
                    if (name == null) {
                        throw new Error("Root element needs a name");
                    }
                    if (options == null) {
                        options = {};
                    }
                    this.options = options;
                    this.stringify = new XMLStringifier(options);
                    temp = new XMLElement(this, "doc");
                    root = temp.element(name);
                    root.isRoot = true;
                    root.documentObject = this;
                    this.rootObject = root;
                    if (!options.headless) {
                        root.declaration(options);
                        if (options.pubID != null || options.sysID != null) {
                            root.doctype(options);
                        }
                    }
                }
                XMLBuilder.prototype.root = function() {
                    return this.rootObject;
                };
                XMLBuilder.prototype.end = function(options) {
                    return this.toString(options);
                };
                XMLBuilder.prototype.toString = function(options) {
                    var indent, newline, offset, pretty, r, ref, ref1, ref2;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    r = "";
                    if (this.xmldec != null) {
                        r += this.xmldec.toString(options);
                    }
                    if (this.doctype != null) {
                        r += this.doctype.toString(options);
                    }
                    r += this.rootObject.toString(options);
                    if (pretty && r.slice(-newline.length) === newline) {
                        r = r.slice(0, -newline.length);
                    }
                    return r;
                };
                return XMLBuilder;
            }();
        }).call(this);
    }, {
        "./XMLDeclaration": 173,
        "./XMLDocType": 174,
        "./XMLElement": 175,
        "./XMLStringifier": 179
    } ],
    179: [ function(require, module, exports) {
        (function() {
            var XMLStringifier, bind = function(fn, me) {
                return function() {
                    return fn.apply(me, arguments);
                };
            }, hasProp = {}.hasOwnProperty;
            module.exports = XMLStringifier = function() {
                function XMLStringifier(options) {
                    this.assertLegalChar = bind(this.assertLegalChar, this);
                    var key, ref, value;
                    this.allowSurrogateChars = options != null ? options.allowSurrogateChars : void 0;
                    this.noDoubleEncoding = options != null ? options.noDoubleEncoding : void 0;
                    ref = (options != null ? options.stringify : void 0) || {};
                    for (key in ref) {
                        if (!hasProp.call(ref, key)) continue;
                        value = ref[key];
                        this[key] = value;
                    }
                }
                XMLStringifier.prototype.eleName = function(val) {
                    val = "" + val || "";
                    return this.assertLegalChar(val);
                };
                XMLStringifier.prototype.eleText = function(val) {
                    val = "" + val || "";
                    return this.assertLegalChar(this.elEscape(val));
                };
                XMLStringifier.prototype.cdata = function(val) {
                    val = "" + val || "";
                    if (val.match(/]]>/)) {
                        throw new Error("Invalid CDATA text: " + val);
                    }
                    return this.assertLegalChar(val);
                };
                XMLStringifier.prototype.comment = function(val) {
                    val = "" + val || "";
                    if (val.match(/--/)) {
                        throw new Error("Comment text cannot contain double-hypen: " + val);
                    }
                    return this.assertLegalChar(val);
                };
                XMLStringifier.prototype.raw = function(val) {
                    return "" + val || "";
                };
                XMLStringifier.prototype.attName = function(val) {
                    return "" + val || "";
                };
                XMLStringifier.prototype.attValue = function(val) {
                    val = "" + val || "";
                    return this.attEscape(val);
                };
                XMLStringifier.prototype.insTarget = function(val) {
                    return "" + val || "";
                };
                XMLStringifier.prototype.insValue = function(val) {
                    val = "" + val || "";
                    if (val.match(/\?>/)) {
                        throw new Error("Invalid processing instruction value: " + val);
                    }
                    return val;
                };
                XMLStringifier.prototype.xmlVersion = function(val) {
                    val = "" + val || "";
                    if (!val.match(/1\.[0-9]+/)) {
                        throw new Error("Invalid version number: " + val);
                    }
                    return val;
                };
                XMLStringifier.prototype.xmlEncoding = function(val) {
                    val = "" + val || "";
                    if (!val.match(/^[A-Za-z](?:[A-Za-z0-9._-]|-)*$/)) {
                        throw new Error("Invalid encoding: " + val);
                    }
                    return val;
                };
                XMLStringifier.prototype.xmlStandalone = function(val) {
                    if (val) {
                        return "yes";
                    } else {
                        return "no";
                    }
                };
                XMLStringifier.prototype.dtdPubID = function(val) {
                    return "" + val || "";
                };
                XMLStringifier.prototype.dtdSysID = function(val) {
                    return "" + val || "";
                };
                XMLStringifier.prototype.dtdElementValue = function(val) {
                    return "" + val || "";
                };
                XMLStringifier.prototype.dtdAttType = function(val) {
                    return "" + val || "";
                };
                XMLStringifier.prototype.dtdAttDefault = function(val) {
                    if (val != null) {
                        return "" + val || "";
                    } else {
                        return val;
                    }
                };
                XMLStringifier.prototype.dtdEntityValue = function(val) {
                    return "" + val || "";
                };
                XMLStringifier.prototype.dtdNData = function(val) {
                    return "" + val || "";
                };
                XMLStringifier.prototype.convertAttKey = "@";
                XMLStringifier.prototype.convertPIKey = "?";
                XMLStringifier.prototype.convertTextKey = "#text";
                XMLStringifier.prototype.convertCDataKey = "#cdata";
                XMLStringifier.prototype.convertCommentKey = "#comment";
                XMLStringifier.prototype.convertRawKey = "#raw";
                XMLStringifier.prototype.assertLegalChar = function(str) {
                    var chars, chr;
                    if (this.allowSurrogateChars) {
                        chars = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uFFFE-\uFFFF]/;
                    } else {
                        chars = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE-\uFFFF]/;
                    }
                    chr = str.match(chars);
                    if (chr) {
                        throw new Error("Invalid character (" + chr + ") in string: " + str + " at index " + chr.index);
                    }
                    return str;
                };
                XMLStringifier.prototype.elEscape = function(str) {
                    var ampregex;
                    ampregex = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
                    return str.replace(ampregex, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#xD;");
                };
                XMLStringifier.prototype.attEscape = function(str) {
                    var ampregex;
                    ampregex = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
                    return str.replace(ampregex, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
                };
                return XMLStringifier;
            }();
        }).call(this);
    }, {} ],
    173: [ function(require, module, exports) {
        (function() {
            var XMLDeclaration, XMLNode, create, isObject, extend = function(child, parent) {
                for (var key in parent) {
                    if (hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            }, hasProp = {}.hasOwnProperty;
            create = require("lodash/create");
            isObject = require("lodash/isObject");
            XMLNode = require("./XMLNode");
            module.exports = XMLDeclaration = function(superClass) {
                extend(XMLDeclaration, superClass);
                function XMLDeclaration(parent, version, encoding, standalone) {
                    var ref;
                    XMLDeclaration.__super__.constructor.call(this, parent);
                    if (isObject(version)) {
                        ref = version, version = ref.version, encoding = ref.encoding, standalone = ref.standalone;
                    }
                    if (!version) {
                        version = "1.0";
                    }
                    this.version = this.stringify.xmlVersion(version);
                    if (encoding != null) {
                        this.encoding = this.stringify.xmlEncoding(encoding);
                    }
                    if (standalone != null) {
                        this.standalone = this.stringify.xmlStandalone(standalone);
                    }
                }
                XMLDeclaration.prototype.toString = function(options, level) {
                    var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    level || (level = 0);
                    space = new Array(level + offset + 1).join(indent);
                    r = "";
                    if (pretty) {
                        r += space;
                    }
                    r += "<?xml";
                    r += ' version="' + this.version + '"';
                    if (this.encoding != null) {
                        r += ' encoding="' + this.encoding + '"';
                    }
                    if (this.standalone != null) {
                        r += ' standalone="' + this.standalone + '"';
                    }
                    r += "?>";
                    if (pretty) {
                        r += newline;
                    }
                    return r;
                };
                return XMLDeclaration;
            }(XMLNode);
        }).call(this);
    }, {
        "./XMLNode": 176,
        "lodash/create": 125,
        "lodash/isObject": 138
    } ],
    176: [ function(require, module, exports) {
        (function() {
            var XMLCData, XMLComment, XMLDeclaration, XMLDocType, XMLElement, XMLNode, XMLRaw, XMLText, isEmpty, isFunction, isObject, hasProp = {}.hasOwnProperty;
            isObject = require("lodash/isObject");
            isFunction = require("lodash/isFunction");
            isEmpty = require("lodash/isEmpty");
            XMLElement = null;
            XMLCData = null;
            XMLComment = null;
            XMLDeclaration = null;
            XMLDocType = null;
            XMLRaw = null;
            XMLText = null;
            module.exports = XMLNode = function() {
                function XMLNode(parent) {
                    this.parent = parent;
                    this.options = this.parent.options;
                    this.stringify = this.parent.stringify;
                    if (XMLElement === null) {
                        XMLElement = require("./XMLElement");
                        XMLCData = require("./XMLCData");
                        XMLComment = require("./XMLComment");
                        XMLDeclaration = require("./XMLDeclaration");
                        XMLDocType = require("./XMLDocType");
                        XMLRaw = require("./XMLRaw");
                        XMLText = require("./XMLText");
                    }
                }
                XMLNode.prototype.element = function(name, attributes, text) {
                    var childNode, item, j, k, key, lastChild, len, len1, ref, val;
                    lastChild = null;
                    if (attributes == null) {
                        attributes = {};
                    }
                    attributes = attributes.valueOf();
                    if (!isObject(attributes)) {
                        ref = [ attributes, text ], text = ref[0], attributes = ref[1];
                    }
                    if (name != null) {
                        name = name.valueOf();
                    }
                    if (Array.isArray(name)) {
                        for (j = 0, len = name.length; j < len; j++) {
                            item = name[j];
                            lastChild = this.element(item);
                        }
                    } else if (isFunction(name)) {
                        lastChild = this.element(name.apply());
                    } else if (isObject(name)) {
                        for (key in name) {
                            if (!hasProp.call(name, key)) continue;
                            val = name[key];
                            if (isFunction(val)) {
                                val = val.apply();
                            }
                            if (isObject(val) && isEmpty(val)) {
                                val = null;
                            }
                            if (!this.options.ignoreDecorators && this.stringify.convertAttKey && key.indexOf(this.stringify.convertAttKey) === 0) {
                                lastChild = this.attribute(key.substr(this.stringify.convertAttKey.length), val);
                            } else if (!this.options.ignoreDecorators && this.stringify.convertPIKey && key.indexOf(this.stringify.convertPIKey) === 0) {
                                lastChild = this.instruction(key.substr(this.stringify.convertPIKey.length), val);
                            } else if (!this.options.separateArrayItems && Array.isArray(val)) {
                                for (k = 0, len1 = val.length; k < len1; k++) {
                                    item = val[k];
                                    childNode = {};
                                    childNode[key] = item;
                                    lastChild = this.element(childNode);
                                }
                            } else if (isObject(val)) {
                                lastChild = this.element(key);
                                lastChild.element(val);
                            } else {
                                lastChild = this.element(key, val);
                            }
                        }
                    } else {
                        if (!this.options.ignoreDecorators && this.stringify.convertTextKey && name.indexOf(this.stringify.convertTextKey) === 0) {
                            lastChild = this.text(text);
                        } else if (!this.options.ignoreDecorators && this.stringify.convertCDataKey && name.indexOf(this.stringify.convertCDataKey) === 0) {
                            lastChild = this.cdata(text);
                        } else if (!this.options.ignoreDecorators && this.stringify.convertCommentKey && name.indexOf(this.stringify.convertCommentKey) === 0) {
                            lastChild = this.comment(text);
                        } else if (!this.options.ignoreDecorators && this.stringify.convertRawKey && name.indexOf(this.stringify.convertRawKey) === 0) {
                            lastChild = this.raw(text);
                        } else {
                            lastChild = this.node(name, attributes, text);
                        }
                    }
                    if (lastChild == null) {
                        throw new Error("Could not create any elements with: " + name);
                    }
                    return lastChild;
                };
                XMLNode.prototype.insertBefore = function(name, attributes, text) {
                    var child, i, removed;
                    if (this.isRoot) {
                        throw new Error("Cannot insert elements at root level");
                    }
                    i = this.parent.children.indexOf(this);
                    removed = this.parent.children.splice(i);
                    child = this.parent.element(name, attributes, text);
                    Array.prototype.push.apply(this.parent.children, removed);
                    return child;
                };
                XMLNode.prototype.insertAfter = function(name, attributes, text) {
                    var child, i, removed;
                    if (this.isRoot) {
                        throw new Error("Cannot insert elements at root level");
                    }
                    i = this.parent.children.indexOf(this);
                    removed = this.parent.children.splice(i + 1);
                    child = this.parent.element(name, attributes, text);
                    Array.prototype.push.apply(this.parent.children, removed);
                    return child;
                };
                XMLNode.prototype.remove = function() {
                    var i, ref;
                    if (this.isRoot) {
                        throw new Error("Cannot remove the root element");
                    }
                    i = this.parent.children.indexOf(this);
                    [].splice.apply(this.parent.children, [ i, i - i + 1 ].concat(ref = [])), ref;
                    return this.parent;
                };
                XMLNode.prototype.node = function(name, attributes, text) {
                    var child, ref;
                    if (name != null) {
                        name = name.valueOf();
                    }
                    if (attributes == null) {
                        attributes = {};
                    }
                    attributes = attributes.valueOf();
                    if (!isObject(attributes)) {
                        ref = [ attributes, text ], text = ref[0], attributes = ref[1];
                    }
                    child = new XMLElement(this, name, attributes);
                    if (text != null) {
                        child.text(text);
                    }
                    this.children.push(child);
                    return child;
                };
                XMLNode.prototype.text = function(value) {
                    var child;
                    child = new XMLText(this, value);
                    this.children.push(child);
                    return this;
                };
                XMLNode.prototype.cdata = function(value) {
                    var child;
                    child = new XMLCData(this, value);
                    this.children.push(child);
                    return this;
                };
                XMLNode.prototype.comment = function(value) {
                    var child;
                    child = new XMLComment(this, value);
                    this.children.push(child);
                    return this;
                };
                XMLNode.prototype.raw = function(value) {
                    var child;
                    child = new XMLRaw(this, value);
                    this.children.push(child);
                    return this;
                };
                XMLNode.prototype.declaration = function(version, encoding, standalone) {
                    var doc, xmldec;
                    doc = this.document();
                    xmldec = new XMLDeclaration(doc, version, encoding, standalone);
                    doc.xmldec = xmldec;
                    return doc.root();
                };
                XMLNode.prototype.doctype = function(pubID, sysID) {
                    var doc, doctype;
                    doc = this.document();
                    doctype = new XMLDocType(doc, pubID, sysID);
                    doc.doctype = doctype;
                    return doctype;
                };
                XMLNode.prototype.up = function() {
                    if (this.isRoot) {
                        throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
                    }
                    return this.parent;
                };
                XMLNode.prototype.root = function() {
                    var child;
                    if (this.isRoot) {
                        return this;
                    }
                    child = this.parent;
                    while (!child.isRoot) {
                        child = child.parent;
                    }
                    return child;
                };
                XMLNode.prototype.document = function() {
                    return this.root().documentObject;
                };
                XMLNode.prototype.end = function(options) {
                    return this.document().toString(options);
                };
                XMLNode.prototype.prev = function() {
                    var i;
                    if (this.isRoot) {
                        throw new Error("Root node has no siblings");
                    }
                    i = this.parent.children.indexOf(this);
                    if (i < 1) {
                        throw new Error("Already at the first node");
                    }
                    return this.parent.children[i - 1];
                };
                XMLNode.prototype.next = function() {
                    var i;
                    if (this.isRoot) {
                        throw new Error("Root node has no siblings");
                    }
                    i = this.parent.children.indexOf(this);
                    if (i === -1 || i === this.parent.children.length - 1) {
                        throw new Error("Already at the last node");
                    }
                    return this.parent.children[i + 1];
                };
                XMLNode.prototype.importXMLBuilder = function(xmlbuilder) {
                    var clonedRoot;
                    clonedRoot = xmlbuilder.root().clone();
                    clonedRoot.parent = this;
                    clonedRoot.isRoot = false;
                    this.children.push(clonedRoot);
                    return this;
                };
                XMLNode.prototype.ele = function(name, attributes, text) {
                    return this.element(name, attributes, text);
                };
                XMLNode.prototype.nod = function(name, attributes, text) {
                    return this.node(name, attributes, text);
                };
                XMLNode.prototype.txt = function(value) {
                    return this.text(value);
                };
                XMLNode.prototype.dat = function(value) {
                    return this.cdata(value);
                };
                XMLNode.prototype.com = function(value) {
                    return this.comment(value);
                };
                XMLNode.prototype.doc = function() {
                    return this.document();
                };
                XMLNode.prototype.dec = function(version, encoding, standalone) {
                    return this.declaration(version, encoding, standalone);
                };
                XMLNode.prototype.dtd = function(pubID, sysID) {
                    return this.doctype(pubID, sysID);
                };
                XMLNode.prototype.e = function(name, attributes, text) {
                    return this.element(name, attributes, text);
                };
                XMLNode.prototype.n = function(name, attributes, text) {
                    return this.node(name, attributes, text);
                };
                XMLNode.prototype.t = function(value) {
                    return this.text(value);
                };
                XMLNode.prototype.d = function(value) {
                    return this.cdata(value);
                };
                XMLNode.prototype.c = function(value) {
                    return this.comment(value);
                };
                XMLNode.prototype.r = function(value) {
                    return this.raw(value);
                };
                XMLNode.prototype.u = function() {
                    return this.up();
                };
                return XMLNode;
            }();
        }).call(this);
    }, {
        "./XMLCData": 167,
        "./XMLComment": 168,
        "./XMLDeclaration": 173,
        "./XMLDocType": 174,
        "./XMLElement": 175,
        "./XMLRaw": 178,
        "./XMLText": 180,
        "lodash/isEmpty": 135,
        "lodash/isFunction": 136,
        "lodash/isObject": 138
    } ],
    180: [ function(require, module, exports) {
        (function() {
            var XMLNode, XMLText, create, extend = function(child, parent) {
                for (var key in parent) {
                    if (hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            }, hasProp = {}.hasOwnProperty;
            create = require("lodash/create");
            XMLNode = require("./XMLNode");
            module.exports = XMLText = function(superClass) {
                extend(XMLText, superClass);
                function XMLText(parent, text) {
                    XMLText.__super__.constructor.call(this, parent);
                    if (text == null) {
                        throw new Error("Missing element text");
                    }
                    this.value = this.stringify.eleText(text);
                }
                XMLText.prototype.clone = function() {
                    return create(XMLText.prototype, this);
                };
                XMLText.prototype.toString = function(options, level) {
                    var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    level || (level = 0);
                    space = new Array(level + offset + 1).join(indent);
                    r = "";
                    if (pretty) {
                        r += space;
                    }
                    r += this.value;
                    if (pretty) {
                        r += newline;
                    }
                    return r;
                };
                return XMLText;
            }(XMLNode);
        }).call(this);
    }, {
        "./XMLNode": 176,
        "lodash/create": 125
    } ],
    178: [ function(require, module, exports) {
        (function() {
            var XMLNode, XMLRaw, create, extend = function(child, parent) {
                for (var key in parent) {
                    if (hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            }, hasProp = {}.hasOwnProperty;
            create = require("lodash/create");
            XMLNode = require("./XMLNode");
            module.exports = XMLRaw = function(superClass) {
                extend(XMLRaw, superClass);
                function XMLRaw(parent, text) {
                    XMLRaw.__super__.constructor.call(this, parent);
                    if (text == null) {
                        throw new Error("Missing raw text");
                    }
                    this.value = this.stringify.raw(text);
                }
                XMLRaw.prototype.clone = function() {
                    return create(XMLRaw.prototype, this);
                };
                XMLRaw.prototype.toString = function(options, level) {
                    var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    level || (level = 0);
                    space = new Array(level + offset + 1).join(indent);
                    r = "";
                    if (pretty) {
                        r += space;
                    }
                    r += this.value;
                    if (pretty) {
                        r += newline;
                    }
                    return r;
                };
                return XMLRaw;
            }(XMLNode);
        }).call(this);
    }, {
        "./XMLNode": 176,
        "lodash/create": 125
    } ],
    175: [ function(require, module, exports) {
        (function() {
            var XMLAttribute, XMLElement, XMLNode, XMLProcessingInstruction, create, every, isFunction, isObject, extend = function(child, parent) {
                for (var key in parent) {
                    if (hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            }, hasProp = {}.hasOwnProperty;
            create = require("lodash/create");
            isObject = require("lodash/isObject");
            isFunction = require("lodash/isFunction");
            every = require("lodash/every");
            XMLNode = require("./XMLNode");
            XMLAttribute = require("./XMLAttribute");
            XMLProcessingInstruction = require("./XMLProcessingInstruction");
            module.exports = XMLElement = function(superClass) {
                extend(XMLElement, superClass);
                function XMLElement(parent, name, attributes) {
                    XMLElement.__super__.constructor.call(this, parent);
                    if (name == null) {
                        throw new Error("Missing element name");
                    }
                    this.name = this.stringify.eleName(name);
                    this.children = [];
                    this.instructions = [];
                    this.attributes = {};
                    if (attributes != null) {
                        this.attribute(attributes);
                    }
                }
                XMLElement.prototype.clone = function() {
                    var att, attName, clonedSelf, i, len, pi, ref, ref1;
                    clonedSelf = create(XMLElement.prototype, this);
                    if (clonedSelf.isRoot) {
                        clonedSelf.documentObject = null;
                    }
                    clonedSelf.attributes = {};
                    ref = this.attributes;
                    for (attName in ref) {
                        if (!hasProp.call(ref, attName)) continue;
                        att = ref[attName];
                        clonedSelf.attributes[attName] = att.clone();
                    }
                    clonedSelf.instructions = [];
                    ref1 = this.instructions;
                    for (i = 0, len = ref1.length; i < len; i++) {
                        pi = ref1[i];
                        clonedSelf.instructions.push(pi.clone());
                    }
                    clonedSelf.children = [];
                    this.children.forEach(function(child) {
                        var clonedChild;
                        clonedChild = child.clone();
                        clonedChild.parent = clonedSelf;
                        return clonedSelf.children.push(clonedChild);
                    });
                    return clonedSelf;
                };
                XMLElement.prototype.attribute = function(name, value) {
                    var attName, attValue;
                    if (name != null) {
                        name = name.valueOf();
                    }
                    if (isObject(name)) {
                        for (attName in name) {
                            if (!hasProp.call(name, attName)) continue;
                            attValue = name[attName];
                            this.attribute(attName, attValue);
                        }
                    } else {
                        if (isFunction(value)) {
                            value = value.apply();
                        }
                        if (!this.options.skipNullAttributes || value != null) {
                            this.attributes[name] = new XMLAttribute(this, name, value);
                        }
                    }
                    return this;
                };
                XMLElement.prototype.removeAttribute = function(name) {
                    var attName, i, len;
                    if (name == null) {
                        throw new Error("Missing attribute name");
                    }
                    name = name.valueOf();
                    if (Array.isArray(name)) {
                        for (i = 0, len = name.length; i < len; i++) {
                            attName = name[i];
                            delete this.attributes[attName];
                        }
                    } else {
                        delete this.attributes[name];
                    }
                    return this;
                };
                XMLElement.prototype.instruction = function(target, value) {
                    var i, insTarget, insValue, instruction, len;
                    if (target != null) {
                        target = target.valueOf();
                    }
                    if (value != null) {
                        value = value.valueOf();
                    }
                    if (Array.isArray(target)) {
                        for (i = 0, len = target.length; i < len; i++) {
                            insTarget = target[i];
                            this.instruction(insTarget);
                        }
                    } else if (isObject(target)) {
                        for (insTarget in target) {
                            if (!hasProp.call(target, insTarget)) continue;
                            insValue = target[insTarget];
                            this.instruction(insTarget, insValue);
                        }
                    } else {
                        if (isFunction(value)) {
                            value = value.apply();
                        }
                        instruction = new XMLProcessingInstruction(this, target, value);
                        this.instructions.push(instruction);
                    }
                    return this;
                };
                XMLElement.prototype.toString = function(options, level) {
                    var att, child, i, indent, instruction, j, len, len1, name, newline, offset, pretty, r, ref, ref1, ref2, ref3, ref4, ref5, space;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    level || (level = 0);
                    space = new Array(level + offset + 1).join(indent);
                    r = "";
                    ref3 = this.instructions;
                    for (i = 0, len = ref3.length; i < len; i++) {
                        instruction = ref3[i];
                        r += instruction.toString(options, level);
                    }
                    if (pretty) {
                        r += space;
                    }
                    r += "<" + this.name;
                    ref4 = this.attributes;
                    for (name in ref4) {
                        if (!hasProp.call(ref4, name)) continue;
                        att = ref4[name];
                        r += att.toString(options);
                    }
                    if (this.children.length === 0 || every(this.children, function(e) {
                        return e.value === "";
                    })) {
                        r += "/>";
                        if (pretty) {
                            r += newline;
                        }
                    } else if (pretty && this.children.length === 1 && this.children[0].value != null) {
                        r += ">";
                        r += this.children[0].value;
                        r += "</" + this.name + ">";
                        r += newline;
                    } else {
                        r += ">";
                        if (pretty) {
                            r += newline;
                        }
                        ref5 = this.children;
                        for (j = 0, len1 = ref5.length; j < len1; j++) {
                            child = ref5[j];
                            r += child.toString(options, level + 1);
                        }
                        if (pretty) {
                            r += space;
                        }
                        r += "</" + this.name + ">";
                        if (pretty) {
                            r += newline;
                        }
                    }
                    return r;
                };
                XMLElement.prototype.att = function(name, value) {
                    return this.attribute(name, value);
                };
                XMLElement.prototype.ins = function(target, value) {
                    return this.instruction(target, value);
                };
                XMLElement.prototype.a = function(name, value) {
                    return this.attribute(name, value);
                };
                XMLElement.prototype.i = function(target, value) {
                    return this.instruction(target, value);
                };
                return XMLElement;
            }(XMLNode);
        }).call(this);
    }, {
        "./XMLAttribute": 165,
        "./XMLNode": 176,
        "./XMLProcessingInstruction": 177,
        "lodash/create": 125,
        "lodash/every": 127,
        "lodash/isFunction": 136,
        "lodash/isObject": 138
    } ],
    174: [ function(require, module, exports) {
        (function() {
            var XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDocType, XMLProcessingInstruction, create, isObject;
            create = require("lodash/create");
            isObject = require("lodash/isObject");
            XMLCData = require("./XMLCData");
            XMLComment = require("./XMLComment");
            XMLDTDAttList = require("./XMLDTDAttList");
            XMLDTDEntity = require("./XMLDTDEntity");
            XMLDTDElement = require("./XMLDTDElement");
            XMLDTDNotation = require("./XMLDTDNotation");
            XMLProcessingInstruction = require("./XMLProcessingInstruction");
            module.exports = XMLDocType = function() {
                function XMLDocType(parent, pubID, sysID) {
                    var ref, ref1;
                    this.documentObject = parent;
                    this.stringify = this.documentObject.stringify;
                    this.children = [];
                    if (isObject(pubID)) {
                        ref = pubID, pubID = ref.pubID, sysID = ref.sysID;
                    }
                    if (sysID == null) {
                        ref1 = [ pubID, sysID ], sysID = ref1[0], pubID = ref1[1];
                    }
                    if (pubID != null) {
                        this.pubID = this.stringify.dtdPubID(pubID);
                    }
                    if (sysID != null) {
                        this.sysID = this.stringify.dtdSysID(sysID);
                    }
                }
                XMLDocType.prototype.element = function(name, value) {
                    var child;
                    child = new XMLDTDElement(this, name, value);
                    this.children.push(child);
                    return this;
                };
                XMLDocType.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                    var child;
                    child = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
                    this.children.push(child);
                    return this;
                };
                XMLDocType.prototype.entity = function(name, value) {
                    var child;
                    child = new XMLDTDEntity(this, false, name, value);
                    this.children.push(child);
                    return this;
                };
                XMLDocType.prototype.pEntity = function(name, value) {
                    var child;
                    child = new XMLDTDEntity(this, true, name, value);
                    this.children.push(child);
                    return this;
                };
                XMLDocType.prototype.notation = function(name, value) {
                    var child;
                    child = new XMLDTDNotation(this, name, value);
                    this.children.push(child);
                    return this;
                };
                XMLDocType.prototype.cdata = function(value) {
                    var child;
                    child = new XMLCData(this, value);
                    this.children.push(child);
                    return this;
                };
                XMLDocType.prototype.comment = function(value) {
                    var child;
                    child = new XMLComment(this, value);
                    this.children.push(child);
                    return this;
                };
                XMLDocType.prototype.instruction = function(target, value) {
                    var child;
                    child = new XMLProcessingInstruction(this, target, value);
                    this.children.push(child);
                    return this;
                };
                XMLDocType.prototype.root = function() {
                    return this.documentObject.root();
                };
                XMLDocType.prototype.document = function() {
                    return this.documentObject;
                };
                XMLDocType.prototype.toString = function(options, level) {
                    var child, i, indent, len, newline, offset, pretty, r, ref, ref1, ref2, ref3, space;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    level || (level = 0);
                    space = new Array(level + offset + 1).join(indent);
                    r = "";
                    if (pretty) {
                        r += space;
                    }
                    r += "<!DOCTYPE " + this.root().name;
                    if (this.pubID && this.sysID) {
                        r += ' PUBLIC "' + this.pubID + '" "' + this.sysID + '"';
                    } else if (this.sysID) {
                        r += ' SYSTEM "' + this.sysID + '"';
                    }
                    if (this.children.length > 0) {
                        r += " [";
                        if (pretty) {
                            r += newline;
                        }
                        ref3 = this.children;
                        for (i = 0, len = ref3.length; i < len; i++) {
                            child = ref3[i];
                            r += child.toString(options, level + 1);
                        }
                        r += "]";
                    }
                    r += ">";
                    if (pretty) {
                        r += newline;
                    }
                    return r;
                };
                XMLDocType.prototype.ele = function(name, value) {
                    return this.element(name, value);
                };
                XMLDocType.prototype.att = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                    return this.attList(elementName, attributeName, attributeType, defaultValueType, defaultValue);
                };
                XMLDocType.prototype.ent = function(name, value) {
                    return this.entity(name, value);
                };
                XMLDocType.prototype.pent = function(name, value) {
                    return this.pEntity(name, value);
                };
                XMLDocType.prototype.not = function(name, value) {
                    return this.notation(name, value);
                };
                XMLDocType.prototype.dat = function(value) {
                    return this.cdata(value);
                };
                XMLDocType.prototype.com = function(value) {
                    return this.comment(value);
                };
                XMLDocType.prototype.ins = function(target, value) {
                    return this.instruction(target, value);
                };
                XMLDocType.prototype.up = function() {
                    return this.root();
                };
                XMLDocType.prototype.doc = function() {
                    return this.document();
                };
                return XMLDocType;
            }();
        }).call(this);
    }, {
        "./XMLCData": 167,
        "./XMLComment": 168,
        "./XMLDTDAttList": 169,
        "./XMLDTDElement": 170,
        "./XMLDTDEntity": 171,
        "./XMLDTDNotation": 172,
        "./XMLProcessingInstruction": 177,
        "lodash/create": 125,
        "lodash/isObject": 138
    } ],
    177: [ function(require, module, exports) {
        (function() {
            var XMLProcessingInstruction, create;
            create = require("lodash/create");
            module.exports = XMLProcessingInstruction = function() {
                function XMLProcessingInstruction(parent, target, value) {
                    this.stringify = parent.stringify;
                    if (target == null) {
                        throw new Error("Missing instruction target");
                    }
                    this.target = this.stringify.insTarget(target);
                    if (value) {
                        this.value = this.stringify.insValue(value);
                    }
                }
                XMLProcessingInstruction.prototype.clone = function() {
                    return create(XMLProcessingInstruction.prototype, this);
                };
                XMLProcessingInstruction.prototype.toString = function(options, level) {
                    var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    level || (level = 0);
                    space = new Array(level + offset + 1).join(indent);
                    r = "";
                    if (pretty) {
                        r += space;
                    }
                    r += "<?";
                    r += this.target;
                    if (this.value) {
                        r += " " + this.value;
                    }
                    r += "?>";
                    if (pretty) {
                        r += newline;
                    }
                    return r;
                };
                return XMLProcessingInstruction;
            }();
        }).call(this);
    }, {
        "lodash/create": 125
    } ],
    172: [ function(require, module, exports) {
        (function() {
            var XMLDTDNotation, create;
            create = require("lodash/create");
            module.exports = XMLDTDNotation = function() {
                function XMLDTDNotation(parent, name, value) {
                    this.stringify = parent.stringify;
                    if (name == null) {
                        throw new Error("Missing notation name");
                    }
                    if (!value.pubID && !value.sysID) {
                        throw new Error("Public or system identifiers are required for an external entity");
                    }
                    this.name = this.stringify.eleName(name);
                    if (value.pubID != null) {
                        this.pubID = this.stringify.dtdPubID(value.pubID);
                    }
                    if (value.sysID != null) {
                        this.sysID = this.stringify.dtdSysID(value.sysID);
                    }
                }
                XMLDTDNotation.prototype.toString = function(options, level) {
                    var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    level || (level = 0);
                    space = new Array(level + offset + 1).join(indent);
                    r = "";
                    if (pretty) {
                        r += space;
                    }
                    r += "<!NOTATION " + this.name;
                    if (this.pubID && this.sysID) {
                        r += ' PUBLIC "' + this.pubID + '" "' + this.sysID + '"';
                    } else if (this.pubID) {
                        r += ' PUBLIC "' + this.pubID + '"';
                    } else if (this.sysID) {
                        r += ' SYSTEM "' + this.sysID + '"';
                    }
                    r += ">";
                    if (pretty) {
                        r += newline;
                    }
                    return r;
                };
                return XMLDTDNotation;
            }();
        }).call(this);
    }, {
        "lodash/create": 125
    } ],
    171: [ function(require, module, exports) {
        (function() {
            var XMLDTDEntity, create, isObject;
            create = require("lodash/create");
            isObject = require("lodash/isObject");
            module.exports = XMLDTDEntity = function() {
                function XMLDTDEntity(parent, pe, name, value) {
                    this.stringify = parent.stringify;
                    if (name == null) {
                        throw new Error("Missing entity name");
                    }
                    if (value == null) {
                        throw new Error("Missing entity value");
                    }
                    this.pe = !!pe;
                    this.name = this.stringify.eleName(name);
                    if (!isObject(value)) {
                        this.value = this.stringify.dtdEntityValue(value);
                    } else {
                        if (!value.pubID && !value.sysID) {
                            throw new Error("Public and/or system identifiers are required for an external entity");
                        }
                        if (value.pubID && !value.sysID) {
                            throw new Error("System identifier is required for a public external entity");
                        }
                        if (value.pubID != null) {
                            this.pubID = this.stringify.dtdPubID(value.pubID);
                        }
                        if (value.sysID != null) {
                            this.sysID = this.stringify.dtdSysID(value.sysID);
                        }
                        if (value.nData != null) {
                            this.nData = this.stringify.dtdNData(value.nData);
                        }
                        if (this.pe && this.nData) {
                            throw new Error("Notation declaration is not allowed in a parameter entity");
                        }
                    }
                }
                XMLDTDEntity.prototype.toString = function(options, level) {
                    var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    level || (level = 0);
                    space = new Array(level + offset + 1).join(indent);
                    r = "";
                    if (pretty) {
                        r += space;
                    }
                    r += "<!ENTITY";
                    if (this.pe) {
                        r += " %";
                    }
                    r += " " + this.name;
                    if (this.value) {
                        r += ' "' + this.value + '"';
                    } else {
                        if (this.pubID && this.sysID) {
                            r += ' PUBLIC "' + this.pubID + '" "' + this.sysID + '"';
                        } else if (this.sysID) {
                            r += ' SYSTEM "' + this.sysID + '"';
                        }
                        if (this.nData) {
                            r += " NDATA " + this.nData;
                        }
                    }
                    r += ">";
                    if (pretty) {
                        r += newline;
                    }
                    return r;
                };
                return XMLDTDEntity;
            }();
        }).call(this);
    }, {
        "lodash/create": 125,
        "lodash/isObject": 138
    } ],
    170: [ function(require, module, exports) {
        (function() {
            var XMLDTDElement, create;
            create = require("lodash/create");
            module.exports = XMLDTDElement = function() {
                function XMLDTDElement(parent, name, value) {
                    this.stringify = parent.stringify;
                    if (name == null) {
                        throw new Error("Missing DTD element name");
                    }
                    if (!value) {
                        value = "(#PCDATA)";
                    }
                    if (Array.isArray(value)) {
                        value = "(" + value.join(",") + ")";
                    }
                    this.name = this.stringify.eleName(name);
                    this.value = this.stringify.dtdElementValue(value);
                }
                XMLDTDElement.prototype.toString = function(options, level) {
                    var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    level || (level = 0);
                    space = new Array(level + offset + 1).join(indent);
                    r = "";
                    if (pretty) {
                        r += space;
                    }
                    r += "<!ELEMENT " + this.name + " " + this.value + ">";
                    if (pretty) {
                        r += newline;
                    }
                    return r;
                };
                return XMLDTDElement;
            }();
        }).call(this);
    }, {
        "lodash/create": 125
    } ],
    169: [ function(require, module, exports) {
        (function() {
            var XMLDTDAttList, create;
            create = require("lodash/create");
            module.exports = XMLDTDAttList = function() {
                function XMLDTDAttList(parent, elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                    this.stringify = parent.stringify;
                    if (elementName == null) {
                        throw new Error("Missing DTD element name");
                    }
                    if (attributeName == null) {
                        throw new Error("Missing DTD attribute name");
                    }
                    if (!attributeType) {
                        throw new Error("Missing DTD attribute type");
                    }
                    if (!defaultValueType) {
                        throw new Error("Missing DTD attribute default");
                    }
                    if (defaultValueType.indexOf("#") !== 0) {
                        defaultValueType = "#" + defaultValueType;
                    }
                    if (!defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) {
                        throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT");
                    }
                    if (defaultValue && !defaultValueType.match(/^(#FIXED|#DEFAULT)$/)) {
                        throw new Error("Default value only applies to #FIXED or #DEFAULT");
                    }
                    this.elementName = this.stringify.eleName(elementName);
                    this.attributeName = this.stringify.attName(attributeName);
                    this.attributeType = this.stringify.dtdAttType(attributeType);
                    this.defaultValue = this.stringify.dtdAttDefault(defaultValue);
                    this.defaultValueType = defaultValueType;
                }
                XMLDTDAttList.prototype.toString = function(options, level) {
                    var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    level || (level = 0);
                    space = new Array(level + offset + 1).join(indent);
                    r = "";
                    if (pretty) {
                        r += space;
                    }
                    r += "<!ATTLIST " + this.elementName + " " + this.attributeName + " " + this.attributeType;
                    if (this.defaultValueType !== "#DEFAULT") {
                        r += " " + this.defaultValueType;
                    }
                    if (this.defaultValue) {
                        r += ' "' + this.defaultValue + '"';
                    }
                    r += ">";
                    if (pretty) {
                        r += newline;
                    }
                    return r;
                };
                return XMLDTDAttList;
            }();
        }).call(this);
    }, {
        "lodash/create": 125
    } ],
    168: [ function(require, module, exports) {
        (function() {
            var XMLComment, XMLNode, create, extend = function(child, parent) {
                for (var key in parent) {
                    if (hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            }, hasProp = {}.hasOwnProperty;
            create = require("lodash/create");
            XMLNode = require("./XMLNode");
            module.exports = XMLComment = function(superClass) {
                extend(XMLComment, superClass);
                function XMLComment(parent, text) {
                    XMLComment.__super__.constructor.call(this, parent);
                    if (text == null) {
                        throw new Error("Missing comment text");
                    }
                    this.text = this.stringify.comment(text);
                }
                XMLComment.prototype.clone = function() {
                    return create(XMLComment.prototype, this);
                };
                XMLComment.prototype.toString = function(options, level) {
                    var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    level || (level = 0);
                    space = new Array(level + offset + 1).join(indent);
                    r = "";
                    if (pretty) {
                        r += space;
                    }
                    r += "\x3c!-- " + this.text + " --\x3e";
                    if (pretty) {
                        r += newline;
                    }
                    return r;
                };
                return XMLComment;
            }(XMLNode);
        }).call(this);
    }, {
        "./XMLNode": 176,
        "lodash/create": 125
    } ],
    167: [ function(require, module, exports) {
        (function() {
            var XMLCData, XMLNode, create, extend = function(child, parent) {
                for (var key in parent) {
                    if (hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            }, hasProp = {}.hasOwnProperty;
            create = require("lodash/create");
            XMLNode = require("./XMLNode");
            module.exports = XMLCData = function(superClass) {
                extend(XMLCData, superClass);
                function XMLCData(parent, text) {
                    XMLCData.__super__.constructor.call(this, parent);
                    if (text == null) {
                        throw new Error("Missing CDATA text");
                    }
                    this.text = this.stringify.cdata(text);
                }
                XMLCData.prototype.clone = function() {
                    return create(XMLCData.prototype, this);
                };
                XMLCData.prototype.toString = function(options, level) {
                    var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
                    pretty = (options != null ? options.pretty : void 0) || false;
                    indent = (ref = options != null ? options.indent : void 0) != null ? ref : "  ";
                    offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
                    newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : "\n";
                    level || (level = 0);
                    space = new Array(level + offset + 1).join(indent);
                    r = "";
                    if (pretty) {
                        r += space;
                    }
                    r += "<![CDATA[" + this.text + "]]>";
                    if (pretty) {
                        r += newline;
                    }
                    return r;
                };
                return XMLCData;
            }(XMLNode);
        }).call(this);
    }, {
        "./XMLNode": 176,
        "lodash/create": 125
    } ],
    165: [ function(require, module, exports) {
        (function() {
            var XMLAttribute, create;
            create = require("lodash/create");
            module.exports = XMLAttribute = function() {
                function XMLAttribute(parent, name, value) {
                    this.stringify = parent.stringify;
                    if (name == null) {
                        throw new Error("Missing attribute name of element " + parent.name);
                    }
                    if (value == null) {
                        throw new Error("Missing attribute value for attribute " + name + " of element " + parent.name);
                    }
                    this.name = this.stringify.attName(name);
                    this.value = this.stringify.attValue(value);
                }
                XMLAttribute.prototype.clone = function() {
                    return create(XMLAttribute.prototype, this);
                };
                XMLAttribute.prototype.toString = function(options, level) {
                    return " " + this.name + '="' + this.value + '"';
                };
                return XMLAttribute;
            }();
        }).call(this);
    }, {
        "lodash/create": 125
    } ],
    160: [ function(require, module, exports) {
        var v1 = require("./v1");
        var v4 = require("./v4");
        var uuid = v4;
        uuid.v1 = v1;
        uuid.v4 = v4;
        module.exports = uuid;
    }, {
        "./v1": 163,
        "./v4": 164
    } ],
    164: [ function(require, module, exports) {
        var rng = require("./lib/rng");
        var bytesToUuid = require("./lib/bytesToUuid");
        function v4(options, buf, offset) {
            var i = buf && offset || 0;
            if (typeof options == "string") {
                buf = options == "binary" ? new Array(16) : null;
                options = null;
            }
            options = options || {};
            var rnds = options.random || (options.rng || rng)();
            rnds[6] = rnds[6] & 15 | 64;
            rnds[8] = rnds[8] & 63 | 128;
            if (buf) {
                for (var ii = 0; ii < 16; ++ii) {
                    buf[i + ii] = rnds[ii];
                }
            }
            return buf || bytesToUuid(rnds);
        }
        module.exports = v4;
    }, {
        "./lib/bytesToUuid": 161,
        "./lib/rng": 162
    } ],
    163: [ function(require, module, exports) {
        var rng = require("./lib/rng");
        var bytesToUuid = require("./lib/bytesToUuid");
        var _seedBytes = rng();
        var _nodeId = [ _seedBytes[0] | 1, _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5] ];
        var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 16383;
        var _lastMSecs = 0, _lastNSecs = 0;
        function v1(options, buf, offset) {
            var i = buf && offset || 0;
            var b = buf || [];
            options = options || {};
            var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;
            var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();
            var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;
            var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
            if (dt < 0 && options.clockseq === undefined) {
                clockseq = clockseq + 1 & 16383;
            }
            if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
                nsecs = 0;
            }
            if (nsecs >= 1e4) {
                throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
            }
            _lastMSecs = msecs;
            _lastNSecs = nsecs;
            _clockseq = clockseq;
            msecs += 122192928e5;
            var tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
            b[i++] = tl >>> 24 & 255;
            b[i++] = tl >>> 16 & 255;
            b[i++] = tl >>> 8 & 255;
            b[i++] = tl & 255;
            var tmh = msecs / 4294967296 * 1e4 & 268435455;
            b[i++] = tmh >>> 8 & 255;
            b[i++] = tmh & 255;
            b[i++] = tmh >>> 24 & 15 | 16;
            b[i++] = tmh >>> 16 & 255;
            b[i++] = clockseq >>> 8 | 128;
            b[i++] = clockseq & 255;
            var node = options.node || _nodeId;
            for (var n = 0; n < 6; ++n) {
                b[i + n] = node[n];
            }
            return buf ? buf : bytesToUuid(b);
        }
        module.exports = v1;
    }, {
        "./lib/bytesToUuid": 161,
        "./lib/rng": 162
    } ],
    162: [ function(require, module, exports) {
        (function(global) {
            var rng;
            var crypto = global.crypto || global.msCrypto;
            if (crypto && crypto.getRandomValues) {
                var rnds8 = new Uint8Array(16);
                rng = function whatwgRNG() {
                    crypto.getRandomValues(rnds8);
                    return rnds8;
                };
            }
            if (!rng) {
                var rnds = new Array(16);
                rng = function() {
                    for (var i = 0, r; i < 16; i++) {
                        if ((i & 3) === 0) r = Math.random() * 4294967296;
                        rnds[i] = r >>> ((i & 3) << 3) & 255;
                    }
                    return rnds;
                };
            }
            module.exports = rng;
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {} ],
    161: [ function(require, module, exports) {
        var byteToHex = [];
        for (var i = 0; i < 256; ++i) {
            byteToHex[i] = (i + 256).toString(16).substr(1);
        }
        function bytesToUuid(buf, offset) {
            var i = offset || 0;
            var bth = byteToHex;
            return bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + "-" + bth[buf[i++]] + bth[buf[i++]] + "-" + bth[buf[i++]] + bth[buf[i++]] + "-" + bth[buf[i++]] + bth[buf[i++]] + "-" + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]];
        }
        module.exports = bytesToUuid;
    }, {} ],
    159: [ function(require, module, exports) {
        (function(process, global) {
            var formatRegExp = /%[sdj%]/g;
            exports.format = function(f) {
                if (!isString(f)) {
                    var objects = [];
                    for (var i = 0; i < arguments.length; i++) {
                        objects.push(inspect(arguments[i]));
                    }
                    return objects.join(" ");
                }
                var i = 1;
                var args = arguments;
                var len = args.length;
                var str = String(f).replace(formatRegExp, function(x) {
                    if (x === "%%") return "%";
                    if (i >= len) return x;
                    switch (x) {
                      case "%s":
                        return String(args[i++]);

                      case "%d":
                        return Number(args[i++]);

                      case "%j":
                        try {
                            return JSON.stringify(args[i++]);
                        } catch (_) {
                            return "[Circular]";
                        }

                      default:
                        return x;
                    }
                });
                for (var x = args[i]; i < len; x = args[++i]) {
                    if (isNull(x) || !isObject(x)) {
                        str += " " + x;
                    } else {
                        str += " " + inspect(x);
                    }
                }
                return str;
            };
            exports.deprecate = function(fn, msg) {
                if (isUndefined(global.process)) {
                    return function() {
                        return exports.deprecate(fn, msg).apply(this, arguments);
                    };
                }
                if (process.noDeprecation === true) {
                    return fn;
                }
                var warned = false;
                function deprecated() {
                    if (!warned) {
                        if (process.throwDeprecation) {
                            throw new Error(msg);
                        } else if (process.traceDeprecation) {
                            console.trace(msg);
                        } else {
                            console.error(msg);
                        }
                        warned = true;
                    }
                    return fn.apply(this, arguments);
                }
                return deprecated;
            };
            var debugs = {};
            var debugEnviron;
            exports.debuglog = function(set) {
                if (isUndefined(debugEnviron)) debugEnviron = process.env.NODE_DEBUG || "";
                set = set.toUpperCase();
                if (!debugs[set]) {
                    if (new RegExp("\\b" + set + "\\b", "i").test(debugEnviron)) {
                        var pid = process.pid;
                        debugs[set] = function() {
                            var msg = exports.format.apply(exports, arguments);
                            console.error("%s %d: %s", set, pid, msg);
                        };
                    } else {
                        debugs[set] = function() {};
                    }
                }
                return debugs[set];
            };
            function inspect(obj, opts) {
                var ctx = {
                    seen: [],
                    stylize: stylizeNoColor
                };
                if (arguments.length >= 3) ctx.depth = arguments[2];
                if (arguments.length >= 4) ctx.colors = arguments[3];
                if (isBoolean(opts)) {
                    ctx.showHidden = opts;
                } else if (opts) {
                    exports._extend(ctx, opts);
                }
                if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
                if (isUndefined(ctx.depth)) ctx.depth = 2;
                if (isUndefined(ctx.colors)) ctx.colors = false;
                if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
                if (ctx.colors) ctx.stylize = stylizeWithColor;
                return formatValue(ctx, obj, ctx.depth);
            }
            exports.inspect = inspect;
            inspect.colors = {
                bold: [ 1, 22 ],
                italic: [ 3, 23 ],
                underline: [ 4, 24 ],
                inverse: [ 7, 27 ],
                white: [ 37, 39 ],
                grey: [ 90, 39 ],
                black: [ 30, 39 ],
                blue: [ 34, 39 ],
                cyan: [ 36, 39 ],
                green: [ 32, 39 ],
                magenta: [ 35, 39 ],
                red: [ 31, 39 ],
                yellow: [ 33, 39 ]
            };
            inspect.styles = {
                special: "cyan",
                number: "yellow",
                boolean: "yellow",
                undefined: "grey",
                null: "bold",
                string: "green",
                date: "magenta",
                regexp: "red"
            };
            function stylizeWithColor(str, styleType) {
                var style = inspect.styles[styleType];
                if (style) {
                    return "[" + inspect.colors[style][0] + "m" + str + "[" + inspect.colors[style][1] + "m";
                } else {
                    return str;
                }
            }
            function stylizeNoColor(str, styleType) {
                return str;
            }
            function arrayToHash(array) {
                var hash = {};
                array.forEach(function(val, idx) {
                    hash[val] = true;
                });
                return hash;
            }
            function formatValue(ctx, value, recurseTimes) {
                if (ctx.customInspect && value && isFunction(value.inspect) && value.inspect !== exports.inspect && !(value.constructor && value.constructor.prototype === value)) {
                    var ret = value.inspect(recurseTimes, ctx);
                    if (!isString(ret)) {
                        ret = formatValue(ctx, ret, recurseTimes);
                    }
                    return ret;
                }
                var primitive = formatPrimitive(ctx, value);
                if (primitive) {
                    return primitive;
                }
                var keys = Object.keys(value);
                var visibleKeys = arrayToHash(keys);
                if (ctx.showHidden) {
                    keys = Object.getOwnPropertyNames(value);
                }
                if (isError(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0)) {
                    return formatError(value);
                }
                if (keys.length === 0) {
                    if (isFunction(value)) {
                        var name = value.name ? ": " + value.name : "";
                        return ctx.stylize("[Function" + name + "]", "special");
                    }
                    if (isRegExp(value)) {
                        return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
                    }
                    if (isDate(value)) {
                        return ctx.stylize(Date.prototype.toString.call(value), "date");
                    }
                    if (isError(value)) {
                        return formatError(value);
                    }
                }
                var base = "", array = false, braces = [ "{", "}" ];
                if (isArray(value)) {
                    array = true;
                    braces = [ "[", "]" ];
                }
                if (isFunction(value)) {
                    var n = value.name ? ": " + value.name : "";
                    base = " [Function" + n + "]";
                }
                if (isRegExp(value)) {
                    base = " " + RegExp.prototype.toString.call(value);
                }
                if (isDate(value)) {
                    base = " " + Date.prototype.toUTCString.call(value);
                }
                if (isError(value)) {
                    base = " " + formatError(value);
                }
                if (keys.length === 0 && (!array || value.length == 0)) {
                    return braces[0] + base + braces[1];
                }
                if (recurseTimes < 0) {
                    if (isRegExp(value)) {
                        return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
                    } else {
                        return ctx.stylize("[Object]", "special");
                    }
                }
                ctx.seen.push(value);
                var output;
                if (array) {
                    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
                } else {
                    output = keys.map(function(key) {
                        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
                    });
                }
                ctx.seen.pop();
                return reduceToSingleString(output, base, braces);
            }
            function formatPrimitive(ctx, value) {
                if (isUndefined(value)) return ctx.stylize("undefined", "undefined");
                if (isString(value)) {
                    var simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
                    return ctx.stylize(simple, "string");
                }
                if (isNumber(value)) return ctx.stylize("" + value, "number");
                if (isBoolean(value)) return ctx.stylize("" + value, "boolean");
                if (isNull(value)) return ctx.stylize("null", "null");
            }
            function formatError(value) {
                return "[" + Error.prototype.toString.call(value) + "]";
            }
            function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
                var output = [];
                for (var i = 0, l = value.length; i < l; ++i) {
                    if (hasOwnProperty(value, String(i))) {
                        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
                    } else {
                        output.push("");
                    }
                }
                keys.forEach(function(key) {
                    if (!key.match(/^\d+$/)) {
                        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
                    }
                });
                return output;
            }
            function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
                var name, str, desc;
                desc = Object.getOwnPropertyDescriptor(value, key) || {
                    value: value[key]
                };
                if (desc.get) {
                    if (desc.set) {
                        str = ctx.stylize("[Getter/Setter]", "special");
                    } else {
                        str = ctx.stylize("[Getter]", "special");
                    }
                } else {
                    if (desc.set) {
                        str = ctx.stylize("[Setter]", "special");
                    }
                }
                if (!hasOwnProperty(visibleKeys, key)) {
                    name = "[" + key + "]";
                }
                if (!str) {
                    if (ctx.seen.indexOf(desc.value) < 0) {
                        if (isNull(recurseTimes)) {
                            str = formatValue(ctx, desc.value, null);
                        } else {
                            str = formatValue(ctx, desc.value, recurseTimes - 1);
                        }
                        if (str.indexOf("\n") > -1) {
                            if (array) {
                                str = str.split("\n").map(function(line) {
                                    return "  " + line;
                                }).join("\n").substr(2);
                            } else {
                                str = "\n" + str.split("\n").map(function(line) {
                                    return "   " + line;
                                }).join("\n");
                            }
                        }
                    } else {
                        str = ctx.stylize("[Circular]", "special");
                    }
                }
                if (isUndefined(name)) {
                    if (array && key.match(/^\d+$/)) {
                        return str;
                    }
                    name = JSON.stringify("" + key);
                    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                        name = name.substr(1, name.length - 2);
                        name = ctx.stylize(name, "name");
                    } else {
                        name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
                        name = ctx.stylize(name, "string");
                    }
                }
                return name + ": " + str;
            }
            function reduceToSingleString(output, base, braces) {
                var numLinesEst = 0;
                var length = output.reduce(function(prev, cur) {
                    numLinesEst++;
                    if (cur.indexOf("\n") >= 0) numLinesEst++;
                    return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
                }, 0);
                if (length > 60) {
                    return braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1];
                }
                return braces[0] + base + " " + output.join(", ") + " " + braces[1];
            }
            function isArray(ar) {
                return Array.isArray(ar);
            }
            exports.isArray = isArray;
            function isBoolean(arg) {
                return typeof arg === "boolean";
            }
            exports.isBoolean = isBoolean;
            function isNull(arg) {
                return arg === null;
            }
            exports.isNull = isNull;
            function isNullOrUndefined(arg) {
                return arg == null;
            }
            exports.isNullOrUndefined = isNullOrUndefined;
            function isNumber(arg) {
                return typeof arg === "number";
            }
            exports.isNumber = isNumber;
            function isString(arg) {
                return typeof arg === "string";
            }
            exports.isString = isString;
            function isSymbol(arg) {
                return typeof arg === "symbol";
            }
            exports.isSymbol = isSymbol;
            function isUndefined(arg) {
                return arg === void 0;
            }
            exports.isUndefined = isUndefined;
            function isRegExp(re) {
                return isObject(re) && objectToString(re) === "[object RegExp]";
            }
            exports.isRegExp = isRegExp;
            function isObject(arg) {
                return typeof arg === "object" && arg !== null;
            }
            exports.isObject = isObject;
            function isDate(d) {
                return isObject(d) && objectToString(d) === "[object Date]";
            }
            exports.isDate = isDate;
            function isError(e) {
                return isObject(e) && (objectToString(e) === "[object Error]" || e instanceof Error);
            }
            exports.isError = isError;
            function isFunction(arg) {
                return typeof arg === "function";
            }
            exports.isFunction = isFunction;
            function isPrimitive(arg) {
                return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
            }
            exports.isPrimitive = isPrimitive;
            exports.isBuffer = require("./support/isBuffer");
            function objectToString(o) {
                return Object.prototype.toString.call(o);
            }
            function pad(n) {
                return n < 10 ? "0" + n.toString(10) : n.toString(10);
            }
            var months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
            function timestamp() {
                var d = new Date();
                var time = [ pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds()) ].join(":");
                return [ d.getDate(), months[d.getMonth()], time ].join(" ");
            }
            exports.log = function() {
                console.log("%s - %s", timestamp(), exports.format.apply(exports, arguments));
            };
            exports.inherits = require("inherits");
            exports._extend = function(origin, add) {
                if (!add || !isObject(add)) return origin;
                var keys = Object.keys(add);
                var i = keys.length;
                while (i--) {
                    origin[keys[i]] = add[keys[i]];
                }
                return origin;
            };
            function hasOwnProperty(obj, prop) {
                return Object.prototype.hasOwnProperty.call(obj, prop);
            }
        }).call(this, require("_process"), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {
        "./support/isBuffer": 158,
        _process: 148,
        inherits: 157
    } ],
    158: [ function(require, module, exports) {
        module.exports = function isBuffer(arg) {
            return arg && typeof arg === "object" && typeof arg.copy === "function" && typeof arg.fill === "function" && typeof arg.readUInt8 === "function";
        };
    }, {} ],
    157: [ function(require, module, exports) {
        if (typeof Object.create === "function") {
            module.exports = function inherits(ctor, superCtor) {
                ctor.super_ = superCtor;
                ctor.prototype = Object.create(superCtor.prototype, {
                    constructor: {
                        value: ctor,
                        enumerable: false,
                        writable: true,
                        configurable: true
                    }
                });
            };
        } else {
            module.exports = function inherits(ctor, superCtor) {
                ctor.super_ = superCtor;
                var TempCtor = function() {};
                TempCtor.prototype = superCtor.prototype;
                ctor.prototype = new TempCtor();
                ctor.prototype.constructor = ctor;
            };
        }
    }, {} ],
    148: [ function(require, module, exports) {
        var process = module.exports = {};
        var cachedSetTimeout;
        var cachedClearTimeout;
        function defaultSetTimout() {
            throw new Error("setTimeout has not been defined");
        }
        function defaultClearTimeout() {
            throw new Error("clearTimeout has not been defined");
        }
        (function() {
            try {
                if (typeof setTimeout === "function") {
                    cachedSetTimeout = setTimeout;
                } else {
                    cachedSetTimeout = defaultSetTimout;
                }
            } catch (e) {
                cachedSetTimeout = defaultSetTimout;
            }
            try {
                if (typeof clearTimeout === "function") {
                    cachedClearTimeout = clearTimeout;
                } else {
                    cachedClearTimeout = defaultClearTimeout;
                }
            } catch (e) {
                cachedClearTimeout = defaultClearTimeout;
            }
        })();
        function runTimeout(fun) {
            if (cachedSetTimeout === setTimeout) {
                return setTimeout(fun, 0);
            }
            if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
                cachedSetTimeout = setTimeout;
                return setTimeout(fun, 0);
            }
            try {
                return cachedSetTimeout(fun, 0);
            } catch (e) {
                try {
                    return cachedSetTimeout.call(null, fun, 0);
                } catch (e) {
                    return cachedSetTimeout.call(this, fun, 0);
                }
            }
        }
        function runClearTimeout(marker) {
            if (cachedClearTimeout === clearTimeout) {
                return clearTimeout(marker);
            }
            if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
                cachedClearTimeout = clearTimeout;
                return clearTimeout(marker);
            }
            try {
                return cachedClearTimeout(marker);
            } catch (e) {
                try {
                    return cachedClearTimeout.call(null, marker);
                } catch (e) {
                    return cachedClearTimeout.call(this, marker);
                }
            }
        }
        var queue = [];
        var draining = false;
        var currentQueue;
        var queueIndex = -1;
        function cleanUpNextTick() {
            if (!draining || !currentQueue) {
                return;
            }
            draining = false;
            if (currentQueue.length) {
                queue = currentQueue.concat(queue);
            } else {
                queueIndex = -1;
            }
            if (queue.length) {
                drainQueue();
            }
        }
        function drainQueue() {
            if (draining) {
                return;
            }
            var timeout = runTimeout(cleanUpNextTick);
            draining = true;
            var len = queue.length;
            while (len) {
                currentQueue = queue;
                queue = [];
                while (++queueIndex < len) {
                    if (currentQueue) {
                        currentQueue[queueIndex].run();
                    }
                }
                queueIndex = -1;
                len = queue.length;
            }
            currentQueue = null;
            draining = false;
            runClearTimeout(timeout);
        }
        process.nextTick = function(fun) {
            var args = new Array(arguments.length - 1);
            if (arguments.length > 1) {
                for (var i = 1; i < arguments.length; i++) {
                    args[i - 1] = arguments[i];
                }
            }
            queue.push(new Item(fun, args));
            if (queue.length === 1 && !draining) {
                runTimeout(drainQueue);
            }
        };
        function Item(fun, array) {
            this.fun = fun;
            this.array = array;
        }
        Item.prototype.run = function() {
            this.fun.apply(null, this.array);
        };
        process.title = "browser";
        process.browser = true;
        process.env = {};
        process.argv = [];
        process.version = "";
        process.versions = {};
        function noop() {}
        process.on = noop;
        process.addListener = noop;
        process.once = noop;
        process.off = noop;
        process.removeListener = noop;
        process.removeAllListeners = noop;
        process.emit = noop;
        process.prependListener = noop;
        process.prependOnceListener = noop;
        process.listeners = function(name) {
            return [];
        };
        process.binding = function(name) {
            throw new Error("process.binding is not supported");
        };
        process.cwd = function() {
            return "/";
        };
        process.chdir = function(dir) {
            throw new Error("process.chdir is not supported");
        };
        process.umask = function() {
            return 0;
        };
    }, {} ],
    135: [ function(require, module, exports) {
        var baseKeys = require("./_baseKeys"), getTag = require("./_getTag"), isArguments = require("./isArguments"), isArray = require("./isArray"), isArrayLike = require("./isArrayLike"), isBuffer = require("./isBuffer"), isPrototype = require("./_isPrototype"), isTypedArray = require("./isTypedArray");
        var mapTag = "[object Map]", setTag = "[object Set]";
        var objectProto = Object.prototype;
        var hasOwnProperty = objectProto.hasOwnProperty;
        function isEmpty(value) {
            if (value == null) {
                return true;
            }
            if (isArrayLike(value) && (isArray(value) || typeof value == "string" || typeof value.splice == "function" || isBuffer(value) || isTypedArray(value) || isArguments(value))) {
                return !value.length;
            }
            var tag = getTag(value);
            if (tag == mapTag || tag == setTag) {
                return !value.size;
            }
            if (isPrototype(value)) {
                return !baseKeys(value).length;
            }
            for (var key in value) {
                if (hasOwnProperty.call(value, key)) {
                    return false;
                }
            }
            return true;
        }
        module.exports = isEmpty;
    }, {
        "./_baseKeys": 47,
        "./_getTag": 75,
        "./_isPrototype": 88,
        "./isArguments": 131,
        "./isArray": 132,
        "./isArrayLike": 133,
        "./isBuffer": 134,
        "./isTypedArray": 141
    } ],
    127: [ function(require, module, exports) {
        var arrayEvery = require("./_arrayEvery"), baseEvery = require("./_baseEvery"), baseIteratee = require("./_baseIteratee"), isArray = require("./isArray"), isIterateeCall = require("./_isIterateeCall");
        function every(collection, predicate, guard) {
            var func = isArray(collection) ? arrayEvery : baseEvery;
            if (guard && isIterateeCall(collection, predicate, guard)) {
                predicate = undefined;
            }
            return func(collection, baseIteratee(predicate, 3));
        }
        module.exports = every;
    }, {
        "./_arrayEvery": 21,
        "./_baseEvery": 33,
        "./_baseIteratee": 46,
        "./_isIterateeCall": 84,
        "./isArray": 132
    } ],
    125: [ function(require, module, exports) {
        var baseAssign = require("./_baseAssign"), baseCreate = require("./_baseCreate");
        function create(prototype, properties) {
            var result = baseCreate(prototype);
            return properties == null ? result : baseAssign(result, properties);
        }
        module.exports = create;
    }, {
        "./_baseAssign": 29,
        "./_baseCreate": 31
    } ],
    123: [ function(require, module, exports) {
        var assignValue = require("./_assignValue"), copyObject = require("./_copyObject"), createAssigner = require("./_createAssigner"), isArrayLike = require("./isArrayLike"), isPrototype = require("./_isPrototype"), keys = require("./keys");
        var objectProto = Object.prototype;
        var hasOwnProperty = objectProto.hasOwnProperty;
        var assign = createAssigner(function(object, source) {
            if (isPrototype(source) || isArrayLike(source)) {
                copyObject(source, keys(source), object);
                return;
            }
            for (var key in source) {
                if (hasOwnProperty.call(source, key)) {
                    assignValue(object, key, source[key]);
                }
            }
        });
        module.exports = assign;
    }, {
        "./_assignValue": 27,
        "./_copyObject": 59,
        "./_createAssigner": 61,
        "./_isPrototype": 88,
        "./isArrayLike": 133,
        "./keys": 142
    } ],
    61: [ function(require, module, exports) {
        var baseRest = require("./_baseRest"), isIterateeCall = require("./_isIterateeCall");
        function createAssigner(assigner) {
            return baseRest(function(object, sources) {
                var index = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : undefined, guard = length > 2 ? sources[2] : undefined;
                customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, 
                customizer) : undefined;
                if (guard && isIterateeCall(sources[0], sources[1], guard)) {
                    customizer = length < 3 ? undefined : customizer;
                    length = 1;
                }
                object = Object(object);
                while (++index < length) {
                    var source = sources[index];
                    if (source) {
                        assigner(object, source, index, customizer);
                    }
                }
                return object;
            });
        }
        module.exports = createAssigner;
    }, {
        "./_baseRest": 52,
        "./_isIterateeCall": 84
    } ],
    84: [ function(require, module, exports) {
        var eq = require("./eq"), isArrayLike = require("./isArrayLike"), isIndex = require("./_isIndex"), isObject = require("./isObject");
        function isIterateeCall(value, index, object) {
            if (!isObject(object)) {
                return false;
            }
            var type = typeof index;
            if (type == "number" ? isArrayLike(object) && isIndex(index, object.length) : type == "string" && index in object) {
                return eq(object[index], value);
            }
            return false;
        }
        module.exports = isIterateeCall;
    }, {
        "./_isIndex": 83,
        "./eq": 126,
        "./isArrayLike": 133,
        "./isObject": 138
    } ],
    52: [ function(require, module, exports) {
        var identity = require("./identity"), overRest = require("./_overRest"), setToString = require("./_setToString");
        function baseRest(func, start) {
            return setToString(overRest(func, start, identity), func + "");
        }
        module.exports = baseRest;
    }, {
        "./_overRest": 108,
        "./_setToString": 113,
        "./identity": 130
    } ],
    113: [ function(require, module, exports) {
        var baseSetToString = require("./_baseSetToString"), shortOut = require("./_shortOut");
        var setToString = shortOut(baseSetToString);
        module.exports = setToString;
    }, {
        "./_baseSetToString": 53,
        "./_shortOut": 114
    } ],
    114: [ function(require, module, exports) {
        var HOT_COUNT = 800, HOT_SPAN = 16;
        var nativeNow = Date.now;
        function shortOut(func) {
            var count = 0, lastCalled = 0;
            return function() {
                var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
                lastCalled = stamp;
                if (remaining > 0) {
                    if (++count >= HOT_COUNT) {
                        return arguments[0];
                    }
                } else {
                    count = 0;
                }
                return func.apply(undefined, arguments);
            };
        }
        module.exports = shortOut;
    }, {} ],
    53: [ function(require, module, exports) {
        var constant = require("./constant"), defineProperty = require("./_defineProperty"), identity = require("./identity");
        var baseSetToString = !defineProperty ? identity : function(func, string) {
            return defineProperty(func, "toString", {
                configurable: true,
                enumerable: false,
                value: constant(string),
                writable: true
            });
        };
        module.exports = baseSetToString;
    }, {
        "./_defineProperty": 64,
        "./constant": 124,
        "./identity": 130
    } ],
    124: [ function(require, module, exports) {
        function constant(value) {
            return function() {
                return value;
            };
        }
        module.exports = constant;
    }, {} ],
    108: [ function(require, module, exports) {
        var apply = require("./_apply");
        var nativeMax = Math.max;
        function overRest(func, start, transform) {
            start = nativeMax(start === undefined ? func.length - 1 : start, 0);
            return function() {
                var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
                while (++index < length) {
                    array[index] = args[start + index];
                }
                index = -1;
                var otherArgs = Array(start + 1);
                while (++index < start) {
                    otherArgs[index] = args[index];
                }
                otherArgs[start] = transform(array);
                return apply(func, this, otherArgs);
            };
        }
        module.exports = overRest;
    }, {
        "./_apply": 20
    } ],
    46: [ function(require, module, exports) {
        var baseMatches = require("./_baseMatches"), baseMatchesProperty = require("./_baseMatchesProperty"), identity = require("./identity"), isArray = require("./isArray"), property = require("./property");
        function baseIteratee(value) {
            if (typeof value == "function") {
                return value;
            }
            if (value == null) {
                return identity;
            }
            if (typeof value == "object") {
                return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
            }
            return property(value);
        }
        module.exports = baseIteratee;
    }, {
        "./_baseMatches": 48,
        "./_baseMatchesProperty": 49,
        "./identity": 130,
        "./isArray": 132,
        "./property": 144
    } ],
    144: [ function(require, module, exports) {
        var baseProperty = require("./_baseProperty"), basePropertyDeep = require("./_basePropertyDeep"), isKey = require("./_isKey"), toKey = require("./_toKey");
        function property(path) {
            return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
        }
        module.exports = property;
    }, {
        "./_baseProperty": 50,
        "./_basePropertyDeep": 51,
        "./_isKey": 85,
        "./_toKey": 121
    } ],
    51: [ function(require, module, exports) {
        var baseGet = require("./_baseGet");
        function basePropertyDeep(path) {
            return function(object) {
                return baseGet(object, path);
            };
        }
        module.exports = basePropertyDeep;
    }, {
        "./_baseGet": 36
    } ],
    50: [ function(require, module, exports) {
        function baseProperty(key) {
            return function(object) {
                return object == null ? undefined : object[key];
            };
        }
        module.exports = baseProperty;
    }, {} ],
    130: [ function(require, module, exports) {
        function identity(value) {
            return value;
        }
        module.exports = identity;
    }, {} ],
    49: [ function(require, module, exports) {
        var baseIsEqual = require("./_baseIsEqual"), get = require("./get"), hasIn = require("./hasIn"), isKey = require("./_isKey"), isStrictComparable = require("./_isStrictComparable"), matchesStrictComparable = require("./_matchesStrictComparable"), toKey = require("./_toKey");
        var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
        function baseMatchesProperty(path, srcValue) {
            if (isKey(path) && isStrictComparable(srcValue)) {
                return matchesStrictComparable(toKey(path), srcValue);
            }
            return function(object) {
                var objValue = get(object, path);
                return objValue === undefined && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
            };
        }
        module.exports = baseMatchesProperty;
    }, {
        "./_baseIsEqual": 41,
        "./_isKey": 85,
        "./_isStrictComparable": 89,
        "./_matchesStrictComparable": 101,
        "./_toKey": 121,
        "./get": 128,
        "./hasIn": 129
    } ],
    129: [ function(require, module, exports) {
        var baseHasIn = require("./_baseHasIn"), hasPath = require("./_hasPath");
        function hasIn(object, path) {
            return object != null && hasPath(object, path, baseHasIn);
        }
        module.exports = hasIn;
    }, {
        "./_baseHasIn": 39,
        "./_hasPath": 77
    } ],
    77: [ function(require, module, exports) {
        var castPath = require("./_castPath"), isArguments = require("./isArguments"), isArray = require("./isArray"), isIndex = require("./_isIndex"), isLength = require("./isLength"), toKey = require("./_toKey");
        function hasPath(object, path, hasFunc) {
            path = castPath(path, object);
            var index = -1, length = path.length, result = false;
            while (++index < length) {
                var key = toKey(path[index]);
                if (!(result = object != null && hasFunc(object, key))) {
                    break;
                }
                object = object[key];
            }
            if (result || ++index != length) {
                return result;
            }
            length = object == null ? 0 : object.length;
            return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
        }
        module.exports = hasPath;
    }, {
        "./_castPath": 58,
        "./_isIndex": 83,
        "./_toKey": 121,
        "./isArguments": 131,
        "./isArray": 132,
        "./isLength": 137
    } ],
    128: [ function(require, module, exports) {
        var baseGet = require("./_baseGet");
        function get(object, path, defaultValue) {
            var result = object == null ? undefined : baseGet(object, path);
            return result === undefined ? defaultValue : result;
        }
        module.exports = get;
    }, {
        "./_baseGet": 36
    } ],
    48: [ function(require, module, exports) {
        var baseIsMatch = require("./_baseIsMatch"), getMatchData = require("./_getMatchData"), matchesStrictComparable = require("./_matchesStrictComparable");
        function baseMatches(source) {
            var matchData = getMatchData(source);
            if (matchData.length == 1 && matchData[0][2]) {
                return matchesStrictComparable(matchData[0][0], matchData[0][1]);
            }
            return function(object) {
                return object === source || baseIsMatch(object, source, matchData);
            };
        }
        module.exports = baseMatches;
    }, {
        "./_baseIsMatch": 43,
        "./_getMatchData": 71,
        "./_matchesStrictComparable": 101
    } ],
    101: [ function(require, module, exports) {
        function matchesStrictComparable(key, srcValue) {
            return function(object) {
                if (object == null) {
                    return false;
                }
                return object[key] === srcValue && (srcValue !== undefined || key in Object(object));
            };
        }
        module.exports = matchesStrictComparable;
    }, {} ],
    71: [ function(require, module, exports) {
        var isStrictComparable = require("./_isStrictComparable"), keys = require("./keys");
        function getMatchData(object) {
            var result = keys(object), length = result.length;
            while (length--) {
                var key = result[length], value = object[key];
                result[length] = [ key, value, isStrictComparable(value) ];
            }
            return result;
        }
        module.exports = getMatchData;
    }, {
        "./_isStrictComparable": 89,
        "./keys": 142
    } ],
    89: [ function(require, module, exports) {
        var isObject = require("./isObject");
        function isStrictComparable(value) {
            return value === value && !isObject(value);
        }
        module.exports = isStrictComparable;
    }, {
        "./isObject": 138
    } ],
    43: [ function(require, module, exports) {
        var Stack = require("./_Stack"), baseIsEqual = require("./_baseIsEqual");
        var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
        function baseIsMatch(object, source, matchData, customizer) {
            var index = matchData.length, length = index, noCustomizer = !customizer;
            if (object == null) {
                return !length;
            }
            object = Object(object);
            while (index--) {
                var data = matchData[index];
                if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
                    return false;
                }
            }
            while (++index < length) {
                data = matchData[index];
                var key = data[0], objValue = object[key], srcValue = data[1];
                if (noCustomizer && data[2]) {
                    if (objValue === undefined && !(key in object)) {
                        return false;
                    }
                } else {
                    var stack = new Stack();
                    if (customizer) {
                        var result = customizer(objValue, srcValue, key, object, source, stack);
                    }
                    if (!(result === undefined ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result)) {
                        return false;
                    }
                }
            }
            return true;
        }
        module.exports = baseIsMatch;
    }, {
        "./_Stack": 16,
        "./_baseIsEqual": 41
    } ],
    41: [ function(require, module, exports) {
        var baseIsEqualDeep = require("./_baseIsEqualDeep"), isObjectLike = require("./isObjectLike");
        function baseIsEqual(value, other, bitmask, customizer, stack) {
            if (value === other) {
                return true;
            }
            if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
                return value !== value && other !== other;
            }
            return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
        }
        module.exports = baseIsEqual;
    }, {
        "./_baseIsEqualDeep": 42,
        "./isObjectLike": 139
    } ],
    42: [ function(require, module, exports) {
        var Stack = require("./_Stack"), equalArrays = require("./_equalArrays"), equalByTag = require("./_equalByTag"), equalObjects = require("./_equalObjects"), getTag = require("./_getTag"), isArray = require("./isArray"), isBuffer = require("./isBuffer"), isTypedArray = require("./isTypedArray");
        var COMPARE_PARTIAL_FLAG = 1;
        var argsTag = "[object Arguments]", arrayTag = "[object Array]", objectTag = "[object Object]";
        var objectProto = Object.prototype;
        var hasOwnProperty = objectProto.hasOwnProperty;
        function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
            var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
            objTag = objTag == argsTag ? objectTag : objTag;
            othTag = othTag == argsTag ? objectTag : othTag;
            var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
            if (isSameTag && isBuffer(object)) {
                if (!isBuffer(other)) {
                    return false;
                }
                objIsArr = true;
                objIsObj = false;
            }
            if (isSameTag && !objIsObj) {
                stack || (stack = new Stack());
                return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
            }
            if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
                var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
                if (objIsWrapped || othIsWrapped) {
                    var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
                    stack || (stack = new Stack());
                    return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
                }
            }
            if (!isSameTag) {
                return false;
            }
            stack || (stack = new Stack());
            return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
        }
        module.exports = baseIsEqualDeep;
    }, {
        "./_Stack": 16,
        "./_equalArrays": 65,
        "./_equalByTag": 66,
        "./_equalObjects": 67,
        "./_getTag": 75,
        "./isArray": 132,
        "./isBuffer": 134,
        "./isTypedArray": 141
    } ],
    75: [ function(require, module, exports) {
        var DataView = require("./_DataView"), Map = require("./_Map"), Promise = require("./_Promise"), Set = require("./_Set"), WeakMap = require("./_WeakMap"), baseGetTag = require("./_baseGetTag"), toSource = require("./_toSource");
        var mapTag = "[object Map]", objectTag = "[object Object]", promiseTag = "[object Promise]", setTag = "[object Set]", weakMapTag = "[object WeakMap]";
        var dataViewTag = "[object DataView]";
        var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map), promiseCtorString = toSource(Promise), setCtorString = toSource(Set), weakMapCtorString = toSource(WeakMap);
        var getTag = baseGetTag;
        if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map && getTag(new Map()) != mapTag || Promise && getTag(Promise.resolve()) != promiseTag || Set && getTag(new Set()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
            getTag = function(value) {
                var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : undefined, ctorString = Ctor ? toSource(Ctor) : "";
                if (ctorString) {
                    switch (ctorString) {
                      case dataViewCtorString:
                        return dataViewTag;

                      case mapCtorString:
                        return mapTag;

                      case promiseCtorString:
                        return promiseTag;

                      case setCtorString:
                        return setTag;

                      case weakMapCtorString:
                        return weakMapTag;
                    }
                }
                return result;
            };
        }
        module.exports = getTag;
    }, {
        "./_DataView": 8,
        "./_Map": 11,
        "./_Promise": 13,
        "./_Set": 14,
        "./_WeakMap": 19,
        "./_baseGetTag": 38,
        "./_toSource": 122
    } ],
    67: [ function(require, module, exports) {
        var getAllKeys = require("./_getAllKeys");
        var COMPARE_PARTIAL_FLAG = 1;
        var objectProto = Object.prototype;
        var hasOwnProperty = objectProto.hasOwnProperty;
        function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
            var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
            if (objLength != othLength && !isPartial) {
                return false;
            }
            var index = objLength;
            while (index--) {
                var key = objProps[index];
                if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
                    return false;
                }
            }
            var stacked = stack.get(object);
            if (stacked && stack.get(other)) {
                return stacked == other;
            }
            var result = true;
            stack.set(object, other);
            stack.set(other, object);
            var skipCtor = isPartial;
            while (++index < objLength) {
                key = objProps[index];
                var objValue = object[key], othValue = other[key];
                if (customizer) {
                    var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
                }
                if (!(compared === undefined ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
                    result = false;
                    break;
                }
                skipCtor || (skipCtor = key == "constructor");
            }
            if (result && !skipCtor) {
                var objCtor = object.constructor, othCtor = other.constructor;
                if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
                    result = false;
                }
            }
            stack["delete"](object);
            stack["delete"](other);
            return result;
        }
        module.exports = equalObjects;
    }, {
        "./_getAllKeys": 69
    } ],
    69: [ function(require, module, exports) {
        var baseGetAllKeys = require("./_baseGetAllKeys"), getSymbols = require("./_getSymbols"), keys = require("./keys");
        function getAllKeys(object) {
            return baseGetAllKeys(object, keys, getSymbols);
        }
        module.exports = getAllKeys;
    }, {
        "./_baseGetAllKeys": 37,
        "./_getSymbols": 74,
        "./keys": 142
    } ],
    74: [ function(require, module, exports) {
        var arrayFilter = require("./_arrayFilter"), stubArray = require("./stubArray");
        var objectProto = Object.prototype;
        var propertyIsEnumerable = objectProto.propertyIsEnumerable;
        var nativeGetSymbols = Object.getOwnPropertySymbols;
        var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
            if (object == null) {
                return [];
            }
            object = Object(object);
            return arrayFilter(nativeGetSymbols(object), function(symbol) {
                return propertyIsEnumerable.call(object, symbol);
            });
        };
        module.exports = getSymbols;
    }, {
        "./_arrayFilter": 22,
        "./stubArray": 145
    } ],
    145: [ function(require, module, exports) {
        function stubArray() {
            return [];
        }
        module.exports = stubArray;
    }, {} ],
    66: [ function(require, module, exports) {
        var Symbol = require("./_Symbol"), Uint8Array = require("./_Uint8Array"), eq = require("./eq"), equalArrays = require("./_equalArrays"), mapToArray = require("./_mapToArray"), setToArray = require("./_setToArray");
        var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
        var boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", mapTag = "[object Map]", numberTag = "[object Number]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]";
        var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]";
        var symbolProto = Symbol ? Symbol.prototype : undefined, symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;
        function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
            switch (tag) {
              case dataViewTag:
                if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
                    return false;
                }
                object = object.buffer;
                other = other.buffer;

              case arrayBufferTag:
                if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
                    return false;
                }
                return true;

              case boolTag:
              case dateTag:
              case numberTag:
                return eq(+object, +other);

              case errorTag:
                return object.name == other.name && object.message == other.message;

              case regexpTag:
              case stringTag:
                return object == other + "";

              case mapTag:
                var convert = mapToArray;

              case setTag:
                var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
                convert || (convert = setToArray);
                if (object.size != other.size && !isPartial) {
                    return false;
                }
                var stacked = stack.get(object);
                if (stacked) {
                    return stacked == other;
                }
                bitmask |= COMPARE_UNORDERED_FLAG;
                stack.set(object, other);
                var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
                stack["delete"](object);
                return result;

              case symbolTag:
                if (symbolValueOf) {
                    return symbolValueOf.call(object) == symbolValueOf.call(other);
                }
            }
            return false;
        }
        module.exports = equalByTag;
    }, {
        "./_Symbol": 17,
        "./_Uint8Array": 18,
        "./_equalArrays": 65,
        "./_mapToArray": 100,
        "./_setToArray": 112,
        "./eq": 126
    } ],
    112: [ function(require, module, exports) {
        function setToArray(set) {
            var index = -1, result = Array(set.size);
            set.forEach(function(value) {
                result[++index] = value;
            });
            return result;
        }
        module.exports = setToArray;
    }, {} ],
    100: [ function(require, module, exports) {
        function mapToArray(map) {
            var index = -1, result = Array(map.size);
            map.forEach(function(value, key) {
                result[++index] = [ key, value ];
            });
            return result;
        }
        module.exports = mapToArray;
    }, {} ],
    65: [ function(require, module, exports) {
        var SetCache = require("./_SetCache"), arraySome = require("./_arraySome"), cacheHas = require("./_cacheHas");
        var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
        function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
            var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
            if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
                return false;
            }
            var stacked = stack.get(array);
            if (stacked && stack.get(other)) {
                return stacked == other;
            }
            var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : undefined;
            stack.set(array, other);
            stack.set(other, array);
            while (++index < arrLength) {
                var arrValue = array[index], othValue = other[index];
                if (customizer) {
                    var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
                }
                if (compared !== undefined) {
                    if (compared) {
                        continue;
                    }
                    result = false;
                    break;
                }
                if (seen) {
                    if (!arraySome(other, function(othValue, othIndex) {
                        if (!cacheHas(seen, othIndex) && (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                            return seen.push(othIndex);
                        }
                    })) {
                        result = false;
                        break;
                    }
                } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                    result = false;
                    break;
                }
            }
            stack["delete"](array);
            stack["delete"](other);
            return result;
        }
        module.exports = equalArrays;
    }, {
        "./_SetCache": 15,
        "./_arraySome": 26,
        "./_cacheHas": 57
    } ],
    57: [ function(require, module, exports) {
        function cacheHas(cache, key) {
            return cache.has(key);
        }
        module.exports = cacheHas;
    }, {} ],
    39: [ function(require, module, exports) {
        function baseHasIn(object, key) {
            return object != null && key in Object(object);
        }
        module.exports = baseHasIn;
    }, {} ],
    37: [ function(require, module, exports) {
        var arrayPush = require("./_arrayPush"), isArray = require("./isArray");
        function baseGetAllKeys(object, keysFunc, symbolsFunc) {
            var result = keysFunc(object);
            return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
        }
        module.exports = baseGetAllKeys;
    }, {
        "./_arrayPush": 25,
        "./isArray": 132
    } ],
    36: [ function(require, module, exports) {
        var castPath = require("./_castPath"), toKey = require("./_toKey");
        function baseGet(object, path) {
            path = castPath(path, object);
            var index = 0, length = path.length;
            while (object != null && index < length) {
                object = object[toKey(path[index++])];
            }
            return index && index == length ? object : undefined;
        }
        module.exports = baseGet;
    }, {
        "./_castPath": 58,
        "./_toKey": 121
    } ],
    121: [ function(require, module, exports) {
        var isSymbol = require("./isSymbol");
        var INFINITY = 1 / 0;
        function toKey(value) {
            if (typeof value == "string" || isSymbol(value)) {
                return value;
            }
            var result = value + "";
            return result == "0" && 1 / value == -INFINITY ? "-0" : result;
        }
        module.exports = toKey;
    }, {
        "./isSymbol": 140
    } ],
    58: [ function(require, module, exports) {
        var isArray = require("./isArray"), isKey = require("./_isKey"), stringToPath = require("./_stringToPath"), toString = require("./toString");
        function castPath(value, object) {
            if (isArray(value)) {
                return value;
            }
            return isKey(value, object) ? [ value ] : stringToPath(toString(value));
        }
        module.exports = castPath;
    }, {
        "./_isKey": 85,
        "./_stringToPath": 120,
        "./isArray": 132,
        "./toString": 147
    } ],
    147: [ function(require, module, exports) {
        var baseToString = require("./_baseToString");
        function toString(value) {
            return value == null ? "" : baseToString(value);
        }
        module.exports = toString;
    }, {
        "./_baseToString": 55
    } ],
    55: [ function(require, module, exports) {
        var Symbol = require("./_Symbol"), arrayMap = require("./_arrayMap"), isArray = require("./isArray"), isSymbol = require("./isSymbol");
        var INFINITY = 1 / 0;
        var symbolProto = Symbol ? Symbol.prototype : undefined, symbolToString = symbolProto ? symbolProto.toString : undefined;
        function baseToString(value) {
            if (typeof value == "string") {
                return value;
            }
            if (isArray(value)) {
                return arrayMap(value, baseToString) + "";
            }
            if (isSymbol(value)) {
                return symbolToString ? symbolToString.call(value) : "";
            }
            var result = value + "";
            return result == "0" && 1 / value == -INFINITY ? "-0" : result;
        }
        module.exports = baseToString;
    }, {
        "./_Symbol": 17,
        "./_arrayMap": 24,
        "./isArray": 132,
        "./isSymbol": 140
    } ],
    120: [ function(require, module, exports) {
        var memoizeCapped = require("./_memoizeCapped");
        var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
        var reEscapeChar = /\\(\\)?/g;
        var stringToPath = memoizeCapped(function(string) {
            var result = [];
            if (string.charCodeAt(0) === 46) {
                result.push("");
            }
            string.replace(rePropName, function(match, number, quote, subString) {
                result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
            });
            return result;
        });
        module.exports = stringToPath;
    }, {
        "./_memoizeCapped": 102
    } ],
    102: [ function(require, module, exports) {
        var memoize = require("./memoize");
        var MAX_MEMOIZE_SIZE = 500;
        function memoizeCapped(func) {
            var result = memoize(func, function(key) {
                if (cache.size === MAX_MEMOIZE_SIZE) {
                    cache.clear();
                }
                return key;
            });
            var cache = result.cache;
            return result;
        }
        module.exports = memoizeCapped;
    }, {
        "./memoize": 143
    } ],
    143: [ function(require, module, exports) {
        var MapCache = require("./_MapCache");
        var FUNC_ERROR_TEXT = "Expected a function";
        function memoize(func, resolver) {
            if (typeof func != "function" || resolver != null && typeof resolver != "function") {
                throw new TypeError(FUNC_ERROR_TEXT);
            }
            var memoized = function() {
                var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
                if (cache.has(key)) {
                    return cache.get(key);
                }
                var result = func.apply(this, args);
                memoized.cache = cache.set(key, result) || cache;
                return result;
            };
            memoized.cache = new (memoize.Cache || MapCache)();
            return memoized;
        }
        memoize.Cache = MapCache;
        module.exports = memoize;
    }, {
        "./_MapCache": 12
    } ],
    85: [ function(require, module, exports) {
        var isArray = require("./isArray"), isSymbol = require("./isSymbol");
        var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp = /^\w*$/;
        function isKey(value, object) {
            if (isArray(value)) {
                return false;
            }
            var type = typeof value;
            if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) {
                return true;
            }
            return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
        }
        module.exports = isKey;
    }, {
        "./isArray": 132,
        "./isSymbol": 140
    } ],
    140: [ function(require, module, exports) {
        var baseGetTag = require("./_baseGetTag"), isObjectLike = require("./isObjectLike");
        var symbolTag = "[object Symbol]";
        function isSymbol(value) {
            return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
        }
        module.exports = isSymbol;
    }, {
        "./_baseGetTag": 38,
        "./isObjectLike": 139
    } ],
    33: [ function(require, module, exports) {
        var baseEach = require("./_baseEach");
        function baseEvery(collection, predicate) {
            var result = true;
            baseEach(collection, function(value, index, collection) {
                result = !!predicate(value, index, collection);
                return result;
            });
            return result;
        }
        module.exports = baseEvery;
    }, {
        "./_baseEach": 32
    } ],
    32: [ function(require, module, exports) {
        var baseForOwn = require("./_baseForOwn"), createBaseEach = require("./_createBaseEach");
        var baseEach = createBaseEach(baseForOwn);
        module.exports = baseEach;
    }, {
        "./_baseForOwn": 35,
        "./_createBaseEach": 62
    } ],
    62: [ function(require, module, exports) {
        var isArrayLike = require("./isArrayLike");
        function createBaseEach(eachFunc, fromRight) {
            return function(collection, iteratee) {
                if (collection == null) {
                    return collection;
                }
                if (!isArrayLike(collection)) {
                    return eachFunc(collection, iteratee);
                }
                var length = collection.length, index = fromRight ? length : -1, iterable = Object(collection);
                while (fromRight ? index-- : ++index < length) {
                    if (iteratee(iterable[index], index, iterable) === false) {
                        break;
                    }
                }
                return collection;
            };
        }
        module.exports = createBaseEach;
    }, {
        "./isArrayLike": 133
    } ],
    35: [ function(require, module, exports) {
        var baseFor = require("./_baseFor"), keys = require("./keys");
        function baseForOwn(object, iteratee) {
            return object && baseFor(object, iteratee, keys);
        }
        module.exports = baseForOwn;
    }, {
        "./_baseFor": 34,
        "./keys": 142
    } ],
    34: [ function(require, module, exports) {
        var createBaseFor = require("./_createBaseFor");
        var baseFor = createBaseFor();
        module.exports = baseFor;
    }, {
        "./_createBaseFor": 63
    } ],
    63: [ function(require, module, exports) {
        function createBaseFor(fromRight) {
            return function(object, iteratee, keysFunc) {
                var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
                while (length--) {
                    var key = props[fromRight ? length : ++index];
                    if (iteratee(iterable[key], key, iterable) === false) {
                        break;
                    }
                }
                return object;
            };
        }
        module.exports = createBaseFor;
    }, {} ],
    31: [ function(require, module, exports) {
        var isObject = require("./isObject");
        var objectCreate = Object.create;
        var baseCreate = function() {
            function object() {}
            return function(proto) {
                if (!isObject(proto)) {
                    return {};
                }
                if (objectCreate) {
                    return objectCreate(proto);
                }
                object.prototype = proto;
                var result = new object();
                object.prototype = undefined;
                return result;
            };
        }();
        module.exports = baseCreate;
    }, {
        "./isObject": 138
    } ],
    29: [ function(require, module, exports) {
        var copyObject = require("./_copyObject"), keys = require("./keys");
        function baseAssign(object, source) {
            return object && copyObject(source, keys(source), object);
        }
        module.exports = baseAssign;
    }, {
        "./_copyObject": 59,
        "./keys": 142
    } ],
    142: [ function(require, module, exports) {
        var arrayLikeKeys = require("./_arrayLikeKeys"), baseKeys = require("./_baseKeys"), isArrayLike = require("./isArrayLike");
        function keys(object) {
            return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
        }
        module.exports = keys;
    }, {
        "./_arrayLikeKeys": 23,
        "./_baseKeys": 47,
        "./isArrayLike": 133
    } ],
    133: [ function(require, module, exports) {
        var isFunction = require("./isFunction"), isLength = require("./isLength");
        function isArrayLike(value) {
            return value != null && isLength(value.length) && !isFunction(value);
        }
        module.exports = isArrayLike;
    }, {
        "./isFunction": 136,
        "./isLength": 137
    } ],
    47: [ function(require, module, exports) {
        var isPrototype = require("./_isPrototype"), nativeKeys = require("./_nativeKeys");
        var objectProto = Object.prototype;
        var hasOwnProperty = objectProto.hasOwnProperty;
        function baseKeys(object) {
            if (!isPrototype(object)) {
                return nativeKeys(object);
            }
            var result = [];
            for (var key in Object(object)) {
                if (hasOwnProperty.call(object, key) && key != "constructor") {
                    result.push(key);
                }
            }
            return result;
        }
        module.exports = baseKeys;
    }, {
        "./_isPrototype": 88,
        "./_nativeKeys": 104
    } ],
    104: [ function(require, module, exports) {
        var overArg = require("./_overArg");
        var nativeKeys = overArg(Object.keys, Object);
        module.exports = nativeKeys;
    }, {
        "./_overArg": 107
    } ],
    107: [ function(require, module, exports) {
        function overArg(func, transform) {
            return function(arg) {
                return func(transform(arg));
            };
        }
        module.exports = overArg;
    }, {} ],
    88: [ function(require, module, exports) {
        var objectProto = Object.prototype;
        function isPrototype(value) {
            var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
            return value === proto;
        }
        module.exports = isPrototype;
    }, {} ],
    59: [ function(require, module, exports) {
        var assignValue = require("./_assignValue"), baseAssignValue = require("./_baseAssignValue");
        function copyObject(source, props, object, customizer) {
            var isNew = !object;
            object || (object = {});
            var index = -1, length = props.length;
            while (++index < length) {
                var key = props[index];
                var newValue = customizer ? customizer(object[key], source[key], key, object, source) : undefined;
                if (newValue === undefined) {
                    newValue = source[key];
                }
                if (isNew) {
                    baseAssignValue(object, key, newValue);
                } else {
                    assignValue(object, key, newValue);
                }
            }
            return object;
        }
        module.exports = copyObject;
    }, {
        "./_assignValue": 27,
        "./_baseAssignValue": 30
    } ],
    27: [ function(require, module, exports) {
        var baseAssignValue = require("./_baseAssignValue"), eq = require("./eq");
        var objectProto = Object.prototype;
        var hasOwnProperty = objectProto.hasOwnProperty;
        function assignValue(object, key, value) {
            var objValue = object[key];
            if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === undefined && !(key in object)) {
                baseAssignValue(object, key, value);
            }
        }
        module.exports = assignValue;
    }, {
        "./_baseAssignValue": 30,
        "./eq": 126
    } ],
    30: [ function(require, module, exports) {
        var defineProperty = require("./_defineProperty");
        function baseAssignValue(object, key, value) {
            if (key == "__proto__" && defineProperty) {
                defineProperty(object, key, {
                    configurable: true,
                    enumerable: true,
                    value: value,
                    writable: true
                });
            } else {
                object[key] = value;
            }
        }
        module.exports = baseAssignValue;
    }, {
        "./_defineProperty": 64
    } ],
    64: [ function(require, module, exports) {
        var getNative = require("./_getNative");
        var defineProperty = function() {
            try {
                var func = getNative(Object, "defineProperty");
                func({}, "", {});
                return func;
            } catch (e) {}
        }();
        module.exports = defineProperty;
    }, {
        "./_getNative": 72
    } ],
    26: [ function(require, module, exports) {
        function arraySome(array, predicate) {
            var index = -1, length = array == null ? 0 : array.length;
            while (++index < length) {
                if (predicate(array[index], index, array)) {
                    return true;
                }
            }
            return false;
        }
        module.exports = arraySome;
    }, {} ],
    25: [ function(require, module, exports) {
        function arrayPush(array, values) {
            var index = -1, length = values.length, offset = array.length;
            while (++index < length) {
                array[offset + index] = values[index];
            }
            return array;
        }
        module.exports = arrayPush;
    }, {} ],
    24: [ function(require, module, exports) {
        function arrayMap(array, iteratee) {
            var index = -1, length = array == null ? 0 : array.length, result = Array(length);
            while (++index < length) {
                result[index] = iteratee(array[index], index, array);
            }
            return result;
        }
        module.exports = arrayMap;
    }, {} ],
    23: [ function(require, module, exports) {
        var baseTimes = require("./_baseTimes"), isArguments = require("./isArguments"), isArray = require("./isArray"), isBuffer = require("./isBuffer"), isIndex = require("./_isIndex"), isTypedArray = require("./isTypedArray");
        var objectProto = Object.prototype;
        var hasOwnProperty = objectProto.hasOwnProperty;
        function arrayLikeKeys(value, inherited) {
            var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
            for (var key in value) {
                if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isBuff && (key == "offset" || key == "parent") || isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || isIndex(key, length)))) {
                    result.push(key);
                }
            }
            return result;
        }
        module.exports = arrayLikeKeys;
    }, {
        "./_baseTimes": 54,
        "./_isIndex": 83,
        "./isArguments": 131,
        "./isArray": 132,
        "./isBuffer": 134,
        "./isTypedArray": 141
    } ],
    141: [ function(require, module, exports) {
        var baseIsTypedArray = require("./_baseIsTypedArray"), baseUnary = require("./_baseUnary"), nodeUtil = require("./_nodeUtil");
        var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
        var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
        module.exports = isTypedArray;
    }, {
        "./_baseIsTypedArray": 45,
        "./_baseUnary": 56,
        "./_nodeUtil": 105
    } ],
    105: [ function(require, module, exports) {
        var freeGlobal = require("./_freeGlobal");
        var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
        var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
        var moduleExports = freeModule && freeModule.exports === freeExports;
        var freeProcess = moduleExports && freeGlobal.process;
        var nodeUtil = function() {
            try {
                return freeProcess && freeProcess.binding && freeProcess.binding("util");
            } catch (e) {}
        }();
        module.exports = nodeUtil;
    }, {
        "./_freeGlobal": 68
    } ],
    56: [ function(require, module, exports) {
        function baseUnary(func) {
            return function(value) {
                return func(value);
            };
        }
        module.exports = baseUnary;
    }, {} ],
    45: [ function(require, module, exports) {
        var baseGetTag = require("./_baseGetTag"), isLength = require("./isLength"), isObjectLike = require("./isObjectLike");
        var argsTag = "[object Arguments]", arrayTag = "[object Array]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", mapTag = "[object Map]", numberTag = "[object Number]", objectTag = "[object Object]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", weakMapTag = "[object WeakMap]";
        var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
        var typedArrayTags = {};
        typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
        typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
        function baseIsTypedArray(value) {
            return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
        }
        module.exports = baseIsTypedArray;
    }, {
        "./_baseGetTag": 38,
        "./isLength": 137,
        "./isObjectLike": 139
    } ],
    137: [ function(require, module, exports) {
        var MAX_SAFE_INTEGER = 9007199254740991;
        function isLength(value) {
            return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
        }
        module.exports = isLength;
    }, {} ],
    134: [ function(require, module, exports) {
        var root = require("./_root"), stubFalse = require("./stubFalse");
        var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
        var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
        var moduleExports = freeModule && freeModule.exports === freeExports;
        var Buffer = moduleExports ? root.Buffer : undefined;
        var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;
        var isBuffer = nativeIsBuffer || stubFalse;
        module.exports = isBuffer;
    }, {
        "./_root": 109,
        "./stubFalse": 146
    } ],
    146: [ function(require, module, exports) {
        function stubFalse() {
            return false;
        }
        module.exports = stubFalse;
    }, {} ],
    132: [ function(require, module, exports) {
        var isArray = Array.isArray;
        module.exports = isArray;
    }, {} ],
    131: [ function(require, module, exports) {
        var baseIsArguments = require("./_baseIsArguments"), isObjectLike = require("./isObjectLike");
        var objectProto = Object.prototype;
        var hasOwnProperty = objectProto.hasOwnProperty;
        var propertyIsEnumerable = objectProto.propertyIsEnumerable;
        var isArguments = baseIsArguments(function() {
            return arguments;
        }()) ? baseIsArguments : function(value) {
            return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
        };
        module.exports = isArguments;
    }, {
        "./_baseIsArguments": 40,
        "./isObjectLike": 139
    } ],
    40: [ function(require, module, exports) {
        var baseGetTag = require("./_baseGetTag"), isObjectLike = require("./isObjectLike");
        var argsTag = "[object Arguments]";
        function baseIsArguments(value) {
            return isObjectLike(value) && baseGetTag(value) == argsTag;
        }
        module.exports = baseIsArguments;
    }, {
        "./_baseGetTag": 38,
        "./isObjectLike": 139
    } ],
    139: [ function(require, module, exports) {
        function isObjectLike(value) {
            return value != null && typeof value == "object";
        }
        module.exports = isObjectLike;
    }, {} ],
    83: [ function(require, module, exports) {
        var MAX_SAFE_INTEGER = 9007199254740991;
        var reIsUint = /^(?:0|[1-9]\d*)$/;
        function isIndex(value, length) {
            var type = typeof value;
            length = length == null ? MAX_SAFE_INTEGER : length;
            return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
        }
        module.exports = isIndex;
    }, {} ],
    54: [ function(require, module, exports) {
        function baseTimes(n, iteratee) {
            var index = -1, result = Array(n);
            while (++index < n) {
                result[index] = iteratee(index);
            }
            return result;
        }
        module.exports = baseTimes;
    }, {} ],
    22: [ function(require, module, exports) {
        function arrayFilter(array, predicate) {
            var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
            while (++index < length) {
                var value = array[index];
                if (predicate(value, index, array)) {
                    result[resIndex++] = value;
                }
            }
            return result;
        }
        module.exports = arrayFilter;
    }, {} ],
    21: [ function(require, module, exports) {
        function arrayEvery(array, predicate) {
            var index = -1, length = array == null ? 0 : array.length;
            while (++index < length) {
                if (!predicate(array[index], index, array)) {
                    return false;
                }
            }
            return true;
        }
        module.exports = arrayEvery;
    }, {} ],
    20: [ function(require, module, exports) {
        function apply(func, thisArg, args) {
            switch (args.length) {
              case 0:
                return func.call(thisArg);

              case 1:
                return func.call(thisArg, args[0]);

              case 2:
                return func.call(thisArg, args[0], args[1]);

              case 3:
                return func.call(thisArg, args[0], args[1], args[2]);
            }
            return func.apply(thisArg, args);
        }
        module.exports = apply;
    }, {} ],
    19: [ function(require, module, exports) {
        var getNative = require("./_getNative"), root = require("./_root");
        var WeakMap = getNative(root, "WeakMap");
        module.exports = WeakMap;
    }, {
        "./_getNative": 72,
        "./_root": 109
    } ],
    18: [ function(require, module, exports) {
        var root = require("./_root");
        var Uint8Array = root.Uint8Array;
        module.exports = Uint8Array;
    }, {
        "./_root": 109
    } ],
    16: [ function(require, module, exports) {
        var ListCache = require("./_ListCache"), stackClear = require("./_stackClear"), stackDelete = require("./_stackDelete"), stackGet = require("./_stackGet"), stackHas = require("./_stackHas"), stackSet = require("./_stackSet");
        function Stack(entries) {
            var data = this.__data__ = new ListCache(entries);
            this.size = data.size;
        }
        Stack.prototype.clear = stackClear;
        Stack.prototype["delete"] = stackDelete;
        Stack.prototype.get = stackGet;
        Stack.prototype.has = stackHas;
        Stack.prototype.set = stackSet;
        module.exports = Stack;
    }, {
        "./_ListCache": 10,
        "./_stackClear": 115,
        "./_stackDelete": 116,
        "./_stackGet": 117,
        "./_stackHas": 118,
        "./_stackSet": 119
    } ],
    119: [ function(require, module, exports) {
        var ListCache = require("./_ListCache"), Map = require("./_Map"), MapCache = require("./_MapCache");
        var LARGE_ARRAY_SIZE = 200;
        function stackSet(key, value) {
            var data = this.__data__;
            if (data instanceof ListCache) {
                var pairs = data.__data__;
                if (!Map || pairs.length < LARGE_ARRAY_SIZE - 1) {
                    pairs.push([ key, value ]);
                    this.size = ++data.size;
                    return this;
                }
                data = this.__data__ = new MapCache(pairs);
            }
            data.set(key, value);
            this.size = data.size;
            return this;
        }
        module.exports = stackSet;
    }, {
        "./_ListCache": 10,
        "./_Map": 11,
        "./_MapCache": 12
    } ],
    118: [ function(require, module, exports) {
        function stackHas(key) {
            return this.__data__.has(key);
        }
        module.exports = stackHas;
    }, {} ],
    117: [ function(require, module, exports) {
        function stackGet(key) {
            return this.__data__.get(key);
        }
        module.exports = stackGet;
    }, {} ],
    116: [ function(require, module, exports) {
        function stackDelete(key) {
            var data = this.__data__, result = data["delete"](key);
            this.size = data.size;
            return result;
        }
        module.exports = stackDelete;
    }, {} ],
    115: [ function(require, module, exports) {
        var ListCache = require("./_ListCache");
        function stackClear() {
            this.__data__ = new ListCache();
            this.size = 0;
        }
        module.exports = stackClear;
    }, {
        "./_ListCache": 10
    } ],
    15: [ function(require, module, exports) {
        var MapCache = require("./_MapCache"), setCacheAdd = require("./_setCacheAdd"), setCacheHas = require("./_setCacheHas");
        function SetCache(values) {
            var index = -1, length = values == null ? 0 : values.length;
            this.__data__ = new MapCache();
            while (++index < length) {
                this.add(values[index]);
            }
        }
        SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
        SetCache.prototype.has = setCacheHas;
        module.exports = SetCache;
    }, {
        "./_MapCache": 12,
        "./_setCacheAdd": 110,
        "./_setCacheHas": 111
    } ],
    111: [ function(require, module, exports) {
        function setCacheHas(value) {
            return this.__data__.has(value);
        }
        module.exports = setCacheHas;
    }, {} ],
    110: [ function(require, module, exports) {
        var HASH_UNDEFINED = "__lodash_hash_undefined__";
        function setCacheAdd(value) {
            this.__data__.set(value, HASH_UNDEFINED);
            return this;
        }
        module.exports = setCacheAdd;
    }, {} ],
    14: [ function(require, module, exports) {
        var getNative = require("./_getNative"), root = require("./_root");
        var Set = getNative(root, "Set");
        module.exports = Set;
    }, {
        "./_getNative": 72,
        "./_root": 109
    } ],
    13: [ function(require, module, exports) {
        var getNative = require("./_getNative"), root = require("./_root");
        var Promise = getNative(root, "Promise");
        module.exports = Promise;
    }, {
        "./_getNative": 72,
        "./_root": 109
    } ],
    12: [ function(require, module, exports) {
        var mapCacheClear = require("./_mapCacheClear"), mapCacheDelete = require("./_mapCacheDelete"), mapCacheGet = require("./_mapCacheGet"), mapCacheHas = require("./_mapCacheHas"), mapCacheSet = require("./_mapCacheSet");
        function MapCache(entries) {
            var index = -1, length = entries == null ? 0 : entries.length;
            this.clear();
            while (++index < length) {
                var entry = entries[index];
                this.set(entry[0], entry[1]);
            }
        }
        MapCache.prototype.clear = mapCacheClear;
        MapCache.prototype["delete"] = mapCacheDelete;
        MapCache.prototype.get = mapCacheGet;
        MapCache.prototype.has = mapCacheHas;
        MapCache.prototype.set = mapCacheSet;
        module.exports = MapCache;
    }, {
        "./_mapCacheClear": 95,
        "./_mapCacheDelete": 96,
        "./_mapCacheGet": 97,
        "./_mapCacheHas": 98,
        "./_mapCacheSet": 99
    } ],
    99: [ function(require, module, exports) {
        var getMapData = require("./_getMapData");
        function mapCacheSet(key, value) {
            var data = getMapData(this, key), size = data.size;
            data.set(key, value);
            this.size += data.size == size ? 0 : 1;
            return this;
        }
        module.exports = mapCacheSet;
    }, {
        "./_getMapData": 70
    } ],
    98: [ function(require, module, exports) {
        var getMapData = require("./_getMapData");
        function mapCacheHas(key) {
            return getMapData(this, key).has(key);
        }
        module.exports = mapCacheHas;
    }, {
        "./_getMapData": 70
    } ],
    97: [ function(require, module, exports) {
        var getMapData = require("./_getMapData");
        function mapCacheGet(key) {
            return getMapData(this, key).get(key);
        }
        module.exports = mapCacheGet;
    }, {
        "./_getMapData": 70
    } ],
    96: [ function(require, module, exports) {
        var getMapData = require("./_getMapData");
        function mapCacheDelete(key) {
            var result = getMapData(this, key)["delete"](key);
            this.size -= result ? 1 : 0;
            return result;
        }
        module.exports = mapCacheDelete;
    }, {
        "./_getMapData": 70
    } ],
    70: [ function(require, module, exports) {
        var isKeyable = require("./_isKeyable");
        function getMapData(map, key) {
            var data = map.__data__;
            return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
        }
        module.exports = getMapData;
    }, {
        "./_isKeyable": 86
    } ],
    86: [ function(require, module, exports) {
        function isKeyable(value) {
            var type = typeof value;
            return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
        }
        module.exports = isKeyable;
    }, {} ],
    95: [ function(require, module, exports) {
        var Hash = require("./_Hash"), ListCache = require("./_ListCache"), Map = require("./_Map");
        function mapCacheClear() {
            this.size = 0;
            this.__data__ = {
                hash: new Hash(),
                map: new (Map || ListCache)(),
                string: new Hash()
            };
        }
        module.exports = mapCacheClear;
    }, {
        "./_Hash": 9,
        "./_ListCache": 10,
        "./_Map": 11
    } ],
    11: [ function(require, module, exports) {
        var getNative = require("./_getNative"), root = require("./_root");
        var Map = getNative(root, "Map");
        module.exports = Map;
    }, {
        "./_getNative": 72,
        "./_root": 109
    } ],
    10: [ function(require, module, exports) {
        var listCacheClear = require("./_listCacheClear"), listCacheDelete = require("./_listCacheDelete"), listCacheGet = require("./_listCacheGet"), listCacheHas = require("./_listCacheHas"), listCacheSet = require("./_listCacheSet");
        function ListCache(entries) {
            var index = -1, length = entries == null ? 0 : entries.length;
            this.clear();
            while (++index < length) {
                var entry = entries[index];
                this.set(entry[0], entry[1]);
            }
        }
        ListCache.prototype.clear = listCacheClear;
        ListCache.prototype["delete"] = listCacheDelete;
        ListCache.prototype.get = listCacheGet;
        ListCache.prototype.has = listCacheHas;
        ListCache.prototype.set = listCacheSet;
        module.exports = ListCache;
    }, {
        "./_listCacheClear": 90,
        "./_listCacheDelete": 91,
        "./_listCacheGet": 92,
        "./_listCacheHas": 93,
        "./_listCacheSet": 94
    } ],
    94: [ function(require, module, exports) {
        var assocIndexOf = require("./_assocIndexOf");
        function listCacheSet(key, value) {
            var data = this.__data__, index = assocIndexOf(data, key);
            if (index < 0) {
                ++this.size;
                data.push([ key, value ]);
            } else {
                data[index][1] = value;
            }
            return this;
        }
        module.exports = listCacheSet;
    }, {
        "./_assocIndexOf": 28
    } ],
    93: [ function(require, module, exports) {
        var assocIndexOf = require("./_assocIndexOf");
        function listCacheHas(key) {
            return assocIndexOf(this.__data__, key) > -1;
        }
        module.exports = listCacheHas;
    }, {
        "./_assocIndexOf": 28
    } ],
    92: [ function(require, module, exports) {
        var assocIndexOf = require("./_assocIndexOf");
        function listCacheGet(key) {
            var data = this.__data__, index = assocIndexOf(data, key);
            return index < 0 ? undefined : data[index][1];
        }
        module.exports = listCacheGet;
    }, {
        "./_assocIndexOf": 28
    } ],
    91: [ function(require, module, exports) {
        var assocIndexOf = require("./_assocIndexOf");
        var arrayProto = Array.prototype;
        var splice = arrayProto.splice;
        function listCacheDelete(key) {
            var data = this.__data__, index = assocIndexOf(data, key);
            if (index < 0) {
                return false;
            }
            var lastIndex = data.length - 1;
            if (index == lastIndex) {
                data.pop();
            } else {
                splice.call(data, index, 1);
            }
            --this.size;
            return true;
        }
        module.exports = listCacheDelete;
    }, {
        "./_assocIndexOf": 28
    } ],
    28: [ function(require, module, exports) {
        var eq = require("./eq");
        function assocIndexOf(array, key) {
            var length = array.length;
            while (length--) {
                if (eq(array[length][0], key)) {
                    return length;
                }
            }
            return -1;
        }
        module.exports = assocIndexOf;
    }, {
        "./eq": 126
    } ],
    126: [ function(require, module, exports) {
        function eq(value, other) {
            return value === other || value !== value && other !== other;
        }
        module.exports = eq;
    }, {} ],
    90: [ function(require, module, exports) {
        function listCacheClear() {
            this.__data__ = [];
            this.size = 0;
        }
        module.exports = listCacheClear;
    }, {} ],
    9: [ function(require, module, exports) {
        var hashClear = require("./_hashClear"), hashDelete = require("./_hashDelete"), hashGet = require("./_hashGet"), hashHas = require("./_hashHas"), hashSet = require("./_hashSet");
        function Hash(entries) {
            var index = -1, length = entries == null ? 0 : entries.length;
            this.clear();
            while (++index < length) {
                var entry = entries[index];
                this.set(entry[0], entry[1]);
            }
        }
        Hash.prototype.clear = hashClear;
        Hash.prototype["delete"] = hashDelete;
        Hash.prototype.get = hashGet;
        Hash.prototype.has = hashHas;
        Hash.prototype.set = hashSet;
        module.exports = Hash;
    }, {
        "./_hashClear": 78,
        "./_hashDelete": 79,
        "./_hashGet": 80,
        "./_hashHas": 81,
        "./_hashSet": 82
    } ],
    82: [ function(require, module, exports) {
        var nativeCreate = require("./_nativeCreate");
        var HASH_UNDEFINED = "__lodash_hash_undefined__";
        function hashSet(key, value) {
            var data = this.__data__;
            this.size += this.has(key) ? 0 : 1;
            data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
            return this;
        }
        module.exports = hashSet;
    }, {
        "./_nativeCreate": 103
    } ],
    81: [ function(require, module, exports) {
        var nativeCreate = require("./_nativeCreate");
        var objectProto = Object.prototype;
        var hasOwnProperty = objectProto.hasOwnProperty;
        function hashHas(key) {
            var data = this.__data__;
            return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
        }
        module.exports = hashHas;
    }, {
        "./_nativeCreate": 103
    } ],
    80: [ function(require, module, exports) {
        var nativeCreate = require("./_nativeCreate");
        var HASH_UNDEFINED = "__lodash_hash_undefined__";
        var objectProto = Object.prototype;
        var hasOwnProperty = objectProto.hasOwnProperty;
        function hashGet(key) {
            var data = this.__data__;
            if (nativeCreate) {
                var result = data[key];
                return result === HASH_UNDEFINED ? undefined : result;
            }
            return hasOwnProperty.call(data, key) ? data[key] : undefined;
        }
        module.exports = hashGet;
    }, {
        "./_nativeCreate": 103
    } ],
    79: [ function(require, module, exports) {
        function hashDelete(key) {
            var result = this.has(key) && delete this.__data__[key];
            this.size -= result ? 1 : 0;
            return result;
        }
        module.exports = hashDelete;
    }, {} ],
    78: [ function(require, module, exports) {
        var nativeCreate = require("./_nativeCreate");
        function hashClear() {
            this.__data__ = nativeCreate ? nativeCreate(null) : {};
            this.size = 0;
        }
        module.exports = hashClear;
    }, {
        "./_nativeCreate": 103
    } ],
    103: [ function(require, module, exports) {
        var getNative = require("./_getNative");
        var nativeCreate = getNative(Object, "create");
        module.exports = nativeCreate;
    }, {
        "./_getNative": 72
    } ],
    8: [ function(require, module, exports) {
        var getNative = require("./_getNative"), root = require("./_root");
        var DataView = getNative(root, "DataView");
        module.exports = DataView;
    }, {
        "./_getNative": 72,
        "./_root": 109
    } ],
    72: [ function(require, module, exports) {
        var baseIsNative = require("./_baseIsNative"), getValue = require("./_getValue");
        function getNative(object, key) {
            var value = getValue(object, key);
            return baseIsNative(value) ? value : undefined;
        }
        module.exports = getNative;
    }, {
        "./_baseIsNative": 44,
        "./_getValue": 76
    } ],
    76: [ function(require, module, exports) {
        function getValue(object, key) {
            return object == null ? undefined : object[key];
        }
        module.exports = getValue;
    }, {} ],
    44: [ function(require, module, exports) {
        var isFunction = require("./isFunction"), isMasked = require("./_isMasked"), isObject = require("./isObject"), toSource = require("./_toSource");
        var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
        var reIsHostCtor = /^\[object .+?Constructor\]$/;
        var funcProto = Function.prototype, objectProto = Object.prototype;
        var funcToString = funcProto.toString;
        var hasOwnProperty = objectProto.hasOwnProperty;
        var reIsNative = RegExp("^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
        function baseIsNative(value) {
            if (!isObject(value) || isMasked(value)) {
                return false;
            }
            var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
            return pattern.test(toSource(value));
        }
        module.exports = baseIsNative;
    }, {
        "./_isMasked": 87,
        "./_toSource": 122,
        "./isFunction": 136,
        "./isObject": 138
    } ],
    136: [ function(require, module, exports) {
        var baseGetTag = require("./_baseGetTag"), isObject = require("./isObject");
        var asyncTag = "[object AsyncFunction]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
        function isFunction(value) {
            if (!isObject(value)) {
                return false;
            }
            var tag = baseGetTag(value);
            return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
        }
        module.exports = isFunction;
    }, {
        "./_baseGetTag": 38,
        "./isObject": 138
    } ],
    138: [ function(require, module, exports) {
        function isObject(value) {
            var type = typeof value;
            return value != null && (type == "object" || type == "function");
        }
        module.exports = isObject;
    }, {} ],
    38: [ function(require, module, exports) {
        var Symbol = require("./_Symbol"), getRawTag = require("./_getRawTag"), objectToString = require("./_objectToString");
        var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
        var symToStringTag = Symbol ? Symbol.toStringTag : undefined;
        function baseGetTag(value) {
            if (value == null) {
                return value === undefined ? undefinedTag : nullTag;
            }
            return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
        }
        module.exports = baseGetTag;
    }, {
        "./_Symbol": 17,
        "./_getRawTag": 73,
        "./_objectToString": 106
    } ],
    106: [ function(require, module, exports) {
        var objectProto = Object.prototype;
        var nativeObjectToString = objectProto.toString;
        function objectToString(value) {
            return nativeObjectToString.call(value);
        }
        module.exports = objectToString;
    }, {} ],
    73: [ function(require, module, exports) {
        var Symbol = require("./_Symbol");
        var objectProto = Object.prototype;
        var hasOwnProperty = objectProto.hasOwnProperty;
        var nativeObjectToString = objectProto.toString;
        var symToStringTag = Symbol ? Symbol.toStringTag : undefined;
        function getRawTag(value) {
            var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
            try {
                value[symToStringTag] = undefined;
                var unmasked = true;
            } catch (e) {}
            var result = nativeObjectToString.call(value);
            if (unmasked) {
                if (isOwn) {
                    value[symToStringTag] = tag;
                } else {
                    delete value[symToStringTag];
                }
            }
            return result;
        }
        module.exports = getRawTag;
    }, {
        "./_Symbol": 17
    } ],
    17: [ function(require, module, exports) {
        var root = require("./_root");
        var Symbol = root.Symbol;
        module.exports = Symbol;
    }, {
        "./_root": 109
    } ],
    122: [ function(require, module, exports) {
        var funcProto = Function.prototype;
        var funcToString = funcProto.toString;
        function toSource(func) {
            if (func != null) {
                try {
                    return funcToString.call(func);
                } catch (e) {}
                try {
                    return func + "";
                } catch (e) {}
            }
            return "";
        }
        module.exports = toSource;
    }, {} ],
    87: [ function(require, module, exports) {
        var coreJsData = require("./_coreJsData");
        var maskSrcKey = function() {
            var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
            return uid ? "Symbol(src)_1." + uid : "";
        }();
        function isMasked(func) {
            return !!maskSrcKey && maskSrcKey in func;
        }
        module.exports = isMasked;
    }, {
        "./_coreJsData": 60
    } ],
    60: [ function(require, module, exports) {
        var root = require("./_root");
        var coreJsData = root["__core-js_shared__"];
        module.exports = coreJsData;
    }, {
        "./_root": 109
    } ],
    109: [ function(require, module, exports) {
        var freeGlobal = require("./_freeGlobal");
        var freeSelf = typeof self == "object" && self && self.Object === Object && self;
        var root = freeGlobal || freeSelf || Function("return this")();
        module.exports = root;
    }, {
        "./_freeGlobal": 68
    } ],
    68: [ function(require, module, exports) {
        (function(global) {
            var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
            module.exports = freeGlobal;
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {} ],
    7: [ function(require, module, exports) {
        (function(exports) {
            "use strict";
            function isArray(obj) {
                if (obj !== null) {
                    return Object.prototype.toString.call(obj) === "[object Array]";
                } else {
                    return false;
                }
            }
            function isObject(obj) {
                if (obj !== null) {
                    return Object.prototype.toString.call(obj) === "[object Object]";
                } else {
                    return false;
                }
            }
            function strictDeepEqual(first, second) {
                if (first === second) {
                    return true;
                }
                var firstType = Object.prototype.toString.call(first);
                if (firstType !== Object.prototype.toString.call(second)) {
                    return false;
                }
                if (isArray(first) === true) {
                    if (first.length !== second.length) {
                        return false;
                    }
                    for (var i = 0; i < first.length; i++) {
                        if (strictDeepEqual(first[i], second[i]) === false) {
                            return false;
                        }
                    }
                    return true;
                }
                if (isObject(first) === true) {
                    var keysSeen = {};
                    for (var key in first) {
                        if (hasOwnProperty.call(first, key)) {
                            if (strictDeepEqual(first[key], second[key]) === false) {
                                return false;
                            }
                            keysSeen[key] = true;
                        }
                    }
                    for (var key2 in second) {
                        if (hasOwnProperty.call(second, key2)) {
                            if (keysSeen[key2] !== true) {
                                return false;
                            }
                        }
                    }
                    return true;
                }
                return false;
            }
            function isFalse(obj) {
                if (obj === "" || obj === false || obj === null) {
                    return true;
                } else if (isArray(obj) && obj.length === 0) {
                    return true;
                } else if (isObject(obj)) {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
            }
            function objValues(obj) {
                var keys = Object.keys(obj);
                var values = [];
                for (var i = 0; i < keys.length; i++) {
                    values.push(obj[keys[i]]);
                }
                return values;
            }
            function merge(a, b) {
                var merged = {};
                for (var key in a) {
                    merged[key] = a[key];
                }
                for (var key2 in b) {
                    merged[key2] = b[key2];
                }
                return merged;
            }
            var trimLeft;
            if (typeof String.prototype.trimLeft === "function") {
                trimLeft = function(str) {
                    return str.trimLeft();
                };
            } else {
                trimLeft = function(str) {
                    return str.match(/^\s*(.*)/)[1];
                };
            }
            var TYPE_NUMBER = 0;
            var TYPE_ANY = 1;
            var TYPE_STRING = 2;
            var TYPE_ARRAY = 3;
            var TYPE_OBJECT = 4;
            var TYPE_BOOLEAN = 5;
            var TYPE_EXPREF = 6;
            var TYPE_NULL = 7;
            var TYPE_ARRAY_NUMBER = 8;
            var TYPE_ARRAY_STRING = 9;
            var TOK_EOF = "EOF";
            var TOK_UNQUOTEDIDENTIFIER = "UnquotedIdentifier";
            var TOK_QUOTEDIDENTIFIER = "QuotedIdentifier";
            var TOK_RBRACKET = "Rbracket";
            var TOK_RPAREN = "Rparen";
            var TOK_COMMA = "Comma";
            var TOK_COLON = "Colon";
            var TOK_RBRACE = "Rbrace";
            var TOK_NUMBER = "Number";
            var TOK_CURRENT = "Current";
            var TOK_EXPREF = "Expref";
            var TOK_PIPE = "Pipe";
            var TOK_OR = "Or";
            var TOK_AND = "And";
            var TOK_EQ = "EQ";
            var TOK_GT = "GT";
            var TOK_LT = "LT";
            var TOK_GTE = "GTE";
            var TOK_LTE = "LTE";
            var TOK_NE = "NE";
            var TOK_FLATTEN = "Flatten";
            var TOK_STAR = "Star";
            var TOK_FILTER = "Filter";
            var TOK_DOT = "Dot";
            var TOK_NOT = "Not";
            var TOK_LBRACE = "Lbrace";
            var TOK_LBRACKET = "Lbracket";
            var TOK_LPAREN = "Lparen";
            var TOK_LITERAL = "Literal";
            var basicTokens = {
                ".": TOK_DOT,
                "*": TOK_STAR,
                ",": TOK_COMMA,
                ":": TOK_COLON,
                "{": TOK_LBRACE,
                "}": TOK_RBRACE,
                "]": TOK_RBRACKET,
                "(": TOK_LPAREN,
                ")": TOK_RPAREN,
                "@": TOK_CURRENT
            };
            var operatorStartToken = {
                "<": true,
                ">": true,
                "=": true,
                "!": true
            };
            var skipChars = {
                " ": true,
                "\t": true,
                "\n": true
            };
            function isAlpha(ch) {
                return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch === "_";
            }
            function isNum(ch) {
                return ch >= "0" && ch <= "9" || ch === "-";
            }
            function isAlphaNum(ch) {
                return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch >= "0" && ch <= "9" || ch === "_";
            }
            function Lexer() {}
            Lexer.prototype = {
                tokenize: function(stream) {
                    var tokens = [];
                    this._current = 0;
                    var start;
                    var identifier;
                    var token;
                    while (this._current < stream.length) {
                        if (isAlpha(stream[this._current])) {
                            start = this._current;
                            identifier = this._consumeUnquotedIdentifier(stream);
                            tokens.push({
                                type: TOK_UNQUOTEDIDENTIFIER,
                                value: identifier,
                                start: start
                            });
                        } else if (basicTokens[stream[this._current]] !== undefined) {
                            tokens.push({
                                type: basicTokens[stream[this._current]],
                                value: stream[this._current],
                                start: this._current
                            });
                            this._current++;
                        } else if (isNum(stream[this._current])) {
                            token = this._consumeNumber(stream);
                            tokens.push(token);
                        } else if (stream[this._current] === "[") {
                            token = this._consumeLBracket(stream);
                            tokens.push(token);
                        } else if (stream[this._current] === '"') {
                            start = this._current;
                            identifier = this._consumeQuotedIdentifier(stream);
                            tokens.push({
                                type: TOK_QUOTEDIDENTIFIER,
                                value: identifier,
                                start: start
                            });
                        } else if (stream[this._current] === "'") {
                            start = this._current;
                            identifier = this._consumeRawStringLiteral(stream);
                            tokens.push({
                                type: TOK_LITERAL,
                                value: identifier,
                                start: start
                            });
                        } else if (stream[this._current] === "`") {
                            start = this._current;
                            var literal = this._consumeLiteral(stream);
                            tokens.push({
                                type: TOK_LITERAL,
                                value: literal,
                                start: start
                            });
                        } else if (operatorStartToken[stream[this._current]] !== undefined) {
                            tokens.push(this._consumeOperator(stream));
                        } else if (skipChars[stream[this._current]] !== undefined) {
                            this._current++;
                        } else if (stream[this._current] === "&") {
                            start = this._current;
                            this._current++;
                            if (stream[this._current] === "&") {
                                this._current++;
                                tokens.push({
                                    type: TOK_AND,
                                    value: "&&",
                                    start: start
                                });
                            } else {
                                tokens.push({
                                    type: TOK_EXPREF,
                                    value: "&",
                                    start: start
                                });
                            }
                        } else if (stream[this._current] === "|") {
                            start = this._current;
                            this._current++;
                            if (stream[this._current] === "|") {
                                this._current++;
                                tokens.push({
                                    type: TOK_OR,
                                    value: "||",
                                    start: start
                                });
                            } else {
                                tokens.push({
                                    type: TOK_PIPE,
                                    value: "|",
                                    start: start
                                });
                            }
                        } else {
                            var error = new Error("Unknown character:" + stream[this._current]);
                            error.name = "LexerError";
                            throw error;
                        }
                    }
                    return tokens;
                },
                _consumeUnquotedIdentifier: function(stream) {
                    var start = this._current;
                    this._current++;
                    while (this._current < stream.length && isAlphaNum(stream[this._current])) {
                        this._current++;
                    }
                    return stream.slice(start, this._current);
                },
                _consumeQuotedIdentifier: function(stream) {
                    var start = this._current;
                    this._current++;
                    var maxLength = stream.length;
                    while (stream[this._current] !== '"' && this._current < maxLength) {
                        var current = this._current;
                        if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === '"')) {
                            current += 2;
                        } else {
                            current++;
                        }
                        this._current = current;
                    }
                    this._current++;
                    return JSON.parse(stream.slice(start, this._current));
                },
                _consumeRawStringLiteral: function(stream) {
                    var start = this._current;
                    this._current++;
                    var maxLength = stream.length;
                    while (stream[this._current] !== "'" && this._current < maxLength) {
                        var current = this._current;
                        if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === "'")) {
                            current += 2;
                        } else {
                            current++;
                        }
                        this._current = current;
                    }
                    this._current++;
                    var literal = stream.slice(start + 1, this._current - 1);
                    return literal.replace("\\'", "'");
                },
                _consumeNumber: function(stream) {
                    var start = this._current;
                    this._current++;
                    var maxLength = stream.length;
                    while (isNum(stream[this._current]) && this._current < maxLength) {
                        this._current++;
                    }
                    var value = parseInt(stream.slice(start, this._current));
                    return {
                        type: TOK_NUMBER,
                        value: value,
                        start: start
                    };
                },
                _consumeLBracket: function(stream) {
                    var start = this._current;
                    this._current++;
                    if (stream[this._current] === "?") {
                        this._current++;
                        return {
                            type: TOK_FILTER,
                            value: "[?",
                            start: start
                        };
                    } else if (stream[this._current] === "]") {
                        this._current++;
                        return {
                            type: TOK_FLATTEN,
                            value: "[]",
                            start: start
                        };
                    } else {
                        return {
                            type: TOK_LBRACKET,
                            value: "[",
                            start: start
                        };
                    }
                },
                _consumeOperator: function(stream) {
                    var start = this._current;
                    var startingChar = stream[start];
                    this._current++;
                    if (startingChar === "!") {
                        if (stream[this._current] === "=") {
                            this._current++;
                            return {
                                type: TOK_NE,
                                value: "!=",
                                start: start
                            };
                        } else {
                            return {
                                type: TOK_NOT,
                                value: "!",
                                start: start
                            };
                        }
                    } else if (startingChar === "<") {
                        if (stream[this._current] === "=") {
                            this._current++;
                            return {
                                type: TOK_LTE,
                                value: "<=",
                                start: start
                            };
                        } else {
                            return {
                                type: TOK_LT,
                                value: "<",
                                start: start
                            };
                        }
                    } else if (startingChar === ">") {
                        if (stream[this._current] === "=") {
                            this._current++;
                            return {
                                type: TOK_GTE,
                                value: ">=",
                                start: start
                            };
                        } else {
                            return {
                                type: TOK_GT,
                                value: ">",
                                start: start
                            };
                        }
                    } else if (startingChar === "=") {
                        if (stream[this._current] === "=") {
                            this._current++;
                            return {
                                type: TOK_EQ,
                                value: "==",
                                start: start
                            };
                        }
                    }
                },
                _consumeLiteral: function(stream) {
                    this._current++;
                    var start = this._current;
                    var maxLength = stream.length;
                    var literal;
                    while (stream[this._current] !== "`" && this._current < maxLength) {
                        var current = this._current;
                        if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === "`")) {
                            current += 2;
                        } else {
                            current++;
                        }
                        this._current = current;
                    }
                    var literalString = trimLeft(stream.slice(start, this._current));
                    literalString = literalString.replace("\\`", "`");
                    if (this._looksLikeJSON(literalString)) {
                        literal = JSON.parse(literalString);
                    } else {
                        literal = JSON.parse('"' + literalString + '"');
                    }
                    this._current++;
                    return literal;
                },
                _looksLikeJSON: function(literalString) {
                    var startingChars = '[{"';
                    var jsonLiterals = [ "true", "false", "null" ];
                    var numberLooking = "-0123456789";
                    if (literalString === "") {
                        return false;
                    } else if (startingChars.indexOf(literalString[0]) >= 0) {
                        return true;
                    } else if (jsonLiterals.indexOf(literalString) >= 0) {
                        return true;
                    } else if (numberLooking.indexOf(literalString[0]) >= 0) {
                        try {
                            JSON.parse(literalString);
                            return true;
                        } catch (ex) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
            };
            var bindingPower = {};
            bindingPower[TOK_EOF] = 0;
            bindingPower[TOK_UNQUOTEDIDENTIFIER] = 0;
            bindingPower[TOK_QUOTEDIDENTIFIER] = 0;
            bindingPower[TOK_RBRACKET] = 0;
            bindingPower[TOK_RPAREN] = 0;
            bindingPower[TOK_COMMA] = 0;
            bindingPower[TOK_RBRACE] = 0;
            bindingPower[TOK_NUMBER] = 0;
            bindingPower[TOK_CURRENT] = 0;
            bindingPower[TOK_EXPREF] = 0;
            bindingPower[TOK_PIPE] = 1;
            bindingPower[TOK_OR] = 2;
            bindingPower[TOK_AND] = 3;
            bindingPower[TOK_EQ] = 5;
            bindingPower[TOK_GT] = 5;
            bindingPower[TOK_LT] = 5;
            bindingPower[TOK_GTE] = 5;
            bindingPower[TOK_LTE] = 5;
            bindingPower[TOK_NE] = 5;
            bindingPower[TOK_FLATTEN] = 9;
            bindingPower[TOK_STAR] = 20;
            bindingPower[TOK_FILTER] = 21;
            bindingPower[TOK_DOT] = 40;
            bindingPower[TOK_NOT] = 45;
            bindingPower[TOK_LBRACE] = 50;
            bindingPower[TOK_LBRACKET] = 55;
            bindingPower[TOK_LPAREN] = 60;
            function Parser() {}
            Parser.prototype = {
                parse: function(expression) {
                    this._loadTokens(expression);
                    this.index = 0;
                    var ast = this.expression(0);
                    if (this._lookahead(0) !== TOK_EOF) {
                        var t = this._lookaheadToken(0);
                        var error = new Error("Unexpected token type: " + t.type + ", value: " + t.value);
                        error.name = "ParserError";
                        throw error;
                    }
                    return ast;
                },
                _loadTokens: function(expression) {
                    var lexer = new Lexer();
                    var tokens = lexer.tokenize(expression);
                    tokens.push({
                        type: TOK_EOF,
                        value: "",
                        start: expression.length
                    });
                    this.tokens = tokens;
                },
                expression: function(rbp) {
                    var leftToken = this._lookaheadToken(0);
                    this._advance();
                    var left = this.nud(leftToken);
                    var currentToken = this._lookahead(0);
                    while (rbp < bindingPower[currentToken]) {
                        this._advance();
                        left = this.led(currentToken, left);
                        currentToken = this._lookahead(0);
                    }
                    return left;
                },
                _lookahead: function(number) {
                    return this.tokens[this.index + number].type;
                },
                _lookaheadToken: function(number) {
                    return this.tokens[this.index + number];
                },
                _advance: function() {
                    this.index++;
                },
                nud: function(token) {
                    var left;
                    var right;
                    var expression;
                    switch (token.type) {
                      case TOK_LITERAL:
                        return {
                            type: "Literal",
                            value: token.value
                        };

                      case TOK_UNQUOTEDIDENTIFIER:
                        return {
                            type: "Field",
                            name: token.value
                        };

                      case TOK_QUOTEDIDENTIFIER:
                        var node = {
                            type: "Field",
                            name: token.value
                        };
                        if (this._lookahead(0) === TOK_LPAREN) {
                            throw new Error("Quoted identifier not allowed for function names.");
                        } else {
                            return node;
                        }
                        break;

                      case TOK_NOT:
                        right = this.expression(bindingPower.Not);
                        return {
                            type: "NotExpression",
                            children: [ right ]
                        };

                      case TOK_STAR:
                        left = {
                            type: "Identity"
                        };
                        right = null;
                        if (this._lookahead(0) === TOK_RBRACKET) {
                            right = {
                                type: "Identity"
                            };
                        } else {
                            right = this._parseProjectionRHS(bindingPower.Star);
                        }
                        return {
                            type: "ValueProjection",
                            children: [ left, right ]
                        };

                      case TOK_FILTER:
                        return this.led(token.type, {
                            type: "Identity"
                        });

                      case TOK_LBRACE:
                        return this._parseMultiselectHash();

                      case TOK_FLATTEN:
                        left = {
                            type: TOK_FLATTEN,
                            children: [ {
                                type: "Identity"
                            } ]
                        };
                        right = this._parseProjectionRHS(bindingPower.Flatten);
                        return {
                            type: "Projection",
                            children: [ left, right ]
                        };

                      case TOK_LBRACKET:
                        if (this._lookahead(0) === TOK_NUMBER || this._lookahead(0) === TOK_COLON) {
                            right = this._parseIndexExpression();
                            return this._projectIfSlice({
                                type: "Identity"
                            }, right);
                        } else if (this._lookahead(0) === TOK_STAR && this._lookahead(1) === TOK_RBRACKET) {
                            this._advance();
                            this._advance();
                            right = this._parseProjectionRHS(bindingPower.Star);
                            return {
                                type: "Projection",
                                children: [ {
                                    type: "Identity"
                                }, right ]
                            };
                        } else {
                            return this._parseMultiselectList();
                        }
                        break;

                      case TOK_CURRENT:
                        return {
                            type: TOK_CURRENT
                        };

                      case TOK_EXPREF:
                        expression = this.expression(bindingPower.Expref);
                        return {
                            type: "ExpressionReference",
                            children: [ expression ]
                        };

                      case TOK_LPAREN:
                        var args = [];
                        while (this._lookahead(0) !== TOK_RPAREN) {
                            if (this._lookahead(0) === TOK_CURRENT) {
                                expression = {
                                    type: TOK_CURRENT
                                };
                                this._advance();
                            } else {
                                expression = this.expression(0);
                            }
                            args.push(expression);
                        }
                        this._match(TOK_RPAREN);
                        return args[0];

                      default:
                        this._errorToken(token);
                    }
                },
                led: function(tokenName, left) {
                    var right;
                    switch (tokenName) {
                      case TOK_DOT:
                        var rbp = bindingPower.Dot;
                        if (this._lookahead(0) !== TOK_STAR) {
                            right = this._parseDotRHS(rbp);
                            return {
                                type: "Subexpression",
                                children: [ left, right ]
                            };
                        } else {
                            this._advance();
                            right = this._parseProjectionRHS(rbp);
                            return {
                                type: "ValueProjection",
                                children: [ left, right ]
                            };
                        }
                        break;

                      case TOK_PIPE:
                        right = this.expression(bindingPower.Pipe);
                        return {
                            type: TOK_PIPE,
                            children: [ left, right ]
                        };

                      case TOK_OR:
                        right = this.expression(bindingPower.Or);
                        return {
                            type: "OrExpression",
                            children: [ left, right ]
                        };

                      case TOK_AND:
                        right = this.expression(bindingPower.And);
                        return {
                            type: "AndExpression",
                            children: [ left, right ]
                        };

                      case TOK_LPAREN:
                        var name = left.name;
                        var args = [];
                        var expression, node;
                        while (this._lookahead(0) !== TOK_RPAREN) {
                            if (this._lookahead(0) === TOK_CURRENT) {
                                expression = {
                                    type: TOK_CURRENT
                                };
                                this._advance();
                            } else {
                                expression = this.expression(0);
                            }
                            if (this._lookahead(0) === TOK_COMMA) {
                                this._match(TOK_COMMA);
                            }
                            args.push(expression);
                        }
                        this._match(TOK_RPAREN);
                        node = {
                            type: "Function",
                            name: name,
                            children: args
                        };
                        return node;

                      case TOK_FILTER:
                        var condition = this.expression(0);
                        this._match(TOK_RBRACKET);
                        if (this._lookahead(0) === TOK_FLATTEN) {
                            right = {
                                type: "Identity"
                            };
                        } else {
                            right = this._parseProjectionRHS(bindingPower.Filter);
                        }
                        return {
                            type: "FilterProjection",
                            children: [ left, right, condition ]
                        };

                      case TOK_FLATTEN:
                        var leftNode = {
                            type: TOK_FLATTEN,
                            children: [ left ]
                        };
                        var rightNode = this._parseProjectionRHS(bindingPower.Flatten);
                        return {
                            type: "Projection",
                            children: [ leftNode, rightNode ]
                        };

                      case TOK_EQ:
                      case TOK_NE:
                      case TOK_GT:
                      case TOK_GTE:
                      case TOK_LT:
                      case TOK_LTE:
                        return this._parseComparator(left, tokenName);

                      case TOK_LBRACKET:
                        var token = this._lookaheadToken(0);
                        if (token.type === TOK_NUMBER || token.type === TOK_COLON) {
                            right = this._parseIndexExpression();
                            return this._projectIfSlice(left, right);
                        } else {
                            this._match(TOK_STAR);
                            this._match(TOK_RBRACKET);
                            right = this._parseProjectionRHS(bindingPower.Star);
                            return {
                                type: "Projection",
                                children: [ left, right ]
                            };
                        }
                        break;

                      default:
                        this._errorToken(this._lookaheadToken(0));
                    }
                },
                _match: function(tokenType) {
                    if (this._lookahead(0) === tokenType) {
                        this._advance();
                    } else {
                        var t = this._lookaheadToken(0);
                        var error = new Error("Expected " + tokenType + ", got: " + t.type);
                        error.name = "ParserError";
                        throw error;
                    }
                },
                _errorToken: function(token) {
                    var error = new Error("Invalid token (" + token.type + '): "' + token.value + '"');
                    error.name = "ParserError";
                    throw error;
                },
                _parseIndexExpression: function() {
                    if (this._lookahead(0) === TOK_COLON || this._lookahead(1) === TOK_COLON) {
                        return this._parseSliceExpression();
                    } else {
                        var node = {
                            type: "Index",
                            value: this._lookaheadToken(0).value
                        };
                        this._advance();
                        this._match(TOK_RBRACKET);
                        return node;
                    }
                },
                _projectIfSlice: function(left, right) {
                    var indexExpr = {
                        type: "IndexExpression",
                        children: [ left, right ]
                    };
                    if (right.type === "Slice") {
                        return {
                            type: "Projection",
                            children: [ indexExpr, this._parseProjectionRHS(bindingPower.Star) ]
                        };
                    } else {
                        return indexExpr;
                    }
                },
                _parseSliceExpression: function() {
                    var parts = [ null, null, null ];
                    var index = 0;
                    var currentToken = this._lookahead(0);
                    while (currentToken !== TOK_RBRACKET && index < 3) {
                        if (currentToken === TOK_COLON) {
                            index++;
                            this._advance();
                        } else if (currentToken === TOK_NUMBER) {
                            parts[index] = this._lookaheadToken(0).value;
                            this._advance();
                        } else {
                            var t = this._lookahead(0);
                            var error = new Error("Syntax error, unexpected token: " + t.value + "(" + t.type + ")");
                            error.name = "Parsererror";
                            throw error;
                        }
                        currentToken = this._lookahead(0);
                    }
                    this._match(TOK_RBRACKET);
                    return {
                        type: "Slice",
                        children: parts
                    };
                },
                _parseComparator: function(left, comparator) {
                    var right = this.expression(bindingPower[comparator]);
                    return {
                        type: "Comparator",
                        name: comparator,
                        children: [ left, right ]
                    };
                },
                _parseDotRHS: function(rbp) {
                    var lookahead = this._lookahead(0);
                    var exprTokens = [ TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER, TOK_STAR ];
                    if (exprTokens.indexOf(lookahead) >= 0) {
                        return this.expression(rbp);
                    } else if (lookahead === TOK_LBRACKET) {
                        this._match(TOK_LBRACKET);
                        return this._parseMultiselectList();
                    } else if (lookahead === TOK_LBRACE) {
                        this._match(TOK_LBRACE);
                        return this._parseMultiselectHash();
                    }
                },
                _parseProjectionRHS: function(rbp) {
                    var right;
                    if (bindingPower[this._lookahead(0)] < 10) {
                        right = {
                            type: "Identity"
                        };
                    } else if (this._lookahead(0) === TOK_LBRACKET) {
                        right = this.expression(rbp);
                    } else if (this._lookahead(0) === TOK_FILTER) {
                        right = this.expression(rbp);
                    } else if (this._lookahead(0) === TOK_DOT) {
                        this._match(TOK_DOT);
                        right = this._parseDotRHS(rbp);
                    } else {
                        var t = this._lookaheadToken(0);
                        var error = new Error("Sytanx error, unexpected token: " + t.value + "(" + t.type + ")");
                        error.name = "ParserError";
                        throw error;
                    }
                    return right;
                },
                _parseMultiselectList: function() {
                    var expressions = [];
                    while (this._lookahead(0) !== TOK_RBRACKET) {
                        var expression = this.expression(0);
                        expressions.push(expression);
                        if (this._lookahead(0) === TOK_COMMA) {
                            this._match(TOK_COMMA);
                            if (this._lookahead(0) === TOK_RBRACKET) {
                                throw new Error("Unexpected token Rbracket");
                            }
                        }
                    }
                    this._match(TOK_RBRACKET);
                    return {
                        type: "MultiSelectList",
                        children: expressions
                    };
                },
                _parseMultiselectHash: function() {
                    var pairs = [];
                    var identifierTypes = [ TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER ];
                    var keyToken, keyName, value, node;
                    for (;;) {
                        keyToken = this._lookaheadToken(0);
                        if (identifierTypes.indexOf(keyToken.type) < 0) {
                            throw new Error("Expecting an identifier token, got: " + keyToken.type);
                        }
                        keyName = keyToken.value;
                        this._advance();
                        this._match(TOK_COLON);
                        value = this.expression(0);
                        node = {
                            type: "KeyValuePair",
                            name: keyName,
                            value: value
                        };
                        pairs.push(node);
                        if (this._lookahead(0) === TOK_COMMA) {
                            this._match(TOK_COMMA);
                        } else if (this._lookahead(0) === TOK_RBRACE) {
                            this._match(TOK_RBRACE);
                            break;
                        }
                    }
                    return {
                        type: "MultiSelectHash",
                        children: pairs
                    };
                }
            };
            function TreeInterpreter(runtime) {
                this.runtime = runtime;
            }
            TreeInterpreter.prototype = {
                search: function(node, value) {
                    return this.visit(node, value);
                },
                visit: function(node, value) {
                    var matched, current, result, first, second, field, left, right, collected, i;
                    switch (node.type) {
                      case "Field":
                        if (value === null) {
                            return null;
                        } else if (isObject(value)) {
                            field = value[node.name];
                            if (field === undefined) {
                                return null;
                            } else {
                                return field;
                            }
                        } else {
                            return null;
                        }
                        break;

                      case "Subexpression":
                        result = this.visit(node.children[0], value);
                        for (i = 1; i < node.children.length; i++) {
                            result = this.visit(node.children[1], result);
                            if (result === null) {
                                return null;
                            }
                        }
                        return result;

                      case "IndexExpression":
                        left = this.visit(node.children[0], value);
                        right = this.visit(node.children[1], left);
                        return right;

                      case "Index":
                        if (!isArray(value)) {
                            return null;
                        }
                        var index = node.value;
                        if (index < 0) {
                            index = value.length + index;
                        }
                        result = value[index];
                        if (result === undefined) {
                            result = null;
                        }
                        return result;

                      case "Slice":
                        if (!isArray(value)) {
                            return null;
                        }
                        var sliceParams = node.children.slice(0);
                        var computed = this.computeSliceParams(value.length, sliceParams);
                        var start = computed[0];
                        var stop = computed[1];
                        var step = computed[2];
                        result = [];
                        if (step > 0) {
                            for (i = start; i < stop; i += step) {
                                result.push(value[i]);
                            }
                        } else {
                            for (i = start; i > stop; i += step) {
                                result.push(value[i]);
                            }
                        }
                        return result;

                      case "Projection":
                        var base = this.visit(node.children[0], value);
                        if (!isArray(base)) {
                            return null;
                        }
                        collected = [];
                        for (i = 0; i < base.length; i++) {
                            current = this.visit(node.children[1], base[i]);
                            if (current !== null) {
                                collected.push(current);
                            }
                        }
                        return collected;

                      case "ValueProjection":
                        base = this.visit(node.children[0], value);
                        if (!isObject(base)) {
                            return null;
                        }
                        collected = [];
                        var values = objValues(base);
                        for (i = 0; i < values.length; i++) {
                            current = this.visit(node.children[1], values[i]);
                            if (current !== null) {
                                collected.push(current);
                            }
                        }
                        return collected;

                      case "FilterProjection":
                        base = this.visit(node.children[0], value);
                        if (!isArray(base)) {
                            return null;
                        }
                        var filtered = [];
                        var finalResults = [];
                        for (i = 0; i < base.length; i++) {
                            matched = this.visit(node.children[2], base[i]);
                            if (!isFalse(matched)) {
                                filtered.push(base[i]);
                            }
                        }
                        for (var j = 0; j < filtered.length; j++) {
                            current = this.visit(node.children[1], filtered[j]);
                            if (current !== null) {
                                finalResults.push(current);
                            }
                        }
                        return finalResults;

                      case "Comparator":
                        first = this.visit(node.children[0], value);
                        second = this.visit(node.children[1], value);
                        switch (node.name) {
                          case TOK_EQ:
                            result = strictDeepEqual(first, second);
                            break;

                          case TOK_NE:
                            result = !strictDeepEqual(first, second);
                            break;

                          case TOK_GT:
                            result = first > second;
                            break;

                          case TOK_GTE:
                            result = first >= second;
                            break;

                          case TOK_LT:
                            result = first < second;
                            break;

                          case TOK_LTE:
                            result = first <= second;
                            break;

                          default:
                            throw new Error("Unknown comparator: " + node.name);
                        }
                        return result;

                      case TOK_FLATTEN:
                        var original = this.visit(node.children[0], value);
                        if (!isArray(original)) {
                            return null;
                        }
                        var merged = [];
                        for (i = 0; i < original.length; i++) {
                            current = original[i];
                            if (isArray(current)) {
                                merged.push.apply(merged, current);
                            } else {
                                merged.push(current);
                            }
                        }
                        return merged;

                      case "Identity":
                        return value;

                      case "MultiSelectList":
                        if (value === null) {
                            return null;
                        }
                        collected = [];
                        for (i = 0; i < node.children.length; i++) {
                            collected.push(this.visit(node.children[i], value));
                        }
                        return collected;

                      case "MultiSelectHash":
                        if (value === null) {
                            return null;
                        }
                        collected = {};
                        var child;
                        for (i = 0; i < node.children.length; i++) {
                            child = node.children[i];
                            collected[child.name] = this.visit(child.value, value);
                        }
                        return collected;

                      case "OrExpression":
                        matched = this.visit(node.children[0], value);
                        if (isFalse(matched)) {
                            matched = this.visit(node.children[1], value);
                        }
                        return matched;

                      case "AndExpression":
                        first = this.visit(node.children[0], value);
                        if (isFalse(first) === true) {
                            return first;
                        }
                        return this.visit(node.children[1], value);

                      case "NotExpression":
                        first = this.visit(node.children[0], value);
                        return isFalse(first);

                      case "Literal":
                        return node.value;

                      case TOK_PIPE:
                        left = this.visit(node.children[0], value);
                        return this.visit(node.children[1], left);

                      case TOK_CURRENT:
                        return value;

                      case "Function":
                        var resolvedArgs = [];
                        for (i = 0; i < node.children.length; i++) {
                            resolvedArgs.push(this.visit(node.children[i], value));
                        }
                        return this.runtime.callFunction(node.name, resolvedArgs);

                      case "ExpressionReference":
                        var refNode = node.children[0];
                        refNode.jmespathType = TOK_EXPREF;
                        return refNode;

                      default:
                        throw new Error("Unknown node type: " + node.type);
                    }
                },
                computeSliceParams: function(arrayLength, sliceParams) {
                    var start = sliceParams[0];
                    var stop = sliceParams[1];
                    var step = sliceParams[2];
                    var computed = [ null, null, null ];
                    if (step === null) {
                        step = 1;
                    } else if (step === 0) {
                        var error = new Error("Invalid slice, step cannot be 0");
                        error.name = "RuntimeError";
                        throw error;
                    }
                    var stepValueNegative = step < 0 ? true : false;
                    if (start === null) {
                        start = stepValueNegative ? arrayLength - 1 : 0;
                    } else {
                        start = this.capSliceRange(arrayLength, start, step);
                    }
                    if (stop === null) {
                        stop = stepValueNegative ? -1 : arrayLength;
                    } else {
                        stop = this.capSliceRange(arrayLength, stop, step);
                    }
                    computed[0] = start;
                    computed[1] = stop;
                    computed[2] = step;
                    return computed;
                },
                capSliceRange: function(arrayLength, actualValue, step) {
                    if (actualValue < 0) {
                        actualValue += arrayLength;
                        if (actualValue < 0) {
                            actualValue = step < 0 ? -1 : 0;
                        }
                    } else if (actualValue >= arrayLength) {
                        actualValue = step < 0 ? arrayLength - 1 : arrayLength;
                    }
                    return actualValue;
                }
            };
            function Runtime(interpreter) {
                this._interpreter = interpreter;
                this.functionTable = {
                    abs: {
                        _func: this._functionAbs,
                        _signature: [ {
                            types: [ TYPE_NUMBER ]
                        } ]
                    },
                    avg: {
                        _func: this._functionAvg,
                        _signature: [ {
                            types: [ TYPE_ARRAY_NUMBER ]
                        } ]
                    },
                    ceil: {
                        _func: this._functionCeil,
                        _signature: [ {
                            types: [ TYPE_NUMBER ]
                        } ]
                    },
                    contains: {
                        _func: this._functionContains,
                        _signature: [ {
                            types: [ TYPE_STRING, TYPE_ARRAY ]
                        }, {
                            types: [ TYPE_ANY ]
                        } ]
                    },
                    ends_with: {
                        _func: this._functionEndsWith,
                        _signature: [ {
                            types: [ TYPE_STRING ]
                        }, {
                            types: [ TYPE_STRING ]
                        } ]
                    },
                    floor: {
                        _func: this._functionFloor,
                        _signature: [ {
                            types: [ TYPE_NUMBER ]
                        } ]
                    },
                    length: {
                        _func: this._functionLength,
                        _signature: [ {
                            types: [ TYPE_STRING, TYPE_ARRAY, TYPE_OBJECT ]
                        } ]
                    },
                    map: {
                        _func: this._functionMap,
                        _signature: [ {
                            types: [ TYPE_EXPREF ]
                        }, {
                            types: [ TYPE_ARRAY ]
                        } ]
                    },
                    max: {
                        _func: this._functionMax,
                        _signature: [ {
                            types: [ TYPE_ARRAY_NUMBER, TYPE_ARRAY_STRING ]
                        } ]
                    },
                    merge: {
                        _func: this._functionMerge,
                        _signature: [ {
                            types: [ TYPE_OBJECT ],
                            variadic: true
                        } ]
                    },
                    max_by: {
                        _func: this._functionMaxBy,
                        _signature: [ {
                            types: [ TYPE_ARRAY ]
                        }, {
                            types: [ TYPE_EXPREF ]
                        } ]
                    },
                    sum: {
                        _func: this._functionSum,
                        _signature: [ {
                            types: [ TYPE_ARRAY_NUMBER ]
                        } ]
                    },
                    starts_with: {
                        _func: this._functionStartsWith,
                        _signature: [ {
                            types: [ TYPE_STRING ]
                        }, {
                            types: [ TYPE_STRING ]
                        } ]
                    },
                    min: {
                        _func: this._functionMin,
                        _signature: [ {
                            types: [ TYPE_ARRAY_NUMBER, TYPE_ARRAY_STRING ]
                        } ]
                    },
                    min_by: {
                        _func: this._functionMinBy,
                        _signature: [ {
                            types: [ TYPE_ARRAY ]
                        }, {
                            types: [ TYPE_EXPREF ]
                        } ]
                    },
                    type: {
                        _func: this._functionType,
                        _signature: [ {
                            types: [ TYPE_ANY ]
                        } ]
                    },
                    keys: {
                        _func: this._functionKeys,
                        _signature: [ {
                            types: [ TYPE_OBJECT ]
                        } ]
                    },
                    values: {
                        _func: this._functionValues,
                        _signature: [ {
                            types: [ TYPE_OBJECT ]
                        } ]
                    },
                    sort: {
                        _func: this._functionSort,
                        _signature: [ {
                            types: [ TYPE_ARRAY_STRING, TYPE_ARRAY_NUMBER ]
                        } ]
                    },
                    sort_by: {
                        _func: this._functionSortBy,
                        _signature: [ {
                            types: [ TYPE_ARRAY ]
                        }, {
                            types: [ TYPE_EXPREF ]
                        } ]
                    },
                    join: {
                        _func: this._functionJoin,
                        _signature: [ {
                            types: [ TYPE_STRING ]
                        }, {
                            types: [ TYPE_ARRAY_STRING ]
                        } ]
                    },
                    reverse: {
                        _func: this._functionReverse,
                        _signature: [ {
                            types: [ TYPE_STRING, TYPE_ARRAY ]
                        } ]
                    },
                    to_array: {
                        _func: this._functionToArray,
                        _signature: [ {
                            types: [ TYPE_ANY ]
                        } ]
                    },
                    to_string: {
                        _func: this._functionToString,
                        _signature: [ {
                            types: [ TYPE_ANY ]
                        } ]
                    },
                    to_number: {
                        _func: this._functionToNumber,
                        _signature: [ {
                            types: [ TYPE_ANY ]
                        } ]
                    },
                    not_null: {
                        _func: this._functionNotNull,
                        _signature: [ {
                            types: [ TYPE_ANY ],
                            variadic: true
                        } ]
                    }
                };
            }
            Runtime.prototype = {
                callFunction: function(name, resolvedArgs) {
                    var functionEntry = this.functionTable[name];
                    if (functionEntry === undefined) {
                        throw new Error("Unknown function: " + name + "()");
                    }
                    this._validateArgs(name, resolvedArgs, functionEntry._signature);
                    return functionEntry._func.call(this, resolvedArgs);
                },
                _validateArgs: function(name, args, signature) {
                    var pluralized;
                    if (signature[signature.length - 1].variadic) {
                        if (args.length < signature.length) {
                            pluralized = signature.length === 1 ? " argument" : " arguments";
                            throw new Error("ArgumentError: " + name + "() " + "takes at least" + signature.length + pluralized + " but received " + args.length);
                        }
                    } else if (args.length !== signature.length) {
                        pluralized = signature.length === 1 ? " argument" : " arguments";
                        throw new Error("ArgumentError: " + name + "() " + "takes " + signature.length + pluralized + " but received " + args.length);
                    }
                    var currentSpec;
                    var actualType;
                    var typeMatched;
                    for (var i = 0; i < signature.length; i++) {
                        typeMatched = false;
                        currentSpec = signature[i].types;
                        actualType = this._getTypeName(args[i]);
                        for (var j = 0; j < currentSpec.length; j++) {
                            if (this._typeMatches(actualType, currentSpec[j], args[i])) {
                                typeMatched = true;
                                break;
                            }
                        }
                        if (!typeMatched) {
                            throw new Error("TypeError: " + name + "() " + "expected argument " + (i + 1) + " to be type " + currentSpec + " but received type " + actualType + " instead.");
                        }
                    }
                },
                _typeMatches: function(actual, expected, argValue) {
                    if (expected === TYPE_ANY) {
                        return true;
                    }
                    if (expected === TYPE_ARRAY_STRING || expected === TYPE_ARRAY_NUMBER || expected === TYPE_ARRAY) {
                        if (expected === TYPE_ARRAY) {
                            return actual === TYPE_ARRAY;
                        } else if (actual === TYPE_ARRAY) {
                            var subtype;
                            if (expected === TYPE_ARRAY_NUMBER) {
                                subtype = TYPE_NUMBER;
                            } else if (expected === TYPE_ARRAY_STRING) {
                                subtype = TYPE_STRING;
                            }
                            for (var i = 0; i < argValue.length; i++) {
                                if (!this._typeMatches(this._getTypeName(argValue[i]), subtype, argValue[i])) {
                                    return false;
                                }
                            }
                            return true;
                        }
                    } else {
                        return actual === expected;
                    }
                },
                _getTypeName: function(obj) {
                    switch (Object.prototype.toString.call(obj)) {
                      case "[object String]":
                        return TYPE_STRING;

                      case "[object Number]":
                        return TYPE_NUMBER;

                      case "[object Array]":
                        return TYPE_ARRAY;

                      case "[object Boolean]":
                        return TYPE_BOOLEAN;

                      case "[object Null]":
                        return TYPE_NULL;

                      case "[object Object]":
                        if (obj.jmespathType === TOK_EXPREF) {
                            return TYPE_EXPREF;
                        } else {
                            return TYPE_OBJECT;
                        }
                    }
                },
                _functionStartsWith: function(resolvedArgs) {
                    return resolvedArgs[0].lastIndexOf(resolvedArgs[1]) === 0;
                },
                _functionEndsWith: function(resolvedArgs) {
                    var searchStr = resolvedArgs[0];
                    var suffix = resolvedArgs[1];
                    return searchStr.indexOf(suffix, searchStr.length - suffix.length) !== -1;
                },
                _functionReverse: function(resolvedArgs) {
                    var typeName = this._getTypeName(resolvedArgs[0]);
                    if (typeName === TYPE_STRING) {
                        var originalStr = resolvedArgs[0];
                        var reversedStr = "";
                        for (var i = originalStr.length - 1; i >= 0; i--) {
                            reversedStr += originalStr[i];
                        }
                        return reversedStr;
                    } else {
                        var reversedArray = resolvedArgs[0].slice(0);
                        reversedArray.reverse();
                        return reversedArray;
                    }
                },
                _functionAbs: function(resolvedArgs) {
                    return Math.abs(resolvedArgs[0]);
                },
                _functionCeil: function(resolvedArgs) {
                    return Math.ceil(resolvedArgs[0]);
                },
                _functionAvg: function(resolvedArgs) {
                    var sum = 0;
                    var inputArray = resolvedArgs[0];
                    for (var i = 0; i < inputArray.length; i++) {
                        sum += inputArray[i];
                    }
                    return sum / inputArray.length;
                },
                _functionContains: function(resolvedArgs) {
                    return resolvedArgs[0].indexOf(resolvedArgs[1]) >= 0;
                },
                _functionFloor: function(resolvedArgs) {
                    return Math.floor(resolvedArgs[0]);
                },
                _functionLength: function(resolvedArgs) {
                    if (!isObject(resolvedArgs[0])) {
                        return resolvedArgs[0].length;
                    } else {
                        return Object.keys(resolvedArgs[0]).length;
                    }
                },
                _functionMap: function(resolvedArgs) {
                    var mapped = [];
                    var interpreter = this._interpreter;
                    var exprefNode = resolvedArgs[0];
                    var elements = resolvedArgs[1];
                    for (var i = 0; i < elements.length; i++) {
                        mapped.push(interpreter.visit(exprefNode, elements[i]));
                    }
                    return mapped;
                },
                _functionMerge: function(resolvedArgs) {
                    var merged = {};
                    for (var i = 0; i < resolvedArgs.length; i++) {
                        var current = resolvedArgs[i];
                        for (var key in current) {
                            merged[key] = current[key];
                        }
                    }
                    return merged;
                },
                _functionMax: function(resolvedArgs) {
                    if (resolvedArgs[0].length > 0) {
                        var typeName = this._getTypeName(resolvedArgs[0][0]);
                        if (typeName === TYPE_NUMBER) {
                            return Math.max.apply(Math, resolvedArgs[0]);
                        } else {
                            var elements = resolvedArgs[0];
                            var maxElement = elements[0];
                            for (var i = 1; i < elements.length; i++) {
                                if (maxElement.localeCompare(elements[i]) < 0) {
                                    maxElement = elements[i];
                                }
                            }
                            return maxElement;
                        }
                    } else {
                        return null;
                    }
                },
                _functionMin: function(resolvedArgs) {
                    if (resolvedArgs[0].length > 0) {
                        var typeName = this._getTypeName(resolvedArgs[0][0]);
                        if (typeName === TYPE_NUMBER) {
                            return Math.min.apply(Math, resolvedArgs[0]);
                        } else {
                            var elements = resolvedArgs[0];
                            var minElement = elements[0];
                            for (var i = 1; i < elements.length; i++) {
                                if (elements[i].localeCompare(minElement) < 0) {
                                    minElement = elements[i];
                                }
                            }
                            return minElement;
                        }
                    } else {
                        return null;
                    }
                },
                _functionSum: function(resolvedArgs) {
                    var sum = 0;
                    var listToSum = resolvedArgs[0];
                    for (var i = 0; i < listToSum.length; i++) {
                        sum += listToSum[i];
                    }
                    return sum;
                },
                _functionType: function(resolvedArgs) {
                    switch (this._getTypeName(resolvedArgs[0])) {
                      case TYPE_NUMBER:
                        return "number";

                      case TYPE_STRING:
                        return "string";

                      case TYPE_ARRAY:
                        return "array";

                      case TYPE_OBJECT:
                        return "object";

                      case TYPE_BOOLEAN:
                        return "boolean";

                      case TYPE_EXPREF:
                        return "expref";

                      case TYPE_NULL:
                        return "null";
                    }
                },
                _functionKeys: function(resolvedArgs) {
                    return Object.keys(resolvedArgs[0]);
                },
                _functionValues: function(resolvedArgs) {
                    var obj = resolvedArgs[0];
                    var keys = Object.keys(obj);
                    var values = [];
                    for (var i = 0; i < keys.length; i++) {
                        values.push(obj[keys[i]]);
                    }
                    return values;
                },
                _functionJoin: function(resolvedArgs) {
                    var joinChar = resolvedArgs[0];
                    var listJoin = resolvedArgs[1];
                    return listJoin.join(joinChar);
                },
                _functionToArray: function(resolvedArgs) {
                    if (this._getTypeName(resolvedArgs[0]) === TYPE_ARRAY) {
                        return resolvedArgs[0];
                    } else {
                        return [ resolvedArgs[0] ];
                    }
                },
                _functionToString: function(resolvedArgs) {
                    if (this._getTypeName(resolvedArgs[0]) === TYPE_STRING) {
                        return resolvedArgs[0];
                    } else {
                        return JSON.stringify(resolvedArgs[0]);
                    }
                },
                _functionToNumber: function(resolvedArgs) {
                    var typeName = this._getTypeName(resolvedArgs[0]);
                    var convertedValue;
                    if (typeName === TYPE_NUMBER) {
                        return resolvedArgs[0];
                    } else if (typeName === TYPE_STRING) {
                        convertedValue = +resolvedArgs[0];
                        if (!isNaN(convertedValue)) {
                            return convertedValue;
                        }
                    }
                    return null;
                },
                _functionNotNull: function(resolvedArgs) {
                    for (var i = 0; i < resolvedArgs.length; i++) {
                        if (this._getTypeName(resolvedArgs[i]) !== TYPE_NULL) {
                            return resolvedArgs[i];
                        }
                    }
                    return null;
                },
                _functionSort: function(resolvedArgs) {
                    var sortedArray = resolvedArgs[0].slice(0);
                    sortedArray.sort();
                    return sortedArray;
                },
                _functionSortBy: function(resolvedArgs) {
                    var sortedArray = resolvedArgs[0].slice(0);
                    if (sortedArray.length === 0) {
                        return sortedArray;
                    }
                    var interpreter = this._interpreter;
                    var exprefNode = resolvedArgs[1];
                    var requiredType = this._getTypeName(interpreter.visit(exprefNode, sortedArray[0]));
                    if ([ TYPE_NUMBER, TYPE_STRING ].indexOf(requiredType) < 0) {
                        throw new Error("TypeError");
                    }
                    var that = this;
                    var decorated = [];
                    for (var i = 0; i < sortedArray.length; i++) {
                        decorated.push([ i, sortedArray[i] ]);
                    }
                    decorated.sort(function(a, b) {
                        var exprA = interpreter.visit(exprefNode, a[1]);
                        var exprB = interpreter.visit(exprefNode, b[1]);
                        if (that._getTypeName(exprA) !== requiredType) {
                            throw new Error("TypeError: expected " + requiredType + ", received " + that._getTypeName(exprA));
                        } else if (that._getTypeName(exprB) !== requiredType) {
                            throw new Error("TypeError: expected " + requiredType + ", received " + that._getTypeName(exprB));
                        }
                        if (exprA > exprB) {
                            return 1;
                        } else if (exprA < exprB) {
                            return -1;
                        } else {
                            return a[0] - b[0];
                        }
                    });
                    for (var j = 0; j < decorated.length; j++) {
                        sortedArray[j] = decorated[j][1];
                    }
                    return sortedArray;
                },
                _functionMaxBy: function(resolvedArgs) {
                    var exprefNode = resolvedArgs[1];
                    var resolvedArray = resolvedArgs[0];
                    var keyFunction = this.createKeyFunction(exprefNode, [ TYPE_NUMBER, TYPE_STRING ]);
                    var maxNumber = -Infinity;
                    var maxRecord;
                    var current;
                    for (var i = 0; i < resolvedArray.length; i++) {
                        current = keyFunction(resolvedArray[i]);
                        if (current > maxNumber) {
                            maxNumber = current;
                            maxRecord = resolvedArray[i];
                        }
                    }
                    return maxRecord;
                },
                _functionMinBy: function(resolvedArgs) {
                    var exprefNode = resolvedArgs[1];
                    var resolvedArray = resolvedArgs[0];
                    var keyFunction = this.createKeyFunction(exprefNode, [ TYPE_NUMBER, TYPE_STRING ]);
                    var minNumber = Infinity;
                    var minRecord;
                    var current;
                    for (var i = 0; i < resolvedArray.length; i++) {
                        current = keyFunction(resolvedArray[i]);
                        if (current < minNumber) {
                            minNumber = current;
                            minRecord = resolvedArray[i];
                        }
                    }
                    return minRecord;
                },
                createKeyFunction: function(exprefNode, allowedTypes) {
                    var that = this;
                    var interpreter = this._interpreter;
                    var keyFunc = function(x) {
                        var current = interpreter.visit(exprefNode, x);
                        if (allowedTypes.indexOf(that._getTypeName(current)) < 0) {
                            var msg = "TypeError: expected one of " + allowedTypes + ", received " + that._getTypeName(current);
                            throw new Error(msg);
                        }
                        return current;
                    };
                    return keyFunc;
                }
            };
            function compile(stream) {
                var parser = new Parser();
                var ast = parser.parse(stream);
                return ast;
            }
            function tokenize(stream) {
                var lexer = new Lexer();
                return lexer.tokenize(stream);
            }
            function search(data, expression) {
                var parser = new Parser();
                var runtime = new Runtime();
                var interpreter = new TreeInterpreter(runtime);
                runtime._interpreter = interpreter;
                var node = parser.parse(expression);
                return interpreter.search(node, data);
            }
            exports.tokenize = tokenize;
            exports.compile = compile;
            exports.search = search;
            exports.strictDeepEqual = strictDeepEqual;
        })(typeof exports === "undefined" ? this.jmespath = {} : exports);
    }, {} ],
    2: [ function(require, module, exports) {}, {} ]
}, {}, []);

_xamzrequire = function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof _xamzrequire == "function" && _xamzrequire;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f;
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }
        return n[o].exports;
    }
    var i = typeof _xamzrequire == "function" && _xamzrequire;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s;
}({
    184: [ function(require, module, exports) {
        require("./browser_loader");
        var AWS = require("./core");
        if (typeof window !== "undefined") window.AWS = AWS;
        if (typeof module !== "undefined") module.exports = AWS;
        if (typeof self !== "undefined") self.AWS = AWS;
    }, {
        "./browser_loader": 191,
        "./core": 194
    } ],
    191: [ function(require, module, exports) {
        (function(process) {
            var util = require("./util");
            util.crypto.lib = require("./browserCryptoLib");
            util.Buffer = require("buffer/").Buffer;
            util.url = require("url/");
            util.querystring = require("querystring/");
            util.environment = "js";
            var AWS = require("./core");
            module.exports = AWS;
            require("./credentials");
            require("./credentials/credential_provider_chain");
            require("./credentials/temporary_credentials");
            require("./credentials/web_identity_credentials");
            require("./credentials/cognito_identity_credentials");
            require("./credentials/saml_credentials");
            AWS.XML.Parser = require("./xml/browser_parser");
            require("./http/xhr");
            if (typeof process === "undefined") {
                process = {
                    browser: true
                };
            }
        }).call(this, require("_process"));
    }, {
        "./browserCryptoLib": 185,
        "./core": 194,
        "./credentials": 195,
        "./credentials/cognito_identity_credentials": 196,
        "./credentials/credential_provider_chain": 197,
        "./credentials/saml_credentials": 198,
        "./credentials/temporary_credentials": 199,
        "./credentials/web_identity_credentials": 200,
        "./http/xhr": 209,
        "./util": 261,
        "./xml/browser_parser": 262,
        _process: 148,
        "buffer/": 3,
        "querystring/": 155,
        "url/": 156
    } ],
    262: [ function(require, module, exports) {
        var util = require("../util");
        var Shape = require("../model/shape");
        function DomXmlParser() {}
        DomXmlParser.prototype.parse = function(xml, shape) {
            if (xml.replace(/^\s+/, "") === "") return {};
            var result, error;
            try {
                if (window.DOMParser) {
                    try {
                        var parser = new DOMParser();
                        result = parser.parseFromString(xml, "text/xml");
                    } catch (syntaxError) {
                        throw util.error(new Error("Parse error in document"), {
                            originalError: syntaxError,
                            code: "XMLParserError",
                            retryable: true
                        });
                    }
                    if (result.documentElement === null) {
                        throw util.error(new Error("Cannot parse empty document."), {
                            code: "XMLParserError",
                            retryable: true
                        });
                    }
                    var isError = result.getElementsByTagName("parsererror")[0];
                    if (isError && (isError.parentNode === result || isError.parentNode.nodeName === "body" || isError.parentNode.parentNode === result || isError.parentNode.parentNode.nodeName === "body")) {
                        var errorElement = isError.getElementsByTagName("div")[0] || isError;
                        throw util.error(new Error(errorElement.textContent || "Parser error in document"), {
                            code: "XMLParserError",
                            retryable: true
                        });
                    }
                } else if (window.ActiveXObject) {
                    result = new window.ActiveXObject("Microsoft.XMLDOM");
                    result.async = false;
                    if (!result.loadXML(xml)) {
                        throw util.error(new Error("Parse error in document"), {
                            code: "XMLParserError",
                            retryable: true
                        });
                    }
                } else {
                    throw new Error("Cannot load XML parser");
                }
            } catch (e) {
                error = e;
            }
            if (result && result.documentElement && !error) {
                var data = parseXml(result.documentElement, shape);
                var metadata = result.getElementsByTagName("ResponseMetadata")[0];
                if (metadata) {
                    data.ResponseMetadata = parseXml(metadata, {});
                }
                return data;
            } else if (error) {
                throw util.error(error || new Error(), {
                    code: "XMLParserError",
                    retryable: true
                });
            } else {
                return {};
            }
        };
        function parseXml(xml, shape) {
            if (!shape) shape = {};
            switch (shape.type) {
              case "structure":
                return parseStructure(xml, shape);

              case "map":
                return parseMap(xml, shape);

              case "list":
                return parseList(xml, shape);

              case undefined:
              case null:
                return parseUnknown(xml);

              default:
                return parseScalar(xml, shape);
            }
        }
        function parseStructure(xml, shape) {
            var data = {};
            if (xml === null) return data;
            util.each(shape.members, function(memberName, memberShape) {
                if (memberShape.isXmlAttribute) {
                    if (Object.prototype.hasOwnProperty.call(xml.attributes, memberShape.name)) {
                        var value = xml.attributes[memberShape.name].value;
                        data[memberName] = parseXml({
                            textContent: value
                        }, memberShape);
                    }
                } else {
                    var xmlChild = memberShape.flattened ? xml : xml.getElementsByTagName(memberShape.name)[0];
                    if (xmlChild) {
                        data[memberName] = parseXml(xmlChild, memberShape);
                    } else if (!memberShape.flattened && memberShape.type === "list") {
                        data[memberName] = memberShape.defaultValue;
                    }
                }
            });
            return data;
        }
        function parseMap(xml, shape) {
            var data = {};
            var xmlKey = shape.key.name || "key";
            var xmlValue = shape.value.name || "value";
            var tagName = shape.flattened ? shape.name : "entry";
            var child = xml.firstElementChild;
            while (child) {
                if (child.nodeName === tagName) {
                    var key = child.getElementsByTagName(xmlKey)[0].textContent;
                    var value = child.getElementsByTagName(xmlValue)[0];
                    data[key] = parseXml(value, shape.value);
                }
                child = child.nextElementSibling;
            }
            return data;
        }
        function parseList(xml, shape) {
            var data = [];
            var tagName = shape.flattened ? shape.name : shape.member.name || "member";
            var child = xml.firstElementChild;
            while (child) {
                if (child.nodeName === tagName) {
                    data.push(parseXml(child, shape.member));
                }
                child = child.nextElementSibling;
            }
            return data;
        }
        function parseScalar(xml, shape) {
            if (xml.getAttribute) {
                var encoding = xml.getAttribute("encoding");
                if (encoding === "base64") {
                    shape = new Shape.create({
                        type: encoding
                    });
                }
            }
            var text = xml.textContent;
            if (text === "") text = null;
            if (typeof shape.toType === "function") {
                return shape.toType(text);
            } else {
                return text;
            }
        }
        function parseUnknown(xml) {
            if (xml === undefined || xml === null) return "";
            if (!xml.firstElementChild) {
                if (xml.parentNode.parentNode === null) return {};
                if (xml.childNodes.length === 0) return ""; else return xml.textContent;
            }
            var shape = {
                type: "structure",
                members: {}
            };
            var child = xml.firstElementChild;
            while (child) {
                var tag = child.nodeName;
                if (Object.prototype.hasOwnProperty.call(shape.members, tag)) {
                    shape.members[tag].type = "list";
                } else {
                    shape.members[tag] = {
                        name: tag
                    };
                }
                child = child.nextElementSibling;
            }
            return parseStructure(xml, shape);
        }
        module.exports = DomXmlParser;
    }, {
        "../model/shape": 217,
        "../util": 261
    } ],
    209: [ function(require, module, exports) {
        var AWS = require("../core");
        var EventEmitter = require("events").EventEmitter;
        require("../http");
        AWS.XHRClient = AWS.util.inherit({
            handleRequest: function handleRequest(httpRequest, httpOptions, callback, errCallback) {
                var self = this;
                var endpoint = httpRequest.endpoint;
                var emitter = new EventEmitter();
                var href = endpoint.protocol + "//" + endpoint.hostname;
                if (endpoint.port !== 80 && endpoint.port !== 443) {
                    href += ":" + endpoint.port;
                }
                href += httpRequest.path;
                var xhr = new XMLHttpRequest(), headersEmitted = false;
                httpRequest.stream = xhr;
                xhr.addEventListener("readystatechange", function() {
                    try {
                        if (xhr.status === 0) return;
                    } catch (e) {
                        return;
                    }
                    if (this.readyState >= this.HEADERS_RECEIVED && !headersEmitted) {
                        emitter.statusCode = xhr.status;
                        emitter.headers = self.parseHeaders(xhr.getAllResponseHeaders());
                        emitter.emit("headers", emitter.statusCode, emitter.headers, xhr.statusText);
                        headersEmitted = true;
                    }
                    if (this.readyState === this.DONE) {
                        self.finishRequest(xhr, emitter);
                    }
                }, false);
                xhr.upload.addEventListener("progress", function(evt) {
                    emitter.emit("sendProgress", evt);
                });
                xhr.addEventListener("progress", function(evt) {
                    emitter.emit("receiveProgress", evt);
                }, false);
                xhr.addEventListener("timeout", function() {
                    errCallback(AWS.util.error(new Error("Timeout"), {
                        code: "TimeoutError"
                    }));
                }, false);
                xhr.addEventListener("error", function() {
                    errCallback(AWS.util.error(new Error("Network Failure"), {
                        code: "NetworkingError"
                    }));
                }, false);
                xhr.addEventListener("abort", function() {
                    errCallback(AWS.util.error(new Error("Request aborted"), {
                        code: "RequestAbortedError"
                    }));
                }, false);
                callback(emitter);
                xhr.open(httpRequest.method, href, httpOptions.xhrAsync !== false);
                AWS.util.each(httpRequest.headers, function(key, value) {
                    if (key !== "Content-Length" && key !== "User-Agent" && key !== "Host") {
                        xhr.setRequestHeader(key, value);
                    }
                });
                if (httpOptions.timeout && httpOptions.xhrAsync !== false) {
                    xhr.timeout = httpOptions.timeout;
                }
                if (httpOptions.xhrWithCredentials) {
                    xhr.withCredentials = true;
                }
                try {
                    xhr.responseType = "arraybuffer";
                } catch (e) {}
                try {
                    if (httpRequest.body) {
                        xhr.send(httpRequest.body);
                    } else {
                        xhr.send();
                    }
                } catch (err) {
                    if (httpRequest.body && typeof httpRequest.body.buffer === "object") {
                        xhr.send(httpRequest.body.buffer);
                    } else {
                        throw err;
                    }
                }
                return emitter;
            },
            parseHeaders: function parseHeaders(rawHeaders) {
                var headers = {};
                AWS.util.arrayEach(rawHeaders.split(/\r?\n/), function(line) {
                    var key = line.split(":", 1)[0];
                    var value = line.substring(key.length + 2);
                    if (key.length > 0) headers[key.toLowerCase()] = value;
                });
                return headers;
            },
            finishRequest: function finishRequest(xhr, emitter) {
                var buffer;
                if (xhr.responseType === "arraybuffer" && xhr.response) {
                    var ab = xhr.response;
                    buffer = new AWS.util.Buffer(ab.byteLength);
                    var view = new Uint8Array(ab);
                    for (var i = 0; i < buffer.length; ++i) {
                        buffer[i] = view[i];
                    }
                }
                try {
                    if (!buffer && typeof xhr.responseText === "string") {
                        buffer = new AWS.util.Buffer(xhr.responseText);
                    }
                } catch (e) {}
                if (buffer) emitter.emit("data", buffer);
                emitter.emit("end");
            }
        });
        AWS.HttpClient.prototype = AWS.XHRClient.prototype;
        AWS.HttpClient.streamsApiVersion = 1;
    }, {
        "../core": 194,
        "../http": 208,
        events: 4
    } ],
    200: [ function(require, module, exports) {
        var AWS = require("../core");
        AWS.WebIdentityCredentials = AWS.util.inherit(AWS.Credentials, {
            constructor: function WebIdentityCredentials(params, clientConfig) {
                AWS.Credentials.call(this);
                this.expired = true;
                this.params = params;
                this.params.RoleSessionName = this.params.RoleSessionName || "web-identity";
                this.data = null;
                this._clientConfig = AWS.util.copy(clientConfig || {});
            },
            refresh: function refresh(callback) {
                var self = this;
                self.createClients();
                if (!callback) callback = function(err) {
                    if (err) throw err;
                };
                self.service.assumeRoleWithWebIdentity(function(err, data) {
                    self.data = null;
                    if (!err) {
                        self.data = data;
                        self.service.credentialsFrom(data, self);
                    }
                    callback(err);
                });
            },
            createClients: function() {
                if (!this.service) {
                    var stsConfig = AWS.util.merge({}, this._clientConfig);
                    stsConfig.params = this.params;
                    this.service = new AWS.STS(stsConfig);
                }
            }
        });
    }, {
        "../core": 194
    } ],
    199: [ function(require, module, exports) {
        var AWS = require("../core");
        AWS.TemporaryCredentials = AWS.util.inherit(AWS.Credentials, {
            constructor: function TemporaryCredentials(params, masterCredentials) {
                AWS.Credentials.call(this);
                this.loadMasterCredentials(masterCredentials);
                this.expired = true;
                this.params = params || {};
                if (this.params.RoleArn) {
                    this.params.RoleSessionName = this.params.RoleSessionName || "temporary-credentials";
                }
            },
            refresh: function refresh(callback) {
                var self = this;
                self.createClients();
                if (!callback) callback = function(err) {
                    if (err) throw err;
                };
                self.masterCredentials.get(function() {
                    self.service.config.credentials = self.masterCredentials;
                    var operation = self.params.RoleArn ? self.service.assumeRole : self.service.getSessionToken;
                    operation.call(self.service, function(err, data) {
                        if (!err) {
                            self.service.credentialsFrom(data, self);
                        }
                        callback(err);
                    });
                });
            },
            loadMasterCredentials: function loadMasterCredentials(masterCredentials) {
                this.masterCredentials = masterCredentials || AWS.config.credentials;
                while (this.masterCredentials.masterCredentials) {
                    this.masterCredentials = this.masterCredentials.masterCredentials;
                }
                if (typeof this.masterCredentials.get !== "function") {
                    this.masterCredentials = new AWS.Credentials(this.masterCredentials);
                }
            },
            createClients: function() {
                this.service = this.service || new AWS.STS({
                    params: this.params
                });
            }
        });
    }, {
        "../core": 194
    } ],
    198: [ function(require, module, exports) {
        var AWS = require("../core");
        AWS.SAMLCredentials = AWS.util.inherit(AWS.Credentials, {
            constructor: function SAMLCredentials(params) {
                AWS.Credentials.call(this);
                this.expired = true;
                this.params = params;
            },
            refresh: function refresh(callback) {
                var self = this;
                self.createClients();
                if (!callback) callback = function(err) {
                    if (err) throw err;
                };
                self.service.assumeRoleWithSAML(function(err, data) {
                    if (!err) {
                        self.service.credentialsFrom(data, self);
                    }
                    callback(err);
                });
            },
            createClients: function() {
                this.service = this.service || new AWS.STS({
                    params: this.params
                });
            }
        });
    }, {
        "../core": 194
    } ],
    196: [ function(require, module, exports) {
        var AWS = require("../core");
        AWS.CognitoIdentityCredentials = AWS.util.inherit(AWS.Credentials, {
            localStorageKey: {
                id: "aws.cognito.identity-id.",
                providers: "aws.cognito.identity-providers."
            },
            constructor: function CognitoIdentityCredentials(params, clientConfig) {
                AWS.Credentials.call(this);
                this.expired = true;
                this.params = params;
                this.data = null;
                this._identityId = null;
                this._clientConfig = AWS.util.copy(clientConfig || {});
                this.loadCachedId();
                var self = this;
                Object.defineProperty(this, "identityId", {
                    get: function() {
                        self.loadCachedId();
                        return self._identityId || self.params.IdentityId;
                    },
                    set: function(identityId) {
                        self._identityId = identityId;
                    }
                });
            },
            refresh: function refresh(callback) {
                var self = this;
                self.createClients();
                self.data = null;
                self._identityId = null;
                self.getId(function(err) {
                    if (!err) {
                        if (!self.params.RoleArn) {
                            self.getCredentialsForIdentity(callback);
                        } else {
                            self.getCredentialsFromSTS(callback);
                        }
                    } else {
                        self.clearIdOnNotAuthorized(err);
                        callback(err);
                    }
                });
            },
            clearCachedId: function clearCache() {
                this._identityId = null;
                delete this.params.IdentityId;
                var poolId = this.params.IdentityPoolId;
                var loginId = this.params.LoginId || "";
                delete this.storage[this.localStorageKey.id + poolId + loginId];
                delete this.storage[this.localStorageKey.providers + poolId + loginId];
            },
            clearIdOnNotAuthorized: function clearIdOnNotAuthorized(err) {
                var self = this;
                if (err.code == "NotAuthorizedException") {
                    self.clearCachedId();
                }
            },
            getId: function getId(callback) {
                var self = this;
                if (typeof self.params.IdentityId === "string") {
                    return callback(null, self.params.IdentityId);
                }
                self.cognito.getId(function(err, data) {
                    if (!err && data.IdentityId) {
                        self.params.IdentityId = data.IdentityId;
                        callback(null, data.IdentityId);
                    } else {
                        callback(err);
                    }
                });
            },
            loadCredentials: function loadCredentials(data, credentials) {
                if (!data || !credentials) return;
                credentials.expired = false;
                credentials.accessKeyId = data.Credentials.AccessKeyId;
                credentials.secretAccessKey = data.Credentials.SecretKey;
                credentials.sessionToken = data.Credentials.SessionToken;
                credentials.expireTime = data.Credentials.Expiration;
            },
            getCredentialsForIdentity: function getCredentialsForIdentity(callback) {
                var self = this;
                self.cognito.getCredentialsForIdentity(function(err, data) {
                    if (!err) {
                        self.cacheId(data);
                        self.data = data;
                        self.loadCredentials(self.data, self);
                    } else {
                        self.clearIdOnNotAuthorized(err);
                    }
                    callback(err);
                });
            },
            getCredentialsFromSTS: function getCredentialsFromSTS(callback) {
                var self = this;
                self.cognito.getOpenIdToken(function(err, data) {
                    if (!err) {
                        self.cacheId(data);
                        self.params.WebIdentityToken = data.Token;
                        self.webIdentityCredentials.refresh(function(webErr) {
                            if (!webErr) {
                                self.data = self.webIdentityCredentials.data;
                                self.sts.credentialsFrom(self.data, self);
                            }
                            callback(webErr);
                        });
                    } else {
                        self.clearIdOnNotAuthorized(err);
                        callback(err);
                    }
                });
            },
            loadCachedId: function loadCachedId() {
                var self = this;
                if (AWS.util.isBrowser() && !self.params.IdentityId) {
                    var id = self.getStorage("id");
                    if (id && self.params.Logins) {
                        var actualProviders = Object.keys(self.params.Logins);
                        var cachedProviders = (self.getStorage("providers") || "").split(",");
                        var intersect = cachedProviders.filter(function(n) {
                            return actualProviders.indexOf(n) !== -1;
                        });
                        if (intersect.length !== 0) {
                            self.params.IdentityId = id;
                        }
                    } else if (id) {
                        self.params.IdentityId = id;
                    }
                }
            },
            createClients: function() {
                var clientConfig = this._clientConfig;
                this.webIdentityCredentials = this.webIdentityCredentials || new AWS.WebIdentityCredentials(this.params, clientConfig);
                if (!this.cognito) {
                    var cognitoConfig = AWS.util.merge({}, clientConfig);
                    cognitoConfig.params = this.params;
                    this.cognito = new AWS.CognitoIdentity(cognitoConfig);
                }
                this.sts = this.sts || new AWS.STS(clientConfig);
            },
            cacheId: function cacheId(data) {
                this._identityId = data.IdentityId;
                this.params.IdentityId = this._identityId;
                if (AWS.util.isBrowser()) {
                    this.setStorage("id", data.IdentityId);
                    if (this.params.Logins) {
                        this.setStorage("providers", Object.keys(this.params.Logins).join(","));
                    }
                }
            },
            getStorage: function getStorage(key) {
                return this.storage[this.localStorageKey[key] + this.params.IdentityPoolId + (this.params.LoginId || "")];
            },
            setStorage: function setStorage(key, val) {
                try {
                    this.storage[this.localStorageKey[key] + this.params.IdentityPoolId + (this.params.LoginId || "")] = val;
                } catch (_) {}
            },
            storage: function() {
                try {
                    var storage = AWS.util.isBrowser() && window.localStorage !== null && typeof window.localStorage === "object" ? window.localStorage : {};
                    storage["aws.test-storage"] = "foobar";
                    delete storage["aws.test-storage"];
                    return storage;
                } catch (_) {
                    return {};
                }
            }()
        });
    }, {
        "../core": 194
    } ],
    185: [ function(require, module, exports) {
        var Hmac = require("./browserHmac");
        var Md5 = require("./browserMd5");
        var Sha1 = require("./browserSha1");
        var Sha256 = require("./browserSha256");
        module.exports = exports = {
            createHash: function createHash(alg) {
                alg = alg.toLowerCase();
                if (alg === "md5") {
                    return new Md5();
                } else if (alg === "sha256") {
                    return new Sha256();
                } else if (alg === "sha1") {
                    return new Sha1();
                }
                throw new Error("Hash algorithm " + alg + " is not supported in the browser SDK");
            },
            createHmac: function createHmac(alg, key) {
                alg = alg.toLowerCase();
                if (alg === "md5") {
                    return new Hmac(Md5, key);
                } else if (alg === "sha256") {
                    return new Hmac(Sha256, key);
                } else if (alg === "sha1") {
                    return new Hmac(Sha1, key);
                }
                throw new Error("HMAC algorithm " + alg + " is not supported in the browser SDK");
            },
            createSign: function() {
                throw new Error("createSign is not implemented in the browser");
            }
        };
    }, {
        "./browserHmac": 187,
        "./browserMd5": 188,
        "./browserSha1": 189,
        "./browserSha256": 190
    } ],
    190: [ function(require, module, exports) {
        var Buffer = require("buffer/").Buffer;
        var hashUtils = require("./browserHashUtils");
        var BLOCK_SIZE = 64;
        var DIGEST_LENGTH = 32;
        var KEY = new Uint32Array([ 1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298 ]);
        var INIT = [ 1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225 ];
        var MAX_HASHABLE_LENGTH = Math.pow(2, 53) - 1;
        function Sha256() {
            this.state = [ 1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225 ];
            this.temp = new Int32Array(64);
            this.buffer = new Uint8Array(64);
            this.bufferLength = 0;
            this.bytesHashed = 0;
            this.finished = false;
        }
        module.exports = exports = Sha256;
        Sha256.BLOCK_SIZE = BLOCK_SIZE;
        Sha256.prototype.update = function(data) {
            if (this.finished) {
                throw new Error("Attempted to update an already finished hash.");
            }
            if (hashUtils.isEmptyData(data)) {
                return this;
            }
            data = hashUtils.convertToBuffer(data);
            var position = 0;
            var byteLength = data.byteLength;
            this.bytesHashed += byteLength;
            if (this.bytesHashed * 8 > MAX_HASHABLE_LENGTH) {
                throw new Error("Cannot hash more than 2^53 - 1 bits");
            }
            while (byteLength > 0) {
                this.buffer[this.bufferLength++] = data[position++];
                byteLength--;
                if (this.bufferLength === BLOCK_SIZE) {
                    this.hashBuffer();
                    this.bufferLength = 0;
                }
            }
            return this;
        };
        Sha256.prototype.digest = function(encoding) {
            if (!this.finished) {
                var bitsHashed = this.bytesHashed * 8;
                var bufferView = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
                var undecoratedLength = this.bufferLength;
                bufferView.setUint8(this.bufferLength++, 128);
                if (undecoratedLength % BLOCK_SIZE >= BLOCK_SIZE - 8) {
                    for (var i = this.bufferLength; i < BLOCK_SIZE; i++) {
                        bufferView.setUint8(i, 0);
                    }
                    this.hashBuffer();
                    this.bufferLength = 0;
                }
                for (var i = this.bufferLength; i < BLOCK_SIZE - 8; i++) {
                    bufferView.setUint8(i, 0);
                }
                bufferView.setUint32(BLOCK_SIZE - 8, Math.floor(bitsHashed / 4294967296), true);
                bufferView.setUint32(BLOCK_SIZE - 4, bitsHashed);
                this.hashBuffer();
                this.finished = true;
            }
            var out = new Buffer(DIGEST_LENGTH);
            for (var i = 0; i < 8; i++) {
                out[i * 4] = this.state[i] >>> 24 & 255;
                out[i * 4 + 1] = this.state[i] >>> 16 & 255;
                out[i * 4 + 2] = this.state[i] >>> 8 & 255;
                out[i * 4 + 3] = this.state[i] >>> 0 & 255;
            }
            return encoding ? out.toString(encoding) : out;
        };
        Sha256.prototype.hashBuffer = function() {
            var _a = this, buffer = _a.buffer, state = _a.state;
            var state0 = state[0], state1 = state[1], state2 = state[2], state3 = state[3], state4 = state[4], state5 = state[5], state6 = state[6], state7 = state[7];
            for (var i = 0; i < BLOCK_SIZE; i++) {
                if (i < 16) {
                    this.temp[i] = (buffer[i * 4] & 255) << 24 | (buffer[i * 4 + 1] & 255) << 16 | (buffer[i * 4 + 2] & 255) << 8 | buffer[i * 4 + 3] & 255;
                } else {
                    var u = this.temp[i - 2];
                    var t1_1 = (u >>> 17 | u << 15) ^ (u >>> 19 | u << 13) ^ u >>> 10;
                    u = this.temp[i - 15];
                    var t2_1 = (u >>> 7 | u << 25) ^ (u >>> 18 | u << 14) ^ u >>> 3;
                    this.temp[i] = (t1_1 + this.temp[i - 7] | 0) + (t2_1 + this.temp[i - 16] | 0);
                }
                var t1 = (((state4 >>> 6 | state4 << 26) ^ (state4 >>> 11 | state4 << 21) ^ (state4 >>> 25 | state4 << 7)) + (state4 & state5 ^ ~state4 & state6) | 0) + (state7 + (KEY[i] + this.temp[i] | 0) | 0) | 0;
                var t2 = ((state0 >>> 2 | state0 << 30) ^ (state0 >>> 13 | state0 << 19) ^ (state0 >>> 22 | state0 << 10)) + (state0 & state1 ^ state0 & state2 ^ state1 & state2) | 0;
                state7 = state6;
                state6 = state5;
                state5 = state4;
                state4 = state3 + t1 | 0;
                state3 = state2;
                state2 = state1;
                state1 = state0;
                state0 = t1 + t2 | 0;
            }
            state[0] += state0;
            state[1] += state1;
            state[2] += state2;
            state[3] += state3;
            state[4] += state4;
            state[5] += state5;
            state[6] += state6;
            state[7] += state7;
        };
    }, {
        "./browserHashUtils": 186,
        "buffer/": 3
    } ],
    189: [ function(require, module, exports) {
        var Buffer = require("buffer/").Buffer;
        var hashUtils = require("./browserHashUtils");
        var BLOCK_SIZE = 64;
        var DIGEST_LENGTH = 20;
        var KEY = new Uint32Array([ 1518500249, 1859775393, 2400959708 | 0, 3395469782 | 0 ]);
        var INIT = [ 1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225 ];
        var MAX_HASHABLE_LENGTH = Math.pow(2, 53) - 1;
        function Sha1() {
            this.h0 = 1732584193;
            this.h1 = 4023233417;
            this.h2 = 2562383102;
            this.h3 = 271733878;
            this.h4 = 3285377520;
            this.block = new Uint32Array(80);
            this.offset = 0;
            this.shift = 24;
            this.totalLength = 0;
        }
        module.exports = exports = Sha1;
        Sha1.BLOCK_SIZE = BLOCK_SIZE;
        Sha1.prototype.update = function(data) {
            if (this.finished) {
                throw new Error("Attempted to update an already finished hash.");
            }
            if (hashUtils.isEmptyData(data)) {
                return this;
            }
            data = hashUtils.convertToBuffer(data);
            var length = data.length;
            this.totalLength += length * 8;
            for (var i = 0; i < length; i++) {
                this.write(data[i]);
            }
            return this;
        };
        Sha1.prototype.write = function write(byte) {
            this.block[this.offset] |= (byte & 255) << this.shift;
            if (this.shift) {
                this.shift -= 8;
            } else {
                this.offset++;
                this.shift = 24;
            }
            if (this.offset === 16) this.processBlock();
        };
        Sha1.prototype.digest = function(encoding) {
            this.write(128);
            if (this.offset > 14 || this.offset === 14 && this.shift < 24) {
                this.processBlock();
            }
            this.offset = 14;
            this.shift = 24;
            this.write(0);
            this.write(0);
            this.write(this.totalLength > 0xffffffffff ? this.totalLength / 1099511627776 : 0);
            this.write(this.totalLength > 4294967295 ? this.totalLength / 4294967296 : 0);
            for (var s = 24; s >= 0; s -= 8) {
                this.write(this.totalLength >> s);
            }
            var out = new Buffer(DIGEST_LENGTH);
            var outView = new DataView(out.buffer);
            outView.setUint32(0, this.h0, false);
            outView.setUint32(4, this.h1, false);
            outView.setUint32(8, this.h2, false);
            outView.setUint32(12, this.h3, false);
            outView.setUint32(16, this.h4, false);
            return encoding ? out.toString(encoding) : out;
        };
        Sha1.prototype.processBlock = function processBlock() {
            for (var i = 16; i < 80; i++) {
                var w = this.block[i - 3] ^ this.block[i - 8] ^ this.block[i - 14] ^ this.block[i - 16];
                this.block[i] = w << 1 | w >>> 31;
            }
            var a = this.h0;
            var b = this.h1;
            var c = this.h2;
            var d = this.h3;
            var e = this.h4;
            var f, k;
            for (i = 0; i < 80; i++) {
                if (i < 20) {
                    f = d ^ b & (c ^ d);
                    k = 1518500249;
                } else if (i < 40) {
                    f = b ^ c ^ d;
                    k = 1859775393;
                } else if (i < 60) {
                    f = b & c | d & (b | c);
                    k = 2400959708;
                } else {
                    f = b ^ c ^ d;
                    k = 3395469782;
                }
                var temp = (a << 5 | a >>> 27) + f + e + k + (this.block[i] | 0);
                e = d;
                d = c;
                c = b << 30 | b >>> 2;
                b = a;
                a = temp;
            }
            this.h0 = this.h0 + a | 0;
            this.h1 = this.h1 + b | 0;
            this.h2 = this.h2 + c | 0;
            this.h3 = this.h3 + d | 0;
            this.h4 = this.h4 + e | 0;
            this.offset = 0;
            for (i = 0; i < 16; i++) {
                this.block[i] = 0;
            }
        };
    }, {
        "./browserHashUtils": 186,
        "buffer/": 3
    } ],
    188: [ function(require, module, exports) {
        var hashUtils = require("./browserHashUtils");
        var Buffer = require("buffer/").Buffer;
        var BLOCK_SIZE = 64;
        var DIGEST_LENGTH = 16;
        var INIT = [ 1732584193, 4023233417, 2562383102, 271733878 ];
        function Md5() {
            this.state = [ 1732584193, 4023233417, 2562383102, 271733878 ];
            this.buffer = new DataView(new ArrayBuffer(BLOCK_SIZE));
            this.bufferLength = 0;
            this.bytesHashed = 0;
            this.finished = false;
        }
        module.exports = exports = Md5;
        Md5.BLOCK_SIZE = BLOCK_SIZE;
        Md5.prototype.update = function(sourceData) {
            if (hashUtils.isEmptyData(sourceData)) {
                return this;
            } else if (this.finished) {
                throw new Error("Attempted to update an already finished hash.");
            }
            var data = hashUtils.convertToBuffer(sourceData);
            var position = 0;
            var byteLength = data.byteLength;
            this.bytesHashed += byteLength;
            while (byteLength > 0) {
                this.buffer.setUint8(this.bufferLength++, data[position++]);
                byteLength--;
                if (this.bufferLength === BLOCK_SIZE) {
                    this.hashBuffer();
                    this.bufferLength = 0;
                }
            }
            return this;
        };
        Md5.prototype.digest = function(encoding) {
            if (!this.finished) {
                var _a = this, buffer = _a.buffer, undecoratedLength = _a.bufferLength, bytesHashed = _a.bytesHashed;
                var bitsHashed = bytesHashed * 8;
                buffer.setUint8(this.bufferLength++, 128);
                if (undecoratedLength % BLOCK_SIZE >= BLOCK_SIZE - 8) {
                    for (var i = this.bufferLength; i < BLOCK_SIZE; i++) {
                        buffer.setUint8(i, 0);
                    }
                    this.hashBuffer();
                    this.bufferLength = 0;
                }
                for (var i = this.bufferLength; i < BLOCK_SIZE - 8; i++) {
                    buffer.setUint8(i, 0);
                }
                buffer.setUint32(BLOCK_SIZE - 8, bitsHashed >>> 0, true);
                buffer.setUint32(BLOCK_SIZE - 4, Math.floor(bitsHashed / 4294967296), true);
                this.hashBuffer();
                this.finished = true;
            }
            var out = new DataView(new ArrayBuffer(DIGEST_LENGTH));
            for (var i = 0; i < 4; i++) {
                out.setUint32(i * 4, this.state[i], true);
            }
            var buff = new Buffer(out.buffer, out.byteOffset, out.byteLength);
            return encoding ? buff.toString(encoding) : buff;
        };
        Md5.prototype.hashBuffer = function() {
            var _a = this, buffer = _a.buffer, state = _a.state;
            var a = state[0], b = state[1], c = state[2], d = state[3];
            a = ff(a, b, c, d, buffer.getUint32(0, true), 7, 3614090360);
            d = ff(d, a, b, c, buffer.getUint32(4, true), 12, 3905402710);
            c = ff(c, d, a, b, buffer.getUint32(8, true), 17, 606105819);
            b = ff(b, c, d, a, buffer.getUint32(12, true), 22, 3250441966);
            a = ff(a, b, c, d, buffer.getUint32(16, true), 7, 4118548399);
            d = ff(d, a, b, c, buffer.getUint32(20, true), 12, 1200080426);
            c = ff(c, d, a, b, buffer.getUint32(24, true), 17, 2821735955);
            b = ff(b, c, d, a, buffer.getUint32(28, true), 22, 4249261313);
            a = ff(a, b, c, d, buffer.getUint32(32, true), 7, 1770035416);
            d = ff(d, a, b, c, buffer.getUint32(36, true), 12, 2336552879);
            c = ff(c, d, a, b, buffer.getUint32(40, true), 17, 4294925233);
            b = ff(b, c, d, a, buffer.getUint32(44, true), 22, 2304563134);
            a = ff(a, b, c, d, buffer.getUint32(48, true), 7, 1804603682);
            d = ff(d, a, b, c, buffer.getUint32(52, true), 12, 4254626195);
            c = ff(c, d, a, b, buffer.getUint32(56, true), 17, 2792965006);
            b = ff(b, c, d, a, buffer.getUint32(60, true), 22, 1236535329);
            a = gg(a, b, c, d, buffer.getUint32(4, true), 5, 4129170786);
            d = gg(d, a, b, c, buffer.getUint32(24, true), 9, 3225465664);
            c = gg(c, d, a, b, buffer.getUint32(44, true), 14, 643717713);
            b = gg(b, c, d, a, buffer.getUint32(0, true), 20, 3921069994);
            a = gg(a, b, c, d, buffer.getUint32(20, true), 5, 3593408605);
            d = gg(d, a, b, c, buffer.getUint32(40, true), 9, 38016083);
            c = gg(c, d, a, b, buffer.getUint32(60, true), 14, 3634488961);
            b = gg(b, c, d, a, buffer.getUint32(16, true), 20, 3889429448);
            a = gg(a, b, c, d, buffer.getUint32(36, true), 5, 568446438);
            d = gg(d, a, b, c, buffer.getUint32(56, true), 9, 3275163606);
            c = gg(c, d, a, b, buffer.getUint32(12, true), 14, 4107603335);
            b = gg(b, c, d, a, buffer.getUint32(32, true), 20, 1163531501);
            a = gg(a, b, c, d, buffer.getUint32(52, true), 5, 2850285829);
            d = gg(d, a, b, c, buffer.getUint32(8, true), 9, 4243563512);
            c = gg(c, d, a, b, buffer.getUint32(28, true), 14, 1735328473);
            b = gg(b, c, d, a, buffer.getUint32(48, true), 20, 2368359562);
            a = hh(a, b, c, d, buffer.getUint32(20, true), 4, 4294588738);
            d = hh(d, a, b, c, buffer.getUint32(32, true), 11, 2272392833);
            c = hh(c, d, a, b, buffer.getUint32(44, true), 16, 1839030562);
            b = hh(b, c, d, a, buffer.getUint32(56, true), 23, 4259657740);
            a = hh(a, b, c, d, buffer.getUint32(4, true), 4, 2763975236);
            d = hh(d, a, b, c, buffer.getUint32(16, true), 11, 1272893353);
            c = hh(c, d, a, b, buffer.getUint32(28, true), 16, 4139469664);
            b = hh(b, c, d, a, buffer.getUint32(40, true), 23, 3200236656);
            a = hh(a, b, c, d, buffer.getUint32(52, true), 4, 681279174);
            d = hh(d, a, b, c, buffer.getUint32(0, true), 11, 3936430074);
            c = hh(c, d, a, b, buffer.getUint32(12, true), 16, 3572445317);
            b = hh(b, c, d, a, buffer.getUint32(24, true), 23, 76029189);
            a = hh(a, b, c, d, buffer.getUint32(36, true), 4, 3654602809);
            d = hh(d, a, b, c, buffer.getUint32(48, true), 11, 3873151461);
            c = hh(c, d, a, b, buffer.getUint32(60, true), 16, 530742520);
            b = hh(b, c, d, a, buffer.getUint32(8, true), 23, 3299628645);
            a = ii(a, b, c, d, buffer.getUint32(0, true), 6, 4096336452);
            d = ii(d, a, b, c, buffer.getUint32(28, true), 10, 1126891415);
            c = ii(c, d, a, b, buffer.getUint32(56, true), 15, 2878612391);
            b = ii(b, c, d, a, buffer.getUint32(20, true), 21, 4237533241);
            a = ii(a, b, c, d, buffer.getUint32(48, true), 6, 1700485571);
            d = ii(d, a, b, c, buffer.getUint32(12, true), 10, 2399980690);
            c = ii(c, d, a, b, buffer.getUint32(40, true), 15, 4293915773);
            b = ii(b, c, d, a, buffer.getUint32(4, true), 21, 2240044497);
            a = ii(a, b, c, d, buffer.getUint32(32, true), 6, 1873313359);
            d = ii(d, a, b, c, buffer.getUint32(60, true), 10, 4264355552);
            c = ii(c, d, a, b, buffer.getUint32(24, true), 15, 2734768916);
            b = ii(b, c, d, a, buffer.getUint32(52, true), 21, 1309151649);
            a = ii(a, b, c, d, buffer.getUint32(16, true), 6, 4149444226);
            d = ii(d, a, b, c, buffer.getUint32(44, true), 10, 3174756917);
            c = ii(c, d, a, b, buffer.getUint32(8, true), 15, 718787259);
            b = ii(b, c, d, a, buffer.getUint32(36, true), 21, 3951481745);
            state[0] = a + state[0] & 4294967295;
            state[1] = b + state[1] & 4294967295;
            state[2] = c + state[2] & 4294967295;
            state[3] = d + state[3] & 4294967295;
        };
        function cmn(q, a, b, x, s, t) {
            a = (a + q & 4294967295) + (x + t & 4294967295) & 4294967295;
            return (a << s | a >>> 32 - s) + b & 4294967295;
        }
        function ff(a, b, c, d, x, s, t) {
            return cmn(b & c | ~b & d, a, b, x, s, t);
        }
        function gg(a, b, c, d, x, s, t) {
            return cmn(b & d | c & ~d, a, b, x, s, t);
        }
        function hh(a, b, c, d, x, s, t) {
            return cmn(b ^ c ^ d, a, b, x, s, t);
        }
        function ii(a, b, c, d, x, s, t) {
            return cmn(c ^ (b | ~d), a, b, x, s, t);
        }
    }, {
        "./browserHashUtils": 186,
        "buffer/": 3
    } ],
    187: [ function(require, module, exports) {
        var hashUtils = require("./browserHashUtils");
        function Hmac(hashCtor, secret) {
            this.hash = new hashCtor();
            this.outer = new hashCtor();
            var inner = bufferFromSecret(hashCtor, secret);
            var outer = new Uint8Array(hashCtor.BLOCK_SIZE);
            outer.set(inner);
            for (var i = 0; i < hashCtor.BLOCK_SIZE; i++) {
                inner[i] ^= 54;
                outer[i] ^= 92;
            }
            this.hash.update(inner);
            this.outer.update(outer);
            for (var i = 0; i < inner.byteLength; i++) {
                inner[i] = 0;
            }
        }
        module.exports = exports = Hmac;
        Hmac.prototype.update = function(toHash) {
            if (hashUtils.isEmptyData(toHash) || this.error) {
                return this;
            }
            try {
                this.hash.update(hashUtils.convertToBuffer(toHash));
            } catch (e) {
                this.error = e;
            }
            return this;
        };
        Hmac.prototype.digest = function(encoding) {
            if (!this.outer.finished) {
                this.outer.update(this.hash.digest());
            }
            return this.outer.digest(encoding);
        };
        function bufferFromSecret(hashCtor, secret) {
            var input = hashUtils.convertToBuffer(secret);
            if (input.byteLength > hashCtor.BLOCK_SIZE) {
                var bufferHash = new hashCtor();
                bufferHash.update(input);
                input = bufferHash.digest();
            }
            var buffer = new Uint8Array(hashCtor.BLOCK_SIZE);
            buffer.set(input);
            return buffer;
        }
    }, {
        "./browserHashUtils": 186
    } ],
    186: [ function(require, module, exports) {
        var Buffer = require("buffer/").Buffer;
        if (typeof ArrayBuffer !== "undefined" && typeof ArrayBuffer.isView === "undefined") {
            ArrayBuffer.isView = function(arg) {
                return viewStrings.indexOf(Object.prototype.toString.call(arg)) > -1;
            };
        }
        var viewStrings = [ "[object Int8Array]", "[object Uint8Array]", "[object Uint8ClampedArray]", "[object Int16Array]", "[object Uint16Array]", "[object Int32Array]", "[object Uint32Array]", "[object Float32Array]", "[object Float64Array]", "[object DataView]" ];
        function isEmptyData(data) {
            if (typeof data === "string") {
                return data.length === 0;
            }
            return data.byteLength === 0;
        }
        function convertToBuffer(data) {
            if (typeof data === "string") {
                data = new Buffer(data, "utf8");
            }
            if (ArrayBuffer.isView(data)) {
                return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
            }
            return new Uint8Array(data);
        }
        module.exports = exports = {
            isEmptyData: isEmptyData,
            convertToBuffer: convertToBuffer
        };
    }, {
        "buffer/": 3
    } ],
    156: [ function(require, module, exports) {
        var punycode = require("punycode");
        exports.parse = urlParse;
        exports.resolve = urlResolve;
        exports.resolveObject = urlResolveObject;
        exports.format = urlFormat;
        exports.Url = Url;
        function Url() {
            this.protocol = null;
            this.slashes = null;
            this.auth = null;
            this.host = null;
            this.port = null;
            this.hostname = null;
            this.hash = null;
            this.search = null;
            this.query = null;
            this.pathname = null;
            this.path = null;
            this.href = null;
        }
        var protocolPattern = /^([a-z0-9.+-]+:)/i, portPattern = /:[0-9]*$/, delims = [ "<", ">", '"', "`", " ", "\r", "\n", "\t" ], unwise = [ "{", "}", "|", "\\", "^", "`" ].concat(delims), autoEscape = [ "'" ].concat(unwise), nonHostChars = [ "%", "/", "?", ";", "#" ].concat(autoEscape), hostEndingChars = [ "/", "?", "#" ], hostnameMaxLen = 255, hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/, hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/, unsafeProtocol = {
            javascript: true,
            "javascript:": true
        }, hostlessProtocol = {
            javascript: true,
            "javascript:": true
        }, slashedProtocol = {
            http: true,
            https: true,
            ftp: true,
            gopher: true,
            file: true,
            "http:": true,
            "https:": true,
            "ftp:": true,
            "gopher:": true,
            "file:": true
        }, querystring = require("querystring");
        function urlParse(url, parseQueryString, slashesDenoteHost) {
            if (url && isObject(url) && url instanceof Url) return url;
            var u = new Url();
            u.parse(url, parseQueryString, slashesDenoteHost);
            return u;
        }
        Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
            if (!isString(url)) {
                throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
            }
            var rest = url;
            rest = rest.trim();
            var proto = protocolPattern.exec(rest);
            if (proto) {
                proto = proto[0];
                var lowerProto = proto.toLowerCase();
                this.protocol = lowerProto;
                rest = rest.substr(proto.length);
            }
            if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
                var slashes = rest.substr(0, 2) === "//";
                if (slashes && !(proto && hostlessProtocol[proto])) {
                    rest = rest.substr(2);
                    this.slashes = true;
                }
            }
            if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
                var hostEnd = -1;
                for (var i = 0; i < hostEndingChars.length; i++) {
                    var hec = rest.indexOf(hostEndingChars[i]);
                    if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) hostEnd = hec;
                }
                var auth, atSign;
                if (hostEnd === -1) {
                    atSign = rest.lastIndexOf("@");
                } else {
                    atSign = rest.lastIndexOf("@", hostEnd);
                }
                if (atSign !== -1) {
                    auth = rest.slice(0, atSign);
                    rest = rest.slice(atSign + 1);
                    this.auth = decodeURIComponent(auth);
                }
                hostEnd = -1;
                for (var i = 0; i < nonHostChars.length; i++) {
                    var hec = rest.indexOf(nonHostChars[i]);
                    if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) hostEnd = hec;
                }
                if (hostEnd === -1) hostEnd = rest.length;
                this.host = rest.slice(0, hostEnd);
                rest = rest.slice(hostEnd);
                this.parseHost();
                this.hostname = this.hostname || "";
                var ipv6Hostname = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
                if (!ipv6Hostname) {
                    var hostparts = this.hostname.split(/\./);
                    for (var i = 0, l = hostparts.length; i < l; i++) {
                        var part = hostparts[i];
                        if (!part) continue;
                        if (!part.match(hostnamePartPattern)) {
                            var newpart = "";
                            for (var j = 0, k = part.length; j < k; j++) {
                                if (part.charCodeAt(j) > 127) {
                                    newpart += "x";
                                } else {
                                    newpart += part[j];
                                }
                            }
                            if (!newpart.match(hostnamePartPattern)) {
                                var validParts = hostparts.slice(0, i);
                                var notHost = hostparts.slice(i + 1);
                                var bit = part.match(hostnamePartStart);
                                if (bit) {
                                    validParts.push(bit[1]);
                                    notHost.unshift(bit[2]);
                                }
                                if (notHost.length) {
                                    rest = "/" + notHost.join(".") + rest;
                                }
                                this.hostname = validParts.join(".");
                                break;
                            }
                        }
                    }
                }
                if (this.hostname.length > hostnameMaxLen) {
                    this.hostname = "";
                } else {
                    this.hostname = this.hostname.toLowerCase();
                }
                if (!ipv6Hostname) {
                    var domainArray = this.hostname.split(".");
                    var newOut = [];
                    for (var i = 0; i < domainArray.length; ++i) {
                        var s = domainArray[i];
                        newOut.push(s.match(/[^A-Za-z0-9_-]/) ? "xn--" + punycode.encode(s) : s);
                    }
                    this.hostname = newOut.join(".");
                }
                var p = this.port ? ":" + this.port : "";
                var h = this.hostname || "";
                this.host = h + p;
                this.href += this.host;
                if (ipv6Hostname) {
                    this.hostname = this.hostname.substr(1, this.hostname.length - 2);
                    if (rest[0] !== "/") {
                        rest = "/" + rest;
                    }
                }
            }
            if (!unsafeProtocol[lowerProto]) {
                for (var i = 0, l = autoEscape.length; i < l; i++) {
                    var ae = autoEscape[i];
                    var esc = encodeURIComponent(ae);
                    if (esc === ae) {
                        esc = escape(ae);
                    }
                    rest = rest.split(ae).join(esc);
                }
            }
            var hash = rest.indexOf("#");
            if (hash !== -1) {
                this.hash = rest.substr(hash);
                rest = rest.slice(0, hash);
            }
            var qm = rest.indexOf("?");
            if (qm !== -1) {
                this.search = rest.substr(qm);
                this.query = rest.substr(qm + 1);
                if (parseQueryString) {
                    this.query = querystring.parse(this.query);
                }
                rest = rest.slice(0, qm);
            } else if (parseQueryString) {
                this.search = "";
                this.query = {};
            }
            if (rest) this.pathname = rest;
            if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) {
                this.pathname = "/";
            }
            if (this.pathname || this.search) {
                var p = this.pathname || "";
                var s = this.search || "";
                this.path = p + s;
            }
            this.href = this.format();
            return this;
        };
        function urlFormat(obj) {
            if (isString(obj)) obj = urlParse(obj);
            if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
            return obj.format();
        }
        Url.prototype.format = function() {
            var auth = this.auth || "";
            if (auth) {
                auth = encodeURIComponent(auth);
                auth = auth.replace(/%3A/i, ":");
                auth += "@";
            }
            var protocol = this.protocol || "", pathname = this.pathname || "", hash = this.hash || "", host = false, query = "";
            if (this.host) {
                host = auth + this.host;
            } else if (this.hostname) {
                host = auth + (this.hostname.indexOf(":") === -1 ? this.hostname : "[" + this.hostname + "]");
                if (this.port) {
                    host += ":" + this.port;
                }
            }
            if (this.query && isObject(this.query) && Object.keys(this.query).length) {
                query = querystring.stringify(this.query);
            }
            var search = this.search || query && "?" + query || "";
            if (protocol && protocol.substr(-1) !== ":") protocol += ":";
            if (this.slashes || (!protocol || slashedProtocol[protocol]) && host !== false) {
                host = "//" + (host || "");
                if (pathname && pathname.charAt(0) !== "/") pathname = "/" + pathname;
            } else if (!host) {
                host = "";
            }
            if (hash && hash.charAt(0) !== "#") hash = "#" + hash;
            if (search && search.charAt(0) !== "?") search = "?" + search;
            pathname = pathname.replace(/[?#]/g, function(match) {
                return encodeURIComponent(match);
            });
            search = search.replace("#", "%23");
            return protocol + host + pathname + search + hash;
        };
        function urlResolve(source, relative) {
            return urlParse(source, false, true).resolve(relative);
        }
        Url.prototype.resolve = function(relative) {
            return this.resolveObject(urlParse(relative, false, true)).format();
        };
        function urlResolveObject(source, relative) {
            if (!source) return relative;
            return urlParse(source, false, true).resolveObject(relative);
        }
        Url.prototype.resolveObject = function(relative) {
            if (isString(relative)) {
                var rel = new Url();
                rel.parse(relative, false, true);
                relative = rel;
            }
            var result = new Url();
            Object.keys(this).forEach(function(k) {
                result[k] = this[k];
            }, this);
            result.hash = relative.hash;
            if (relative.href === "") {
                result.href = result.format();
                return result;
            }
            if (relative.slashes && !relative.protocol) {
                Object.keys(relative).forEach(function(k) {
                    if (k !== "protocol") result[k] = relative[k];
                });
                if (slashedProtocol[result.protocol] && result.hostname && !result.pathname) {
                    result.path = result.pathname = "/";
                }
                result.href = result.format();
                return result;
            }
            if (relative.protocol && relative.protocol !== result.protocol) {
                if (!slashedProtocol[relative.protocol]) {
                    Object.keys(relative).forEach(function(k) {
                        result[k] = relative[k];
                    });
                    result.href = result.format();
                    return result;
                }
                result.protocol = relative.protocol;
                if (!relative.host && !hostlessProtocol[relative.protocol]) {
                    var relPath = (relative.pathname || "").split("/");
                    while (relPath.length && !(relative.host = relPath.shift())) ;
                    if (!relative.host) relative.host = "";
                    if (!relative.hostname) relative.hostname = "";
                    if (relPath[0] !== "") relPath.unshift("");
                    if (relPath.length < 2) relPath.unshift("");
                    result.pathname = relPath.join("/");
                } else {
                    result.pathname = relative.pathname;
                }
                result.search = relative.search;
                result.query = relative.query;
                result.host = relative.host || "";
                result.auth = relative.auth;
                result.hostname = relative.hostname || relative.host;
                result.port = relative.port;
                if (result.pathname || result.search) {
                    var p = result.pathname || "";
                    var s = result.search || "";
                    result.path = p + s;
                }
                result.slashes = result.slashes || relative.slashes;
                result.href = result.format();
                return result;
            }
            var isSourceAbs = result.pathname && result.pathname.charAt(0) === "/", isRelAbs = relative.host || relative.pathname && relative.pathname.charAt(0) === "/", mustEndAbs = isRelAbs || isSourceAbs || result.host && relative.pathname, removeAllDots = mustEndAbs, srcPath = result.pathname && result.pathname.split("/") || [], relPath = relative.pathname && relative.pathname.split("/") || [], psychotic = result.protocol && !slashedProtocol[result.protocol];
            if (psychotic) {
                result.hostname = "";
                result.port = null;
                if (result.host) {
                    if (srcPath[0] === "") srcPath[0] = result.host; else srcPath.unshift(result.host);
                }
                result.host = "";
                if (relative.protocol) {
                    relative.hostname = null;
                    relative.port = null;
                    if (relative.host) {
                        if (relPath[0] === "") relPath[0] = relative.host; else relPath.unshift(relative.host);
                    }
                    relative.host = null;
                }
                mustEndAbs = mustEndAbs && (relPath[0] === "" || srcPath[0] === "");
            }
            if (isRelAbs) {
                result.host = relative.host || relative.host === "" ? relative.host : result.host;
                result.hostname = relative.hostname || relative.hostname === "" ? relative.hostname : result.hostname;
                result.search = relative.search;
                result.query = relative.query;
                srcPath = relPath;
            } else if (relPath.length) {
                if (!srcPath) srcPath = [];
                srcPath.pop();
                srcPath = srcPath.concat(relPath);
                result.search = relative.search;
                result.query = relative.query;
            } else if (!isNullOrUndefined(relative.search)) {
                if (psychotic) {
                    result.hostname = result.host = srcPath.shift();
                    var authInHost = result.host && result.host.indexOf("@") > 0 ? result.host.split("@") : false;
                    if (authInHost) {
                        result.auth = authInHost.shift();
                        result.host = result.hostname = authInHost.shift();
                    }
                }
                result.search = relative.search;
                result.query = relative.query;
                if (!isNull(result.pathname) || !isNull(result.search)) {
                    result.path = (result.pathname ? result.pathname : "") + (result.search ? result.search : "");
                }
                result.href = result.format();
                return result;
            }
            if (!srcPath.length) {
                result.pathname = null;
                if (result.search) {
                    result.path = "/" + result.search;
                } else {
                    result.path = null;
                }
                result.href = result.format();
                return result;
            }
            var last = srcPath.slice(-1)[0];
            var hasTrailingSlash = (result.host || relative.host) && (last === "." || last === "..") || last === "";
            var up = 0;
            for (var i = srcPath.length; i >= 0; i--) {
                last = srcPath[i];
                if (last == ".") {
                    srcPath.splice(i, 1);
                } else if (last === "..") {
                    srcPath.splice(i, 1);
                    up++;
                } else if (up) {
                    srcPath.splice(i, 1);
                    up--;
                }
            }
            if (!mustEndAbs && !removeAllDots) {
                for (;up--; up) {
                    srcPath.unshift("..");
                }
            }
            if (mustEndAbs && srcPath[0] !== "" && (!srcPath[0] || srcPath[0].charAt(0) !== "/")) {
                srcPath.unshift("");
            }
            if (hasTrailingSlash && srcPath.join("/").substr(-1) !== "/") {
                srcPath.push("");
            }
            var isAbsolute = srcPath[0] === "" || srcPath[0] && srcPath[0].charAt(0) === "/";
            if (psychotic) {
                result.hostname = result.host = isAbsolute ? "" : srcPath.length ? srcPath.shift() : "";
                var authInHost = result.host && result.host.indexOf("@") > 0 ? result.host.split("@") : false;
                if (authInHost) {
                    result.auth = authInHost.shift();
                    result.host = result.hostname = authInHost.shift();
                }
            }
            mustEndAbs = mustEndAbs || result.host && srcPath.length;
            if (mustEndAbs && !isAbsolute) {
                srcPath.unshift("");
            }
            if (!srcPath.length) {
                result.pathname = null;
                result.path = null;
            } else {
                result.pathname = srcPath.join("/");
            }
            if (!isNull(result.pathname) || !isNull(result.search)) {
                result.path = (result.pathname ? result.pathname : "") + (result.search ? result.search : "");
            }
            result.auth = relative.auth || result.auth;
            result.slashes = result.slashes || relative.slashes;
            result.href = result.format();
            return result;
        };
        Url.prototype.parseHost = function() {
            var host = this.host;
            var port = portPattern.exec(host);
            if (port) {
                port = port[0];
                if (port !== ":") {
                    this.port = port.substr(1);
                }
                host = host.substr(0, host.length - port.length);
            }
            if (host) this.hostname = host;
        };
        function isString(arg) {
            return typeof arg === "string";
        }
        function isObject(arg) {
            return typeof arg === "object" && arg !== null;
        }
        function isNull(arg) {
            return arg === null;
        }
        function isNullOrUndefined(arg) {
            return arg == null;
        }
    }, {
        punycode: 149,
        querystring: 152
    } ],
    155: [ function(require, module, exports) {
        arguments[4][152][0].apply(exports, arguments);
    }, {
        "./decode": 153,
        "./encode": 154,
        dup: 152
    } ],
    154: [ function(require, module, exports) {
        "use strict";
        var stringifyPrimitive = function(v) {
            switch (typeof v) {
              case "string":
                return v;

              case "boolean":
                return v ? "true" : "false";

              case "number":
                return isFinite(v) ? v : "";

              default:
                return "";
            }
        };
        module.exports = function(obj, sep, eq, name) {
            sep = sep || "&";
            eq = eq || "=";
            if (obj === null) {
                obj = undefined;
            }
            if (typeof obj === "object") {
                return Object.keys(obj).map(function(k) {
                    var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
                    if (Array.isArray(obj[k])) {
                        return obj[k].map(function(v) {
                            return ks + encodeURIComponent(stringifyPrimitive(v));
                        }).join(sep);
                    } else {
                        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
                    }
                }).join(sep);
            }
            if (!name) return "";
            return encodeURIComponent(stringifyPrimitive(name)) + eq + encodeURIComponent(stringifyPrimitive(obj));
        };
    }, {} ],
    153: [ function(require, module, exports) {
        "use strict";
        function hasOwnProperty(obj, prop) {
            return Object.prototype.hasOwnProperty.call(obj, prop);
        }
        module.exports = function(qs, sep, eq, options) {
            sep = sep || "&";
            eq = eq || "=";
            var obj = {};
            if (typeof qs !== "string" || qs.length === 0) {
                return obj;
            }
            var regexp = /\+/g;
            qs = qs.split(sep);
            var maxKeys = 1e3;
            if (options && typeof options.maxKeys === "number") {
                maxKeys = options.maxKeys;
            }
            var len = qs.length;
            if (maxKeys > 0 && len > maxKeys) {
                len = maxKeys;
            }
            for (var i = 0; i < len; ++i) {
                var x = qs[i].replace(regexp, "%20"), idx = x.indexOf(eq), kstr, vstr, k, v;
                if (idx >= 0) {
                    kstr = x.substr(0, idx);
                    vstr = x.substr(idx + 1);
                } else {
                    kstr = x;
                    vstr = "";
                }
                k = decodeURIComponent(kstr);
                v = decodeURIComponent(vstr);
                if (!hasOwnProperty(obj, k)) {
                    obj[k] = v;
                } else if (Array.isArray(obj[k])) {
                    obj[k].push(v);
                } else {
                    obj[k] = [ obj[k], v ];
                }
            }
            return obj;
        };
    }, {} ],
    152: [ function(require, module, exports) {
        "use strict";
        exports.decode = exports.parse = require("./decode");
        exports.encode = exports.stringify = require("./encode");
    }, {
        "./decode": 150,
        "./encode": 151
    } ],
    151: [ function(require, module, exports) {
        "use strict";
        var stringifyPrimitive = function(v) {
            switch (typeof v) {
              case "string":
                return v;

              case "boolean":
                return v ? "true" : "false";

              case "number":
                return isFinite(v) ? v : "";

              default:
                return "";
            }
        };
        module.exports = function(obj, sep, eq, name) {
            sep = sep || "&";
            eq = eq || "=";
            if (obj === null) {
                obj = undefined;
            }
            if (typeof obj === "object") {
                return map(objectKeys(obj), function(k) {
                    var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
                    if (isArray(obj[k])) {
                        return map(obj[k], function(v) {
                            return ks + encodeURIComponent(stringifyPrimitive(v));
                        }).join(sep);
                    } else {
                        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
                    }
                }).join(sep);
            }
            if (!name) return "";
            return encodeURIComponent(stringifyPrimitive(name)) + eq + encodeURIComponent(stringifyPrimitive(obj));
        };
        var isArray = Array.isArray || function(xs) {
            return Object.prototype.toString.call(xs) === "[object Array]";
        };
        function map(xs, f) {
            if (xs.map) return xs.map(f);
            var res = [];
            for (var i = 0; i < xs.length; i++) {
                res.push(f(xs[i], i));
            }
            return res;
        }
        var objectKeys = Object.keys || function(obj) {
            var res = [];
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
            }
            return res;
        };
    }, {} ],
    150: [ function(require, module, exports) {
        "use strict";
        function hasOwnProperty(obj, prop) {
            return Object.prototype.hasOwnProperty.call(obj, prop);
        }
        module.exports = function(qs, sep, eq, options) {
            sep = sep || "&";
            eq = eq || "=";
            var obj = {};
            if (typeof qs !== "string" || qs.length === 0) {
                return obj;
            }
            var regexp = /\+/g;
            qs = qs.split(sep);
            var maxKeys = 1e3;
            if (options && typeof options.maxKeys === "number") {
                maxKeys = options.maxKeys;
            }
            var len = qs.length;
            if (maxKeys > 0 && len > maxKeys) {
                len = maxKeys;
            }
            for (var i = 0; i < len; ++i) {
                var x = qs[i].replace(regexp, "%20"), idx = x.indexOf(eq), kstr, vstr, k, v;
                if (idx >= 0) {
                    kstr = x.substr(0, idx);
                    vstr = x.substr(idx + 1);
                } else {
                    kstr = x;
                    vstr = "";
                }
                k = decodeURIComponent(kstr);
                v = decodeURIComponent(vstr);
                if (!hasOwnProperty(obj, k)) {
                    obj[k] = v;
                } else if (isArray(obj[k])) {
                    obj[k].push(v);
                } else {
                    obj[k] = [ obj[k], v ];
                }
            }
            return obj;
        };
        var isArray = Array.isArray || function(xs) {
            return Object.prototype.toString.call(xs) === "[object Array]";
        };
    }, {} ],
    149: [ function(require, module, exports) {
        (function(global) {
            (function(root) {
                var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
                var freeModule = typeof module == "object" && module && !module.nodeType && module;
                var freeGlobal = typeof global == "object" && global;
                if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal) {
                    root = freeGlobal;
                }
                var punycode, maxInt = 2147483647, base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700, initialBias = 72, initialN = 128, delimiter = "-", regexPunycode = /^xn--/, regexNonASCII = /[^\x20-\x7E]/, regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, errors = {
                    overflow: "Overflow: input needs wider integers to process",
                    "not-basic": "Illegal input >= 0x80 (not a basic code point)",
                    "invalid-input": "Invalid input"
                }, baseMinusTMin = base - tMin, floor = Math.floor, stringFromCharCode = String.fromCharCode, key;
                function error(type) {
                    throw RangeError(errors[type]);
                }
                function map(array, fn) {
                    var length = array.length;
                    var result = [];
                    while (length--) {
                        result[length] = fn(array[length]);
                    }
                    return result;
                }
                function mapDomain(string, fn) {
                    var parts = string.split("@");
                    var result = "";
                    if (parts.length > 1) {
                        result = parts[0] + "@";
                        string = parts[1];
                    }
                    string = string.replace(regexSeparators, ".");
                    var labels = string.split(".");
                    var encoded = map(labels, fn).join(".");
                    return result + encoded;
                }
                function ucs2decode(string) {
                    var output = [], counter = 0, length = string.length, value, extra;
                    while (counter < length) {
                        value = string.charCodeAt(counter++);
                        if (value >= 55296 && value <= 56319 && counter < length) {
                            extra = string.charCodeAt(counter++);
                            if ((extra & 64512) == 56320) {
                                output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
                            } else {
                                output.push(value);
                                counter--;
                            }
                        } else {
                            output.push(value);
                        }
                    }
                    return output;
                }
                function ucs2encode(array) {
                    return map(array, function(value) {
                        var output = "";
                        if (value > 65535) {
                            value -= 65536;
                            output += stringFromCharCode(value >>> 10 & 1023 | 55296);
                            value = 56320 | value & 1023;
                        }
                        output += stringFromCharCode(value);
                        return output;
                    }).join("");
                }
                function basicToDigit(codePoint) {
                    if (codePoint - 48 < 10) {
                        return codePoint - 22;
                    }
                    if (codePoint - 65 < 26) {
                        return codePoint - 65;
                    }
                    if (codePoint - 97 < 26) {
                        return codePoint - 97;
                    }
                    return base;
                }
                function digitToBasic(digit, flag) {
                    return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
                }
                function adapt(delta, numPoints, firstTime) {
                    var k = 0;
                    delta = firstTime ? floor(delta / damp) : delta >> 1;
                    delta += floor(delta / numPoints);
                    for (;delta > baseMinusTMin * tMax >> 1; k += base) {
                        delta = floor(delta / baseMinusTMin);
                    }
                    return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
                }
                function decode(input) {
                    var output = [], inputLength = input.length, out, i = 0, n = initialN, bias = initialBias, basic, j, index, oldi, w, k, digit, t, baseMinusT;
                    basic = input.lastIndexOf(delimiter);
                    if (basic < 0) {
                        basic = 0;
                    }
                    for (j = 0; j < basic; ++j) {
                        if (input.charCodeAt(j) >= 128) {
                            error("not-basic");
                        }
                        output.push(input.charCodeAt(j));
                    }
                    for (index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
                        for (oldi = i, w = 1, k = base; ;k += base) {
                            if (index >= inputLength) {
                                error("invalid-input");
                            }
                            digit = basicToDigit(input.charCodeAt(index++));
                            if (digit >= base || digit > floor((maxInt - i) / w)) {
                                error("overflow");
                            }
                            i += digit * w;
                            t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                            if (digit < t) {
                                break;
                            }
                            baseMinusT = base - t;
                            if (w > floor(maxInt / baseMinusT)) {
                                error("overflow");
                            }
                            w *= baseMinusT;
                        }
                        out = output.length + 1;
                        bias = adapt(i - oldi, out, oldi == 0);
                        if (floor(i / out) > maxInt - n) {
                            error("overflow");
                        }
                        n += floor(i / out);
                        i %= out;
                        output.splice(i++, 0, n);
                    }
                    return ucs2encode(output);
                }
                function encode(input) {
                    var n, delta, handledCPCount, basicLength, bias, j, m, q, k, t, currentValue, output = [], inputLength, handledCPCountPlusOne, baseMinusT, qMinusT;
                    input = ucs2decode(input);
                    inputLength = input.length;
                    n = initialN;
                    delta = 0;
                    bias = initialBias;
                    for (j = 0; j < inputLength; ++j) {
                        currentValue = input[j];
                        if (currentValue < 128) {
                            output.push(stringFromCharCode(currentValue));
                        }
                    }
                    handledCPCount = basicLength = output.length;
                    if (basicLength) {
                        output.push(delimiter);
                    }
                    while (handledCPCount < inputLength) {
                        for (m = maxInt, j = 0; j < inputLength; ++j) {
                            currentValue = input[j];
                            if (currentValue >= n && currentValue < m) {
                                m = currentValue;
                            }
                        }
                        handledCPCountPlusOne = handledCPCount + 1;
                        if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
                            error("overflow");
                        }
                        delta += (m - n) * handledCPCountPlusOne;
                        n = m;
                        for (j = 0; j < inputLength; ++j) {
                            currentValue = input[j];
                            if (currentValue < n && ++delta > maxInt) {
                                error("overflow");
                            }
                            if (currentValue == n) {
                                for (q = delta, k = base; ;k += base) {
                                    t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                                    if (q < t) {
                                        break;
                                    }
                                    qMinusT = q - t;
                                    baseMinusT = base - t;
                                    output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
                                    q = floor(qMinusT / baseMinusT);
                                }
                                output.push(stringFromCharCode(digitToBasic(q, 0)));
                                bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                                delta = 0;
                                ++handledCPCount;
                            }
                        }
                        ++delta;
                        ++n;
                    }
                    return output.join("");
                }
                function toUnicode(input) {
                    return mapDomain(input, function(string) {
                        return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
                    });
                }
                function toASCII(input) {
                    return mapDomain(input, function(string) {
                        return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
                    });
                }
                punycode = {
                    version: "1.3.2",
                    ucs2: {
                        decode: ucs2decode,
                        encode: ucs2encode
                    },
                    decode: decode,
                    encode: encode,
                    toASCII: toASCII,
                    toUnicode: toUnicode
                };
                if (typeof define == "function" && typeof define.amd == "object" && define.amd) {
                    define("punycode", function() {
                        return punycode;
                    });
                } else if (freeExports && freeModule) {
                    if (module.exports == freeExports) {
                        freeModule.exports = punycode;
                    } else {
                        for (key in punycode) {
                            punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
                        }
                    }
                } else {
                    root.punycode = punycode;
                }
            })(this);
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {} ],
    4: [ function(require, module, exports) {
        function EventEmitter() {
            this._events = this._events || {};
            this._maxListeners = this._maxListeners || undefined;
        }
        module.exports = EventEmitter;
        EventEmitter.EventEmitter = EventEmitter;
        EventEmitter.prototype._events = undefined;
        EventEmitter.prototype._maxListeners = undefined;
        EventEmitter.defaultMaxListeners = 10;
        EventEmitter.prototype.setMaxListeners = function(n) {
            if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError("n must be a positive number");
            this._maxListeners = n;
            return this;
        };
        EventEmitter.prototype.emit = function(type) {
            var er, handler, len, args, i, listeners;
            if (!this._events) this._events = {};
            if (type === "error") {
                if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
                    er = arguments[1];
                    if (er instanceof Error) {
                        throw er;
                    } else {
                        var err = new Error('Uncaught, unspecified "error" event. (' + er + ")");
                        err.context = er;
                        throw err;
                    }
                }
            }
            handler = this._events[type];
            if (isUndefined(handler)) return false;
            if (isFunction(handler)) {
                switch (arguments.length) {
                  case 1:
                    handler.call(this);
                    break;

                  case 2:
                    handler.call(this, arguments[1]);
                    break;

                  case 3:
                    handler.call(this, arguments[1], arguments[2]);
                    break;

                  default:
                    args = Array.prototype.slice.call(arguments, 1);
                    handler.apply(this, args);
                }
            } else if (isObject(handler)) {
                args = Array.prototype.slice.call(arguments, 1);
                listeners = handler.slice();
                len = listeners.length;
                for (i = 0; i < len; i++) listeners[i].apply(this, args);
            }
            return true;
        };
        EventEmitter.prototype.addListener = function(type, listener) {
            var m;
            if (!isFunction(listener)) throw TypeError("listener must be a function");
            if (!this._events) this._events = {};
            if (this._events.newListener) this.emit("newListener", type, isFunction(listener.listener) ? listener.listener : listener);
            if (!this._events[type]) this._events[type] = listener; else if (isObject(this._events[type])) this._events[type].push(listener); else this._events[type] = [ this._events[type], listener ];
            if (isObject(this._events[type]) && !this._events[type].warned) {
                if (!isUndefined(this._maxListeners)) {
                    m = this._maxListeners;
                } else {
                    m = EventEmitter.defaultMaxListeners;
                }
                if (m && m > 0 && this._events[type].length > m) {
                    this._events[type].warned = true;
                    console.error("(node) warning: possible EventEmitter memory " + "leak detected. %d listeners added. " + "Use emitter.setMaxListeners() to increase limit.", this._events[type].length);
                    if (typeof console.trace === "function") {
                        console.trace();
                    }
                }
            }
            return this;
        };
        EventEmitter.prototype.on = EventEmitter.prototype.addListener;
        EventEmitter.prototype.once = function(type, listener) {
            if (!isFunction(listener)) throw TypeError("listener must be a function");
            var fired = false;
            function g() {
                this.removeListener(type, g);
                if (!fired) {
                    fired = true;
                    listener.apply(this, arguments);
                }
            }
            g.listener = listener;
            this.on(type, g);
            return this;
        };
        EventEmitter.prototype.removeListener = function(type, listener) {
            var list, position, length, i;
            if (!isFunction(listener)) throw TypeError("listener must be a function");
            if (!this._events || !this._events[type]) return this;
            list = this._events[type];
            length = list.length;
            position = -1;
            if (list === listener || isFunction(list.listener) && list.listener === listener) {
                delete this._events[type];
                if (this._events.removeListener) this.emit("removeListener", type, listener);
            } else if (isObject(list)) {
                for (i = length; i-- > 0; ) {
                    if (list[i] === listener || list[i].listener && list[i].listener === listener) {
                        position = i;
                        break;
                    }
                }
                if (position < 0) return this;
                if (list.length === 1) {
                    list.length = 0;
                    delete this._events[type];
                } else {
                    list.splice(position, 1);
                }
                if (this._events.removeListener) this.emit("removeListener", type, listener);
            }
            return this;
        };
        EventEmitter.prototype.removeAllListeners = function(type) {
            var key, listeners;
            if (!this._events) return this;
            if (!this._events.removeListener) {
                if (arguments.length === 0) this._events = {}; else if (this._events[type]) delete this._events[type];
                return this;
            }
            if (arguments.length === 0) {
                for (key in this._events) {
                    if (key === "removeListener") continue;
                    this.removeAllListeners(key);
                }
                this.removeAllListeners("removeListener");
                this._events = {};
                return this;
            }
            listeners = this._events[type];
            if (isFunction(listeners)) {
                this.removeListener(type, listeners);
            } else if (listeners) {
                while (listeners.length) this.removeListener(type, listeners[listeners.length - 1]);
            }
            delete this._events[type];
            return this;
        };
        EventEmitter.prototype.listeners = function(type) {
            var ret;
            if (!this._events || !this._events[type]) ret = []; else if (isFunction(this._events[type])) ret = [ this._events[type] ]; else ret = this._events[type].slice();
            return ret;
        };
        EventEmitter.prototype.listenerCount = function(type) {
            if (this._events) {
                var evlistener = this._events[type];
                if (isFunction(evlistener)) return 1; else if (evlistener) return evlistener.length;
            }
            return 0;
        };
        EventEmitter.listenerCount = function(emitter, type) {
            return emitter.listenerCount(type);
        };
        function isFunction(arg) {
            return typeof arg === "function";
        }
        function isNumber(arg) {
            return typeof arg === "number";
        }
        function isObject(arg) {
            return typeof arg === "object" && arg !== null;
        }
        function isUndefined(arg) {
            return arg === void 0;
        }
    }, {} ],
    3: [ function(require, module, exports) {
        (function(global) {
            "use strict";
            var base64 = require("base64-js");
            var ieee754 = require("ieee754");
            var isArray = require("isarray");
            exports.Buffer = Buffer;
            exports.SlowBuffer = SlowBuffer;
            exports.INSPECT_MAX_BYTES = 50;
            Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined ? global.TYPED_ARRAY_SUPPORT : typedArraySupport();
            exports.kMaxLength = kMaxLength();
            function typedArraySupport() {
                try {
                    var arr = new Uint8Array(1);
                    arr.__proto__ = {
                        __proto__: Uint8Array.prototype,
                        foo: function() {
                            return 42;
                        }
                    };
                    return arr.foo() === 42 && typeof arr.subarray === "function" && arr.subarray(1, 1).byteLength === 0;
                } catch (e) {
                    return false;
                }
            }
            function kMaxLength() {
                return Buffer.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
            }
            function createBuffer(that, length) {
                if (kMaxLength() < length) {
                    throw new RangeError("Invalid typed array length");
                }
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    that = new Uint8Array(length);
                    that.__proto__ = Buffer.prototype;
                } else {
                    if (that === null) {
                        that = new Buffer(length);
                    }
                    that.length = length;
                }
                return that;
            }
            function Buffer(arg, encodingOrOffset, length) {
                if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
                    return new Buffer(arg, encodingOrOffset, length);
                }
                if (typeof arg === "number") {
                    if (typeof encodingOrOffset === "string") {
                        throw new Error("If encoding is specified then the first argument must be a string");
                    }
                    return allocUnsafe(this, arg);
                }
                return from(this, arg, encodingOrOffset, length);
            }
            Buffer.poolSize = 8192;
            Buffer._augment = function(arr) {
                arr.__proto__ = Buffer.prototype;
                return arr;
            };
            function from(that, value, encodingOrOffset, length) {
                if (typeof value === "number") {
                    throw new TypeError('"value" argument must not be a number');
                }
                if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
                    return fromArrayBuffer(that, value, encodingOrOffset, length);
                }
                if (typeof value === "string") {
                    return fromString(that, value, encodingOrOffset);
                }
                return fromObject(that, value);
            }
            Buffer.from = function(value, encodingOrOffset, length) {
                return from(null, value, encodingOrOffset, length);
            };
            if (Buffer.TYPED_ARRAY_SUPPORT) {
                Buffer.prototype.__proto__ = Uint8Array.prototype;
                Buffer.__proto__ = Uint8Array;
                if (typeof Symbol !== "undefined" && Symbol.species && Buffer[Symbol.species] === Buffer) {
                    Object.defineProperty(Buffer, Symbol.species, {
                        value: null,
                        configurable: true
                    });
                }
            }
            function assertSize(size) {
                if (typeof size !== "number") {
                    throw new TypeError('"size" argument must be a number');
                } else if (size < 0) {
                    throw new RangeError('"size" argument must not be negative');
                }
            }
            function alloc(that, size, fill, encoding) {
                assertSize(size);
                if (size <= 0) {
                    return createBuffer(that, size);
                }
                if (fill !== undefined) {
                    return typeof encoding === "string" ? createBuffer(that, size).fill(fill, encoding) : createBuffer(that, size).fill(fill);
                }
                return createBuffer(that, size);
            }
            Buffer.alloc = function(size, fill, encoding) {
                return alloc(null, size, fill, encoding);
            };
            function allocUnsafe(that, size) {
                assertSize(size);
                that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
                if (!Buffer.TYPED_ARRAY_SUPPORT) {
                    for (var i = 0; i < size; ++i) {
                        that[i] = 0;
                    }
                }
                return that;
            }
            Buffer.allocUnsafe = function(size) {
                return allocUnsafe(null, size);
            };
            Buffer.allocUnsafeSlow = function(size) {
                return allocUnsafe(null, size);
            };
            function fromString(that, string, encoding) {
                if (typeof encoding !== "string" || encoding === "") {
                    encoding = "utf8";
                }
                if (!Buffer.isEncoding(encoding)) {
                    throw new TypeError('"encoding" must be a valid string encoding');
                }
                var length = byteLength(string, encoding) | 0;
                that = createBuffer(that, length);
                var actual = that.write(string, encoding);
                if (actual !== length) {
                    that = that.slice(0, actual);
                }
                return that;
            }
            function fromArrayLike(that, array) {
                var length = array.length < 0 ? 0 : checked(array.length) | 0;
                that = createBuffer(that, length);
                for (var i = 0; i < length; i += 1) {
                    that[i] = array[i] & 255;
                }
                return that;
            }
            function fromArrayBuffer(that, array, byteOffset, length) {
                array.byteLength;
                if (byteOffset < 0 || array.byteLength < byteOffset) {
                    throw new RangeError("'offset' is out of bounds");
                }
                if (array.byteLength < byteOffset + (length || 0)) {
                    throw new RangeError("'length' is out of bounds");
                }
                if (byteOffset === undefined && length === undefined) {
                    array = new Uint8Array(array);
                } else if (length === undefined) {
                    array = new Uint8Array(array, byteOffset);
                } else {
                    array = new Uint8Array(array, byteOffset, length);
                }
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    that = array;
                    that.__proto__ = Buffer.prototype;
                } else {
                    that = fromArrayLike(that, array);
                }
                return that;
            }
            function fromObject(that, obj) {
                if (Buffer.isBuffer(obj)) {
                    var len = checked(obj.length) | 0;
                    that = createBuffer(that, len);
                    if (that.length === 0) {
                        return that;
                    }
                    obj.copy(that, 0, 0, len);
                    return that;
                }
                if (obj) {
                    if (typeof ArrayBuffer !== "undefined" && obj.buffer instanceof ArrayBuffer || "length" in obj) {
                        if (typeof obj.length !== "number" || isnan(obj.length)) {
                            return createBuffer(that, 0);
                        }
                        return fromArrayLike(that, obj);
                    }
                    if (obj.type === "Buffer" && isArray(obj.data)) {
                        return fromArrayLike(that, obj.data);
                    }
                }
                throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
            }
            function checked(length) {
                if (length >= kMaxLength()) {
                    throw new RangeError("Attempt to allocate Buffer larger than maximum " + "size: 0x" + kMaxLength().toString(16) + " bytes");
                }
                return length | 0;
            }
            function SlowBuffer(length) {
                if (+length != length) {
                    length = 0;
                }
                return Buffer.alloc(+length);
            }
            Buffer.isBuffer = function isBuffer(b) {
                return !!(b != null && b._isBuffer);
            };
            Buffer.compare = function compare(a, b) {
                if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
                    throw new TypeError("Arguments must be Buffers");
                }
                if (a === b) return 0;
                var x = a.length;
                var y = b.length;
                for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                    if (a[i] !== b[i]) {
                        x = a[i];
                        y = b[i];
                        break;
                    }
                }
                if (x < y) return -1;
                if (y < x) return 1;
                return 0;
            };
            Buffer.isEncoding = function isEncoding(encoding) {
                switch (String(encoding).toLowerCase()) {
                  case "hex":
                  case "utf8":
                  case "utf-8":
                  case "ascii":
                  case "latin1":
                  case "binary":
                  case "base64":
                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return true;

                  default:
                    return false;
                }
            };
            Buffer.concat = function concat(list, length) {
                if (!isArray(list)) {
                    throw new TypeError('"list" argument must be an Array of Buffers');
                }
                if (list.length === 0) {
                    return Buffer.alloc(0);
                }
                var i;
                if (length === undefined) {
                    length = 0;
                    for (i = 0; i < list.length; ++i) {
                        length += list[i].length;
                    }
                }
                var buffer = Buffer.allocUnsafe(length);
                var pos = 0;
                for (i = 0; i < list.length; ++i) {
                    var buf = list[i];
                    if (!Buffer.isBuffer(buf)) {
                        throw new TypeError('"list" argument must be an Array of Buffers');
                    }
                    buf.copy(buffer, pos);
                    pos += buf.length;
                }
                return buffer;
            };
            function byteLength(string, encoding) {
                if (Buffer.isBuffer(string)) {
                    return string.length;
                }
                if (typeof ArrayBuffer !== "undefined" && typeof ArrayBuffer.isView === "function" && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
                    return string.byteLength;
                }
                if (typeof string !== "string") {
                    string = "" + string;
                }
                var len = string.length;
                if (len === 0) return 0;
                var loweredCase = false;
                for (;;) {
                    switch (encoding) {
                      case "ascii":
                      case "latin1":
                      case "binary":
                        return len;

                      case "utf8":
                      case "utf-8":
                      case undefined:
                        return utf8ToBytes(string).length;

                      case "ucs2":
                      case "ucs-2":
                      case "utf16le":
                      case "utf-16le":
                        return len * 2;

                      case "hex":
                        return len >>> 1;

                      case "base64":
                        return base64ToBytes(string).length;

                      default:
                        if (loweredCase) return utf8ToBytes(string).length;
                        encoding = ("" + encoding).toLowerCase();
                        loweredCase = true;
                    }
                }
            }
            Buffer.byteLength = byteLength;
            function slowToString(encoding, start, end) {
                var loweredCase = false;
                if (start === undefined || start < 0) {
                    start = 0;
                }
                if (start > this.length) {
                    return "";
                }
                if (end === undefined || end > this.length) {
                    end = this.length;
                }
                if (end <= 0) {
                    return "";
                }
                end >>>= 0;
                start >>>= 0;
                if (end <= start) {
                    return "";
                }
                if (!encoding) encoding = "utf8";
                while (true) {
                    switch (encoding) {
                      case "hex":
                        return hexSlice(this, start, end);

                      case "utf8":
                      case "utf-8":
                        return utf8Slice(this, start, end);

                      case "ascii":
                        return asciiSlice(this, start, end);

                      case "latin1":
                      case "binary":
                        return latin1Slice(this, start, end);

                      case "base64":
                        return base64Slice(this, start, end);

                      case "ucs2":
                      case "ucs-2":
                      case "utf16le":
                      case "utf-16le":
                        return utf16leSlice(this, start, end);

                      default:
                        if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
                        encoding = (encoding + "").toLowerCase();
                        loweredCase = true;
                    }
                }
            }
            Buffer.prototype._isBuffer = true;
            function swap(b, n, m) {
                var i = b[n];
                b[n] = b[m];
                b[m] = i;
            }
            Buffer.prototype.swap16 = function swap16() {
                var len = this.length;
                if (len % 2 !== 0) {
                    throw new RangeError("Buffer size must be a multiple of 16-bits");
                }
                for (var i = 0; i < len; i += 2) {
                    swap(this, i, i + 1);
                }
                return this;
            };
            Buffer.prototype.swap32 = function swap32() {
                var len = this.length;
                if (len % 4 !== 0) {
                    throw new RangeError("Buffer size must be a multiple of 32-bits");
                }
                for (var i = 0; i < len; i += 4) {
                    swap(this, i, i + 3);
                    swap(this, i + 1, i + 2);
                }
                return this;
            };
            Buffer.prototype.swap64 = function swap64() {
                var len = this.length;
                if (len % 8 !== 0) {
                    throw new RangeError("Buffer size must be a multiple of 64-bits");
                }
                for (var i = 0; i < len; i += 8) {
                    swap(this, i, i + 7);
                    swap(this, i + 1, i + 6);
                    swap(this, i + 2, i + 5);
                    swap(this, i + 3, i + 4);
                }
                return this;
            };
            Buffer.prototype.toString = function toString() {
                var length = this.length | 0;
                if (length === 0) return "";
                if (arguments.length === 0) return utf8Slice(this, 0, length);
                return slowToString.apply(this, arguments);
            };
            Buffer.prototype.equals = function equals(b) {
                if (!Buffer.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
                if (this === b) return true;
                return Buffer.compare(this, b) === 0;
            };
            Buffer.prototype.inspect = function inspect() {
                var str = "";
                var max = exports.INSPECT_MAX_BYTES;
                if (this.length > 0) {
                    str = this.toString("hex", 0, max).match(/.{2}/g).join(" ");
                    if (this.length > max) str += " ... ";
                }
                return "<Buffer " + str + ">";
            };
            Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
                if (!Buffer.isBuffer(target)) {
                    throw new TypeError("Argument must be a Buffer");
                }
                if (start === undefined) {
                    start = 0;
                }
                if (end === undefined) {
                    end = target ? target.length : 0;
                }
                if (thisStart === undefined) {
                    thisStart = 0;
                }
                if (thisEnd === undefined) {
                    thisEnd = this.length;
                }
                if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
                    throw new RangeError("out of range index");
                }
                if (thisStart >= thisEnd && start >= end) {
                    return 0;
                }
                if (thisStart >= thisEnd) {
                    return -1;
                }
                if (start >= end) {
                    return 1;
                }
                start >>>= 0;
                end >>>= 0;
                thisStart >>>= 0;
                thisEnd >>>= 0;
                if (this === target) return 0;
                var x = thisEnd - thisStart;
                var y = end - start;
                var len = Math.min(x, y);
                var thisCopy = this.slice(thisStart, thisEnd);
                var targetCopy = target.slice(start, end);
                for (var i = 0; i < len; ++i) {
                    if (thisCopy[i] !== targetCopy[i]) {
                        x = thisCopy[i];
                        y = targetCopy[i];
                        break;
                    }
                }
                if (x < y) return -1;
                if (y < x) return 1;
                return 0;
            };
            function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
                if (buffer.length === 0) return -1;
                if (typeof byteOffset === "string") {
                    encoding = byteOffset;
                    byteOffset = 0;
                } else if (byteOffset > 2147483647) {
                    byteOffset = 2147483647;
                } else if (byteOffset < -2147483648) {
                    byteOffset = -2147483648;
                }
                byteOffset = +byteOffset;
                if (isNaN(byteOffset)) {
                    byteOffset = dir ? 0 : buffer.length - 1;
                }
                if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
                if (byteOffset >= buffer.length) {
                    if (dir) return -1; else byteOffset = buffer.length - 1;
                } else if (byteOffset < 0) {
                    if (dir) byteOffset = 0; else return -1;
                }
                if (typeof val === "string") {
                    val = Buffer.from(val, encoding);
                }
                if (Buffer.isBuffer(val)) {
                    if (val.length === 0) {
                        return -1;
                    }
                    return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
                } else if (typeof val === "number") {
                    val = val & 255;
                    if (Buffer.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === "function") {
                        if (dir) {
                            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
                        } else {
                            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
                        }
                    }
                    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir);
                }
                throw new TypeError("val must be string, number or Buffer");
            }
            function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
                var indexSize = 1;
                var arrLength = arr.length;
                var valLength = val.length;
                if (encoding !== undefined) {
                    encoding = String(encoding).toLowerCase();
                    if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
                        if (arr.length < 2 || val.length < 2) {
                            return -1;
                        }
                        indexSize = 2;
                        arrLength /= 2;
                        valLength /= 2;
                        byteOffset /= 2;
                    }
                }
                function read(buf, i) {
                    if (indexSize === 1) {
                        return buf[i];
                    } else {
                        return buf.readUInt16BE(i * indexSize);
                    }
                }
                var i;
                if (dir) {
                    var foundIndex = -1;
                    for (i = byteOffset; i < arrLength; i++) {
                        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                            if (foundIndex === -1) foundIndex = i;
                            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
                        } else {
                            if (foundIndex !== -1) i -= i - foundIndex;
                            foundIndex = -1;
                        }
                    }
                } else {
                    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
                    for (i = byteOffset; i >= 0; i--) {
                        var found = true;
                        for (var j = 0; j < valLength; j++) {
                            if (read(arr, i + j) !== read(val, j)) {
                                found = false;
                                break;
                            }
                        }
                        if (found) return i;
                    }
                }
                return -1;
            }
            Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
                return this.indexOf(val, byteOffset, encoding) !== -1;
            };
            Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
                return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
            };
            Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
                return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
            };
            function hexWrite(buf, string, offset, length) {
                offset = Number(offset) || 0;
                var remaining = buf.length - offset;
                if (!length) {
                    length = remaining;
                } else {
                    length = Number(length);
                    if (length > remaining) {
                        length = remaining;
                    }
                }
                var strLen = string.length;
                if (strLen % 2 !== 0) throw new TypeError("Invalid hex string");
                if (length > strLen / 2) {
                    length = strLen / 2;
                }
                for (var i = 0; i < length; ++i) {
                    var parsed = parseInt(string.substr(i * 2, 2), 16);
                    if (isNaN(parsed)) return i;
                    buf[offset + i] = parsed;
                }
                return i;
            }
            function utf8Write(buf, string, offset, length) {
                return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
            }
            function asciiWrite(buf, string, offset, length) {
                return blitBuffer(asciiToBytes(string), buf, offset, length);
            }
            function latin1Write(buf, string, offset, length) {
                return asciiWrite(buf, string, offset, length);
            }
            function base64Write(buf, string, offset, length) {
                return blitBuffer(base64ToBytes(string), buf, offset, length);
            }
            function ucs2Write(buf, string, offset, length) {
                return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
            }
            Buffer.prototype.write = function write(string, offset, length, encoding) {
                if (offset === undefined) {
                    encoding = "utf8";
                    length = this.length;
                    offset = 0;
                } else if (length === undefined && typeof offset === "string") {
                    encoding = offset;
                    length = this.length;
                    offset = 0;
                } else if (isFinite(offset)) {
                    offset = offset | 0;
                    if (isFinite(length)) {
                        length = length | 0;
                        if (encoding === undefined) encoding = "utf8";
                    } else {
                        encoding = length;
                        length = undefined;
                    }
                } else {
                    throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
                }
                var remaining = this.length - offset;
                if (length === undefined || length > remaining) length = remaining;
                if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
                    throw new RangeError("Attempt to write outside buffer bounds");
                }
                if (!encoding) encoding = "utf8";
                var loweredCase = false;
                for (;;) {
                    switch (encoding) {
                      case "hex":
                        return hexWrite(this, string, offset, length);

                      case "utf8":
                      case "utf-8":
                        return utf8Write(this, string, offset, length);

                      case "ascii":
                        return asciiWrite(this, string, offset, length);

                      case "latin1":
                      case "binary":
                        return latin1Write(this, string, offset, length);

                      case "base64":
                        return base64Write(this, string, offset, length);

                      case "ucs2":
                      case "ucs-2":
                      case "utf16le":
                      case "utf-16le":
                        return ucs2Write(this, string, offset, length);

                      default:
                        if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
                        encoding = ("" + encoding).toLowerCase();
                        loweredCase = true;
                    }
                }
            };
            Buffer.prototype.toJSON = function toJSON() {
                return {
                    type: "Buffer",
                    data: Array.prototype.slice.call(this._arr || this, 0)
                };
            };
            function base64Slice(buf, start, end) {
                if (start === 0 && end === buf.length) {
                    return base64.fromByteArray(buf);
                } else {
                    return base64.fromByteArray(buf.slice(start, end));
                }
            }
            function utf8Slice(buf, start, end) {
                end = Math.min(buf.length, end);
                var res = [];
                var i = start;
                while (i < end) {
                    var firstByte = buf[i];
                    var codePoint = null;
                    var bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
                    if (i + bytesPerSequence <= end) {
                        var secondByte, thirdByte, fourthByte, tempCodePoint;
                        switch (bytesPerSequence) {
                          case 1:
                            if (firstByte < 128) {
                                codePoint = firstByte;
                            }
                            break;

                          case 2:
                            secondByte = buf[i + 1];
                            if ((secondByte & 192) === 128) {
                                tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                                if (tempCodePoint > 127) {
                                    codePoint = tempCodePoint;
                                }
                            }
                            break;

                          case 3:
                            secondByte = buf[i + 1];
                            thirdByte = buf[i + 2];
                            if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                                tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                                if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                                    codePoint = tempCodePoint;
                                }
                            }
                            break;

                          case 4:
                            secondByte = buf[i + 1];
                            thirdByte = buf[i + 2];
                            fourthByte = buf[i + 3];
                            if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                                tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                                if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                                    codePoint = tempCodePoint;
                                }
                            }
                        }
                    }
                    if (codePoint === null) {
                        codePoint = 65533;
                        bytesPerSequence = 1;
                    } else if (codePoint > 65535) {
                        codePoint -= 65536;
                        res.push(codePoint >>> 10 & 1023 | 55296);
                        codePoint = 56320 | codePoint & 1023;
                    }
                    res.push(codePoint);
                    i += bytesPerSequence;
                }
                return decodeCodePointsArray(res);
            }
            var MAX_ARGUMENTS_LENGTH = 4096;
            function decodeCodePointsArray(codePoints) {
                var len = codePoints.length;
                if (len <= MAX_ARGUMENTS_LENGTH) {
                    return String.fromCharCode.apply(String, codePoints);
                }
                var res = "";
                var i = 0;
                while (i < len) {
                    res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
                }
                return res;
            }
            function asciiSlice(buf, start, end) {
                var ret = "";
                end = Math.min(buf.length, end);
                for (var i = start; i < end; ++i) {
                    ret += String.fromCharCode(buf[i] & 127);
                }
                return ret;
            }
            function latin1Slice(buf, start, end) {
                var ret = "";
                end = Math.min(buf.length, end);
                for (var i = start; i < end; ++i) {
                    ret += String.fromCharCode(buf[i]);
                }
                return ret;
            }
            function hexSlice(buf, start, end) {
                var len = buf.length;
                if (!start || start < 0) start = 0;
                if (!end || end < 0 || end > len) end = len;
                var out = "";
                for (var i = start; i < end; ++i) {
                    out += toHex(buf[i]);
                }
                return out;
            }
            function utf16leSlice(buf, start, end) {
                var bytes = buf.slice(start, end);
                var res = "";
                for (var i = 0; i < bytes.length; i += 2) {
                    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
                }
                return res;
            }
            Buffer.prototype.slice = function slice(start, end) {
                var len = this.length;
                start = ~~start;
                end = end === undefined ? len : ~~end;
                if (start < 0) {
                    start += len;
                    if (start < 0) start = 0;
                } else if (start > len) {
                    start = len;
                }
                if (end < 0) {
                    end += len;
                    if (end < 0) end = 0;
                } else if (end > len) {
                    end = len;
                }
                if (end < start) end = start;
                var newBuf;
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    newBuf = this.subarray(start, end);
                    newBuf.__proto__ = Buffer.prototype;
                } else {
                    var sliceLen = end - start;
                    newBuf = new Buffer(sliceLen, undefined);
                    for (var i = 0; i < sliceLen; ++i) {
                        newBuf[i] = this[i + start];
                    }
                }
                return newBuf;
            };
            function checkOffset(offset, ext, length) {
                if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
                if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
            }
            Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
                offset = offset | 0;
                byteLength = byteLength | 0;
                if (!noAssert) checkOffset(offset, byteLength, this.length);
                var val = this[offset];
                var mul = 1;
                var i = 0;
                while (++i < byteLength && (mul *= 256)) {
                    val += this[offset + i] * mul;
                }
                return val;
            };
            Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
                offset = offset | 0;
                byteLength = byteLength | 0;
                if (!noAssert) {
                    checkOffset(offset, byteLength, this.length);
                }
                var val = this[offset + --byteLength];
                var mul = 1;
                while (byteLength > 0 && (mul *= 256)) {
                    val += this[offset + --byteLength] * mul;
                }
                return val;
            };
            Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 1, this.length);
                return this[offset];
            };
            Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 2, this.length);
                return this[offset] | this[offset + 1] << 8;
            };
            Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 2, this.length);
                return this[offset] << 8 | this[offset + 1];
            };
            Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 4, this.length);
                return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
            };
            Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 4, this.length);
                return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
            };
            Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
                offset = offset | 0;
                byteLength = byteLength | 0;
                if (!noAssert) checkOffset(offset, byteLength, this.length);
                var val = this[offset];
                var mul = 1;
                var i = 0;
                while (++i < byteLength && (mul *= 256)) {
                    val += this[offset + i] * mul;
                }
                mul *= 128;
                if (val >= mul) val -= Math.pow(2, 8 * byteLength);
                return val;
            };
            Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
                offset = offset | 0;
                byteLength = byteLength | 0;
                if (!noAssert) checkOffset(offset, byteLength, this.length);
                var i = byteLength;
                var mul = 1;
                var val = this[offset + --i];
                while (i > 0 && (mul *= 256)) {
                    val += this[offset + --i] * mul;
                }
                mul *= 128;
                if (val >= mul) val -= Math.pow(2, 8 * byteLength);
                return val;
            };
            Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 1, this.length);
                if (!(this[offset] & 128)) return this[offset];
                return (255 - this[offset] + 1) * -1;
            };
            Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 2, this.length);
                var val = this[offset] | this[offset + 1] << 8;
                return val & 32768 ? val | 4294901760 : val;
            };
            Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 2, this.length);
                var val = this[offset + 1] | this[offset] << 8;
                return val & 32768 ? val | 4294901760 : val;
            };
            Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 4, this.length);
                return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
            };
            Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 4, this.length);
                return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
            };
            Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 4, this.length);
                return ieee754.read(this, offset, true, 23, 4);
            };
            Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 4, this.length);
                return ieee754.read(this, offset, false, 23, 4);
            };
            Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 8, this.length);
                return ieee754.read(this, offset, true, 52, 8);
            };
            Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
                if (!noAssert) checkOffset(offset, 8, this.length);
                return ieee754.read(this, offset, false, 52, 8);
            };
            function checkInt(buf, value, offset, ext, max, min) {
                if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
                if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
                if (offset + ext > buf.length) throw new RangeError("Index out of range");
            }
            Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
                value = +value;
                offset = offset | 0;
                byteLength = byteLength | 0;
                if (!noAssert) {
                    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                    checkInt(this, value, offset, byteLength, maxBytes, 0);
                }
                var mul = 1;
                var i = 0;
                this[offset] = value & 255;
                while (++i < byteLength && (mul *= 256)) {
                    this[offset + i] = value / mul & 255;
                }
                return offset + byteLength;
            };
            Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
                value = +value;
                offset = offset | 0;
                byteLength = byteLength | 0;
                if (!noAssert) {
                    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                    checkInt(this, value, offset, byteLength, maxBytes, 0);
                }
                var i = byteLength - 1;
                var mul = 1;
                this[offset + i] = value & 255;
                while (--i >= 0 && (mul *= 256)) {
                    this[offset + i] = value / mul & 255;
                }
                return offset + byteLength;
            };
            Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
                value = +value;
                offset = offset | 0;
                if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
                if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
                this[offset] = value & 255;
                return offset + 1;
            };
            function objectWriteUInt16(buf, value, offset, littleEndian) {
                if (value < 0) value = 65535 + value + 1;
                for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
                    buf[offset + i] = (value & 255 << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
                }
            }
            Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
                value = +value;
                offset = offset | 0;
                if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    this[offset] = value & 255;
                    this[offset + 1] = value >>> 8;
                } else {
                    objectWriteUInt16(this, value, offset, true);
                }
                return offset + 2;
            };
            Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
                value = +value;
                offset = offset | 0;
                if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    this[offset] = value >>> 8;
                    this[offset + 1] = value & 255;
                } else {
                    objectWriteUInt16(this, value, offset, false);
                }
                return offset + 2;
            };
            function objectWriteUInt32(buf, value, offset, littleEndian) {
                if (value < 0) value = 4294967295 + value + 1;
                for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
                    buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 255;
                }
            }
            Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
                value = +value;
                offset = offset | 0;
                if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    this[offset + 3] = value >>> 24;
                    this[offset + 2] = value >>> 16;
                    this[offset + 1] = value >>> 8;
                    this[offset] = value & 255;
                } else {
                    objectWriteUInt32(this, value, offset, true);
                }
                return offset + 4;
            };
            Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
                value = +value;
                offset = offset | 0;
                if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    this[offset] = value >>> 24;
                    this[offset + 1] = value >>> 16;
                    this[offset + 2] = value >>> 8;
                    this[offset + 3] = value & 255;
                } else {
                    objectWriteUInt32(this, value, offset, false);
                }
                return offset + 4;
            };
            Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
                value = +value;
                offset = offset | 0;
                if (!noAssert) {
                    var limit = Math.pow(2, 8 * byteLength - 1);
                    checkInt(this, value, offset, byteLength, limit - 1, -limit);
                }
                var i = 0;
                var mul = 1;
                var sub = 0;
                this[offset] = value & 255;
                while (++i < byteLength && (mul *= 256)) {
                    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                        sub = 1;
                    }
                    this[offset + i] = (value / mul >> 0) - sub & 255;
                }
                return offset + byteLength;
            };
            Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
                value = +value;
                offset = offset | 0;
                if (!noAssert) {
                    var limit = Math.pow(2, 8 * byteLength - 1);
                    checkInt(this, value, offset, byteLength, limit - 1, -limit);
                }
                var i = byteLength - 1;
                var mul = 1;
                var sub = 0;
                this[offset + i] = value & 255;
                while (--i >= 0 && (mul *= 256)) {
                    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                        sub = 1;
                    }
                    this[offset + i] = (value / mul >> 0) - sub & 255;
                }
                return offset + byteLength;
            };
            Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
                value = +value;
                offset = offset | 0;
                if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
                if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
                if (value < 0) value = 255 + value + 1;
                this[offset] = value & 255;
                return offset + 1;
            };
            Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
                value = +value;
                offset = offset | 0;
                if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    this[offset] = value & 255;
                    this[offset + 1] = value >>> 8;
                } else {
                    objectWriteUInt16(this, value, offset, true);
                }
                return offset + 2;
            };
            Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
                value = +value;
                offset = offset | 0;
                if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    this[offset] = value >>> 8;
                    this[offset + 1] = value & 255;
                } else {
                    objectWriteUInt16(this, value, offset, false);
                }
                return offset + 2;
            };
            Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
                value = +value;
                offset = offset | 0;
                if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    this[offset] = value & 255;
                    this[offset + 1] = value >>> 8;
                    this[offset + 2] = value >>> 16;
                    this[offset + 3] = value >>> 24;
                } else {
                    objectWriteUInt32(this, value, offset, true);
                }
                return offset + 4;
            };
            Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
                value = +value;
                offset = offset | 0;
                if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
                if (value < 0) value = 4294967295 + value + 1;
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    this[offset] = value >>> 24;
                    this[offset + 1] = value >>> 16;
                    this[offset + 2] = value >>> 8;
                    this[offset + 3] = value & 255;
                } else {
                    objectWriteUInt32(this, value, offset, false);
                }
                return offset + 4;
            };
            function checkIEEE754(buf, value, offset, ext, max, min) {
                if (offset + ext > buf.length) throw new RangeError("Index out of range");
                if (offset < 0) throw new RangeError("Index out of range");
            }
            function writeFloat(buf, value, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e38, -3.4028234663852886e38);
                }
                ieee754.write(buf, value, offset, littleEndian, 23, 4);
                return offset + 4;
            }
            Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
                return writeFloat(this, value, offset, true, noAssert);
            };
            Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
                return writeFloat(this, value, offset, false, noAssert);
            };
            function writeDouble(buf, value, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    checkIEEE754(buf, value, offset, 8, 1.7976931348623157e308, -1.7976931348623157e308);
                }
                ieee754.write(buf, value, offset, littleEndian, 52, 8);
                return offset + 8;
            }
            Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
                return writeDouble(this, value, offset, true, noAssert);
            };
            Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
                return writeDouble(this, value, offset, false, noAssert);
            };
            Buffer.prototype.copy = function copy(target, targetStart, start, end) {
                if (!start) start = 0;
                if (!end && end !== 0) end = this.length;
                if (targetStart >= target.length) targetStart = target.length;
                if (!targetStart) targetStart = 0;
                if (end > 0 && end < start) end = start;
                if (end === start) return 0;
                if (target.length === 0 || this.length === 0) return 0;
                if (targetStart < 0) {
                    throw new RangeError("targetStart out of bounds");
                }
                if (start < 0 || start >= this.length) throw new RangeError("sourceStart out of bounds");
                if (end < 0) throw new RangeError("sourceEnd out of bounds");
                if (end > this.length) end = this.length;
                if (target.length - targetStart < end - start) {
                    end = target.length - targetStart + start;
                }
                var len = end - start;
                var i;
                if (this === target && start < targetStart && targetStart < end) {
                    for (i = len - 1; i >= 0; --i) {
                        target[i + targetStart] = this[i + start];
                    }
                } else if (len < 1e3 || !Buffer.TYPED_ARRAY_SUPPORT) {
                    for (i = 0; i < len; ++i) {
                        target[i + targetStart] = this[i + start];
                    }
                } else {
                    Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
                }
                return len;
            };
            Buffer.prototype.fill = function fill(val, start, end, encoding) {
                if (typeof val === "string") {
                    if (typeof start === "string") {
                        encoding = start;
                        start = 0;
                        end = this.length;
                    } else if (typeof end === "string") {
                        encoding = end;
                        end = this.length;
                    }
                    if (val.length === 1) {
                        var code = val.charCodeAt(0);
                        if (code < 256) {
                            val = code;
                        }
                    }
                    if (encoding !== undefined && typeof encoding !== "string") {
                        throw new TypeError("encoding must be a string");
                    }
                    if (typeof encoding === "string" && !Buffer.isEncoding(encoding)) {
                        throw new TypeError("Unknown encoding: " + encoding);
                    }
                } else if (typeof val === "number") {
                    val = val & 255;
                }
                if (start < 0 || this.length < start || this.length < end) {
                    throw new RangeError("Out of range index");
                }
                if (end <= start) {
                    return this;
                }
                start = start >>> 0;
                end = end === undefined ? this.length : end >>> 0;
                if (!val) val = 0;
                var i;
                if (typeof val === "number") {
                    for (i = start; i < end; ++i) {
                        this[i] = val;
                    }
                } else {
                    var bytes = Buffer.isBuffer(val) ? val : utf8ToBytes(new Buffer(val, encoding).toString());
                    var len = bytes.length;
                    for (i = 0; i < end - start; ++i) {
                        this[i + start] = bytes[i % len];
                    }
                }
                return this;
            };
            var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;
            function base64clean(str) {
                str = stringtrim(str).replace(INVALID_BASE64_RE, "");
                if (str.length < 2) return "";
                while (str.length % 4 !== 0) {
                    str = str + "=";
                }
                return str;
            }
            function stringtrim(str) {
                if (str.trim) return str.trim();
                return str.replace(/^\s+|\s+$/g, "");
            }
            function toHex(n) {
                if (n < 16) return "0" + n.toString(16);
                return n.toString(16);
            }
            function utf8ToBytes(string, units) {
                units = units || Infinity;
                var codePoint;
                var length = string.length;
                var leadSurrogate = null;
                var bytes = [];
                for (var i = 0; i < length; ++i) {
                    codePoint = string.charCodeAt(i);
                    if (codePoint > 55295 && codePoint < 57344) {
                        if (!leadSurrogate) {
                            if (codePoint > 56319) {
                                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                                continue;
                            } else if (i + 1 === length) {
                                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                                continue;
                            }
                            leadSurrogate = codePoint;
                            continue;
                        }
                        if (codePoint < 56320) {
                            if ((units -= 3) > -1) bytes.push(239, 191, 189);
                            leadSurrogate = codePoint;
                            continue;
                        }
                        codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
                    } else if (leadSurrogate) {
                        if ((units -= 3) > -1) bytes.push(239, 191, 189);
                    }
                    leadSurrogate = null;
                    if (codePoint < 128) {
                        if ((units -= 1) < 0) break;
                        bytes.push(codePoint);
                    } else if (codePoint < 2048) {
                        if ((units -= 2) < 0) break;
                        bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
                    } else if (codePoint < 65536) {
                        if ((units -= 3) < 0) break;
                        bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
                    } else if (codePoint < 1114112) {
                        if ((units -= 4) < 0) break;
                        bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
                    } else {
                        throw new Error("Invalid code point");
                    }
                }
                return bytes;
            }
            function asciiToBytes(str) {
                var byteArray = [];
                for (var i = 0; i < str.length; ++i) {
                    byteArray.push(str.charCodeAt(i) & 255);
                }
                return byteArray;
            }
            function utf16leToBytes(str, units) {
                var c, hi, lo;
                var byteArray = [];
                for (var i = 0; i < str.length; ++i) {
                    if ((units -= 2) < 0) break;
                    c = str.charCodeAt(i);
                    hi = c >> 8;
                    lo = c % 256;
                    byteArray.push(lo);
                    byteArray.push(hi);
                }
                return byteArray;
            }
            function base64ToBytes(str) {
                return base64.toByteArray(base64clean(str));
            }
            function blitBuffer(src, dst, offset, length) {
                for (var i = 0; i < length; ++i) {
                    if (i + offset >= dst.length || i >= src.length) break;
                    dst[i + offset] = src[i];
                }
                return i;
            }
            function isnan(val) {
                return val !== val;
            }
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {
        "base64-js": 1,
        ieee754: 5,
        isarray: 6
    } ],
    6: [ function(require, module, exports) {
        var toString = {}.toString;
        module.exports = Array.isArray || function(arr) {
            return toString.call(arr) == "[object Array]";
        };
    }, {} ],
    5: [ function(require, module, exports) {
        exports.read = function(buffer, offset, isLE, mLen, nBytes) {
            var e, m;
            var eLen = nBytes * 8 - mLen - 1;
            var eMax = (1 << eLen) - 1;
            var eBias = eMax >> 1;
            var nBits = -7;
            var i = isLE ? nBytes - 1 : 0;
            var d = isLE ? -1 : 1;
            var s = buffer[offset + i];
            i += d;
            e = s & (1 << -nBits) - 1;
            s >>= -nBits;
            nBits += eLen;
            for (;nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
            m = e & (1 << -nBits) - 1;
            e >>= -nBits;
            nBits += mLen;
            for (;nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}
            if (e === 0) {
                e = 1 - eBias;
            } else if (e === eMax) {
                return m ? NaN : (s ? -1 : 1) * Infinity;
            } else {
                m = m + Math.pow(2, mLen);
                e = e - eBias;
            }
            return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
        };
        exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
            var e, m, c;
            var eLen = nBytes * 8 - mLen - 1;
            var eMax = (1 << eLen) - 1;
            var eBias = eMax >> 1;
            var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
            var i = isLE ? 0 : nBytes - 1;
            var d = isLE ? 1 : -1;
            var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
            value = Math.abs(value);
            if (isNaN(value) || value === Infinity) {
                m = isNaN(value) ? 1 : 0;
                e = eMax;
            } else {
                e = Math.floor(Math.log(value) / Math.LN2);
                if (value * (c = Math.pow(2, -e)) < 1) {
                    e--;
                    c *= 2;
                }
                if (e + eBias >= 1) {
                    value += rt / c;
                } else {
                    value += rt * Math.pow(2, 1 - eBias);
                }
                if (value * c >= 2) {
                    e++;
                    c /= 2;
                }
                if (e + eBias >= eMax) {
                    m = 0;
                    e = eMax;
                } else if (e + eBias >= 1) {
                    m = (value * c - 1) * Math.pow(2, mLen);
                    e = e + eBias;
                } else {
                    m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
                    e = 0;
                }
            }
            for (;mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {}
            e = e << mLen | m;
            eLen += mLen;
            for (;eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {}
            buffer[offset + i - d] |= s * 128;
        };
    }, {} ],
    1: [ function(require, module, exports) {
        "use strict";
        exports.byteLength = byteLength;
        exports.toByteArray = toByteArray;
        exports.fromByteArray = fromByteArray;
        var lookup = [];
        var revLookup = [];
        var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
        var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        for (var i = 0, len = code.length; i < len; ++i) {
            lookup[i] = code[i];
            revLookup[code.charCodeAt(i)] = i;
        }
        revLookup["-".charCodeAt(0)] = 62;
        revLookup["_".charCodeAt(0)] = 63;
        function placeHoldersCount(b64) {
            var len = b64.length;
            if (len % 4 > 0) {
                throw new Error("Invalid string. Length must be a multiple of 4");
            }
            return b64[len - 2] === "=" ? 2 : b64[len - 1] === "=" ? 1 : 0;
        }
        function byteLength(b64) {
            return b64.length * 3 / 4 - placeHoldersCount(b64);
        }
        function toByteArray(b64) {
            var i, l, tmp, placeHolders, arr;
            var len = b64.length;
            placeHolders = placeHoldersCount(b64);
            arr = new Arr(len * 3 / 4 - placeHolders);
            l = placeHolders > 0 ? len - 4 : len;
            var L = 0;
            for (i = 0; i < l; i += 4) {
                tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
                arr[L++] = tmp >> 16 & 255;
                arr[L++] = tmp >> 8 & 255;
                arr[L++] = tmp & 255;
            }
            if (placeHolders === 2) {
                tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
                arr[L++] = tmp & 255;
            } else if (placeHolders === 1) {
                tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
                arr[L++] = tmp >> 8 & 255;
                arr[L++] = tmp & 255;
            }
            return arr;
        }
        function tripletToBase64(num) {
            return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
        }
        function encodeChunk(uint8, start, end) {
            var tmp;
            var output = [];
            for (var i = start; i < end; i += 3) {
                tmp = (uint8[i] << 16 & 16711680) + (uint8[i + 1] << 8 & 65280) + (uint8[i + 2] & 255);
                output.push(tripletToBase64(tmp));
            }
            return output.join("");
        }
        function fromByteArray(uint8) {
            var tmp;
            var len = uint8.length;
            var extraBytes = len % 3;
            var output = "";
            var parts = [];
            var maxChunkLength = 16383;
            for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
                parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
            }
            if (extraBytes === 1) {
                tmp = uint8[len - 1];
                output += lookup[tmp >> 2];
                output += lookup[tmp << 4 & 63];
                output += "==";
            } else if (extraBytes === 2) {
                tmp = (uint8[len - 2] << 8) + uint8[len - 1];
                output += lookup[tmp >> 10];
                output += lookup[tmp >> 4 & 63];
                output += lookup[tmp << 2 & 63];
                output += "=";
            }
            parts.push(output);
            return parts.join("");
        }
    }, {} ]
}, {}, [ 184 ]);AWS.apiLoader.services["dynamodb"] = {};

AWS.DynamoDB = AWS.Service.defineService("dynamodb", [ "2011-12-05", "2012-08-10" ]);

_xamzrequire = function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof _xamzrequire == "function" && _xamzrequire;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f;
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }
        return n[o].exports;
    }
    var i = typeof _xamzrequire == "function" && _xamzrequire;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s;
}({
    239: [ function(require, module, exports) {
        var AWS = require("../core");
        require("../dynamodb/document_client");
        AWS.util.update(AWS.DynamoDB.prototype, {
            setupRequestListeners: function setupRequestListeners(request) {
                if (request.service.config.dynamoDbCrc32) {
                    request.removeListener("extractData", AWS.EventListeners.Json.EXTRACT_DATA);
                    request.addListener("extractData", this.checkCrc32);
                    request.addListener("extractData", AWS.EventListeners.Json.EXTRACT_DATA);
                }
            },
            checkCrc32: function checkCrc32(resp) {
                if (!resp.httpResponse.streaming && !resp.request.service.crc32IsValid(resp)) {
                    resp.data = null;
                    resp.error = AWS.util.error(new Error(), {
                        code: "CRC32CheckFailed",
                        message: "CRC32 integrity check failed",
                        retryable: true
                    });
                    resp.request.haltHandlersOnError();
                    throw resp.error;
                }
            },
            crc32IsValid: function crc32IsValid(resp) {
                var crc = resp.httpResponse.headers["x-amz-crc32"];
                if (!crc) return true;
                return parseInt(crc, 10) === AWS.util.crypto.crc32(resp.httpResponse.body);
            },
            defaultRetryCount: 10,
            retryDelays: function retryDelays(retryCount) {
                var retryDelayOptions = AWS.util.copy(this.config.retryDelayOptions);
                if (typeof retryDelayOptions.base !== "number") {
                    retryDelayOptions.base = 50;
                }
                var delay = AWS.util.calculateRetryDelay(retryCount, retryDelayOptions);
                return delay;
            }
        });
    }, {
        "../core": 194,
        "../dynamodb/document_client": 202
    } ],
    202: [ function(require, module, exports) {
        var AWS = require("../core");
        var Translator = require("./translator");
        var DynamoDBSet = require("./set");
        AWS.DynamoDB.DocumentClient = AWS.util.inherit({
            operations: {
                batchGetItem: "batchGet",
                batchWriteItem: "batchWrite",
                putItem: "put",
                getItem: "get",
                deleteItem: "delete",
                updateItem: "update",
                scan: "scan",
                query: "query"
            },
            constructor: function DocumentClient(options) {
                var self = this;
                self.options = options || {};
                self.configure(self.options);
            },
            configure: function configure(options) {
                var self = this;
                self.service = options.service;
                self.bindServiceObject(options);
                self.attrValue = options.attrValue = self.service.api.operations.putItem.input.members.Item.value.shape;
            },
            bindServiceObject: function bindServiceObject(options) {
                var self = this;
                options = options || {};
                if (!self.service) {
                    self.service = new AWS.DynamoDB(options);
                } else {
                    var config = AWS.util.copy(self.service.config);
                    self.service = new self.service.constructor.__super__(config);
                    self.service.config.params = AWS.util.merge(self.service.config.params || {}, options.params);
                }
            },
            batchGet: function(params, callback) {
                var self = this;
                var request = self.service.batchGetItem(params);
                self.setupRequest(request);
                self.setupResponse(request);
                if (typeof callback === "function") {
                    request.send(callback);
                }
                return request;
            },
            batchWrite: function(params, callback) {
                var self = this;
                var request = self.service.batchWriteItem(params);
                self.setupRequest(request);
                self.setupResponse(request);
                if (typeof callback === "function") {
                    request.send(callback);
                }
                return request;
            },
            delete: function(params, callback) {
                var self = this;
                var request = self.service.deleteItem(params);
                self.setupRequest(request);
                self.setupResponse(request);
                if (typeof callback === "function") {
                    request.send(callback);
                }
                return request;
            },
            get: function(params, callback) {
                var self = this;
                var request = self.service.getItem(params);
                self.setupRequest(request);
                self.setupResponse(request);
                if (typeof callback === "function") {
                    request.send(callback);
                }
                return request;
            },
            put: function put(params, callback) {
                var self = this;
                var request = self.service.putItem(params);
                self.setupRequest(request);
                self.setupResponse(request);
                if (typeof callback === "function") {
                    request.send(callback);
                }
                return request;
            },
            update: function(params, callback) {
                var self = this;
                var request = self.service.updateItem(params);
                self.setupRequest(request);
                self.setupResponse(request);
                if (typeof callback === "function") {
                    request.send(callback);
                }
                return request;
            },
            scan: function(params, callback) {
                var self = this;
                var request = self.service.scan(params);
                self.setupRequest(request);
                self.setupResponse(request);
                if (typeof callback === "function") {
                    request.send(callback);
                }
                return request;
            },
            query: function(params, callback) {
                var self = this;
                var request = self.service.query(params);
                self.setupRequest(request);
                self.setupResponse(request);
                if (typeof callback === "function") {
                    request.send(callback);
                }
                return request;
            },
            createSet: function(list, options) {
                options = options || {};
                return new DynamoDBSet(list, options);
            },
            getTranslator: function() {
                return new Translator(this.options);
            },
            setupRequest: function setupRequest(request) {
                var self = this;
                var translator = self.getTranslator();
                var operation = request.operation;
                var inputShape = request.service.api.operations[operation].input;
                request._events.validate.unshift(function(req) {
                    req.rawParams = AWS.util.copy(req.params);
                    req.params = translator.translateInput(req.rawParams, inputShape);
                });
            },
            setupResponse: function setupResponse(request) {
                var self = this;
                var translator = self.getTranslator();
                var outputShape = self.service.api.operations[request.operation].output;
                request.on("extractData", function(response) {
                    response.data = translator.translateOutput(response.data, outputShape);
                });
                var response = request.response;
                response.nextPage = function(cb) {
                    var resp = this;
                    var req = resp.request;
                    var config;
                    var service = req.service;
                    var operation = req.operation;
                    try {
                        config = service.paginationConfig(operation, true);
                    } catch (e) {
                        resp.error = e;
                    }
                    if (!resp.hasNextPage()) {
                        if (cb) cb(resp.error, null); else if (resp.error) throw resp.error;
                        return null;
                    }
                    var params = AWS.util.copy(req.rawParams);
                    if (!resp.nextPageTokens) {
                        return cb ? cb(null, null) : null;
                    } else {
                        var inputTokens = config.inputToken;
                        if (typeof inputTokens === "string") inputTokens = [ inputTokens ];
                        for (var i = 0; i < inputTokens.length; i++) {
                            params[inputTokens[i]] = resp.nextPageTokens[i];
                        }
                        return self[operation](params, cb);
                    }
                };
            }
        });
        module.exports = AWS.DynamoDB.DocumentClient;
    }, {
        "../core": 194,
        "./set": 204,
        "./translator": 205
    } ],
    205: [ function(require, module, exports) {
        var util = require("../core").util;
        var convert = require("./converter");
        var Translator = function(options) {
            options = options || {};
            this.attrValue = options.attrValue;
            this.convertEmptyValues = Boolean(options.convertEmptyValues);
            this.wrapNumbers = Boolean(options.wrapNumbers);
        };
        Translator.prototype.translateInput = function(value, shape) {
            this.mode = "input";
            return this.translate(value, shape);
        };
        Translator.prototype.translateOutput = function(value, shape) {
            this.mode = "output";
            return this.translate(value, shape);
        };
        Translator.prototype.translate = function(value, shape) {
            var self = this;
            if (!shape || value === undefined) return undefined;
            if (shape.shape === self.attrValue) {
                return convert[self.mode](value, {
                    convertEmptyValues: self.convertEmptyValues,
                    wrapNumbers: self.wrapNumbers
                });
            }
            switch (shape.type) {
              case "structure":
                return self.translateStructure(value, shape);

              case "map":
                return self.translateMap(value, shape);

              case "list":
                return self.translateList(value, shape);

              default:
                return self.translateScalar(value, shape);
            }
        };
        Translator.prototype.translateStructure = function(structure, shape) {
            var self = this;
            if (structure == null) return undefined;
            var struct = {};
            util.each(structure, function(name, value) {
                var memberShape = shape.members[name];
                if (memberShape) {
                    var result = self.translate(value, memberShape);
                    if (result !== undefined) struct[name] = result;
                }
            });
            return struct;
        };
        Translator.prototype.translateList = function(list, shape) {
            var self = this;
            if (list == null) return undefined;
            var out = [];
            util.arrayEach(list, function(value) {
                var result = self.translate(value, shape.member);
                if (result === undefined) out.push(null); else out.push(result);
            });
            return out;
        };
        Translator.prototype.translateMap = function(map, shape) {
            var self = this;
            if (map == null) return undefined;
            var out = {};
            util.each(map, function(key, value) {
                var result = self.translate(value, shape.value);
                if (result === undefined) out[key] = null; else out[key] = result;
            });
            return out;
        };
        Translator.prototype.translateScalar = function(value, shape) {
            return shape.toType(value);
        };
        module.exports = Translator;
    }, {
        "../core": 194,
        "./converter": 201
    } ],
    201: [ function(require, module, exports) {
        var AWS = require("../core");
        var util = AWS.util;
        var typeOf = require("./types").typeOf;
        var DynamoDBSet = require("./set");
        var NumberValue = require("./numberValue");
        AWS.DynamoDB.Converter = {
            input: function convertInput(data, options) {
                options = options || {};
                var type = typeOf(data);
                if (type === "Object") {
                    return formatMap(data, options);
                } else if (type === "Array") {
                    return formatList(data, options);
                } else if (type === "Set") {
                    return formatSet(data, options);
                } else if (type === "String") {
                    if (data.length === 0 && options.convertEmptyValues) {
                        return convertInput(null);
                    }
                    return {
                        S: data
                    };
                } else if (type === "Number" || type === "NumberValue") {
                    return {
                        N: data.toString()
                    };
                } else if (type === "Binary") {
                    if (data.length === 0 && options.convertEmptyValues) {
                        return convertInput(null);
                    }
                    return {
                        B: data
                    };
                } else if (type === "Boolean") {
                    return {
                        BOOL: data
                    };
                } else if (type === "null") {
                    return {
                        NULL: true
                    };
                } else if (type !== "undefined" && type !== "Function") {
                    return formatMap(data, options);
                }
            },
            marshall: function marshallItem(data, options) {
                return AWS.DynamoDB.Converter.input(data, options).M;
            },
            output: function convertOutput(data, options) {
                options = options || {};
                var list, map, i;
                for (var type in data) {
                    var values = data[type];
                    if (type === "M") {
                        map = {};
                        for (var key in values) {
                            map[key] = convertOutput(values[key], options);
                        }
                        return map;
                    } else if (type === "L") {
                        list = [];
                        for (i = 0; i < values.length; i++) {
                            list.push(convertOutput(values[i], options));
                        }
                        return list;
                    } else if (type === "SS") {
                        list = [];
                        for (i = 0; i < values.length; i++) {
                            list.push(values[i] + "");
                        }
                        return new DynamoDBSet(list);
                    } else if (type === "NS") {
                        list = [];
                        for (i = 0; i < values.length; i++) {
                            list.push(convertNumber(values[i], options.wrapNumbers));
                        }
                        return new DynamoDBSet(list);
                    } else if (type === "BS") {
                        list = [];
                        for (i = 0; i < values.length; i++) {
                            list.push(new util.Buffer(values[i]));
                        }
                        return new DynamoDBSet(list);
                    } else if (type === "S") {
                        return values + "";
                    } else if (type === "N") {
                        return convertNumber(values, options.wrapNumbers);
                    } else if (type === "B") {
                        return new util.Buffer(values);
                    } else if (type === "BOOL") {
                        return values === "true" || values === "TRUE" || values === true;
                    } else if (type === "NULL") {
                        return null;
                    }
                }
            },
            unmarshall: function unmarshall(data, options) {
                return AWS.DynamoDB.Converter.output({
                    M: data
                }, options);
            }
        };
        function formatList(data, options) {
            var list = {
                L: []
            };
            for (var i = 0; i < data.length; i++) {
                list["L"].push(AWS.DynamoDB.Converter.input(data[i], options));
            }
            return list;
        }
        function convertNumber(value, wrapNumbers) {
            return wrapNumbers ? new NumberValue(value) : Number(value);
        }
        function formatMap(data, options) {
            var map = {
                M: {}
            };
            for (var key in data) {
                var formatted = AWS.DynamoDB.Converter.input(data[key], options);
                if (formatted !== void 0) {
                    map["M"][key] = formatted;
                }
            }
            return map;
        }
        function formatSet(data, options) {
            options = options || {};
            var values = data.values;
            if (options.convertEmptyValues) {
                values = filterEmptySetValues(data);
                if (values.length === 0) {
                    return AWS.DynamoDB.Converter.input(null);
                }
            }
            var map = {};
            switch (data.type) {
              case "String":
                map["SS"] = values;
                break;

              case "Binary":
                map["BS"] = values;
                break;

              case "Number":
                map["NS"] = values.map(function(value) {
                    return value.toString();
                });
            }
            return map;
        }
        function filterEmptySetValues(set) {
            var nonEmptyValues = [];
            var potentiallyEmptyTypes = {
                String: true,
                Binary: true,
                Number: false
            };
            if (potentiallyEmptyTypes[set.type]) {
                for (var i = 0; i < set.values.length; i++) {
                    if (set.values[i].length === 0) {
                        continue;
                    }
                    nonEmptyValues.push(set.values[i]);
                }
                return nonEmptyValues;
            }
            return set.values;
        }
        module.exports = AWS.DynamoDB.Converter;
    }, {
        "../core": 194,
        "./numberValue": 203,
        "./set": 204,
        "./types": 206
    } ],
    204: [ function(require, module, exports) {
        var util = require("../core").util;
        var typeOf = require("./types").typeOf;
        var memberTypeToSetType = {
            String: "String",
            Number: "Number",
            NumberValue: "Number",
            Binary: "Binary"
        };
        var DynamoDBSet = util.inherit({
            constructor: function Set(list, options) {
                options = options || {};
                this.wrapperName = "Set";
                this.initialize(list, options.validate);
            },
            initialize: function(list, validate) {
                var self = this;
                self.values = [].concat(list);
                self.detectType();
                if (validate) {
                    self.validate();
                }
            },
            detectType: function() {
                this.type = memberTypeToSetType[typeOf(this.values[0])];
                if (!this.type) {
                    throw util.error(new Error(), {
                        code: "InvalidSetType",
                        message: "Sets can contain string, number, or binary values"
                    });
                }
            },
            validate: function() {
                var self = this;
                var length = self.values.length;
                var values = self.values;
                for (var i = 0; i < length; i++) {
                    if (memberTypeToSetType[typeOf(values[i])] !== self.type) {
                        throw util.error(new Error(), {
                            code: "InvalidType",
                            message: self.type + " Set contains " + typeOf(values[i]) + " value"
                        });
                    }
                }
            }
        });
        module.exports = DynamoDBSet;
    }, {
        "../core": 194,
        "./types": 206
    } ],
    206: [ function(require, module, exports) {
        var util = require("../core").util;
        function typeOf(data) {
            if (data === null && typeof data === "object") {
                return "null";
            } else if (data !== undefined && isBinary(data)) {
                return "Binary";
            } else if (data !== undefined && data.constructor) {
                return data.wrapperName || util.typeName(data.constructor);
            } else if (data !== undefined && typeof data === "object") {
                return "Object";
            } else {
                return "undefined";
            }
        }
        function isBinary(data) {
            var types = [ "Buffer", "File", "Blob", "ArrayBuffer", "DataView", "Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array" ];
            if (util.isNode()) {
                var Stream = util.stream.Stream;
                if (util.Buffer.isBuffer(data) || data instanceof Stream) {
                    return true;
                }
            }
            for (var i = 0; i < types.length; i++) {
                if (data !== undefined && data.constructor) {
                    if (util.isType(data, types[i])) return true;
                    if (util.typeName(data.constructor) === types[i]) return true;
                }
            }
            return false;
        }
        module.exports = {
            typeOf: typeOf,
            isBinary: isBinary
        };
    }, {
        "../core": 194
    } ],
    203: [ function(require, module, exports) {
        var util = require("../core").util;
        var DynamoDBNumberValue = util.inherit({
            constructor: function NumberValue(value) {
                this.wrapperName = "NumberValue";
                this.value = value.toString();
            },
            toJSON: function() {
                return this.toNumber();
            },
            toNumber: function() {
                return Number(this.value);
            },
            toString: function() {
                return this.value;
            }
        });
        module.exports = DynamoDBNumberValue;
    }, {
        "../core": 194
    } ]
}, {}, [ 239 ]);AWS.apiLoader.services["dynamodb"]["2012-08-10"] = {
    version: "2.0",
    metadata: {
        apiVersion: "2012-08-10",
        endpointPrefix: "dynamodb",
        jsonVersion: "1.0",
        protocol: "json",
        serviceAbbreviation: "DynamoDB",
        serviceFullName: "Amazon DynamoDB",
        serviceId: "DynamoDB",
        signatureVersion: "v4",
        targetPrefix: "DynamoDB_20120810",
        uid: "dynamodb-2012-08-10"
    },
    operations: {
        BatchGetItem: {
            input: {
                type: "structure",
                required: [ "RequestItems" ],
                members: {
                    RequestItems: {
                        shape: "S2"
                    },
                    ReturnConsumedCapacity: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    Responses: {
                        type: "map",
                        key: {},
                        value: {
                            shape: "Sr"
                        }
                    },
                    UnprocessedKeys: {
                        shape: "S2"
                    },
                    ConsumedCapacity: {
                        shape: "St"
                    }
                }
            }
        },
        BatchWriteItem: {
            input: {
                type: "structure",
                required: [ "RequestItems" ],
                members: {
                    RequestItems: {
                        shape: "S10"
                    },
                    ReturnConsumedCapacity: {},
                    ReturnItemCollectionMetrics: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    UnprocessedItems: {
                        shape: "S10"
                    },
                    ItemCollectionMetrics: {
                        type: "map",
                        key: {},
                        value: {
                            type: "list",
                            member: {
                                shape: "S1a"
                            }
                        }
                    },
                    ConsumedCapacity: {
                        shape: "St"
                    }
                }
            }
        },
        CreateBackup: {
            input: {
                type: "structure",
                required: [ "TableName", "BackupName" ],
                members: {
                    TableName: {},
                    BackupName: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    BackupDetails: {
                        shape: "S1h"
                    }
                }
            }
        },
        CreateGlobalTable: {
            input: {
                type: "structure",
                required: [ "GlobalTableName", "ReplicationGroup" ],
                members: {
                    GlobalTableName: {},
                    ReplicationGroup: {
                        shape: "S1n"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    GlobalTableDescription: {
                        shape: "S1r"
                    }
                }
            }
        },
        CreateTable: {
            input: {
                type: "structure",
                required: [ "AttributeDefinitions", "TableName", "KeySchema", "ProvisionedThroughput" ],
                members: {
                    AttributeDefinitions: {
                        shape: "S1y"
                    },
                    TableName: {},
                    KeySchema: {
                        shape: "S22"
                    },
                    LocalSecondaryIndexes: {
                        type: "list",
                        member: {
                            type: "structure",
                            required: [ "IndexName", "KeySchema", "Projection" ],
                            members: {
                                IndexName: {},
                                KeySchema: {
                                    shape: "S22"
                                },
                                Projection: {
                                    shape: "S27"
                                }
                            }
                        }
                    },
                    GlobalSecondaryIndexes: {
                        type: "list",
                        member: {
                            type: "structure",
                            required: [ "IndexName", "KeySchema", "Projection", "ProvisionedThroughput" ],
                            members: {
                                IndexName: {},
                                KeySchema: {
                                    shape: "S22"
                                },
                                Projection: {
                                    shape: "S27"
                                },
                                ProvisionedThroughput: {
                                    shape: "S2d"
                                }
                            }
                        }
                    },
                    ProvisionedThroughput: {
                        shape: "S2d"
                    },
                    StreamSpecification: {
                        shape: "S2f"
                    },
                    SSESpecification: {
                        type: "structure",
                        required: [ "Enabled" ],
                        members: {
                            Enabled: {
                                type: "boolean"
                            }
                        }
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    TableDescription: {
                        shape: "S2l"
                    }
                }
            }
        },
        DeleteBackup: {
            input: {
                type: "structure",
                required: [ "BackupArn" ],
                members: {
                    BackupArn: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    BackupDescription: {
                        shape: "S35"
                    }
                }
            }
        },
        DeleteItem: {
            input: {
                type: "structure",
                required: [ "TableName", "Key" ],
                members: {
                    TableName: {},
                    Key: {
                        shape: "S6"
                    },
                    Expected: {
                        shape: "S3i"
                    },
                    ConditionalOperator: {},
                    ReturnValues: {},
                    ReturnConsumedCapacity: {},
                    ReturnItemCollectionMetrics: {},
                    ConditionExpression: {},
                    ExpressionAttributeNames: {
                        shape: "Sm"
                    },
                    ExpressionAttributeValues: {
                        shape: "S3q"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Attributes: {
                        shape: "Ss"
                    },
                    ConsumedCapacity: {
                        shape: "Su"
                    },
                    ItemCollectionMetrics: {
                        shape: "S1a"
                    }
                }
            }
        },
        DeleteTable: {
            input: {
                type: "structure",
                required: [ "TableName" ],
                members: {
                    TableName: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    TableDescription: {
                        shape: "S2l"
                    }
                }
            }
        },
        DescribeBackup: {
            input: {
                type: "structure",
                required: [ "BackupArn" ],
                members: {
                    BackupArn: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    BackupDescription: {
                        shape: "S35"
                    }
                }
            }
        },
        DescribeContinuousBackups: {
            input: {
                type: "structure",
                required: [ "TableName" ],
                members: {
                    TableName: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    ContinuousBackupsDescription: {
                        shape: "S3z"
                    }
                }
            }
        },
        DescribeGlobalTable: {
            input: {
                type: "structure",
                required: [ "GlobalTableName" ],
                members: {
                    GlobalTableName: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    GlobalTableDescription: {
                        shape: "S1r"
                    }
                }
            }
        },
        DescribeLimits: {
            input: {
                type: "structure",
                members: {}
            },
            output: {
                type: "structure",
                members: {
                    AccountMaxReadCapacityUnits: {
                        type: "long"
                    },
                    AccountMaxWriteCapacityUnits: {
                        type: "long"
                    },
                    TableMaxReadCapacityUnits: {
                        type: "long"
                    },
                    TableMaxWriteCapacityUnits: {
                        type: "long"
                    }
                }
            }
        },
        DescribeTable: {
            input: {
                type: "structure",
                required: [ "TableName" ],
                members: {
                    TableName: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    Table: {
                        shape: "S2l"
                    }
                }
            }
        },
        DescribeTimeToLive: {
            input: {
                type: "structure",
                required: [ "TableName" ],
                members: {
                    TableName: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    TimeToLiveDescription: {
                        shape: "S3e"
                    }
                }
            }
        },
        GetItem: {
            input: {
                type: "structure",
                required: [ "TableName", "Key" ],
                members: {
                    TableName: {},
                    Key: {
                        shape: "S6"
                    },
                    AttributesToGet: {
                        shape: "Sj"
                    },
                    ConsistentRead: {
                        type: "boolean"
                    },
                    ReturnConsumedCapacity: {},
                    ProjectionExpression: {},
                    ExpressionAttributeNames: {
                        shape: "Sm"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Item: {
                        shape: "Ss"
                    },
                    ConsumedCapacity: {
                        shape: "Su"
                    }
                }
            }
        },
        ListBackups: {
            input: {
                type: "structure",
                members: {
                    TableName: {},
                    Limit: {
                        type: "integer"
                    },
                    TimeRangeLowerBound: {
                        type: "timestamp"
                    },
                    TimeRangeUpperBound: {
                        type: "timestamp"
                    },
                    ExclusiveStartBackupArn: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    BackupSummaries: {
                        type: "list",
                        member: {
                            type: "structure",
                            members: {
                                TableName: {},
                                TableId: {},
                                TableArn: {},
                                BackupArn: {},
                                BackupName: {},
                                BackupCreationDateTime: {
                                    type: "timestamp"
                                },
                                BackupStatus: {},
                                BackupSizeBytes: {
                                    type: "long"
                                }
                            }
                        }
                    },
                    LastEvaluatedBackupArn: {}
                }
            }
        },
        ListGlobalTables: {
            input: {
                type: "structure",
                members: {
                    ExclusiveStartGlobalTableName: {},
                    Limit: {
                        type: "integer"
                    },
                    RegionName: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    GlobalTables: {
                        type: "list",
                        member: {
                            type: "structure",
                            members: {
                                GlobalTableName: {},
                                ReplicationGroup: {
                                    shape: "S1n"
                                }
                            }
                        }
                    },
                    LastEvaluatedGlobalTableName: {}
                }
            }
        },
        ListTables: {
            input: {
                type: "structure",
                members: {
                    ExclusiveStartTableName: {},
                    Limit: {
                        type: "integer"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    TableNames: {
                        type: "list",
                        member: {}
                    },
                    LastEvaluatedTableName: {}
                }
            }
        },
        ListTagsOfResource: {
            input: {
                type: "structure",
                required: [ "ResourceArn" ],
                members: {
                    ResourceArn: {},
                    NextToken: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    Tags: {
                        shape: "S4x"
                    },
                    NextToken: {}
                }
            }
        },
        PutItem: {
            input: {
                type: "structure",
                required: [ "TableName", "Item" ],
                members: {
                    TableName: {},
                    Item: {
                        shape: "S14"
                    },
                    Expected: {
                        shape: "S3i"
                    },
                    ReturnValues: {},
                    ReturnConsumedCapacity: {},
                    ReturnItemCollectionMetrics: {},
                    ConditionalOperator: {},
                    ConditionExpression: {},
                    ExpressionAttributeNames: {
                        shape: "Sm"
                    },
                    ExpressionAttributeValues: {
                        shape: "S3q"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Attributes: {
                        shape: "Ss"
                    },
                    ConsumedCapacity: {
                        shape: "Su"
                    },
                    ItemCollectionMetrics: {
                        shape: "S1a"
                    }
                }
            }
        },
        Query: {
            input: {
                type: "structure",
                required: [ "TableName" ],
                members: {
                    TableName: {},
                    IndexName: {},
                    Select: {},
                    AttributesToGet: {
                        shape: "Sj"
                    },
                    Limit: {
                        type: "integer"
                    },
                    ConsistentRead: {
                        type: "boolean"
                    },
                    KeyConditions: {
                        type: "map",
                        key: {},
                        value: {
                            shape: "S56"
                        }
                    },
                    QueryFilter: {
                        shape: "S57"
                    },
                    ConditionalOperator: {},
                    ScanIndexForward: {
                        type: "boolean"
                    },
                    ExclusiveStartKey: {
                        shape: "S6"
                    },
                    ReturnConsumedCapacity: {},
                    ProjectionExpression: {},
                    FilterExpression: {},
                    KeyConditionExpression: {},
                    ExpressionAttributeNames: {
                        shape: "Sm"
                    },
                    ExpressionAttributeValues: {
                        shape: "S3q"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Items: {
                        shape: "Sr"
                    },
                    Count: {
                        type: "integer"
                    },
                    ScannedCount: {
                        type: "integer"
                    },
                    LastEvaluatedKey: {
                        shape: "S6"
                    },
                    ConsumedCapacity: {
                        shape: "Su"
                    }
                }
            }
        },
        RestoreTableFromBackup: {
            input: {
                type: "structure",
                required: [ "TargetTableName", "BackupArn" ],
                members: {
                    TargetTableName: {},
                    BackupArn: {}
                }
            },
            output: {
                type: "structure",
                members: {
                    TableDescription: {
                        shape: "S2l"
                    }
                }
            }
        },
        RestoreTableToPointInTime: {
            input: {
                type: "structure",
                required: [ "SourceTableName", "TargetTableName" ],
                members: {
                    SourceTableName: {},
                    TargetTableName: {},
                    UseLatestRestorableTime: {
                        type: "boolean"
                    },
                    RestoreDateTime: {
                        type: "timestamp"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    TableDescription: {
                        shape: "S2l"
                    }
                }
            }
        },
        Scan: {
            input: {
                type: "structure",
                required: [ "TableName" ],
                members: {
                    TableName: {},
                    IndexName: {},
                    AttributesToGet: {
                        shape: "Sj"
                    },
                    Limit: {
                        type: "integer"
                    },
                    Select: {},
                    ScanFilter: {
                        shape: "S57"
                    },
                    ConditionalOperator: {},
                    ExclusiveStartKey: {
                        shape: "S6"
                    },
                    ReturnConsumedCapacity: {},
                    TotalSegments: {
                        type: "integer"
                    },
                    Segment: {
                        type: "integer"
                    },
                    ProjectionExpression: {},
                    FilterExpression: {},
                    ExpressionAttributeNames: {
                        shape: "Sm"
                    },
                    ExpressionAttributeValues: {
                        shape: "S3q"
                    },
                    ConsistentRead: {
                        type: "boolean"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Items: {
                        shape: "Sr"
                    },
                    Count: {
                        type: "integer"
                    },
                    ScannedCount: {
                        type: "integer"
                    },
                    LastEvaluatedKey: {
                        shape: "S6"
                    },
                    ConsumedCapacity: {
                        shape: "Su"
                    }
                }
            }
        },
        TagResource: {
            input: {
                type: "structure",
                required: [ "ResourceArn", "Tags" ],
                members: {
                    ResourceArn: {},
                    Tags: {
                        shape: "S4x"
                    }
                }
            }
        },
        UntagResource: {
            input: {
                type: "structure",
                required: [ "ResourceArn", "TagKeys" ],
                members: {
                    ResourceArn: {},
                    TagKeys: {
                        type: "list",
                        member: {}
                    }
                }
            }
        },
        UpdateContinuousBackups: {
            input: {
                type: "structure",
                required: [ "TableName", "PointInTimeRecoverySpecification" ],
                members: {
                    TableName: {},
                    PointInTimeRecoverySpecification: {
                        type: "structure",
                        required: [ "PointInTimeRecoveryEnabled" ],
                        members: {
                            PointInTimeRecoveryEnabled: {
                                type: "boolean"
                            }
                        }
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    ContinuousBackupsDescription: {
                        shape: "S3z"
                    }
                }
            }
        },
        UpdateGlobalTable: {
            input: {
                type: "structure",
                required: [ "GlobalTableName", "ReplicaUpdates" ],
                members: {
                    GlobalTableName: {},
                    ReplicaUpdates: {
                        type: "list",
                        member: {
                            type: "structure",
                            members: {
                                Create: {
                                    type: "structure",
                                    required: [ "RegionName" ],
                                    members: {
                                        RegionName: {}
                                    }
                                },
                                Delete: {
                                    type: "structure",
                                    required: [ "RegionName" ],
                                    members: {
                                        RegionName: {}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    GlobalTableDescription: {
                        shape: "S1r"
                    }
                }
            }
        },
        UpdateItem: {
            input: {
                type: "structure",
                required: [ "TableName", "Key" ],
                members: {
                    TableName: {},
                    Key: {
                        shape: "S6"
                    },
                    AttributeUpdates: {
                        type: "map",
                        key: {},
                        value: {
                            type: "structure",
                            members: {
                                Value: {
                                    shape: "S8"
                                },
                                Action: {}
                            }
                        }
                    },
                    Expected: {
                        shape: "S3i"
                    },
                    ConditionalOperator: {},
                    ReturnValues: {},
                    ReturnConsumedCapacity: {},
                    ReturnItemCollectionMetrics: {},
                    UpdateExpression: {},
                    ConditionExpression: {},
                    ExpressionAttributeNames: {
                        shape: "Sm"
                    },
                    ExpressionAttributeValues: {
                        shape: "S3q"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Attributes: {
                        shape: "Ss"
                    },
                    ConsumedCapacity: {
                        shape: "Su"
                    },
                    ItemCollectionMetrics: {
                        shape: "S1a"
                    }
                }
            }
        },
        UpdateTable: {
            input: {
                type: "structure",
                required: [ "TableName" ],
                members: {
                    AttributeDefinitions: {
                        shape: "S1y"
                    },
                    TableName: {},
                    ProvisionedThroughput: {
                        shape: "S2d"
                    },
                    GlobalSecondaryIndexUpdates: {
                        type: "list",
                        member: {
                            type: "structure",
                            members: {
                                Update: {
                                    type: "structure",
                                    required: [ "IndexName", "ProvisionedThroughput" ],
                                    members: {
                                        IndexName: {},
                                        ProvisionedThroughput: {
                                            shape: "S2d"
                                        }
                                    }
                                },
                                Create: {
                                    type: "structure",
                                    required: [ "IndexName", "KeySchema", "Projection", "ProvisionedThroughput" ],
                                    members: {
                                        IndexName: {},
                                        KeySchema: {
                                            shape: "S22"
                                        },
                                        Projection: {
                                            shape: "S27"
                                        },
                                        ProvisionedThroughput: {
                                            shape: "S2d"
                                        }
                                    }
                                },
                                Delete: {
                                    type: "structure",
                                    required: [ "IndexName" ],
                                    members: {
                                        IndexName: {}
                                    }
                                }
                            }
                        }
                    },
                    StreamSpecification: {
                        shape: "S2f"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    TableDescription: {
                        shape: "S2l"
                    }
                }
            }
        },
        UpdateTimeToLive: {
            input: {
                type: "structure",
                required: [ "TableName", "TimeToLiveSpecification" ],
                members: {
                    TableName: {},
                    TimeToLiveSpecification: {
                        shape: "S69"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    TimeToLiveSpecification: {
                        shape: "S69"
                    }
                }
            }
        }
    },
    shapes: {
        S2: {
            type: "map",
            key: {},
            value: {
                type: "structure",
                required: [ "Keys" ],
                members: {
                    Keys: {
                        type: "list",
                        member: {
                            shape: "S6"
                        }
                    },
                    AttributesToGet: {
                        shape: "Sj"
                    },
                    ConsistentRead: {
                        type: "boolean"
                    },
                    ProjectionExpression: {},
                    ExpressionAttributeNames: {
                        shape: "Sm"
                    }
                }
            }
        },
        S6: {
            type: "map",
            key: {},
            value: {
                shape: "S8"
            }
        },
        S8: {
            type: "structure",
            members: {
                S: {},
                N: {},
                B: {
                    type: "blob"
                },
                SS: {
                    type: "list",
                    member: {}
                },
                NS: {
                    type: "list",
                    member: {}
                },
                BS: {
                    type: "list",
                    member: {
                        type: "blob"
                    }
                },
                M: {
                    type: "map",
                    key: {},
                    value: {
                        shape: "S8"
                    }
                },
                L: {
                    type: "list",
                    member: {
                        shape: "S8"
                    }
                },
                NULL: {
                    type: "boolean"
                },
                BOOL: {
                    type: "boolean"
                }
            }
        },
        Sj: {
            type: "list",
            member: {}
        },
        Sm: {
            type: "map",
            key: {},
            value: {}
        },
        Sr: {
            type: "list",
            member: {
                shape: "Ss"
            }
        },
        Ss: {
            type: "map",
            key: {},
            value: {
                shape: "S8"
            }
        },
        St: {
            type: "list",
            member: {
                shape: "Su"
            }
        },
        Su: {
            type: "structure",
            members: {
                TableName: {},
                CapacityUnits: {
                    type: "double"
                },
                Table: {
                    shape: "Sw"
                },
                LocalSecondaryIndexes: {
                    shape: "Sx"
                },
                GlobalSecondaryIndexes: {
                    shape: "Sx"
                }
            }
        },
        Sw: {
            type: "structure",
            members: {
                CapacityUnits: {
                    type: "double"
                }
            }
        },
        Sx: {
            type: "map",
            key: {},
            value: {
                shape: "Sw"
            }
        },
        S10: {
            type: "map",
            key: {},
            value: {
                type: "list",
                member: {
                    type: "structure",
                    members: {
                        PutRequest: {
                            type: "structure",
                            required: [ "Item" ],
                            members: {
                                Item: {
                                    shape: "S14"
                                }
                            }
                        },
                        DeleteRequest: {
                            type: "structure",
                            required: [ "Key" ],
                            members: {
                                Key: {
                                    shape: "S6"
                                }
                            }
                        }
                    }
                }
            }
        },
        S14: {
            type: "map",
            key: {},
            value: {
                shape: "S8"
            }
        },
        S1a: {
            type: "structure",
            members: {
                ItemCollectionKey: {
                    type: "map",
                    key: {},
                    value: {
                        shape: "S8"
                    }
                },
                SizeEstimateRangeGB: {
                    type: "list",
                    member: {
                        type: "double"
                    }
                }
            }
        },
        S1h: {
            type: "structure",
            required: [ "BackupArn", "BackupName", "BackupStatus", "BackupCreationDateTime" ],
            members: {
                BackupArn: {},
                BackupName: {},
                BackupSizeBytes: {
                    type: "long"
                },
                BackupStatus: {},
                BackupCreationDateTime: {
                    type: "timestamp"
                }
            }
        },
        S1n: {
            type: "list",
            member: {
                type: "structure",
                members: {
                    RegionName: {}
                }
            }
        },
        S1r: {
            type: "structure",
            members: {
                ReplicationGroup: {
                    type: "list",
                    member: {
                        type: "structure",
                        members: {
                            RegionName: {}
                        }
                    }
                },
                GlobalTableArn: {},
                CreationDateTime: {
                    type: "timestamp"
                },
                GlobalTableStatus: {},
                GlobalTableName: {}
            }
        },
        S1y: {
            type: "list",
            member: {
                type: "structure",
                required: [ "AttributeName", "AttributeType" ],
                members: {
                    AttributeName: {},
                    AttributeType: {}
                }
            }
        },
        S22: {
            type: "list",
            member: {
                type: "structure",
                required: [ "AttributeName", "KeyType" ],
                members: {
                    AttributeName: {},
                    KeyType: {}
                }
            }
        },
        S27: {
            type: "structure",
            members: {
                ProjectionType: {},
                NonKeyAttributes: {
                    type: "list",
                    member: {}
                }
            }
        },
        S2d: {
            type: "structure",
            required: [ "ReadCapacityUnits", "WriteCapacityUnits" ],
            members: {
                ReadCapacityUnits: {
                    type: "long"
                },
                WriteCapacityUnits: {
                    type: "long"
                }
            }
        },
        S2f: {
            type: "structure",
            members: {
                StreamEnabled: {
                    type: "boolean"
                },
                StreamViewType: {}
            }
        },
        S2l: {
            type: "structure",
            members: {
                AttributeDefinitions: {
                    shape: "S1y"
                },
                TableName: {},
                KeySchema: {
                    shape: "S22"
                },
                TableStatus: {},
                CreationDateTime: {
                    type: "timestamp"
                },
                ProvisionedThroughput: {
                    shape: "S2n"
                },
                TableSizeBytes: {
                    type: "long"
                },
                ItemCount: {
                    type: "long"
                },
                TableArn: {},
                TableId: {},
                LocalSecondaryIndexes: {
                    type: "list",
                    member: {
                        type: "structure",
                        members: {
                            IndexName: {},
                            KeySchema: {
                                shape: "S22"
                            },
                            Projection: {
                                shape: "S27"
                            },
                            IndexSizeBytes: {
                                type: "long"
                            },
                            ItemCount: {
                                type: "long"
                            },
                            IndexArn: {}
                        }
                    }
                },
                GlobalSecondaryIndexes: {
                    type: "list",
                    member: {
                        type: "structure",
                        members: {
                            IndexName: {},
                            KeySchema: {
                                shape: "S22"
                            },
                            Projection: {
                                shape: "S27"
                            },
                            IndexStatus: {},
                            Backfilling: {
                                type: "boolean"
                            },
                            ProvisionedThroughput: {
                                shape: "S2n"
                            },
                            IndexSizeBytes: {
                                type: "long"
                            },
                            ItemCount: {
                                type: "long"
                            },
                            IndexArn: {}
                        }
                    }
                },
                StreamSpecification: {
                    shape: "S2f"
                },
                LatestStreamLabel: {},
                LatestStreamArn: {},
                RestoreSummary: {
                    type: "structure",
                    required: [ "RestoreDateTime", "RestoreInProgress" ],
                    members: {
                        SourceBackupArn: {},
                        SourceTableArn: {},
                        RestoreDateTime: {
                            type: "timestamp"
                        },
                        RestoreInProgress: {
                            type: "boolean"
                        }
                    }
                },
                SSEDescription: {
                    shape: "S31"
                }
            }
        },
        S2n: {
            type: "structure",
            members: {
                LastIncreaseDateTime: {
                    type: "timestamp"
                },
                LastDecreaseDateTime: {
                    type: "timestamp"
                },
                NumberOfDecreasesToday: {
                    type: "long"
                },
                ReadCapacityUnits: {
                    type: "long"
                },
                WriteCapacityUnits: {
                    type: "long"
                }
            }
        },
        S31: {
            type: "structure",
            members: {
                Status: {}
            }
        },
        S35: {
            type: "structure",
            members: {
                BackupDetails: {
                    shape: "S1h"
                },
                SourceTableDetails: {
                    type: "structure",
                    required: [ "TableName", "TableId", "KeySchema", "TableCreationDateTime", "ProvisionedThroughput" ],
                    members: {
                        TableName: {},
                        TableId: {},
                        TableArn: {},
                        TableSizeBytes: {
                            type: "long"
                        },
                        KeySchema: {
                            shape: "S22"
                        },
                        TableCreationDateTime: {
                            type: "timestamp"
                        },
                        ProvisionedThroughput: {
                            shape: "S2d"
                        },
                        ItemCount: {
                            type: "long"
                        }
                    }
                },
                SourceTableFeatureDetails: {
                    type: "structure",
                    members: {
                        LocalSecondaryIndexes: {
                            type: "list",
                            member: {
                                type: "structure",
                                members: {
                                    IndexName: {},
                                    KeySchema: {
                                        shape: "S22"
                                    },
                                    Projection: {
                                        shape: "S27"
                                    }
                                }
                            }
                        },
                        GlobalSecondaryIndexes: {
                            type: "list",
                            member: {
                                type: "structure",
                                members: {
                                    IndexName: {},
                                    KeySchema: {
                                        shape: "S22"
                                    },
                                    Projection: {
                                        shape: "S27"
                                    },
                                    ProvisionedThroughput: {
                                        shape: "S2d"
                                    }
                                }
                            }
                        },
                        StreamDescription: {
                            shape: "S2f"
                        },
                        TimeToLiveDescription: {
                            shape: "S3e"
                        },
                        SSEDescription: {
                            shape: "S31"
                        }
                    }
                }
            }
        },
        S3e: {
            type: "structure",
            members: {
                TimeToLiveStatus: {},
                AttributeName: {}
            }
        },
        S3i: {
            type: "map",
            key: {},
            value: {
                type: "structure",
                members: {
                    Value: {
                        shape: "S8"
                    },
                    Exists: {
                        type: "boolean"
                    },
                    ComparisonOperator: {},
                    AttributeValueList: {
                        shape: "S3m"
                    }
                }
            }
        },
        S3m: {
            type: "list",
            member: {
                shape: "S8"
            }
        },
        S3q: {
            type: "map",
            key: {},
            value: {
                shape: "S8"
            }
        },
        S3z: {
            type: "structure",
            required: [ "ContinuousBackupsStatus" ],
            members: {
                ContinuousBackupsStatus: {},
                PointInTimeRecoveryDescription: {
                    type: "structure",
                    members: {
                        PointInTimeRecoveryStatus: {},
                        EarliestRestorableDateTime: {
                            type: "timestamp"
                        },
                        LatestRestorableDateTime: {
                            type: "timestamp"
                        }
                    }
                }
            }
        },
        S4x: {
            type: "list",
            member: {
                type: "structure",
                required: [ "Key", "Value" ],
                members: {
                    Key: {},
                    Value: {}
                }
            }
        },
        S56: {
            type: "structure",
            required: [ "ComparisonOperator" ],
            members: {
                AttributeValueList: {
                    shape: "S3m"
                },
                ComparisonOperator: {}
            }
        },
        S57: {
            type: "map",
            key: {},
            value: {
                shape: "S56"
            }
        },
        S69: {
            type: "structure",
            required: [ "Enabled", "AttributeName" ],
            members: {
                Enabled: {
                    type: "boolean"
                },
                AttributeName: {}
            }
        }
    },
    paginators: {
        BatchGetItem: {
            input_token: "RequestItems",
            output_token: "UnprocessedKeys"
        },
        ListTables: {
            input_token: "ExclusiveStartTableName",
            limit_key: "Limit",
            output_token: "LastEvaluatedTableName",
            result_key: "TableNames"
        },
        Query: {
            input_token: "ExclusiveStartKey",
            limit_key: "Limit",
            output_token: "LastEvaluatedKey",
            result_key: "Items"
        },
        Scan: {
            input_token: "ExclusiveStartKey",
            limit_key: "Limit",
            output_token: "LastEvaluatedKey",
            result_key: "Items"
        }
    },
    waiters: {
        TableExists: {
            delay: 20,
            operation: "DescribeTable",
            maxAttempts: 25,
            acceptors: [ {
                expected: "ACTIVE",
                matcher: "path",
                state: "success",
                argument: "Table.TableStatus"
            }, {
                expected: "ResourceNotFoundException",
                matcher: "error",
                state: "retry"
            } ]
        },
        TableNotExists: {
            delay: 20,
            operation: "DescribeTable",
            maxAttempts: 25,
            acceptors: [ {
                expected: "ResourceNotFoundException",
                matcher: "error",
                state: "success"
            } ]
        }
    }
};AWS.apiLoader.services["s3"] = {};

AWS.S3 = AWS.Service.defineService("s3", [ "2006-03-01" ]);

_xamzrequire = function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof _xamzrequire == "function" && _xamzrequire;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f;
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }
        return n[o].exports;
    }
    var i = typeof _xamzrequire == "function" && _xamzrequire;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s;
}({
    248: [ function(require, module, exports) {
        var AWS = require("../core");
        var v4Credentials = require("../signers/v4_credentials");
        require("../s3/managed_upload");
        var operationsWith200StatusCodeError = {
            completeMultipartUpload: true,
            copyObject: true,
            uploadPartCopy: true
        };
        var regionRedirectErrorCodes = [ "AuthorizationHeaderMalformed", "BadRequest", "PermanentRedirect", 301 ];
        AWS.util.update(AWS.S3.prototype, {
            getSignatureVersion: function getSignatureVersion(request) {
                var defaultApiVersion = this.api.signatureVersion;
                var userDefinedVersion = this._originalConfig ? this._originalConfig.signatureVersion : null;
                var regionDefinedVersion = this.config.signatureVersion;
                var isPresigned = request ? request.isPresigned() : false;
                if (userDefinedVersion) {
                    userDefinedVersion = userDefinedVersion === "v2" ? "s3" : userDefinedVersion;
                    return userDefinedVersion;
                }
                if (isPresigned !== true) {
                    defaultApiVersion = "v4";
                } else if (regionDefinedVersion) {
                    defaultApiVersion = regionDefinedVersion;
                }
                return defaultApiVersion;
            },
            getSignerClass: function getSignerClass(request) {
                var signatureVersion = this.getSignatureVersion(request);
                return AWS.Signers.RequestSigner.getVersion(signatureVersion);
            },
            validateService: function validateService() {
                var msg;
                var messages = [];
                if (!this.config.region) this.config.region = "us-east-1";
                if (!this.config.endpoint && this.config.s3BucketEndpoint) {
                    messages.push("An endpoint must be provided when configuring " + "`s3BucketEndpoint` to true.");
                }
                if (messages.length === 1) {
                    msg = messages[0];
                } else if (messages.length > 1) {
                    msg = "Multiple configuration errors:\n" + messages.join("\n");
                }
                if (msg) {
                    throw AWS.util.error(new Error(), {
                        name: "InvalidEndpoint",
                        message: msg
                    });
                }
            },
            shouldDisableBodySigning: function shouldDisableBodySigning(request) {
                var signerClass = this.getSignerClass();
                if (this.config.s3DisableBodySigning === true && signerClass === AWS.Signers.V4 && request.httpRequest.endpoint.protocol === "https:") {
                    return true;
                }
                return false;
            },
            setupRequestListeners: function setupRequestListeners(request) {
                request.addListener("validate", this.validateScheme);
                request.addListener("validate", this.validateBucketEndpoint);
                request.addListener("validate", this.correctBucketRegionFromCache);
                request.addListener("validate", this.validateBucketName);
                request.addListener("build", this.addContentType);
                request.addListener("build", this.populateURI);
                request.addListener("build", this.computeContentMd5);
                request.addListener("build", this.computeSseCustomerKeyMd5);
                request.addListener("afterBuild", this.addExpect100Continue);
                request.removeListener("validate", AWS.EventListeners.Core.VALIDATE_REGION);
                request.addListener("extractError", this.extractError);
                request.onAsync("extractError", this.requestBucketRegion);
                request.addListener("extractData", this.extractData);
                request.addListener("extractData", AWS.util.hoistPayloadMember);
                request.addListener("beforePresign", this.prepareSignedUrl);
                if (AWS.util.isBrowser()) {
                    request.onAsync("retry", this.reqRegionForNetworkingError);
                }
                if (this.shouldDisableBodySigning(request)) {
                    request.removeListener("afterBuild", AWS.EventListeners.Core.COMPUTE_SHA256);
                    request.addListener("afterBuild", this.disableBodySigning);
                }
            },
            validateScheme: function(req) {
                var params = req.params, scheme = req.httpRequest.endpoint.protocol, sensitive = params.SSECustomerKey || params.CopySourceSSECustomerKey;
                if (sensitive && scheme !== "https:") {
                    var msg = "Cannot send SSE keys over HTTP. Set 'sslEnabled'" + "to 'true' in your configuration";
                    throw AWS.util.error(new Error(), {
                        code: "ConfigError",
                        message: msg
                    });
                }
            },
            validateBucketEndpoint: function(req) {
                if (!req.params.Bucket && req.service.config.s3BucketEndpoint) {
                    var msg = "Cannot send requests to root API with `s3BucketEndpoint` set.";
                    throw AWS.util.error(new Error(), {
                        code: "ConfigError",
                        message: msg
                    });
                }
            },
            validateBucketName: function validateBucketName(req) {
                var service = req.service;
                var signatureVersion = service.getSignatureVersion(req);
                if (signatureVersion !== "v4") {
                    return;
                }
                var bucket = req.params && req.params.Bucket;
                var key = req.params && req.params.Key;
                var slashIndex = bucket && bucket.indexOf("/");
                if (bucket && slashIndex >= 0) {
                    if (typeof key === "string") {
                        req.params = AWS.util.copy(req.params);
                        var prefix = bucket.substr(slashIndex + 1) || "";
                        req.params.Key = prefix + "/" + key;
                        req.params.Bucket = bucket.substr(0, slashIndex);
                    } else {
                        var msg = "Bucket names cannot contain forward slashes. Bucket: " + bucket;
                        throw AWS.util.error(new Error(), {
                            code: "InvalidBucket",
                            message: msg
                        });
                    }
                }
            },
            isValidAccelerateOperation: function isValidAccelerateOperation(operation) {
                var invalidOperations = [ "createBucket", "deleteBucket", "listBuckets" ];
                return invalidOperations.indexOf(operation) === -1;
            },
            populateURI: function populateURI(req) {
                var httpRequest = req.httpRequest;
                var b = req.params.Bucket;
                var service = req.service;
                var endpoint = httpRequest.endpoint;
                if (b) {
                    if (!service.pathStyleBucketName(b)) {
                        if (service.config.useAccelerateEndpoint && service.isValidAccelerateOperation(req.operation)) {
                            if (service.config.useDualstack) {
                                endpoint.hostname = b + ".s3-accelerate.dualstack.amazonaws.com";
                            } else {
                                endpoint.hostname = b + ".s3-accelerate.amazonaws.com";
                            }
                        } else if (!service.config.s3BucketEndpoint) {
                            endpoint.hostname = b + "." + endpoint.hostname;
                        }
                        var port = endpoint.port;
                        if (port !== 80 && port !== 443) {
                            endpoint.host = endpoint.hostname + ":" + endpoint.port;
                        } else {
                            endpoint.host = endpoint.hostname;
                        }
                        httpRequest.virtualHostedBucket = b;
                        service.removeVirtualHostedBucketFromPath(req);
                    }
                }
            },
            removeVirtualHostedBucketFromPath: function removeVirtualHostedBucketFromPath(req) {
                var httpRequest = req.httpRequest;
                var bucket = httpRequest.virtualHostedBucket;
                if (bucket && httpRequest.path) {
                    httpRequest.path = httpRequest.path.replace(new RegExp("/" + bucket), "");
                    if (httpRequest.path[0] !== "/") {
                        httpRequest.path = "/" + httpRequest.path;
                    }
                }
            },
            addExpect100Continue: function addExpect100Continue(req) {
                var len = req.httpRequest.headers["Content-Length"];
                if (AWS.util.isNode() && len >= 1024 * 1024) {
                    req.httpRequest.headers["Expect"] = "100-continue";
                }
            },
            addContentType: function addContentType(req) {
                var httpRequest = req.httpRequest;
                if (httpRequest.method === "GET" || httpRequest.method === "HEAD") {
                    delete httpRequest.headers["Content-Type"];
                    return;
                }
                if (!httpRequest.headers["Content-Type"]) {
                    httpRequest.headers["Content-Type"] = "application/octet-stream";
                }
                var contentType = httpRequest.headers["Content-Type"];
                if (AWS.util.isBrowser()) {
                    if (typeof httpRequest.body === "string" && !contentType.match(/;\s*charset=/)) {
                        var charset = "; charset=UTF-8";
                        httpRequest.headers["Content-Type"] += charset;
                    } else {
                        var replaceFn = function(_, prefix, charsetName) {
                            return prefix + charsetName.toUpperCase();
                        };
                        httpRequest.headers["Content-Type"] = contentType.replace(/(;\s*charset=)(.+)$/, replaceFn);
                    }
                }
            },
            computableChecksumOperations: {
                putBucketCors: true,
                putBucketLifecycle: true,
                putBucketLifecycleConfiguration: true,
                putBucketTagging: true,
                deleteObjects: true,
                putBucketReplication: true
            },
            willComputeChecksums: function willComputeChecksums(req) {
                if (this.computableChecksumOperations[req.operation]) return true;
                if (!this.config.computeChecksums) return false;
                if (!AWS.util.Buffer.isBuffer(req.httpRequest.body) && typeof req.httpRequest.body !== "string") {
                    return false;
                }
                var rules = req.service.api.operations[req.operation].input.members;
                if (req.service.shouldDisableBodySigning(req) && !Object.prototype.hasOwnProperty.call(req.httpRequest.headers, "presigned-expires")) {
                    if (rules.ContentMD5 && !req.params.ContentMD5) {
                        return true;
                    }
                }
                if (req.service.getSignerClass(req) === AWS.Signers.V4) {
                    if (rules.ContentMD5 && !rules.ContentMD5.required) return false;
                }
                if (rules.ContentMD5 && !req.params.ContentMD5) return true;
            },
            computeContentMd5: function computeContentMd5(req) {
                if (req.service.willComputeChecksums(req)) {
                    var md5 = AWS.util.crypto.md5(req.httpRequest.body, "base64");
                    req.httpRequest.headers["Content-MD5"] = md5;
                }
            },
            computeSseCustomerKeyMd5: function computeSseCustomerKeyMd5(req) {
                var keys = {
                    SSECustomerKey: "x-amz-server-side-encryption-customer-key-MD5",
                    CopySourceSSECustomerKey: "x-amz-copy-source-server-side-encryption-customer-key-MD5"
                };
                AWS.util.each(keys, function(key, header) {
                    if (req.params[key]) {
                        var value = AWS.util.crypto.md5(req.params[key], "base64");
                        req.httpRequest.headers[header] = value;
                    }
                });
            },
            pathStyleBucketName: function pathStyleBucketName(bucketName) {
                if (this.config.s3ForcePathStyle) return true;
                if (this.config.s3BucketEndpoint) return false;
                if (this.dnsCompatibleBucketName(bucketName)) {
                    return this.config.sslEnabled && bucketName.match(/\./) ? true : false;
                } else {
                    return true;
                }
            },
            dnsCompatibleBucketName: function dnsCompatibleBucketName(bucketName) {
                var b = bucketName;
                var domain = new RegExp(/^[a-z0-9][a-z0-9\.\-]{1,61}[a-z0-9]$/);
                var ipAddress = new RegExp(/(\d+\.){3}\d+/);
                var dots = new RegExp(/\.\./);
                return b.match(domain) && !b.match(ipAddress) && !b.match(dots) ? true : false;
            },
            successfulResponse: function successfulResponse(resp) {
                var req = resp.request;
                var httpResponse = resp.httpResponse;
                if (operationsWith200StatusCodeError[req.operation] && httpResponse.body.toString().match("<Error>")) {
                    return false;
                } else {
                    return httpResponse.statusCode < 300;
                }
            },
            retryableError: function retryableError(error, request) {
                if (operationsWith200StatusCodeError[request.operation] && error.statusCode === 200) {
                    return true;
                } else if (request._requestRegionForBucket && request.service.bucketRegionCache[request._requestRegionForBucket]) {
                    return false;
                } else if (error && error.code === "RequestTimeout") {
                    return true;
                } else if (error && regionRedirectErrorCodes.indexOf(error.code) != -1 && error.region && error.region != request.httpRequest.region) {
                    request.httpRequest.region = error.region;
                    if (error.statusCode === 301) {
                        request.service.updateReqBucketRegion(request);
                    }
                    return true;
                } else {
                    var _super = AWS.Service.prototype.retryableError;
                    return _super.call(this, error, request);
                }
            },
            updateReqBucketRegion: function updateReqBucketRegion(request, region) {
                var httpRequest = request.httpRequest;
                if (typeof region === "string" && region.length) {
                    httpRequest.region = region;
                }
                if (!httpRequest.endpoint.host.match(/s3(?!-accelerate).*\.amazonaws\.com$/)) {
                    return;
                }
                var service = request.service;
                var s3Config = service.config;
                var s3BucketEndpoint = s3Config.s3BucketEndpoint;
                if (s3BucketEndpoint) {
                    delete s3Config.s3BucketEndpoint;
                }
                var newConfig = AWS.util.copy(s3Config);
                delete newConfig.endpoint;
                newConfig.region = httpRequest.region;
                httpRequest.endpoint = new AWS.S3(newConfig).endpoint;
                service.populateURI(request);
                s3Config.s3BucketEndpoint = s3BucketEndpoint;
                httpRequest.headers.Host = httpRequest.endpoint.host;
                if (request._asm.currentState === "validate") {
                    request.removeListener("build", service.populateURI);
                    request.addListener("build", service.removeVirtualHostedBucketFromPath);
                }
            },
            extractData: function extractData(resp) {
                var req = resp.request;
                if (req.operation === "getBucketLocation") {
                    var match = resp.httpResponse.body.toString().match(/>(.+)<\/Location/);
                    delete resp.data["_"];
                    if (match) {
                        resp.data.LocationConstraint = match[1];
                    } else {
                        resp.data.LocationConstraint = "";
                    }
                }
                var bucket = req.params.Bucket || null;
                if (req.operation === "deleteBucket" && typeof bucket === "string" && !resp.error) {
                    req.service.clearBucketRegionCache(bucket);
                } else {
                    var headers = resp.httpResponse.headers || {};
                    var region = headers["x-amz-bucket-region"] || null;
                    if (!region && req.operation === "createBucket" && !resp.error) {
                        var createBucketConfiguration = req.params.CreateBucketConfiguration;
                        if (!createBucketConfiguration) {
                            region = "us-east-1";
                        } else if (createBucketConfiguration.LocationConstraint === "EU") {
                            region = "eu-west-1";
                        } else {
                            region = createBucketConfiguration.LocationConstraint;
                        }
                    }
                    if (region) {
                        if (bucket && region !== req.service.bucketRegionCache[bucket]) {
                            req.service.bucketRegionCache[bucket] = region;
                        }
                    }
                }
                req.service.extractRequestIds(resp);
            },
            extractError: function extractError(resp) {
                var codes = {
                    304: "NotModified",
                    403: "Forbidden",
                    400: "BadRequest",
                    404: "NotFound"
                };
                var req = resp.request;
                var code = resp.httpResponse.statusCode;
                var body = resp.httpResponse.body || "";
                var headers = resp.httpResponse.headers || {};
                var region = headers["x-amz-bucket-region"] || null;
                var bucket = req.params.Bucket || null;
                var bucketRegionCache = req.service.bucketRegionCache;
                if (region && bucket && region !== bucketRegionCache[bucket]) {
                    bucketRegionCache[bucket] = region;
                }
                var cachedRegion;
                if (codes[code] && body.length === 0) {
                    if (bucket && !region) {
                        cachedRegion = bucketRegionCache[bucket] || null;
                        if (cachedRegion !== req.httpRequest.region) {
                            region = cachedRegion;
                        }
                    }
                    resp.error = AWS.util.error(new Error(), {
                        code: codes[code],
                        message: null,
                        region: region
                    });
                } else {
                    var data = new AWS.XML.Parser().parse(body.toString());
                    if (data.Region && !region) {
                        region = data.Region;
                        if (bucket && region !== bucketRegionCache[bucket]) {
                            bucketRegionCache[bucket] = region;
                        }
                    } else if (bucket && !region && !data.Region) {
                        cachedRegion = bucketRegionCache[bucket] || null;
                        if (cachedRegion !== req.httpRequest.region) {
                            region = cachedRegion;
                        }
                    }
                    resp.error = AWS.util.error(new Error(), {
                        code: data.Code || code,
                        message: data.Message || null,
                        region: region
                    });
                }
                req.service.extractRequestIds(resp);
            },
            requestBucketRegion: function requestBucketRegion(resp, done) {
                var error = resp.error;
                var req = resp.request;
                var bucket = req.params.Bucket || null;
                if (!error || !bucket || error.region || req.operation === "listObjects" || AWS.util.isNode() && req.operation === "headBucket" || error.statusCode === 400 && req.operation !== "headObject" || regionRedirectErrorCodes.indexOf(error.code) === -1) {
                    return done();
                }
                var reqOperation = AWS.util.isNode() ? "headBucket" : "listObjects";
                var reqParams = {
                    Bucket: bucket
                };
                if (reqOperation === "listObjects") reqParams.MaxKeys = 0;
                var regionReq = req.service[reqOperation](reqParams);
                regionReq._requestRegionForBucket = bucket;
                regionReq.send(function() {
                    var region = req.service.bucketRegionCache[bucket] || null;
                    error.region = region;
                    done();
                });
            },
            reqRegionForNetworkingError: function reqRegionForNetworkingError(resp, done) {
                if (!AWS.util.isBrowser()) {
                    return done();
                }
                var error = resp.error;
                var request = resp.request;
                var bucket = request.params.Bucket;
                if (!error || error.code !== "NetworkingError" || !bucket || request.httpRequest.region === "us-east-1") {
                    return done();
                }
                var service = request.service;
                var bucketRegionCache = service.bucketRegionCache;
                var cachedRegion = bucketRegionCache[bucket] || null;
                if (cachedRegion && cachedRegion !== request.httpRequest.region) {
                    service.updateReqBucketRegion(request, cachedRegion);
                    done();
                } else if (!service.dnsCompatibleBucketName(bucket)) {
                    service.updateReqBucketRegion(request, "us-east-1");
                    if (bucketRegionCache[bucket] !== "us-east-1") {
                        bucketRegionCache[bucket] = "us-east-1";
                    }
                    done();
                } else if (request.httpRequest.virtualHostedBucket) {
                    var getRegionReq = service.listObjects({
                        Bucket: bucket,
                        MaxKeys: 0
                    });
                    service.updateReqBucketRegion(getRegionReq, "us-east-1");
                    getRegionReq._requestRegionForBucket = bucket;
                    getRegionReq.send(function() {
                        var region = service.bucketRegionCache[bucket] || null;
                        if (region && region !== request.httpRequest.region) {
                            service.updateReqBucketRegion(request, region);
                        }
                        done();
                    });
                } else {
                    done();
                }
            },
            bucketRegionCache: {},
            clearBucketRegionCache: function(buckets) {
                var bucketRegionCache = this.bucketRegionCache;
                if (!buckets) {
                    buckets = Object.keys(bucketRegionCache);
                } else if (typeof buckets === "string") {
                    buckets = [ buckets ];
                }
                for (var i = 0; i < buckets.length; i++) {
                    delete bucketRegionCache[buckets[i]];
                }
                return bucketRegionCache;
            },
            correctBucketRegionFromCache: function correctBucketRegionFromCache(req) {
                var bucket = req.params.Bucket || null;
                if (bucket) {
                    var service = req.service;
                    var requestRegion = req.httpRequest.region;
                    var cachedRegion = service.bucketRegionCache[bucket];
                    if (cachedRegion && cachedRegion !== requestRegion) {
                        service.updateReqBucketRegion(req, cachedRegion);
                    }
                }
            },
            extractRequestIds: function extractRequestIds(resp) {
                var extendedRequestId = resp.httpResponse.headers ? resp.httpResponse.headers["x-amz-id-2"] : null;
                var cfId = resp.httpResponse.headers ? resp.httpResponse.headers["x-amz-cf-id"] : null;
                resp.extendedRequestId = extendedRequestId;
                resp.cfId = cfId;
                if (resp.error) {
                    resp.error.requestId = resp.requestId || null;
                    resp.error.extendedRequestId = extendedRequestId;
                    resp.error.cfId = cfId;
                }
            },
            getSignedUrl: function getSignedUrl(operation, params, callback) {
                params = AWS.util.copy(params || {});
                var expires = params.Expires || 900;
                delete params.Expires;
                var request = this.makeRequest(operation, params);
                if (callback) {
                    AWS.util.defer(function() {
                        request.presign(expires, callback);
                    });
                } else {
                    return request.presign(expires, callback);
                }
            },
            createPresignedPost: function createPresignedPost(params, callback) {
                if (typeof params === "function" && callback === undefined) {
                    callback = params;
                    params = null;
                }
                params = AWS.util.copy(params || {});
                var boundParams = this.config.params || {};
                var bucket = params.Bucket || boundParams.Bucket, self = this, config = this.config, endpoint = AWS.util.copy(this.endpoint);
                if (!config.s3BucketEndpoint) {
                    endpoint.pathname = "/" + bucket;
                }
                function finalizePost() {
                    return {
                        url: AWS.util.urlFormat(endpoint),
                        fields: self.preparePostFields(config.credentials, config.region, bucket, params.Fields, params.Conditions, params.Expires)
                    };
                }
                if (callback) {
                    config.getCredentials(function(err) {
                        if (err) {
                            callback(err);
                        }
                        callback(null, finalizePost());
                    });
                } else {
                    return finalizePost();
                }
            },
            preparePostFields: function preparePostFields(credentials, region, bucket, fields, conditions, expiresInSeconds) {
                var now = this.getSkewCorrectedDate();
                if (!credentials || !region || !bucket) {
                    throw new Error("Unable to create a POST object policy without a bucket," + " region, and credentials");
                }
                fields = AWS.util.copy(fields || {});
                conditions = (conditions || []).slice(0);
                expiresInSeconds = expiresInSeconds || 3600;
                var signingDate = AWS.util.date.iso8601(now).replace(/[:\-]|\.\d{3}/g, "");
                var shortDate = signingDate.substr(0, 8);
                var scope = v4Credentials.createScope(shortDate, region, "s3");
                var credential = credentials.accessKeyId + "/" + scope;
                fields["bucket"] = bucket;
                fields["X-Amz-Algorithm"] = "AWS4-HMAC-SHA256";
                fields["X-Amz-Credential"] = credential;
                fields["X-Amz-Date"] = signingDate;
                if (credentials.sessionToken) {
                    fields["X-Amz-Security-Token"] = credentials.sessionToken;
                }
                for (var field in fields) {
                    if (fields.hasOwnProperty(field)) {
                        var condition = {};
                        condition[field] = fields[field];
                        conditions.push(condition);
                    }
                }
                fields.Policy = this.preparePostPolicy(new Date(now.valueOf() + expiresInSeconds * 1e3), conditions);
                fields["X-Amz-Signature"] = AWS.util.crypto.hmac(v4Credentials.getSigningKey(credentials, shortDate, region, "s3", true), fields.Policy, "hex");
                return fields;
            },
            preparePostPolicy: function preparePostPolicy(expiration, conditions) {
                return AWS.util.base64.encode(JSON.stringify({
                    expiration: AWS.util.date.iso8601(expiration),
                    conditions: conditions
                }));
            },
            prepareSignedUrl: function prepareSignedUrl(request) {
                request.addListener("validate", request.service.noPresignedContentLength);
                request.removeListener("build", request.service.addContentType);
                if (!request.params.Body) {
                    request.removeListener("build", request.service.computeContentMd5);
                } else {
                    request.addListener("afterBuild", AWS.EventListeners.Core.COMPUTE_SHA256);
                }
            },
            disableBodySigning: function disableBodySigning(request) {
                var headers = request.httpRequest.headers;
                if (!Object.prototype.hasOwnProperty.call(headers, "presigned-expires")) {
                    headers["X-Amz-Content-Sha256"] = "UNSIGNED-PAYLOAD";
                }
            },
            noPresignedContentLength: function noPresignedContentLength(request) {
                if (request.params.ContentLength !== undefined) {
                    throw AWS.util.error(new Error(), {
                        code: "UnexpectedParameter",
                        message: "ContentLength is not supported in pre-signed URLs."
                    });
                }
            },
            createBucket: function createBucket(params, callback) {
                if (typeof params === "function" || !params) {
                    callback = callback || params;
                    params = {};
                }
                var hostname = this.endpoint.hostname;
                if (hostname !== this.api.globalEndpoint && !params.CreateBucketConfiguration) {
                    params.CreateBucketConfiguration = {
                        LocationConstraint: this.config.region
                    };
                }
                return this.makeRequest("createBucket", params, callback);
            },
            upload: function upload(params, options, callback) {
                if (typeof options === "function" && callback === undefined) {
                    callback = options;
                    options = null;
                }
                options = options || {};
                options = AWS.util.merge(options || {}, {
                    service: this,
                    params: params
                });
                var uploader = new AWS.S3.ManagedUpload(options);
                if (typeof callback === "function") uploader.send(callback);
                return uploader;
            }
        });
    }, {
        "../core": 194,
        "../s3/managed_upload": 232,
        "../signers/v4_credentials": 259
    } ],
    232: [ function(require, module, exports) {
        var AWS = require("../core");
        var byteLength = AWS.util.string.byteLength;
        var Buffer = AWS.util.Buffer;
        AWS.S3.ManagedUpload = AWS.util.inherit({
            constructor: function ManagedUpload(options) {
                var self = this;
                AWS.SequentialExecutor.call(self);
                self.body = null;
                self.sliceFn = null;
                self.callback = null;
                self.parts = {};
                self.completeInfo = [];
                self.fillQueue = function() {
                    self.callback(new Error("Unsupported body payload " + typeof self.body));
                };
                self.configure(options);
            },
            configure: function configure(options) {
                options = options || {};
                this.partSize = this.minPartSize;
                if (options.queueSize) this.queueSize = options.queueSize;
                if (options.partSize) this.partSize = options.partSize;
                if (options.leavePartsOnError) this.leavePartsOnError = true;
                if (options.tags) {
                    if (!Array.isArray(options.tags)) {
                        throw new Error("Tags must be specified as an array; " + typeof options.tags + " provided.");
                    }
                    this.tags = options.tags;
                }
                if (this.partSize < this.minPartSize) {
                    throw new Error("partSize must be greater than " + this.minPartSize);
                }
                this.service = options.service;
                this.bindServiceObject(options.params);
                this.validateBody();
                this.adjustTotalBytes();
            },
            leavePartsOnError: false,
            queueSize: 4,
            partSize: null,
            minPartSize: 1024 * 1024 * 5,
            maxTotalParts: 1e4,
            send: function(callback) {
                var self = this;
                self.failed = false;
                self.callback = callback || function(err) {
                    if (err) throw err;
                };
                var runFill = true;
                if (self.sliceFn) {
                    self.fillQueue = self.fillBuffer;
                } else if (AWS.util.isNode()) {
                    var Stream = AWS.util.stream.Stream;
                    if (self.body instanceof Stream) {
                        runFill = false;
                        self.fillQueue = self.fillStream;
                        self.partBuffers = [];
                        self.body.on("error", function(err) {
                            self.cleanup(err);
                        }).on("readable", function() {
                            self.fillQueue();
                        }).on("end", function() {
                            self.isDoneChunking = true;
                            self.numParts = self.totalPartNumbers;
                            self.fillQueue.call(self);
                            if (self.isDoneChunking && self.totalPartNumbers >= 1 && self.doneParts === self.numParts) {
                                self.finishMultiPart();
                            }
                        });
                    }
                }
                if (runFill) self.fillQueue.call(self);
            },
            abort: function() {
                this.cleanup(AWS.util.error(new Error("Request aborted by user"), {
                    code: "RequestAbortedError",
                    retryable: false
                }));
            },
            validateBody: function validateBody() {
                var self = this;
                self.body = self.service.config.params.Body;
                if (typeof self.body === "string") {
                    self.body = new AWS.util.Buffer(self.body);
                } else if (!self.body) {
                    throw new Error("params.Body is required");
                }
                self.sliceFn = AWS.util.arraySliceFn(self.body);
            },
            bindServiceObject: function bindServiceObject(params) {
                params = params || {};
                var self = this;
                if (!self.service) {
                    self.service = new AWS.S3({
                        params: params
                    });
                } else {
                    var service = self.service;
                    var config = AWS.util.copy(service.config);
                    config.signatureVersion = service.getSignatureVersion();
                    self.service = new service.constructor.__super__(config);
                    self.service.config.params = AWS.util.merge(self.service.config.params || {}, params);
                }
            },
            adjustTotalBytes: function adjustTotalBytes() {
                var self = this;
                try {
                    self.totalBytes = byteLength(self.body);
                } catch (e) {}
                if (self.totalBytes) {
                    var newPartSize = Math.ceil(self.totalBytes / self.maxTotalParts);
                    if (newPartSize > self.partSize) self.partSize = newPartSize;
                } else {
                    self.totalBytes = undefined;
                }
            },
            isDoneChunking: false,
            partPos: 0,
            totalChunkedBytes: 0,
            totalUploadedBytes: 0,
            totalBytes: undefined,
            numParts: 0,
            totalPartNumbers: 0,
            activeParts: 0,
            doneParts: 0,
            parts: null,
            completeInfo: null,
            failed: false,
            multipartReq: null,
            partBuffers: null,
            partBufferLength: 0,
            fillBuffer: function fillBuffer() {
                var self = this;
                var bodyLen = byteLength(self.body);
                if (bodyLen === 0) {
                    self.isDoneChunking = true;
                    self.numParts = 1;
                    self.nextChunk(self.body);
                    return;
                }
                while (self.activeParts < self.queueSize && self.partPos < bodyLen) {
                    var endPos = Math.min(self.partPos + self.partSize, bodyLen);
                    var buf = self.sliceFn.call(self.body, self.partPos, endPos);
                    self.partPos += self.partSize;
                    if (byteLength(buf) < self.partSize || self.partPos === bodyLen) {
                        self.isDoneChunking = true;
                        self.numParts = self.totalPartNumbers + 1;
                    }
                    self.nextChunk(buf);
                }
            },
            fillStream: function fillStream() {
                var self = this;
                if (self.activeParts >= self.queueSize) return;
                var buf = self.body.read(self.partSize - self.partBufferLength) || self.body.read();
                if (buf) {
                    self.partBuffers.push(buf);
                    self.partBufferLength += buf.length;
                    self.totalChunkedBytes += buf.length;
                }
                if (self.partBufferLength >= self.partSize) {
                    var pbuf = self.partBuffers.length === 1 ? self.partBuffers[0] : Buffer.concat(self.partBuffers);
                    self.partBuffers = [];
                    self.partBufferLength = 0;
                    if (pbuf.length > self.partSize) {
                        var rest = pbuf.slice(self.partSize);
                        self.partBuffers.push(rest);
                        self.partBufferLength += rest.length;
                        pbuf = pbuf.slice(0, self.partSize);
                    }
                    self.nextChunk(pbuf);
                }
                if (self.isDoneChunking && !self.isDoneSending) {
                    pbuf = self.partBuffers.length === 1 ? self.partBuffers[0] : Buffer.concat(self.partBuffers);
                    self.partBuffers = [];
                    self.partBufferLength = 0;
                    self.totalBytes = self.totalChunkedBytes;
                    self.isDoneSending = true;
                    if (self.numParts === 0 || pbuf.length > 0) {
                        self.numParts++;
                        self.nextChunk(pbuf);
                    }
                }
                self.body.read(0);
            },
            nextChunk: function nextChunk(chunk) {
                var self = this;
                if (self.failed) return null;
                var partNumber = ++self.totalPartNumbers;
                if (self.isDoneChunking && partNumber === 1) {
                    var params = {
                        Body: chunk
                    };
                    if (this.tags) {
                        params.Tagging = this.getTaggingHeader();
                    }
                    var req = self.service.putObject(params);
                    req._managedUpload = self;
                    req.on("httpUploadProgress", self.progress).send(self.finishSinglePart);
                    return null;
                } else if (self.service.config.params.ContentMD5) {
                    var err = AWS.util.error(new Error("The Content-MD5 you specified is invalid for multi-part uploads."), {
                        code: "InvalidDigest",
                        retryable: false
                    });
                    self.cleanup(err);
                    return null;
                }
                if (self.completeInfo[partNumber] && self.completeInfo[partNumber].ETag !== null) {
                    return null;
                }
                self.activeParts++;
                if (!self.service.config.params.UploadId) {
                    if (!self.multipartReq) {
                        self.multipartReq = self.service.createMultipartUpload();
                        self.multipartReq.on("success", function(resp) {
                            self.service.config.params.UploadId = resp.data.UploadId;
                            self.multipartReq = null;
                        });
                        self.queueChunks(chunk, partNumber);
                        self.multipartReq.on("error", function(err) {
                            self.cleanup(err);
                        });
                        self.multipartReq.send();
                    } else {
                        self.queueChunks(chunk, partNumber);
                    }
                } else {
                    self.uploadPart(chunk, partNumber);
                }
            },
            getTaggingHeader: function getTaggingHeader() {
                var kvPairStrings = [];
                for (var i = 0; i < this.tags.length; i++) {
                    kvPairStrings.push(AWS.util.uriEscape(this.tags[i].Key) + "=" + AWS.util.uriEscape(this.tags[i].Value));
                }
                return kvPairStrings.join("&");
            },
            uploadPart: function uploadPart(chunk, partNumber) {
                var self = this;
                var partParams = {
                    Body: chunk,
                    ContentLength: AWS.util.string.byteLength(chunk),
                    PartNumber: partNumber
                };
                var partInfo = {
                    ETag: null,
                    PartNumber: partNumber
                };
                self.completeInfo[partNumber] = partInfo;
                var req = self.service.uploadPart(partParams);
                self.parts[partNumber] = req;
                req._lastUploadedBytes = 0;
                req._managedUpload = self;
                req.on("httpUploadProgress", self.progress);
                req.send(function(err, data) {
                    delete self.parts[partParams.PartNumber];
                    self.activeParts--;
                    if (!err && (!data || !data.ETag)) {
                        var message = "No access to ETag property on response.";
                        if (AWS.util.isBrowser()) {
                            message += " Check CORS configuration to expose ETag header.";
                        }
                        err = AWS.util.error(new Error(message), {
                            code: "ETagMissing",
                            retryable: false
                        });
                    }
                    if (err) return self.cleanup(err);
                    partInfo.ETag = data.ETag;
                    self.doneParts++;
                    if (self.isDoneChunking && self.doneParts === self.numParts) {
                        self.finishMultiPart();
                    } else {
                        self.fillQueue.call(self);
                    }
                });
            },
            queueChunks: function queueChunks(chunk, partNumber) {
                var self = this;
                self.multipartReq.on("success", function() {
                    self.uploadPart(chunk, partNumber);
                });
            },
            cleanup: function cleanup(err) {
                var self = this;
                if (self.failed) return;
                if (typeof self.body.removeAllListeners === "function" && typeof self.body.resume === "function") {
                    self.body.removeAllListeners("readable");
                    self.body.removeAllListeners("end");
                    self.body.resume();
                }
                if (self.multipartReq) {
                    self.multipartReq.removeAllListeners("success");
                    self.multipartReq.removeAllListeners("error");
                    self.multipartReq.removeAllListeners("complete");
                    delete self.multipartReq;
                }
                if (self.service.config.params.UploadId && !self.leavePartsOnError) {
                    self.service.abortMultipartUpload().send();
                } else if (self.leavePartsOnError) {
                    self.isDoneChunking = false;
                }
                AWS.util.each(self.parts, function(partNumber, part) {
                    part.removeAllListeners("complete");
                    part.abort();
                });
                self.activeParts = 0;
                self.partPos = 0;
                self.numParts = 0;
                self.totalPartNumbers = 0;
                self.parts = {};
                self.failed = true;
                self.callback(err);
            },
            finishMultiPart: function finishMultiPart() {
                var self = this;
                var completeParams = {
                    MultipartUpload: {
                        Parts: self.completeInfo.slice(1)
                    }
                };
                self.service.completeMultipartUpload(completeParams, function(err, data) {
                    if (err) {
                        return self.cleanup(err);
                    }
                    if (data && typeof data.Location === "string") {
                        data.Location = data.Location.replace(/%2F/g, "/");
                    }
                    if (Array.isArray(self.tags)) {
                        self.service.putObjectTagging({
                            Tagging: {
                                TagSet: self.tags
                            }
                        }, function(e, d) {
                            if (e) {
                                self.callback(e);
                            } else {
                                self.callback(e, data);
                            }
                        });
                    } else {
                        self.callback(err, data);
                    }
                });
            },
            finishSinglePart: function finishSinglePart(err, data) {
                var upload = this.request._managedUpload;
                var httpReq = this.request.httpRequest;
                var endpoint = httpReq.endpoint;
                if (err) return upload.callback(err);
                data.Location = [ endpoint.protocol, "//", endpoint.host, httpReq.path ].join("");
                data.key = this.request.params.Key;
                data.Key = this.request.params.Key;
                data.Bucket = this.request.params.Bucket;
                upload.callback(err, data);
            },
            progress: function progress(info) {
                var upload = this._managedUpload;
                if (this.operation === "putObject") {
                    info.part = 1;
                    info.key = this.params.Key;
                } else {
                    upload.totalUploadedBytes += info.loaded - this._lastUploadedBytes;
                    this._lastUploadedBytes = info.loaded;
                    info = {
                        loaded: upload.totalUploadedBytes,
                        total: upload.totalBytes,
                        part: this.params.PartNumber,
                        key: this.params.Key
                    };
                }
                upload.emit("httpUploadProgress", [ info ]);
            }
        });
        AWS.util.mixin(AWS.S3.ManagedUpload, AWS.SequentialExecutor);
        AWS.S3.ManagedUpload.addPromisesToClass = function addPromisesToClass(PromiseDependency) {
            this.prototype.promise = AWS.util.promisifyMethod("send", PromiseDependency);
        };
        AWS.S3.ManagedUpload.deletePromisesFromClass = function deletePromisesFromClass() {
            delete this.prototype.promise;
        };
        AWS.util.addPromises(AWS.S3.ManagedUpload);
        module.exports = AWS.S3.ManagedUpload;
    }, {
        "../core": 194
    } ]
}, {}, [ 248 ]);AWS.apiLoader.services["s3"]["2006-03-01"] = {
    version: "2.0",
    metadata: {
        apiVersion: "2006-03-01",
        checksumFormat: "md5",
        endpointPrefix: "s3",
        globalEndpoint: "s3.amazonaws.com",
        protocol: "rest-xml",
        serviceAbbreviation: "Amazon S3",
        serviceFullName: "Amazon Simple Storage Service",
        serviceId: "S3",
        signatureVersion: "s3",
        timestampFormat: "rfc822",
        uid: "s3-2006-03-01"
    },
    operations: {
        AbortMultipartUpload: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}/{Key+}"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key", "UploadId" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    UploadId: {
                        location: "querystring",
                        locationName: "uploadId"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    }
                }
            }
        },
        CompleteMultipartUpload: {
            http: {
                requestUri: "/{Bucket}/{Key+}"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key", "UploadId" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    MultipartUpload: {
                        locationName: "CompleteMultipartUpload",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        },
                        type: "structure",
                        members: {
                            Parts: {
                                locationName: "Part",
                                type: "list",
                                member: {
                                    type: "structure",
                                    members: {
                                        ETag: {},
                                        PartNumber: {
                                            type: "integer"
                                        }
                                    }
                                },
                                flattened: true
                            }
                        }
                    },
                    UploadId: {
                        location: "querystring",
                        locationName: "uploadId"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    }
                },
                payload: "MultipartUpload"
            },
            output: {
                type: "structure",
                members: {
                    Location: {},
                    Bucket: {},
                    Key: {},
                    Expiration: {
                        location: "header",
                        locationName: "x-amz-expiration"
                    },
                    ETag: {},
                    ServerSideEncryption: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption"
                    },
                    VersionId: {
                        location: "header",
                        locationName: "x-amz-version-id"
                    },
                    SSEKMSKeyId: {
                        shape: "Sj",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-aws-kms-key-id"
                    },
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    }
                }
            }
        },
        CopyObject: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}/{Key+}"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "CopySource", "Key" ],
                members: {
                    ACL: {
                        location: "header",
                        locationName: "x-amz-acl"
                    },
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    CacheControl: {
                        location: "header",
                        locationName: "Cache-Control"
                    },
                    ContentDisposition: {
                        location: "header",
                        locationName: "Content-Disposition"
                    },
                    ContentEncoding: {
                        location: "header",
                        locationName: "Content-Encoding"
                    },
                    ContentLanguage: {
                        location: "header",
                        locationName: "Content-Language"
                    },
                    ContentType: {
                        location: "header",
                        locationName: "Content-Type"
                    },
                    CopySource: {
                        location: "header",
                        locationName: "x-amz-copy-source"
                    },
                    CopySourceIfMatch: {
                        location: "header",
                        locationName: "x-amz-copy-source-if-match"
                    },
                    CopySourceIfModifiedSince: {
                        location: "header",
                        locationName: "x-amz-copy-source-if-modified-since",
                        type: "timestamp"
                    },
                    CopySourceIfNoneMatch: {
                        location: "header",
                        locationName: "x-amz-copy-source-if-none-match"
                    },
                    CopySourceIfUnmodifiedSince: {
                        location: "header",
                        locationName: "x-amz-copy-source-if-unmodified-since",
                        type: "timestamp"
                    },
                    Expires: {
                        location: "header",
                        locationName: "Expires",
                        type: "timestamp"
                    },
                    GrantFullControl: {
                        location: "header",
                        locationName: "x-amz-grant-full-control"
                    },
                    GrantRead: {
                        location: "header",
                        locationName: "x-amz-grant-read"
                    },
                    GrantReadACP: {
                        location: "header",
                        locationName: "x-amz-grant-read-acp"
                    },
                    GrantWriteACP: {
                        location: "header",
                        locationName: "x-amz-grant-write-acp"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    Metadata: {
                        shape: "S11",
                        location: "headers",
                        locationName: "x-amz-meta-"
                    },
                    MetadataDirective: {
                        location: "header",
                        locationName: "x-amz-metadata-directive"
                    },
                    TaggingDirective: {
                        location: "header",
                        locationName: "x-amz-tagging-directive"
                    },
                    ServerSideEncryption: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption"
                    },
                    StorageClass: {
                        location: "header",
                        locationName: "x-amz-storage-class"
                    },
                    WebsiteRedirectLocation: {
                        location: "header",
                        locationName: "x-amz-website-redirect-location"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKey: {
                        shape: "S19",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    SSEKMSKeyId: {
                        shape: "Sj",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-aws-kms-key-id"
                    },
                    CopySourceSSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-copy-source-server-side-encryption-customer-algorithm"
                    },
                    CopySourceSSECustomerKey: {
                        shape: "S1c",
                        location: "header",
                        locationName: "x-amz-copy-source-server-side-encryption-customer-key"
                    },
                    CopySourceSSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-copy-source-server-side-encryption-customer-key-MD5"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    },
                    Tagging: {
                        location: "header",
                        locationName: "x-amz-tagging"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    CopyObjectResult: {
                        type: "structure",
                        members: {
                            ETag: {},
                            LastModified: {
                                type: "timestamp"
                            }
                        }
                    },
                    Expiration: {
                        location: "header",
                        locationName: "x-amz-expiration"
                    },
                    CopySourceVersionId: {
                        location: "header",
                        locationName: "x-amz-copy-source-version-id"
                    },
                    VersionId: {
                        location: "header",
                        locationName: "x-amz-version-id"
                    },
                    ServerSideEncryption: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    SSEKMSKeyId: {
                        shape: "Sj",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-aws-kms-key-id"
                    },
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    }
                },
                payload: "CopyObjectResult"
            },
            alias: "PutObjectCopy"
        },
        CreateBucket: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    ACL: {
                        location: "header",
                        locationName: "x-amz-acl"
                    },
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    CreateBucketConfiguration: {
                        locationName: "CreateBucketConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        },
                        type: "structure",
                        members: {
                            LocationConstraint: {}
                        }
                    },
                    GrantFullControl: {
                        location: "header",
                        locationName: "x-amz-grant-full-control"
                    },
                    GrantRead: {
                        location: "header",
                        locationName: "x-amz-grant-read"
                    },
                    GrantReadACP: {
                        location: "header",
                        locationName: "x-amz-grant-read-acp"
                    },
                    GrantWrite: {
                        location: "header",
                        locationName: "x-amz-grant-write"
                    },
                    GrantWriteACP: {
                        location: "header",
                        locationName: "x-amz-grant-write-acp"
                    }
                },
                payload: "CreateBucketConfiguration"
            },
            output: {
                type: "structure",
                members: {
                    Location: {
                        location: "header",
                        locationName: "Location"
                    }
                }
            },
            alias: "PutBucket"
        },
        CreateMultipartUpload: {
            http: {
                requestUri: "/{Bucket}/{Key+}?uploads"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key" ],
                members: {
                    ACL: {
                        location: "header",
                        locationName: "x-amz-acl"
                    },
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    CacheControl: {
                        location: "header",
                        locationName: "Cache-Control"
                    },
                    ContentDisposition: {
                        location: "header",
                        locationName: "Content-Disposition"
                    },
                    ContentEncoding: {
                        location: "header",
                        locationName: "Content-Encoding"
                    },
                    ContentLanguage: {
                        location: "header",
                        locationName: "Content-Language"
                    },
                    ContentType: {
                        location: "header",
                        locationName: "Content-Type"
                    },
                    Expires: {
                        location: "header",
                        locationName: "Expires",
                        type: "timestamp"
                    },
                    GrantFullControl: {
                        location: "header",
                        locationName: "x-amz-grant-full-control"
                    },
                    GrantRead: {
                        location: "header",
                        locationName: "x-amz-grant-read"
                    },
                    GrantReadACP: {
                        location: "header",
                        locationName: "x-amz-grant-read-acp"
                    },
                    GrantWriteACP: {
                        location: "header",
                        locationName: "x-amz-grant-write-acp"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    Metadata: {
                        shape: "S11",
                        location: "headers",
                        locationName: "x-amz-meta-"
                    },
                    ServerSideEncryption: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption"
                    },
                    StorageClass: {
                        location: "header",
                        locationName: "x-amz-storage-class"
                    },
                    WebsiteRedirectLocation: {
                        location: "header",
                        locationName: "x-amz-website-redirect-location"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKey: {
                        shape: "S19",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    SSEKMSKeyId: {
                        shape: "Sj",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-aws-kms-key-id"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    },
                    Tagging: {
                        location: "header",
                        locationName: "x-amz-tagging"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    AbortDate: {
                        location: "header",
                        locationName: "x-amz-abort-date",
                        type: "timestamp"
                    },
                    AbortRuleId: {
                        location: "header",
                        locationName: "x-amz-abort-rule-id"
                    },
                    Bucket: {
                        locationName: "Bucket"
                    },
                    Key: {},
                    UploadId: {},
                    ServerSideEncryption: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    SSEKMSKeyId: {
                        shape: "Sj",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-aws-kms-key-id"
                    },
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    }
                }
            },
            alias: "InitiateMultipartUpload"
        },
        DeleteBucket: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            }
        },
        DeleteBucketAnalyticsConfiguration: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}?analytics"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Id" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Id: {
                        location: "querystring",
                        locationName: "id"
                    }
                }
            }
        },
        DeleteBucketCors: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}?cors"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            }
        },
        DeleteBucketEncryption: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}?encryption"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            }
        },
        DeleteBucketInventoryConfiguration: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}?inventory"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Id" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Id: {
                        location: "querystring",
                        locationName: "id"
                    }
                }
            }
        },
        DeleteBucketLifecycle: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}?lifecycle"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            }
        },
        DeleteBucketMetricsConfiguration: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}?metrics"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Id" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Id: {
                        location: "querystring",
                        locationName: "id"
                    }
                }
            }
        },
        DeleteBucketPolicy: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}?policy"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            }
        },
        DeleteBucketReplication: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}?replication"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            }
        },
        DeleteBucketTagging: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}?tagging"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            }
        },
        DeleteBucketWebsite: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}?website"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            }
        },
        DeleteObject: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}/{Key+}"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    MFA: {
                        location: "header",
                        locationName: "x-amz-mfa"
                    },
                    VersionId: {
                        location: "querystring",
                        locationName: "versionId"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    DeleteMarker: {
                        location: "header",
                        locationName: "x-amz-delete-marker",
                        type: "boolean"
                    },
                    VersionId: {
                        location: "header",
                        locationName: "x-amz-version-id"
                    },
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    }
                }
            }
        },
        DeleteObjectTagging: {
            http: {
                method: "DELETE",
                requestUri: "/{Bucket}/{Key+}?tagging"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    VersionId: {
                        location: "querystring",
                        locationName: "versionId"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    VersionId: {
                        location: "header",
                        locationName: "x-amz-version-id"
                    }
                }
            }
        },
        DeleteObjects: {
            http: {
                requestUri: "/{Bucket}?delete"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Delete" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Delete: {
                        locationName: "Delete",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        },
                        type: "structure",
                        required: [ "Objects" ],
                        members: {
                            Objects: {
                                locationName: "Object",
                                type: "list",
                                member: {
                                    type: "structure",
                                    required: [ "Key" ],
                                    members: {
                                        Key: {},
                                        VersionId: {}
                                    }
                                },
                                flattened: true
                            },
                            Quiet: {
                                type: "boolean"
                            }
                        }
                    },
                    MFA: {
                        location: "header",
                        locationName: "x-amz-mfa"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    }
                },
                payload: "Delete"
            },
            output: {
                type: "structure",
                members: {
                    Deleted: {
                        type: "list",
                        member: {
                            type: "structure",
                            members: {
                                Key: {},
                                VersionId: {},
                                DeleteMarker: {
                                    type: "boolean"
                                },
                                DeleteMarkerVersionId: {}
                            }
                        },
                        flattened: true
                    },
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    },
                    Errors: {
                        locationName: "Error",
                        type: "list",
                        member: {
                            type: "structure",
                            members: {
                                Key: {},
                                VersionId: {},
                                Code: {},
                                Message: {}
                            }
                        },
                        flattened: true
                    }
                }
            },
            alias: "DeleteMultipleObjects"
        },
        GetBucketAccelerateConfiguration: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?accelerate"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Status: {}
                }
            }
        },
        GetBucketAcl: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?acl"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Owner: {
                        shape: "S2v"
                    },
                    Grants: {
                        shape: "S2y",
                        locationName: "AccessControlList"
                    }
                }
            }
        },
        GetBucketAnalyticsConfiguration: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?analytics"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Id" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Id: {
                        location: "querystring",
                        locationName: "id"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    AnalyticsConfiguration: {
                        shape: "S37"
                    }
                },
                payload: "AnalyticsConfiguration"
            }
        },
        GetBucketCors: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?cors"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    CORSRules: {
                        shape: "S3n",
                        locationName: "CORSRule"
                    }
                }
            }
        },
        GetBucketEncryption: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?encryption"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    ServerSideEncryptionConfiguration: {
                        shape: "S40"
                    }
                },
                payload: "ServerSideEncryptionConfiguration"
            }
        },
        GetBucketInventoryConfiguration: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?inventory"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Id" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Id: {
                        location: "querystring",
                        locationName: "id"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    InventoryConfiguration: {
                        shape: "S46"
                    }
                },
                payload: "InventoryConfiguration"
            }
        },
        GetBucketLifecycle: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?lifecycle"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Rules: {
                        shape: "S4m",
                        locationName: "Rule"
                    }
                }
            },
            deprecated: true
        },
        GetBucketLifecycleConfiguration: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?lifecycle"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Rules: {
                        shape: "S51",
                        locationName: "Rule"
                    }
                }
            }
        },
        GetBucketLocation: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?location"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    LocationConstraint: {}
                }
            }
        },
        GetBucketLogging: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?logging"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    LoggingEnabled: {
                        shape: "S5b"
                    }
                }
            }
        },
        GetBucketMetricsConfiguration: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?metrics"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Id" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Id: {
                        location: "querystring",
                        locationName: "id"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    MetricsConfiguration: {
                        shape: "S5j"
                    }
                },
                payload: "MetricsConfiguration"
            }
        },
        GetBucketNotification: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?notification"
            },
            input: {
                shape: "S5m"
            },
            output: {
                shape: "S5n"
            },
            deprecated: true
        },
        GetBucketNotificationConfiguration: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?notification"
            },
            input: {
                shape: "S5m"
            },
            output: {
                shape: "S5y"
            }
        },
        GetBucketPolicy: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?policy"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Policy: {}
                },
                payload: "Policy"
            }
        },
        GetBucketReplication: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?replication"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    ReplicationConfiguration: {
                        shape: "S6h"
                    }
                },
                payload: "ReplicationConfiguration"
            }
        },
        GetBucketRequestPayment: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?requestPayment"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Payer: {}
                }
            }
        },
        GetBucketTagging: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?tagging"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                required: [ "TagSet" ],
                members: {
                    TagSet: {
                        shape: "S3d"
                    }
                }
            }
        },
        GetBucketVersioning: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?versioning"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Status: {},
                    MFADelete: {
                        locationName: "MfaDelete"
                    }
                }
            }
        },
        GetBucketWebsite: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?website"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    RedirectAllRequestsTo: {
                        shape: "S75"
                    },
                    IndexDocument: {
                        shape: "S78"
                    },
                    ErrorDocument: {
                        shape: "S7a"
                    },
                    RoutingRules: {
                        shape: "S7b"
                    }
                }
            }
        },
        GetObject: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}/{Key+}"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    IfMatch: {
                        location: "header",
                        locationName: "If-Match"
                    },
                    IfModifiedSince: {
                        location: "header",
                        locationName: "If-Modified-Since",
                        type: "timestamp"
                    },
                    IfNoneMatch: {
                        location: "header",
                        locationName: "If-None-Match"
                    },
                    IfUnmodifiedSince: {
                        location: "header",
                        locationName: "If-Unmodified-Since",
                        type: "timestamp"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    Range: {
                        location: "header",
                        locationName: "Range"
                    },
                    ResponseCacheControl: {
                        location: "querystring",
                        locationName: "response-cache-control"
                    },
                    ResponseContentDisposition: {
                        location: "querystring",
                        locationName: "response-content-disposition"
                    },
                    ResponseContentEncoding: {
                        location: "querystring",
                        locationName: "response-content-encoding"
                    },
                    ResponseContentLanguage: {
                        location: "querystring",
                        locationName: "response-content-language"
                    },
                    ResponseContentType: {
                        location: "querystring",
                        locationName: "response-content-type"
                    },
                    ResponseExpires: {
                        location: "querystring",
                        locationName: "response-expires",
                        type: "timestamp"
                    },
                    VersionId: {
                        location: "querystring",
                        locationName: "versionId"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKey: {
                        shape: "S19",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    },
                    PartNumber: {
                        location: "querystring",
                        locationName: "partNumber",
                        type: "integer"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Body: {
                        streaming: true,
                        type: "blob"
                    },
                    DeleteMarker: {
                        location: "header",
                        locationName: "x-amz-delete-marker",
                        type: "boolean"
                    },
                    AcceptRanges: {
                        location: "header",
                        locationName: "accept-ranges"
                    },
                    Expiration: {
                        location: "header",
                        locationName: "x-amz-expiration"
                    },
                    Restore: {
                        location: "header",
                        locationName: "x-amz-restore"
                    },
                    LastModified: {
                        location: "header",
                        locationName: "Last-Modified",
                        type: "timestamp"
                    },
                    ContentLength: {
                        location: "header",
                        locationName: "Content-Length",
                        type: "long"
                    },
                    ETag: {
                        location: "header",
                        locationName: "ETag"
                    },
                    MissingMeta: {
                        location: "header",
                        locationName: "x-amz-missing-meta",
                        type: "integer"
                    },
                    VersionId: {
                        location: "header",
                        locationName: "x-amz-version-id"
                    },
                    CacheControl: {
                        location: "header",
                        locationName: "Cache-Control"
                    },
                    ContentDisposition: {
                        location: "header",
                        locationName: "Content-Disposition"
                    },
                    ContentEncoding: {
                        location: "header",
                        locationName: "Content-Encoding"
                    },
                    ContentLanguage: {
                        location: "header",
                        locationName: "Content-Language"
                    },
                    ContentRange: {
                        location: "header",
                        locationName: "Content-Range"
                    },
                    ContentType: {
                        location: "header",
                        locationName: "Content-Type"
                    },
                    Expires: {
                        location: "header",
                        locationName: "Expires",
                        type: "timestamp"
                    },
                    WebsiteRedirectLocation: {
                        location: "header",
                        locationName: "x-amz-website-redirect-location"
                    },
                    ServerSideEncryption: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption"
                    },
                    Metadata: {
                        shape: "S11",
                        location: "headers",
                        locationName: "x-amz-meta-"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    SSEKMSKeyId: {
                        shape: "Sj",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-aws-kms-key-id"
                    },
                    StorageClass: {
                        location: "header",
                        locationName: "x-amz-storage-class"
                    },
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    },
                    ReplicationStatus: {
                        location: "header",
                        locationName: "x-amz-replication-status"
                    },
                    PartsCount: {
                        location: "header",
                        locationName: "x-amz-mp-parts-count",
                        type: "integer"
                    },
                    TagCount: {
                        location: "header",
                        locationName: "x-amz-tagging-count",
                        type: "integer"
                    }
                },
                payload: "Body"
            }
        },
        GetObjectAcl: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}/{Key+}?acl"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    VersionId: {
                        location: "querystring",
                        locationName: "versionId"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Owner: {
                        shape: "S2v"
                    },
                    Grants: {
                        shape: "S2y",
                        locationName: "AccessControlList"
                    },
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    }
                }
            }
        },
        GetObjectTagging: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}/{Key+}?tagging"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    VersionId: {
                        location: "querystring",
                        locationName: "versionId"
                    }
                }
            },
            output: {
                type: "structure",
                required: [ "TagSet" ],
                members: {
                    VersionId: {
                        location: "header",
                        locationName: "x-amz-version-id"
                    },
                    TagSet: {
                        shape: "S3d"
                    }
                }
            }
        },
        GetObjectTorrent: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}/{Key+}?torrent"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Body: {
                        streaming: true,
                        type: "blob"
                    },
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    }
                },
                payload: "Body"
            }
        },
        HeadBucket: {
            http: {
                method: "HEAD",
                requestUri: "/{Bucket}"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    }
                }
            }
        },
        HeadObject: {
            http: {
                method: "HEAD",
                requestUri: "/{Bucket}/{Key+}"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    IfMatch: {
                        location: "header",
                        locationName: "If-Match"
                    },
                    IfModifiedSince: {
                        location: "header",
                        locationName: "If-Modified-Since",
                        type: "timestamp"
                    },
                    IfNoneMatch: {
                        location: "header",
                        locationName: "If-None-Match"
                    },
                    IfUnmodifiedSince: {
                        location: "header",
                        locationName: "If-Unmodified-Since",
                        type: "timestamp"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    Range: {
                        location: "header",
                        locationName: "Range"
                    },
                    VersionId: {
                        location: "querystring",
                        locationName: "versionId"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKey: {
                        shape: "S19",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    },
                    PartNumber: {
                        location: "querystring",
                        locationName: "partNumber",
                        type: "integer"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    DeleteMarker: {
                        location: "header",
                        locationName: "x-amz-delete-marker",
                        type: "boolean"
                    },
                    AcceptRanges: {
                        location: "header",
                        locationName: "accept-ranges"
                    },
                    Expiration: {
                        location: "header",
                        locationName: "x-amz-expiration"
                    },
                    Restore: {
                        location: "header",
                        locationName: "x-amz-restore"
                    },
                    LastModified: {
                        location: "header",
                        locationName: "Last-Modified",
                        type: "timestamp"
                    },
                    ContentLength: {
                        location: "header",
                        locationName: "Content-Length",
                        type: "long"
                    },
                    ETag: {
                        location: "header",
                        locationName: "ETag"
                    },
                    MissingMeta: {
                        location: "header",
                        locationName: "x-amz-missing-meta",
                        type: "integer"
                    },
                    VersionId: {
                        location: "header",
                        locationName: "x-amz-version-id"
                    },
                    CacheControl: {
                        location: "header",
                        locationName: "Cache-Control"
                    },
                    ContentDisposition: {
                        location: "header",
                        locationName: "Content-Disposition"
                    },
                    ContentEncoding: {
                        location: "header",
                        locationName: "Content-Encoding"
                    },
                    ContentLanguage: {
                        location: "header",
                        locationName: "Content-Language"
                    },
                    ContentType: {
                        location: "header",
                        locationName: "Content-Type"
                    },
                    Expires: {
                        location: "header",
                        locationName: "Expires",
                        type: "timestamp"
                    },
                    WebsiteRedirectLocation: {
                        location: "header",
                        locationName: "x-amz-website-redirect-location"
                    },
                    ServerSideEncryption: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption"
                    },
                    Metadata: {
                        shape: "S11",
                        location: "headers",
                        locationName: "x-amz-meta-"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    SSEKMSKeyId: {
                        shape: "Sj",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-aws-kms-key-id"
                    },
                    StorageClass: {
                        location: "header",
                        locationName: "x-amz-storage-class"
                    },
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    },
                    ReplicationStatus: {
                        location: "header",
                        locationName: "x-amz-replication-status"
                    },
                    PartsCount: {
                        location: "header",
                        locationName: "x-amz-mp-parts-count",
                        type: "integer"
                    }
                }
            }
        },
        ListBucketAnalyticsConfigurations: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?analytics"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContinuationToken: {
                        location: "querystring",
                        locationName: "continuation-token"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    IsTruncated: {
                        type: "boolean"
                    },
                    ContinuationToken: {},
                    NextContinuationToken: {},
                    AnalyticsConfigurationList: {
                        locationName: "AnalyticsConfiguration",
                        type: "list",
                        member: {
                            shape: "S37"
                        },
                        flattened: true
                    }
                }
            }
        },
        ListBucketInventoryConfigurations: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?inventory"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContinuationToken: {
                        location: "querystring",
                        locationName: "continuation-token"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    ContinuationToken: {},
                    InventoryConfigurationList: {
                        locationName: "InventoryConfiguration",
                        type: "list",
                        member: {
                            shape: "S46"
                        },
                        flattened: true
                    },
                    IsTruncated: {
                        type: "boolean"
                    },
                    NextContinuationToken: {}
                }
            }
        },
        ListBucketMetricsConfigurations: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?metrics"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContinuationToken: {
                        location: "querystring",
                        locationName: "continuation-token"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    IsTruncated: {
                        type: "boolean"
                    },
                    ContinuationToken: {},
                    NextContinuationToken: {},
                    MetricsConfigurationList: {
                        locationName: "MetricsConfiguration",
                        type: "list",
                        member: {
                            shape: "S5j"
                        },
                        flattened: true
                    }
                }
            }
        },
        ListBuckets: {
            http: {
                method: "GET"
            },
            output: {
                type: "structure",
                members: {
                    Buckets: {
                        type: "list",
                        member: {
                            locationName: "Bucket",
                            type: "structure",
                            members: {
                                Name: {},
                                CreationDate: {
                                    type: "timestamp"
                                }
                            }
                        }
                    },
                    Owner: {
                        shape: "S2v"
                    }
                }
            },
            alias: "GetService"
        },
        ListMultipartUploads: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?uploads"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Delimiter: {
                        location: "querystring",
                        locationName: "delimiter"
                    },
                    EncodingType: {
                        location: "querystring",
                        locationName: "encoding-type"
                    },
                    KeyMarker: {
                        location: "querystring",
                        locationName: "key-marker"
                    },
                    MaxUploads: {
                        location: "querystring",
                        locationName: "max-uploads",
                        type: "integer"
                    },
                    Prefix: {
                        location: "querystring",
                        locationName: "prefix"
                    },
                    UploadIdMarker: {
                        location: "querystring",
                        locationName: "upload-id-marker"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    Bucket: {},
                    KeyMarker: {},
                    UploadIdMarker: {},
                    NextKeyMarker: {},
                    Prefix: {},
                    Delimiter: {},
                    NextUploadIdMarker: {},
                    MaxUploads: {
                        type: "integer"
                    },
                    IsTruncated: {
                        type: "boolean"
                    },
                    Uploads: {
                        locationName: "Upload",
                        type: "list",
                        member: {
                            type: "structure",
                            members: {
                                UploadId: {},
                                Key: {},
                                Initiated: {
                                    type: "timestamp"
                                },
                                StorageClass: {},
                                Owner: {
                                    shape: "S2v"
                                },
                                Initiator: {
                                    shape: "S97"
                                }
                            }
                        },
                        flattened: true
                    },
                    CommonPrefixes: {
                        shape: "S98"
                    },
                    EncodingType: {}
                }
            }
        },
        ListObjectVersions: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?versions"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Delimiter: {
                        location: "querystring",
                        locationName: "delimiter"
                    },
                    EncodingType: {
                        location: "querystring",
                        locationName: "encoding-type"
                    },
                    KeyMarker: {
                        location: "querystring",
                        locationName: "key-marker"
                    },
                    MaxKeys: {
                        location: "querystring",
                        locationName: "max-keys",
                        type: "integer"
                    },
                    Prefix: {
                        location: "querystring",
                        locationName: "prefix"
                    },
                    VersionIdMarker: {
                        location: "querystring",
                        locationName: "version-id-marker"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    IsTruncated: {
                        type: "boolean"
                    },
                    KeyMarker: {},
                    VersionIdMarker: {},
                    NextKeyMarker: {},
                    NextVersionIdMarker: {},
                    Versions: {
                        locationName: "Version",
                        type: "list",
                        member: {
                            type: "structure",
                            members: {
                                ETag: {},
                                Size: {
                                    type: "integer"
                                },
                                StorageClass: {},
                                Key: {},
                                VersionId: {},
                                IsLatest: {
                                    type: "boolean"
                                },
                                LastModified: {
                                    type: "timestamp"
                                },
                                Owner: {
                                    shape: "S2v"
                                }
                            }
                        },
                        flattened: true
                    },
                    DeleteMarkers: {
                        locationName: "DeleteMarker",
                        type: "list",
                        member: {
                            type: "structure",
                            members: {
                                Owner: {
                                    shape: "S2v"
                                },
                                Key: {},
                                VersionId: {},
                                IsLatest: {
                                    type: "boolean"
                                },
                                LastModified: {
                                    type: "timestamp"
                                }
                            }
                        },
                        flattened: true
                    },
                    Name: {},
                    Prefix: {},
                    Delimiter: {},
                    MaxKeys: {
                        type: "integer"
                    },
                    CommonPrefixes: {
                        shape: "S98"
                    },
                    EncodingType: {}
                }
            },
            alias: "GetBucketObjectVersions"
        },
        ListObjects: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Delimiter: {
                        location: "querystring",
                        locationName: "delimiter"
                    },
                    EncodingType: {
                        location: "querystring",
                        locationName: "encoding-type"
                    },
                    Marker: {
                        location: "querystring",
                        locationName: "marker"
                    },
                    MaxKeys: {
                        location: "querystring",
                        locationName: "max-keys",
                        type: "integer"
                    },
                    Prefix: {
                        location: "querystring",
                        locationName: "prefix"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    IsTruncated: {
                        type: "boolean"
                    },
                    Marker: {},
                    NextMarker: {},
                    Contents: {
                        shape: "S9q"
                    },
                    Name: {},
                    Prefix: {},
                    Delimiter: {},
                    MaxKeys: {
                        type: "integer"
                    },
                    CommonPrefixes: {
                        shape: "S98"
                    },
                    EncodingType: {}
                }
            },
            alias: "GetBucket"
        },
        ListObjectsV2: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}?list-type=2"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Delimiter: {
                        location: "querystring",
                        locationName: "delimiter"
                    },
                    EncodingType: {
                        location: "querystring",
                        locationName: "encoding-type"
                    },
                    MaxKeys: {
                        location: "querystring",
                        locationName: "max-keys",
                        type: "integer"
                    },
                    Prefix: {
                        location: "querystring",
                        locationName: "prefix"
                    },
                    ContinuationToken: {
                        location: "querystring",
                        locationName: "continuation-token"
                    },
                    FetchOwner: {
                        location: "querystring",
                        locationName: "fetch-owner",
                        type: "boolean"
                    },
                    StartAfter: {
                        location: "querystring",
                        locationName: "start-after"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    IsTruncated: {
                        type: "boolean"
                    },
                    Contents: {
                        shape: "S9q"
                    },
                    Name: {},
                    Prefix: {},
                    Delimiter: {},
                    MaxKeys: {
                        type: "integer"
                    },
                    CommonPrefixes: {
                        shape: "S98"
                    },
                    EncodingType: {},
                    KeyCount: {
                        type: "integer"
                    },
                    ContinuationToken: {},
                    NextContinuationToken: {},
                    StartAfter: {}
                }
            }
        },
        ListParts: {
            http: {
                method: "GET",
                requestUri: "/{Bucket}/{Key+}"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key", "UploadId" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    MaxParts: {
                        location: "querystring",
                        locationName: "max-parts",
                        type: "integer"
                    },
                    PartNumberMarker: {
                        location: "querystring",
                        locationName: "part-number-marker",
                        type: "integer"
                    },
                    UploadId: {
                        location: "querystring",
                        locationName: "uploadId"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    AbortDate: {
                        location: "header",
                        locationName: "x-amz-abort-date",
                        type: "timestamp"
                    },
                    AbortRuleId: {
                        location: "header",
                        locationName: "x-amz-abort-rule-id"
                    },
                    Bucket: {},
                    Key: {},
                    UploadId: {},
                    PartNumberMarker: {
                        type: "integer"
                    },
                    NextPartNumberMarker: {
                        type: "integer"
                    },
                    MaxParts: {
                        type: "integer"
                    },
                    IsTruncated: {
                        type: "boolean"
                    },
                    Parts: {
                        locationName: "Part",
                        type: "list",
                        member: {
                            type: "structure",
                            members: {
                                PartNumber: {
                                    type: "integer"
                                },
                                LastModified: {
                                    type: "timestamp"
                                },
                                ETag: {},
                                Size: {
                                    type: "integer"
                                }
                            }
                        },
                        flattened: true
                    },
                    Initiator: {
                        shape: "S97"
                    },
                    Owner: {
                        shape: "S2v"
                    },
                    StorageClass: {},
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    }
                }
            }
        },
        PutBucketAccelerateConfiguration: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?accelerate"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "AccelerateConfiguration" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    AccelerateConfiguration: {
                        locationName: "AccelerateConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        },
                        type: "structure",
                        members: {
                            Status: {}
                        }
                    }
                },
                payload: "AccelerateConfiguration"
            }
        },
        PutBucketAcl: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?acl"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    ACL: {
                        location: "header",
                        locationName: "x-amz-acl"
                    },
                    AccessControlPolicy: {
                        shape: "Sa8",
                        locationName: "AccessControlPolicy",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        }
                    },
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    GrantFullControl: {
                        location: "header",
                        locationName: "x-amz-grant-full-control"
                    },
                    GrantRead: {
                        location: "header",
                        locationName: "x-amz-grant-read"
                    },
                    GrantReadACP: {
                        location: "header",
                        locationName: "x-amz-grant-read-acp"
                    },
                    GrantWrite: {
                        location: "header",
                        locationName: "x-amz-grant-write"
                    },
                    GrantWriteACP: {
                        location: "header",
                        locationName: "x-amz-grant-write-acp"
                    }
                },
                payload: "AccessControlPolicy"
            }
        },
        PutBucketAnalyticsConfiguration: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?analytics"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Id", "AnalyticsConfiguration" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Id: {
                        location: "querystring",
                        locationName: "id"
                    },
                    AnalyticsConfiguration: {
                        shape: "S37",
                        locationName: "AnalyticsConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        }
                    }
                },
                payload: "AnalyticsConfiguration"
            }
        },
        PutBucketCors: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?cors"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "CORSConfiguration" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    CORSConfiguration: {
                        locationName: "CORSConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        },
                        type: "structure",
                        required: [ "CORSRules" ],
                        members: {
                            CORSRules: {
                                shape: "S3n",
                                locationName: "CORSRule"
                            }
                        }
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    }
                },
                payload: "CORSConfiguration"
            }
        },
        PutBucketEncryption: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?encryption"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "ServerSideEncryptionConfiguration" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    ServerSideEncryptionConfiguration: {
                        shape: "S40",
                        locationName: "ServerSideEncryptionConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        }
                    }
                },
                payload: "ServerSideEncryptionConfiguration"
            }
        },
        PutBucketInventoryConfiguration: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?inventory"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Id", "InventoryConfiguration" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Id: {
                        location: "querystring",
                        locationName: "id"
                    },
                    InventoryConfiguration: {
                        shape: "S46",
                        locationName: "InventoryConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        }
                    }
                },
                payload: "InventoryConfiguration"
            }
        },
        PutBucketLifecycle: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?lifecycle"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    LifecycleConfiguration: {
                        locationName: "LifecycleConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        },
                        type: "structure",
                        required: [ "Rules" ],
                        members: {
                            Rules: {
                                shape: "S4m",
                                locationName: "Rule"
                            }
                        }
                    }
                },
                payload: "LifecycleConfiguration"
            },
            deprecated: true
        },
        PutBucketLifecycleConfiguration: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?lifecycle"
            },
            input: {
                type: "structure",
                required: [ "Bucket" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    LifecycleConfiguration: {
                        locationName: "LifecycleConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        },
                        type: "structure",
                        required: [ "Rules" ],
                        members: {
                            Rules: {
                                shape: "S51",
                                locationName: "Rule"
                            }
                        }
                    }
                },
                payload: "LifecycleConfiguration"
            }
        },
        PutBucketLogging: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?logging"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "BucketLoggingStatus" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    BucketLoggingStatus: {
                        locationName: "BucketLoggingStatus",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        },
                        type: "structure",
                        members: {
                            LoggingEnabled: {
                                shape: "S5b"
                            }
                        }
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    }
                },
                payload: "BucketLoggingStatus"
            }
        },
        PutBucketMetricsConfiguration: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?metrics"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Id", "MetricsConfiguration" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Id: {
                        location: "querystring",
                        locationName: "id"
                    },
                    MetricsConfiguration: {
                        shape: "S5j",
                        locationName: "MetricsConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        }
                    }
                },
                payload: "MetricsConfiguration"
            }
        },
        PutBucketNotification: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?notification"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "NotificationConfiguration" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    NotificationConfiguration: {
                        shape: "S5n",
                        locationName: "NotificationConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        }
                    }
                },
                payload: "NotificationConfiguration"
            },
            deprecated: true
        },
        PutBucketNotificationConfiguration: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?notification"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "NotificationConfiguration" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    NotificationConfiguration: {
                        shape: "S5y",
                        locationName: "NotificationConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        }
                    }
                },
                payload: "NotificationConfiguration"
            }
        },
        PutBucketPolicy: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?policy"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Policy" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    ConfirmRemoveSelfBucketAccess: {
                        location: "header",
                        locationName: "x-amz-confirm-remove-self-bucket-access",
                        type: "boolean"
                    },
                    Policy: {}
                },
                payload: "Policy"
            }
        },
        PutBucketReplication: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?replication"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "ReplicationConfiguration" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    ReplicationConfiguration: {
                        shape: "S6h",
                        locationName: "ReplicationConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        }
                    }
                },
                payload: "ReplicationConfiguration"
            }
        },
        PutBucketRequestPayment: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?requestPayment"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "RequestPaymentConfiguration" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    RequestPaymentConfiguration: {
                        locationName: "RequestPaymentConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        },
                        type: "structure",
                        required: [ "Payer" ],
                        members: {
                            Payer: {}
                        }
                    }
                },
                payload: "RequestPaymentConfiguration"
            }
        },
        PutBucketTagging: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?tagging"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Tagging" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    Tagging: {
                        shape: "Sau",
                        locationName: "Tagging",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        }
                    }
                },
                payload: "Tagging"
            }
        },
        PutBucketVersioning: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?versioning"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "VersioningConfiguration" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    MFA: {
                        location: "header",
                        locationName: "x-amz-mfa"
                    },
                    VersioningConfiguration: {
                        locationName: "VersioningConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        },
                        type: "structure",
                        members: {
                            MFADelete: {
                                locationName: "MfaDelete"
                            },
                            Status: {}
                        }
                    }
                },
                payload: "VersioningConfiguration"
            }
        },
        PutBucketWebsite: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}?website"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "WebsiteConfiguration" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    WebsiteConfiguration: {
                        locationName: "WebsiteConfiguration",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        },
                        type: "structure",
                        members: {
                            ErrorDocument: {
                                shape: "S7a"
                            },
                            IndexDocument: {
                                shape: "S78"
                            },
                            RedirectAllRequestsTo: {
                                shape: "S75"
                            },
                            RoutingRules: {
                                shape: "S7b"
                            }
                        }
                    }
                },
                payload: "WebsiteConfiguration"
            }
        },
        PutObject: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}/{Key+}"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key" ],
                members: {
                    ACL: {
                        location: "header",
                        locationName: "x-amz-acl"
                    },
                    Body: {
                        streaming: true,
                        type: "blob"
                    },
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    CacheControl: {
                        location: "header",
                        locationName: "Cache-Control"
                    },
                    ContentDisposition: {
                        location: "header",
                        locationName: "Content-Disposition"
                    },
                    ContentEncoding: {
                        location: "header",
                        locationName: "Content-Encoding"
                    },
                    ContentLanguage: {
                        location: "header",
                        locationName: "Content-Language"
                    },
                    ContentLength: {
                        location: "header",
                        locationName: "Content-Length",
                        type: "long"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    ContentType: {
                        location: "header",
                        locationName: "Content-Type"
                    },
                    Expires: {
                        location: "header",
                        locationName: "Expires",
                        type: "timestamp"
                    },
                    GrantFullControl: {
                        location: "header",
                        locationName: "x-amz-grant-full-control"
                    },
                    GrantRead: {
                        location: "header",
                        locationName: "x-amz-grant-read"
                    },
                    GrantReadACP: {
                        location: "header",
                        locationName: "x-amz-grant-read-acp"
                    },
                    GrantWriteACP: {
                        location: "header",
                        locationName: "x-amz-grant-write-acp"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    Metadata: {
                        shape: "S11",
                        location: "headers",
                        locationName: "x-amz-meta-"
                    },
                    ServerSideEncryption: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption"
                    },
                    StorageClass: {
                        location: "header",
                        locationName: "x-amz-storage-class"
                    },
                    WebsiteRedirectLocation: {
                        location: "header",
                        locationName: "x-amz-website-redirect-location"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKey: {
                        shape: "S19",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    SSEKMSKeyId: {
                        shape: "Sj",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-aws-kms-key-id"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    },
                    Tagging: {
                        location: "header",
                        locationName: "x-amz-tagging"
                    }
                },
                payload: "Body"
            },
            output: {
                type: "structure",
                members: {
                    Expiration: {
                        location: "header",
                        locationName: "x-amz-expiration"
                    },
                    ETag: {
                        location: "header",
                        locationName: "ETag"
                    },
                    ServerSideEncryption: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption"
                    },
                    VersionId: {
                        location: "header",
                        locationName: "x-amz-version-id"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    SSEKMSKeyId: {
                        shape: "Sj",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-aws-kms-key-id"
                    },
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    }
                }
            }
        },
        PutObjectAcl: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}/{Key+}?acl"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key" ],
                members: {
                    ACL: {
                        location: "header",
                        locationName: "x-amz-acl"
                    },
                    AccessControlPolicy: {
                        shape: "Sa8",
                        locationName: "AccessControlPolicy",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        }
                    },
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    GrantFullControl: {
                        location: "header",
                        locationName: "x-amz-grant-full-control"
                    },
                    GrantRead: {
                        location: "header",
                        locationName: "x-amz-grant-read"
                    },
                    GrantReadACP: {
                        location: "header",
                        locationName: "x-amz-grant-read-acp"
                    },
                    GrantWrite: {
                        location: "header",
                        locationName: "x-amz-grant-write"
                    },
                    GrantWriteACP: {
                        location: "header",
                        locationName: "x-amz-grant-write-acp"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    },
                    VersionId: {
                        location: "querystring",
                        locationName: "versionId"
                    }
                },
                payload: "AccessControlPolicy"
            },
            output: {
                type: "structure",
                members: {
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    }
                }
            }
        },
        PutObjectTagging: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}/{Key+}?tagging"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key", "Tagging" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    VersionId: {
                        location: "querystring",
                        locationName: "versionId"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    Tagging: {
                        shape: "Sau",
                        locationName: "Tagging",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        }
                    }
                },
                payload: "Tagging"
            },
            output: {
                type: "structure",
                members: {
                    VersionId: {
                        location: "header",
                        locationName: "x-amz-version-id"
                    }
                }
            }
        },
        RestoreObject: {
            http: {
                requestUri: "/{Bucket}/{Key+}?restore"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    VersionId: {
                        location: "querystring",
                        locationName: "versionId"
                    },
                    RestoreRequest: {
                        locationName: "RestoreRequest",
                        xmlNamespace: {
                            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
                        },
                        type: "structure",
                        members: {
                            Days: {
                                type: "integer"
                            },
                            GlacierJobParameters: {
                                type: "structure",
                                required: [ "Tier" ],
                                members: {
                                    Tier: {}
                                }
                            },
                            Type: {},
                            Tier: {},
                            Description: {},
                            SelectParameters: {
                                type: "structure",
                                required: [ "InputSerialization", "ExpressionType", "Expression", "OutputSerialization" ],
                                members: {
                                    InputSerialization: {
                                        type: "structure",
                                        members: {
                                            CSV: {
                                                type: "structure",
                                                members: {
                                                    FileHeaderInfo: {},
                                                    Comments: {},
                                                    QuoteEscapeCharacter: {},
                                                    RecordDelimiter: {},
                                                    FieldDelimiter: {},
                                                    QuoteCharacter: {}
                                                }
                                            }
                                        }
                                    },
                                    ExpressionType: {},
                                    Expression: {},
                                    OutputSerialization: {
                                        type: "structure",
                                        members: {
                                            CSV: {
                                                type: "structure",
                                                members: {
                                                    QuoteFields: {},
                                                    QuoteEscapeCharacter: {},
                                                    RecordDelimiter: {},
                                                    FieldDelimiter: {},
                                                    QuoteCharacter: {}
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            OutputLocation: {
                                type: "structure",
                                members: {
                                    S3: {
                                        type: "structure",
                                        required: [ "BucketName", "Prefix" ],
                                        members: {
                                            BucketName: {},
                                            Prefix: {},
                                            Encryption: {
                                                type: "structure",
                                                required: [ "EncryptionType" ],
                                                members: {
                                                    EncryptionType: {},
                                                    KMSKeyId: {
                                                        shape: "Sj"
                                                    },
                                                    KMSContext: {}
                                                }
                                            },
                                            CannedACL: {},
                                            AccessControlList: {
                                                shape: "S2y"
                                            },
                                            Tagging: {
                                                shape: "Sau"
                                            },
                                            UserMetadata: {
                                                type: "list",
                                                member: {
                                                    locationName: "MetadataEntry",
                                                    type: "structure",
                                                    members: {
                                                        Name: {},
                                                        Value: {}
                                                    }
                                                }
                                            },
                                            StorageClass: {}
                                        }
                                    }
                                }
                            }
                        }
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    }
                },
                payload: "RestoreRequest"
            },
            output: {
                type: "structure",
                members: {
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    },
                    RestoreOutputPath: {
                        location: "header",
                        locationName: "x-amz-restore-output-path"
                    }
                }
            },
            alias: "PostObjectRestore"
        },
        UploadPart: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}/{Key+}"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "Key", "PartNumber", "UploadId" ],
                members: {
                    Body: {
                        streaming: true,
                        type: "blob"
                    },
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    ContentLength: {
                        location: "header",
                        locationName: "Content-Length",
                        type: "long"
                    },
                    ContentMD5: {
                        location: "header",
                        locationName: "Content-MD5"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    PartNumber: {
                        location: "querystring",
                        locationName: "partNumber",
                        type: "integer"
                    },
                    UploadId: {
                        location: "querystring",
                        locationName: "uploadId"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKey: {
                        shape: "S19",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    }
                },
                payload: "Body"
            },
            output: {
                type: "structure",
                members: {
                    ServerSideEncryption: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption"
                    },
                    ETag: {
                        location: "header",
                        locationName: "ETag"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    SSEKMSKeyId: {
                        shape: "Sj",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-aws-kms-key-id"
                    },
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    }
                }
            }
        },
        UploadPartCopy: {
            http: {
                method: "PUT",
                requestUri: "/{Bucket}/{Key+}"
            },
            input: {
                type: "structure",
                required: [ "Bucket", "CopySource", "Key", "PartNumber", "UploadId" ],
                members: {
                    Bucket: {
                        location: "uri",
                        locationName: "Bucket"
                    },
                    CopySource: {
                        location: "header",
                        locationName: "x-amz-copy-source"
                    },
                    CopySourceIfMatch: {
                        location: "header",
                        locationName: "x-amz-copy-source-if-match"
                    },
                    CopySourceIfModifiedSince: {
                        location: "header",
                        locationName: "x-amz-copy-source-if-modified-since",
                        type: "timestamp"
                    },
                    CopySourceIfNoneMatch: {
                        location: "header",
                        locationName: "x-amz-copy-source-if-none-match"
                    },
                    CopySourceIfUnmodifiedSince: {
                        location: "header",
                        locationName: "x-amz-copy-source-if-unmodified-since",
                        type: "timestamp"
                    },
                    CopySourceRange: {
                        location: "header",
                        locationName: "x-amz-copy-source-range"
                    },
                    Key: {
                        location: "uri",
                        locationName: "Key"
                    },
                    PartNumber: {
                        location: "querystring",
                        locationName: "partNumber",
                        type: "integer"
                    },
                    UploadId: {
                        location: "querystring",
                        locationName: "uploadId"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKey: {
                        shape: "S19",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    CopySourceSSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-copy-source-server-side-encryption-customer-algorithm"
                    },
                    CopySourceSSECustomerKey: {
                        shape: "S1c",
                        location: "header",
                        locationName: "x-amz-copy-source-server-side-encryption-customer-key"
                    },
                    CopySourceSSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-copy-source-server-side-encryption-customer-key-MD5"
                    },
                    RequestPayer: {
                        location: "header",
                        locationName: "x-amz-request-payer"
                    }
                }
            },
            output: {
                type: "structure",
                members: {
                    CopySourceVersionId: {
                        location: "header",
                        locationName: "x-amz-copy-source-version-id"
                    },
                    CopyPartResult: {
                        type: "structure",
                        members: {
                            ETag: {},
                            LastModified: {
                                type: "timestamp"
                            }
                        }
                    },
                    ServerSideEncryption: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption"
                    },
                    SSECustomerAlgorithm: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-algorithm"
                    },
                    SSECustomerKeyMD5: {
                        location: "header",
                        locationName: "x-amz-server-side-encryption-customer-key-MD5"
                    },
                    SSEKMSKeyId: {
                        shape: "Sj",
                        location: "header",
                        locationName: "x-amz-server-side-encryption-aws-kms-key-id"
                    },
                    RequestCharged: {
                        location: "header",
                        locationName: "x-amz-request-charged"
                    }
                },
                payload: "CopyPartResult"
            }
        }
    },
    shapes: {
        Sj: {
            type: "string",
            sensitive: true
        },
        S11: {
            type: "map",
            key: {},
            value: {}
        },
        S19: {
            type: "blob",
            sensitive: true
        },
        S1c: {
            type: "blob",
            sensitive: true
        },
        S2v: {
            type: "structure",
            members: {
                DisplayName: {},
                ID: {}
            }
        },
        S2y: {
            type: "list",
            member: {
                locationName: "Grant",
                type: "structure",
                members: {
                    Grantee: {
                        shape: "S30"
                    },
                    Permission: {}
                }
            }
        },
        S30: {
            type: "structure",
            required: [ "Type" ],
            members: {
                DisplayName: {},
                EmailAddress: {},
                ID: {},
                Type: {
                    locationName: "xsi:type",
                    xmlAttribute: true
                },
                URI: {}
            },
            xmlNamespace: {
                prefix: "xsi",
                uri: "http://www.w3.org/2001/XMLSchema-instance"
            }
        },
        S37: {
            type: "structure",
            required: [ "Id", "StorageClassAnalysis" ],
            members: {
                Id: {},
                Filter: {
                    type: "structure",
                    members: {
                        Prefix: {},
                        Tag: {
                            shape: "S3a"
                        },
                        And: {
                            type: "structure",
                            members: {
                                Prefix: {},
                                Tags: {
                                    shape: "S3d",
                                    flattened: true,
                                    locationName: "Tag"
                                }
                            }
                        }
                    }
                },
                StorageClassAnalysis: {
                    type: "structure",
                    members: {
                        DataExport: {
                            type: "structure",
                            required: [ "OutputSchemaVersion", "Destination" ],
                            members: {
                                OutputSchemaVersion: {},
                                Destination: {
                                    type: "structure",
                                    required: [ "S3BucketDestination" ],
                                    members: {
                                        S3BucketDestination: {
                                            type: "structure",
                                            required: [ "Format", "Bucket" ],
                                            members: {
                                                Format: {},
                                                BucketAccountId: {},
                                                Bucket: {},
                                                Prefix: {}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        S3a: {
            type: "structure",
            required: [ "Key", "Value" ],
            members: {
                Key: {},
                Value: {}
            }
        },
        S3d: {
            type: "list",
            member: {
                shape: "S3a",
                locationName: "Tag"
            }
        },
        S3n: {
            type: "list",
            member: {
                type: "structure",
                required: [ "AllowedMethods", "AllowedOrigins" ],
                members: {
                    AllowedHeaders: {
                        locationName: "AllowedHeader",
                        type: "list",
                        member: {},
                        flattened: true
                    },
                    AllowedMethods: {
                        locationName: "AllowedMethod",
                        type: "list",
                        member: {},
                        flattened: true
                    },
                    AllowedOrigins: {
                        locationName: "AllowedOrigin",
                        type: "list",
                        member: {},
                        flattened: true
                    },
                    ExposeHeaders: {
                        locationName: "ExposeHeader",
                        type: "list",
                        member: {},
                        flattened: true
                    },
                    MaxAgeSeconds: {
                        type: "integer"
                    }
                }
            },
            flattened: true
        },
        S40: {
            type: "structure",
            required: [ "Rules" ],
            members: {
                Rules: {
                    locationName: "Rule",
                    type: "list",
                    member: {
                        type: "structure",
                        members: {
                            ApplyServerSideEncryptionByDefault: {
                                type: "structure",
                                required: [ "SSEAlgorithm" ],
                                members: {
                                    SSEAlgorithm: {},
                                    KMSMasterKeyID: {
                                        shape: "Sj"
                                    }
                                }
                            }
                        }
                    },
                    flattened: true
                }
            }
        },
        S46: {
            type: "structure",
            required: [ "Destination", "IsEnabled", "Id", "IncludedObjectVersions", "Schedule" ],
            members: {
                Destination: {
                    type: "structure",
                    required: [ "S3BucketDestination" ],
                    members: {
                        S3BucketDestination: {
                            type: "structure",
                            required: [ "Bucket", "Format" ],
                            members: {
                                AccountId: {},
                                Bucket: {},
                                Format: {},
                                Prefix: {},
                                Encryption: {
                                    type: "structure",
                                    members: {
                                        SSES3: {
                                            locationName: "SSE-S3",
                                            type: "structure",
                                            members: {}
                                        },
                                        SSEKMS: {
                                            locationName: "SSE-KMS",
                                            type: "structure",
                                            required: [ "KeyId" ],
                                            members: {
                                                KeyId: {
                                                    shape: "Sj"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                IsEnabled: {
                    type: "boolean"
                },
                Filter: {
                    type: "structure",
                    required: [ "Prefix" ],
                    members: {
                        Prefix: {}
                    }
                },
                Id: {},
                IncludedObjectVersions: {},
                OptionalFields: {
                    type: "list",
                    member: {
                        locationName: "Field"
                    }
                },
                Schedule: {
                    type: "structure",
                    required: [ "Frequency" ],
                    members: {
                        Frequency: {}
                    }
                }
            }
        },
        S4m: {
            type: "list",
            member: {
                type: "structure",
                required: [ "Prefix", "Status" ],
                members: {
                    Expiration: {
                        shape: "S4o"
                    },
                    ID: {},
                    Prefix: {},
                    Status: {},
                    Transition: {
                        shape: "S4t"
                    },
                    NoncurrentVersionTransition: {
                        shape: "S4v"
                    },
                    NoncurrentVersionExpiration: {
                        shape: "S4w"
                    },
                    AbortIncompleteMultipartUpload: {
                        shape: "S4x"
                    }
                }
            },
            flattened: true
        },
        S4o: {
            type: "structure",
            members: {
                Date: {
                    shape: "S4p"
                },
                Days: {
                    type: "integer"
                },
                ExpiredObjectDeleteMarker: {
                    type: "boolean"
                }
            }
        },
        S4p: {
            type: "timestamp",
            timestampFormat: "iso8601"
        },
        S4t: {
            type: "structure",
            members: {
                Date: {
                    shape: "S4p"
                },
                Days: {
                    type: "integer"
                },
                StorageClass: {}
            }
        },
        S4v: {
            type: "structure",
            members: {
                NoncurrentDays: {
                    type: "integer"
                },
                StorageClass: {}
            }
        },
        S4w: {
            type: "structure",
            members: {
                NoncurrentDays: {
                    type: "integer"
                }
            }
        },
        S4x: {
            type: "structure",
            members: {
                DaysAfterInitiation: {
                    type: "integer"
                }
            }
        },
        S51: {
            type: "list",
            member: {
                type: "structure",
                required: [ "Status" ],
                members: {
                    Expiration: {
                        shape: "S4o"
                    },
                    ID: {},
                    Prefix: {
                        deprecated: true
                    },
                    Filter: {
                        type: "structure",
                        members: {
                            Prefix: {},
                            Tag: {
                                shape: "S3a"
                            },
                            And: {
                                type: "structure",
                                members: {
                                    Prefix: {},
                                    Tags: {
                                        shape: "S3d",
                                        flattened: true,
                                        locationName: "Tag"
                                    }
                                }
                            }
                        }
                    },
                    Status: {},
                    Transitions: {
                        locationName: "Transition",
                        type: "list",
                        member: {
                            shape: "S4t"
                        },
                        flattened: true
                    },
                    NoncurrentVersionTransitions: {
                        locationName: "NoncurrentVersionTransition",
                        type: "list",
                        member: {
                            shape: "S4v"
                        },
                        flattened: true
                    },
                    NoncurrentVersionExpiration: {
                        shape: "S4w"
                    },
                    AbortIncompleteMultipartUpload: {
                        shape: "S4x"
                    }
                }
            },
            flattened: true
        },
        S5b: {
            type: "structure",
            members: {
                TargetBucket: {},
                TargetGrants: {
                    type: "list",
                    member: {
                        locationName: "Grant",
                        type: "structure",
                        members: {
                            Grantee: {
                                shape: "S30"
                            },
                            Permission: {}
                        }
                    }
                },
                TargetPrefix: {}
            }
        },
        S5j: {
            type: "structure",
            required: [ "Id" ],
            members: {
                Id: {},
                Filter: {
                    type: "structure",
                    members: {
                        Prefix: {},
                        Tag: {
                            shape: "S3a"
                        },
                        And: {
                            type: "structure",
                            members: {
                                Prefix: {},
                                Tags: {
                                    shape: "S3d",
                                    flattened: true,
                                    locationName: "Tag"
                                }
                            }
                        }
                    }
                }
            }
        },
        S5m: {
            type: "structure",
            required: [ "Bucket" ],
            members: {
                Bucket: {
                    location: "uri",
                    locationName: "Bucket"
                }
            }
        },
        S5n: {
            type: "structure",
            members: {
                TopicConfiguration: {
                    type: "structure",
                    members: {
                        Id: {},
                        Events: {
                            shape: "S5q",
                            locationName: "Event"
                        },
                        Event: {
                            deprecated: true
                        },
                        Topic: {}
                    }
                },
                QueueConfiguration: {
                    type: "structure",
                    members: {
                        Id: {},
                        Event: {
                            deprecated: true
                        },
                        Events: {
                            shape: "S5q",
                            locationName: "Event"
                        },
                        Queue: {}
                    }
                },
                CloudFunctionConfiguration: {
                    type: "structure",
                    members: {
                        Id: {},
                        Event: {
                            deprecated: true
                        },
                        Events: {
                            shape: "S5q",
                            locationName: "Event"
                        },
                        CloudFunction: {},
                        InvocationRole: {}
                    }
                }
            }
        },
        S5q: {
            type: "list",
            member: {},
            flattened: true
        },
        S5y: {
            type: "structure",
            members: {
                TopicConfigurations: {
                    locationName: "TopicConfiguration",
                    type: "list",
                    member: {
                        type: "structure",
                        required: [ "TopicArn", "Events" ],
                        members: {
                            Id: {},
                            TopicArn: {
                                locationName: "Topic"
                            },
                            Events: {
                                shape: "S5q",
                                locationName: "Event"
                            },
                            Filter: {
                                shape: "S61"
                            }
                        }
                    },
                    flattened: true
                },
                QueueConfigurations: {
                    locationName: "QueueConfiguration",
                    type: "list",
                    member: {
                        type: "structure",
                        required: [ "QueueArn", "Events" ],
                        members: {
                            Id: {},
                            QueueArn: {
                                locationName: "Queue"
                            },
                            Events: {
                                shape: "S5q",
                                locationName: "Event"
                            },
                            Filter: {
                                shape: "S61"
                            }
                        }
                    },
                    flattened: true
                },
                LambdaFunctionConfigurations: {
                    locationName: "CloudFunctionConfiguration",
                    type: "list",
                    member: {
                        type: "structure",
                        required: [ "LambdaFunctionArn", "Events" ],
                        members: {
                            Id: {},
                            LambdaFunctionArn: {
                                locationName: "CloudFunction"
                            },
                            Events: {
                                shape: "S5q",
                                locationName: "Event"
                            },
                            Filter: {
                                shape: "S61"
                            }
                        }
                    },
                    flattened: true
                }
            }
        },
        S61: {
            type: "structure",
            members: {
                Key: {
                    locationName: "S3Key",
                    type: "structure",
                    members: {
                        FilterRules: {
                            locationName: "FilterRule",
                            type: "list",
                            member: {
                                type: "structure",
                                members: {
                                    Name: {},
                                    Value: {}
                                }
                            },
                            flattened: true
                        }
                    }
                }
            }
        },
        S6h: {
            type: "structure",
            required: [ "Role", "Rules" ],
            members: {
                Role: {},
                Rules: {
                    locationName: "Rule",
                    type: "list",
                    member: {
                        type: "structure",
                        required: [ "Prefix", "Status", "Destination" ],
                        members: {
                            ID: {},
                            Prefix: {},
                            Status: {},
                            SourceSelectionCriteria: {
                                type: "structure",
                                members: {
                                    SseKmsEncryptedObjects: {
                                        type: "structure",
                                        required: [ "Status" ],
                                        members: {
                                            Status: {}
                                        }
                                    }
                                }
                            },
                            Destination: {
                                type: "structure",
                                required: [ "Bucket" ],
                                members: {
                                    Bucket: {},
                                    Account: {},
                                    StorageClass: {},
                                    AccessControlTranslation: {
                                        type: "structure",
                                        required: [ "Owner" ],
                                        members: {
                                            Owner: {}
                                        }
                                    },
                                    EncryptionConfiguration: {
                                        type: "structure",
                                        members: {
                                            ReplicaKmsKeyID: {}
                                        }
                                    }
                                }
                            }
                        }
                    },
                    flattened: true
                }
            }
        },
        S75: {
            type: "structure",
            required: [ "HostName" ],
            members: {
                HostName: {},
                Protocol: {}
            }
        },
        S78: {
            type: "structure",
            required: [ "Suffix" ],
            members: {
                Suffix: {}
            }
        },
        S7a: {
            type: "structure",
            required: [ "Key" ],
            members: {
                Key: {}
            }
        },
        S7b: {
            type: "list",
            member: {
                locationName: "RoutingRule",
                type: "structure",
                required: [ "Redirect" ],
                members: {
                    Condition: {
                        type: "structure",
                        members: {
                            HttpErrorCodeReturnedEquals: {},
                            KeyPrefixEquals: {}
                        }
                    },
                    Redirect: {
                        type: "structure",
                        members: {
                            HostName: {},
                            HttpRedirectCode: {},
                            Protocol: {},
                            ReplaceKeyPrefixWith: {},
                            ReplaceKeyWith: {}
                        }
                    }
                }
            }
        },
        S97: {
            type: "structure",
            members: {
                ID: {},
                DisplayName: {}
            }
        },
        S98: {
            type: "list",
            member: {
                type: "structure",
                members: {
                    Prefix: {}
                }
            },
            flattened: true
        },
        S9q: {
            type: "list",
            member: {
                type: "structure",
                members: {
                    Key: {},
                    LastModified: {
                        type: "timestamp"
                    },
                    ETag: {},
                    Size: {
                        type: "integer"
                    },
                    StorageClass: {},
                    Owner: {
                        shape: "S2v"
                    }
                }
            },
            flattened: true
        },
        Sa8: {
            type: "structure",
            members: {
                Grants: {
                    shape: "S2y",
                    locationName: "AccessControlList"
                },
                Owner: {
                    shape: "S2v"
                }
            }
        },
        Sau: {
            type: "structure",
            required: [ "TagSet" ],
            members: {
                TagSet: {
                    shape: "S3d"
                }
            }
        }
    },
    paginators: {
        ListBuckets: {
            result_key: "Buckets"
        },
        ListMultipartUploads: {
            input_token: [ "KeyMarker", "UploadIdMarker" ],
            limit_key: "MaxUploads",
            more_results: "IsTruncated",
            output_token: [ "NextKeyMarker", "NextUploadIdMarker" ],
            result_key: [ "Uploads", "CommonPrefixes" ]
        },
        ListObjectVersions: {
            input_token: [ "KeyMarker", "VersionIdMarker" ],
            limit_key: "MaxKeys",
            more_results: "IsTruncated",
            output_token: [ "NextKeyMarker", "NextVersionIdMarker" ],
            result_key: [ "Versions", "DeleteMarkers", "CommonPrefixes" ]
        },
        ListObjects: {
            input_token: "Marker",
            limit_key: "MaxKeys",
            more_results: "IsTruncated",
            output_token: "NextMarker || Contents[-1].Key",
            result_key: [ "Contents", "CommonPrefixes" ]
        },
        ListObjectsV2: {
            input_token: "ContinuationToken",
            limit_key: "MaxKeys",
            output_token: "NextContinuationToken",
            result_key: [ "Contents", "CommonPrefixes" ]
        },
        ListParts: {
            input_token: "PartNumberMarker",
            limit_key: "MaxParts",
            more_results: "IsTruncated",
            output_token: "NextPartNumberMarker",
            result_key: "Parts"
        }
    },
    waiters: {
        BucketExists: {
            delay: 5,
            operation: "HeadBucket",
            maxAttempts: 20,
            acceptors: [ {
                expected: 200,
                matcher: "status",
                state: "success"
            }, {
                expected: 301,
                matcher: "status",
                state: "success"
            }, {
                expected: 403,
                matcher: "status",
                state: "success"
            }, {
                expected: 404,
                matcher: "status",
                state: "retry"
            } ]
        },
        BucketNotExists: {
            delay: 5,
            operation: "HeadBucket",
            maxAttempts: 20,
            acceptors: [ {
                expected: 404,
                matcher: "status",
                state: "success"
            } ]
        },
        ObjectExists: {
            delay: 5,
            operation: "HeadObject",
            maxAttempts: 20,
            acceptors: [ {
                expected: 200,
                matcher: "status",
                state: "success"
            }, {
                expected: 404,
                matcher: "status",
                state: "retry"
            } ]
        },
        ObjectNotExists: {
            delay: 5,
            operation: "HeadObject",
            maxAttempts: 20,
            acceptors: [ {
                expected: 404,
                matcher: "status",
                state: "success"
            } ]
        }
    }
};AWS.apiLoader.services["sts"] = {};

AWS.STS = AWS.Service.defineService("sts", [ "2011-06-15" ]);

_xamzrequire = function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof _xamzrequire == "function" && _xamzrequire;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f;
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }
        return n[o].exports;
    }
    var i = typeof _xamzrequire == "function" && _xamzrequire;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s;
}({
    250: [ function(require, module, exports) {
        var AWS = require("../core");
        AWS.util.update(AWS.STS.prototype, {
            credentialsFrom: function credentialsFrom(data, credentials) {
                if (!data) return null;
                if (!credentials) credentials = new AWS.TemporaryCredentials();
                credentials.expired = false;
                credentials.accessKeyId = data.Credentials.AccessKeyId;
                credentials.secretAccessKey = data.Credentials.SecretAccessKey;
                credentials.sessionToken = data.Credentials.SessionToken;
                credentials.expireTime = data.Credentials.Expiration;
                return credentials;
            },
            assumeRoleWithWebIdentity: function assumeRoleWithWebIdentity(params, callback) {
                return this.makeUnauthenticatedRequest("assumeRoleWithWebIdentity", params, callback);
            },
            assumeRoleWithSAML: function assumeRoleWithSAML(params, callback) {
                return this.makeUnauthenticatedRequest("assumeRoleWithSAML", params, callback);
            }
        });
    }, {
        "../core": 194
    } ]
}, {}, [ 250 ]);AWS.apiLoader.services["sts"]["2011-06-15"] = {
    version: "2.0",
    metadata: {
        apiVersion: "2011-06-15",
        endpointPrefix: "sts",
        globalEndpoint: "sts.amazonaws.com",
        protocol: "query",
        serviceAbbreviation: "AWS STS",
        serviceFullName: "AWS Security Token Service",
        serviceId: "STS",
        signatureVersion: "v4",
        uid: "sts-2011-06-15",
        xmlNamespace: "https://sts.amazonaws.com/doc/2011-06-15/"
    },
    operations: {
        AssumeRole: {
            input: {
                type: "structure",
                required: [ "RoleArn", "RoleSessionName" ],
                members: {
                    RoleArn: {},
                    RoleSessionName: {},
                    Policy: {},
                    DurationSeconds: {
                        type: "integer"
                    },
                    ExternalId: {},
                    SerialNumber: {},
                    TokenCode: {}
                }
            },
            output: {
                resultWrapper: "AssumeRoleResult",
                type: "structure",
                members: {
                    Credentials: {
                        shape: "Sa"
                    },
                    AssumedRoleUser: {
                        shape: "Sf"
                    },
                    PackedPolicySize: {
                        type: "integer"
                    }
                }
            }
        },
        AssumeRoleWithSAML: {
            input: {
                type: "structure",
                required: [ "RoleArn", "PrincipalArn", "SAMLAssertion" ],
                members: {
                    RoleArn: {},
                    PrincipalArn: {},
                    SAMLAssertion: {},
                    Policy: {},
                    DurationSeconds: {
                        type: "integer"
                    }
                }
            },
            output: {
                resultWrapper: "AssumeRoleWithSAMLResult",
                type: "structure",
                members: {
                    Credentials: {
                        shape: "Sa"
                    },
                    AssumedRoleUser: {
                        shape: "Sf"
                    },
                    PackedPolicySize: {
                        type: "integer"
                    },
                    Subject: {},
                    SubjectType: {},
                    Issuer: {},
                    Audience: {},
                    NameQualifier: {}
                }
            }
        },
        AssumeRoleWithWebIdentity: {
            input: {
                type: "structure",
                required: [ "RoleArn", "RoleSessionName", "WebIdentityToken" ],
                members: {
                    RoleArn: {},
                    RoleSessionName: {},
                    WebIdentityToken: {},
                    ProviderId: {},
                    Policy: {},
                    DurationSeconds: {
                        type: "integer"
                    }
                }
            },
            output: {
                resultWrapper: "AssumeRoleWithWebIdentityResult",
                type: "structure",
                members: {
                    Credentials: {
                        shape: "Sa"
                    },
                    SubjectFromWebIdentityToken: {},
                    AssumedRoleUser: {
                        shape: "Sf"
                    },
                    PackedPolicySize: {
                        type: "integer"
                    },
                    Provider: {},
                    Audience: {}
                }
            }
        },
        DecodeAuthorizationMessage: {
            input: {
                type: "structure",
                required: [ "EncodedMessage" ],
                members: {
                    EncodedMessage: {}
                }
            },
            output: {
                resultWrapper: "DecodeAuthorizationMessageResult",
                type: "structure",
                members: {
                    DecodedMessage: {}
                }
            }
        },
        GetCallerIdentity: {
            input: {
                type: "structure",
                members: {}
            },
            output: {
                resultWrapper: "GetCallerIdentityResult",
                type: "structure",
                members: {
                    UserId: {},
                    Account: {},
                    Arn: {}
                }
            }
        },
        GetFederationToken: {
            input: {
                type: "structure",
                required: [ "Name" ],
                members: {
                    Name: {},
                    Policy: {},
                    DurationSeconds: {
                        type: "integer"
                    }
                }
            },
            output: {
                resultWrapper: "GetFederationTokenResult",
                type: "structure",
                members: {
                    Credentials: {
                        shape: "Sa"
                    },
                    FederatedUser: {
                        type: "structure",
                        required: [ "FederatedUserId", "Arn" ],
                        members: {
                            FederatedUserId: {},
                            Arn: {}
                        }
                    },
                    PackedPolicySize: {
                        type: "integer"
                    }
                }
            }
        },
        GetSessionToken: {
            input: {
                type: "structure",
                members: {
                    DurationSeconds: {
                        type: "integer"
                    },
                    SerialNumber: {},
                    TokenCode: {}
                }
            },
            output: {
                resultWrapper: "GetSessionTokenResult",
                type: "structure",
                members: {
                    Credentials: {
                        shape: "Sa"
                    }
                }
            }
        }
    },
    shapes: {
        Sa: {
            type: "structure",
            required: [ "AccessKeyId", "SecretAccessKey", "SessionToken", "Expiration" ],
            members: {
                AccessKeyId: {},
                SecretAccessKey: {},
                SessionToken: {},
                Expiration: {
                    type: "timestamp"
                }
            }
        },
        Sf: {
            type: "structure",
            required: [ "AssumedRoleId", "Arn" ],
            members: {
                AssumedRoleId: {},
                Arn: {}
            }
        }
    },
    paginators: {}
};