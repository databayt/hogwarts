// @ts-nocheck -- skip type checking
import * as docs_1 from "../content/docs/en/index.mdx?collection=docs"
import * as docs_0 from "../content/docs/ar/index.mdx?collection=docs"
import { _runtime } from "fumadocs-mdx/runtime/next"
import * as _source from "../source.config"
export const docs = _runtime.docs<typeof _source.docs>([{ info: {"path":"ar/index.mdx","fullPath":"content\\docs\\ar\\index.mdx"}, data: docs_0 }, { info: {"path":"en/index.mdx","fullPath":"content\\docs\\en\\index.mdx"}, data: docs_1 }], [{"info":{"path":"ar/meta.json","fullPath":"content\\docs\\ar\\meta.json"},"data":{"title":"التوثيق","pages":["index","getting-started","components","platform","api","architecture","deployment","contributing","changelog"],"root":true}}, {"info":{"path":"en/meta.json","fullPath":"content\\docs\\en\\meta.json"},"data":{"title":"Documentation","pages":["index","getting-started","components","platform","api","architecture","deployment","contributing","changelog"],"root":true}}])