import "server-only";
import sanitizeHtml from "sanitize-html";

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "em", "s", "u", "code", "pre", "blockquote",
    "h2", "h3", "ul", "ol", "li", "a", "img", "hr",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer nofollow" }),
  },
};

/** Strips anything the editor can't produce, including scripts and event handlers. */
export function sanitizePostHtml(html: string) {
  return sanitizeHtml(html, options);
}

export function htmlToText(html: string) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
