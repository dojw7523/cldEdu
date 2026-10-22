"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { uploadFile } from "@/lib/upload-client";

export function RichEditor({
  name,
  initialHtml,
  blobEnabled,
}: {
  name: string;
  initialHtml: string;
  blobEnabled: boolean;
}) {
  const [html, setHtml] = useState(initialHtml);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }),
      Image,
      Placeholder.configure({ placeholder: "내용을 입력하세요" }),
    ],
    content: initialHtml,
    immediatelyRender: false,
    editorProps: { attributes: { class: "px-4 py-3" } },
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div className="rounded-md border border-gray-300 bg-white focus-within:border-brand-600">
      <input type="hidden" name={name} value={html} />
      {editor && <Toolbar editor={editor} blobEnabled={blobEnabled} />}
      <div className="post-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor, blobEnabled }: { editor: Editor; blobEnabled: boolean }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      quote: editor.isActive("blockquote"),
      code: editor.isActive("codeBlock"),
      link: editor.isActive("link"),
    }),
  });

  const chain = () => editor.chain().focus();

  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 주소", previous ?? "https://");
    if (url === null) return;
    if (url === "") chain().extendMarkRange("link").unsetLink().run();
    else chain().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function insertImage(file: File) {
    setUploading(true);
    try {
      const uploaded = await uploadFile(file, blobEnabled, true);
      chain().setImage({ src: uploaded.url, alt: file.name }).run();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const buttons: { label: string; title: string; on: boolean; run: () => void }[] = [
    { label: "B", title: "굵게", on: active.bold, run: () => chain().toggleBold().run() },
    { label: "I", title: "기울임", on: active.italic, run: () => chain().toggleItalic().run() },
    { label: "S", title: "취소선", on: active.strike, run: () => chain().toggleStrike().run() },
    { label: "H2", title: "제목", on: active.h2, run: () => chain().toggleHeading({ level: 2 }).run() },
    { label: "H3", title: "소제목", on: active.h3, run: () => chain().toggleHeading({ level: 3 }).run() },
    { label: "•", title: "글머리 목록", on: active.bullet, run: () => chain().toggleBulletList().run() },
    { label: "1.", title: "번호 목록", on: active.ordered, run: () => chain().toggleOrderedList().run() },
    { label: "❝", title: "인용", on: active.quote, run: () => chain().toggleBlockquote().run() },
    { label: "</>", title: "코드 블록", on: active.code, run: () => chain().toggleCodeBlock().run() },
    { label: "링크", title: "링크", on: active.link, run: setLink },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 px-2 py-1.5">
      {buttons.map((b) => (
        <button
          key={b.title}
          type="button"
          title={b.title}
          onClick={b.run}
          className={`min-w-8 rounded px-2 py-1 text-sm ${b.on ? "bg-brand-100 text-brand-700" : "text-gray-700 hover:bg-gray-100"}`}
        >
          {b.label}
        </button>
      ))}
      <button
        type="button"
        title="이미지 넣기"
        disabled={uploading}
        onClick={() => fileInput.current?.click()}
        className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
      >
        {uploading ? "올리는 중…" : "이미지"}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) insertImage(file);
        }}
      />
    </div>
  );
}
