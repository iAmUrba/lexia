import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Table as TableIcon, Undo, Redo, FileSignature, Scale, BookOpen } from 'lucide-react'
import { useEffect } from 'react'

interface LexiaEditorProps {
  initialContent: any;
  onChange: (content: any) => void;
  readOnly?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null

  const ToggleButton = ({ isActive, onClick, children }: any) => (
    <button
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${isActive ? 'bg-slate-700 text-slate-200' : 'text-slate-400'}`}
      type="button"
    >
      {children}
    </button>
  );

  return (
    <div className="border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-md p-2 flex flex-wrap items-center gap-1 sticky top-0 z-20 rounded-t-2xl shadow-sm">
      <div className="flex items-center gap-1 border-r border-slate-700/50 pr-2 mr-1">
        <ToggleButton onClick={() => editor.chain().focus().undo().run()} isActive={false}>
          <Undo size={16} />
        </ToggleButton>
        <ToggleButton onClick={() => editor.chain().focus().redo().run()} isActive={false}>
          <Redo size={16} />
        </ToggleButton>
      </div>

      <div className="flex items-center gap-1 border-r border-slate-700/50 pr-2 mr-1">
        <select 
          className="text-sm bg-slate-800 backdrop-blur-sm border border-slate-700 text-slate-300 font-bold outline-none cursor-pointer hover:bg-slate-700 transition-colors p-1.5 rounded-lg shadow-sm"
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: parseInt(val) }).run();
          }}
          value={editor.isActive('heading', { level: 1 }) ? '1' : editor.isActive('heading', { level: 2 }) ? '2' : 'p'}
        >
          <option value="p">Normal</option>
          <option value="1">Título</option>
          <option value="2">Subtítulo</option>
        </select>
      </div>

      <div className="flex items-center gap-1 border-r border-slate-700/50 pr-2 mr-1">
        <ToggleButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
          <Bold size={16} />
        </ToggleButton>
        <ToggleButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
          <Italic size={16} />
        </ToggleButton>
        <ToggleButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}>
          <UnderlineIcon size={16} />
        </ToggleButton>
      </div>

      <div className="flex items-center gap-1 border-r border-slate-700/50 pr-2 mr-1">
        <ToggleButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
          <List size={16} />
        </ToggleButton>
        <ToggleButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
          <ListOrdered size={16} />
        </ToggleButton>
      </div>
      
      <div className="flex items-center gap-1 border-r border-slate-700/50 pr-2 mr-1">
        <ToggleButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} isActive={editor.isActive('table')}>
          <TableIcon size={16} />
        </ToggleButton>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <button type="button" className="flex items-center gap-1.5 p-2 px-3 rounded-xl hover:bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-wider transition-all hover:shadow-sm border border-transparent hover:border-slate-700/50">
          <BookOpen size={14} className="text-indigo-500" /> Jurisprudencia
        </button>
        <button type="button" className="flex items-center gap-1.5 p-2 px-3 rounded-xl hover:bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-wider transition-all hover:shadow-sm border border-transparent hover:border-slate-700/50">
          <Scale size={14} className="text-amber-500" /> Cita
        </button>
        <button type="button" className="flex items-center gap-1.5 p-2 px-3 rounded-xl hover:bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-wider transition-all hover:shadow-sm border border-transparent hover:border-slate-700/50">
          <FileSignature size={14} className="text-emerald-500" /> Firma
        </button>
      </div>
    </div>
  )
}

export default function LexiaEditor({ initialContent, onChange, readOnly = false }: LexiaEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: 'Redacta el documento jurídico aquí...' })
    ],
    content: initialContent || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none text-black mx-auto',
        style: 'font-family: "Century Gothic", CenturyGothic, AppleGothic, sans-serif; padding: 0; margin: 0; box-sizing: border-box; text-align: justify; font-size: 12pt; line-height: 1.5; min-height: 100%;',
      },
    },
  })

  // Update content if initialContent changes drastically (e.g. loading a different document)
  useEffect(() => {
    if (editor && initialContent && Object.keys(initialContent).length > 0) {
       // Only replace if editor is basically empty to avoid overwriting user edits on fast renders
       if (editor.getText().trim() === '') {
         editor.commands.setContent(initialContent);
       }
    }
  }, [editor, initialContent]);

  return (
    <div className={`flex flex-col text-slate-900 h-full ${readOnly ? '' : 'rounded-2xl overflow-hidden'}`}>
      {!readOnly && <MenuBar editor={editor} />}
      <div className="flex-1 overflow-y-auto bg-transparent p-8 flex justify-center custom-scrollbar pb-32">
        
        {/* A4 Paper */}
        <div className="bg-white shadow-lg relative" style={{ width: '210mm', minHeight: '297mm', fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif' }}>
          
          {/* Header */}
          <div className="absolute top-0 left-0 w-full pt-12 text-center text-slate-800" style={{ fontSize: '11pt' }}>
            <img src="/escudo.png" alt="Escudo Rama Judicial" className="mx-auto h-24 mb-4 object-contain" />
            <div className="font-bold tracking-wide">JUZGADO 3° PENAL DEL CIRCUITO ESPECIALIZADO</div>
            <div className="font-bold tracking-wide">CON FUNCIONES DE CONOCIMIENTO</div>
            <div className="font-bold tracking-wide">POPAYÁN - CAUCA</div>
          </div>
          
          {/* Editor Content Area */}
          <div className="relative z-10 w-full h-full" style={{ paddingTop: '5.5cm', paddingBottom: '3.5cm', paddingLeft: '3cm', paddingRight: '2cm' }}>
            <EditorContent editor={editor} className="h-full w-full" />
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 w-full pb-8 text-center text-slate-600" style={{ fontSize: '10pt' }}>
            <div>JCABj03ctopespop@cendoj.ramajudicial.gov.co</div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
