'use client';

import React, { useImperativeHandle, forwardRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useRef, useEffect } from 'react';
// For image upload
import { useRef as useReactRef } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Image as LucideImage,
  Link as LucideLink,
  Undo2,
  Redo2
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  setContent: (content: string) => void;
  className?: string;
}

export type RichTextEditorHandle = {
  getPendingImages: () => { [localUrl: string]: File };
  replaceImageSrcs: (replaceMap: { [localUrl: string]: string }) => void;
  getBlobToSupabaseUrlMap: () => { [blobUrl: string]: string };
  editor: any;
};

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ content, setContent, className = '' }, ref) => {
    const fileInputRef = useReactRef<HTMLInputElement>(null);
    const editorRef = useRef<any>(null);
    const [pendingImages, setPendingImages] = useState<{ [localUrl: string]: File }>({});
    const [blobToSupabaseUrl, setBlobToSupabaseUrl] = useState<{ [blobUrl: string]: string }>({});

    useImperativeHandle(ref, () => ({
      getPendingImages: () => pendingImages,
      replaceImageSrcs: (replaceMap) => {
        if (!editorRef.current) return;
        let html = editorRef.current.getHTML();
        Object.entries(replaceMap).forEach(([localUrl, supaUrl]) => {
          html = html.replaceAll(localUrl, supaUrl);
        });
        editorRef.current.commands.setContent(html, false);
        setContent(html);
      },
      getBlobToSupabaseUrlMap: () => blobToSupabaseUrl,
      editor: editorRef.current,
    }), [pendingImages, setContent, blobToSupabaseUrl]);

  // Patch: Map blob URLs to Supabase URLs on load
  useEffect(() => {
    // Only run on mount/content change
    if (!content) return;
    const temp = document.createElement('div');
    temp.innerHTML = content;
    const imgs = temp.querySelectorAll('img');
    const mapping: { [blobUrl: string]: string } = {};
    imgs.forEach(img => {
      const src = img.src;
      // Only map Supabase URLs
      if (src.includes('/storage/v1/object/public/')) {
        // Attempt to create a blob for this image to simulate editor's behavior
        fetch(src)
          .then(res => res.blob())
          .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            mapping[blobUrl] = src;
            // Also map the original Supabase URL to itself for fallback
            mapping[src] = src;
            setBlobToSupabaseUrl(current => ({ ...current, [blobUrl]: src, [src]: src }));
          });
      }
    });
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'rounded-md bg-gray-800 p-5 font-mono text-sm text-gray-100',
          },
        },
      }),
      CodeBlockLowlight.configure({
        lowlight: createLowlight(common),
        HTMLAttributes: {
          class: 'rounded-md bg-gray-800 p-5 font-mono text-sm text-gray-100',
        },
      }),
      TiptapImage.configure({
        HTMLAttributes: {
          class: 'rounded-md max-w-full',
        },
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: `h-[600px] overflow-y-auto p-4 focus:outline-none ${className}`,
      },
    },
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setContent(newContent);
      editorRef.current = editor;
    },
  });

  // Sync editor content with prop if it changes (e.g. after fetch)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', false);
    }
  }, [content, editor]);

  return (
    <div>
      {/* Tiptap Toolbar */}
      <div className="flex flex-wrap items-center gap-1 mb-2 border-b pb-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded ${editor?.isActive('bold') ? 'bg-gray-300' : ''}`}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded ${editor?.isActive('italic') ? 'bg-gray-300' : ''}`}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded ${editor?.isActive('strike') ? 'bg-gray-300' : ''}`}
          title="Strike"
        >
          <Strikethrough size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleCode().run()}
          className={`px-2 py-1 rounded ${editor?.isActive('code') ? 'bg-gray-300' : ''}`}
          title="Inline Code"
        >
          <Code size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}`}
          title="H1"
        >
          <Heading1 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
          title="H2"
        >
          <Heading2 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''}`}
          title="H3"
        >
          <Heading3 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded ${editor?.isActive('bulletList') ? 'bg-gray-300' : ''}`}
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded ${editor?.isActive('orderedList') ? 'bg-gray-300' : ''}`}
          title="Ordered List"
        >
          <ListOrdered size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 rounded ${editor?.isActive('blockquote') ? 'bg-gray-300' : ''}`}
          title="Blockquote"
        >
          <Quote size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (fileInputRef.current) fileInputRef.current.value = '';
            fileInputRef.current?.click();
          }}
          className="px-2 py-1 rounded"
          title="Insert Image"
        >
          <LucideImage size={18} />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const localUrl = URL.createObjectURL(file);
              setPendingImages(prev => ({ ...prev, [localUrl]: file }));
              editor?.chain().focus().setImage({ src: localUrl }).run();
            }}
          />
        </button>
        <button
          type="button"
          onClick={() => {
            const selection = editor?.state.selection;
            const hasSelection = selection && selection.from !== selection.to;
            if (hasSelection) {
              const url = window.prompt('Enter URL');
              if (url) editor?.chain().focus().setLink({ href: url }).run();
            } else {
              const text = window.prompt('Enter link text');
              if (!text) return;
              const url = window.prompt('Enter URL');
              if (url) editor?.chain().focus().insertContent(`<a href="${url}" target="_blank">${text}</a>`).run();
            }
          }}
          className={`px-2 py-1 rounded ${editor?.isActive('link') ? 'bg-gray-300' : ''}`}
          title="Insert Link"
        >
          <LucideLink size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          className="px-2 py-1 rounded"
          title="Undo"
        >
          <Undo2 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          className="px-2 py-1 rounded"
          title="Redo"
        >
          <Redo2 size={18} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
});

export { RichTextEditor };
