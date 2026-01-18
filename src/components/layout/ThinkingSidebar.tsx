
import React, { useState } from 'react';
import { BookOpen, PenTool, Lightbulb, HelpCircle, Users, MessageSquare, Send, X } from 'lucide-react';
import { AnnotationData, ReciprocalRole, ClassStreamPost } from '@/types';

interface ThinkingSidebarProps {
    isFocused?: boolean;
    isSpanish?: boolean;
    role?: ReciprocalRole;
    kwlData?: {
        knowledge: string;
        curiosity: string;
    } | null;
    onAnnotationClick?: (id: string) => void;
    annotations?: AnnotationData[];
    classStream?: ClassStreamPost[];
    onPostStream?: (content: string, tool: ClassStreamPost['activeTool']) => void;
    onLikePost?: (postId: string) => void;
    // New Props for Enhanced Stream
    currentUserId?: string;
    isTeacher?: boolean;
    onDeletePost?: (postId: string) => void;
    onEditPost?: (postId: string, newContent: string) => void;
    onReplyPost?: (postId: string, content: string) => void; // New reply handler
    // Customization for Heatmap
    customToolsTabLabel?: string;
    customToolsContent?: React.ReactNode;
}

// Simple translation dictionary
const LABELS = {
    en: {
        thinkingTools: "Thinking Tools",
        classStream: "Class Stream",
        activeSchema: "Active Schema",
        iKnow: "I Know:",
        iWonder: "I Wonder:",
        nothingSpecified: "Nothing specified.",
        journalEntries: "My Journal Entries",
        strategyTip: "Strategy Tip",
        tipContent: "Try to connect the author's argument to your own experience.",
        completeAirlock: "Complete the Airlock to populate this.",
        whatDoYouKnow: "What do you already know about this topic?",
        noPosts: "No discussion yet. Be the first to post!",
        postedBy: "posted by",
        at: "at"
    },
    es: {
        thinkingTools: "Herramientas de Pensamiento",
        classStream: "Flujo de Clase",
        activeSchema: "Esquema Activo",
        iKnow: "Yo Sé:",
        iWonder: "Me Pregunto:",
        nothingSpecified: "Nada especificado.",
        journalEntries: "Mis Entradas de Diario",
        strategyTip: "Consejo de Estrategia",
        tipContent: "Intenta conectar el argumento del autor con tu propia experiencia.",
        completeAirlock: "Completa el Airlock para llenar esto.",
        whatDoYouKnow: "¿Qué sabes ya sobre este tema?",
        noPosts: "No hay discusión todavía. ¡Sé el primero en publicar!",
        postedBy: "publicado por",
        at: "a las"
    }
}


export function ThinkingSidebar({
    isFocused, kwlData, annotations = [], onAnnotationClick, isSpanish = false, role, classStream = [],
    onPostStream, onLikePost,
    currentUserId, isTeacher, onDeletePost, onEditPost, onReplyPost,
    customToolsTabLabel, customToolsContent
}: ThinkingSidebarProps) {
    // Role Tool States
    const [questionDraft, setQuestionDraft] = useState('');
    const [clarifyTerm, setClarifyTerm] = useState('');
    const [summaryDraft, setSummaryDraft] = useState('');
    const [predictionDraft, setPredictionDraft] = useState('');

    const [activeTab, setActiveTab] = useState<'my-tools' | 'class-stream'>('my-tools');

    // Interaction States
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const t = isSpanish ? LABELS.es : LABELS.en;

    const roleColors = {
        'Questioner': 'text-orange-600 bg-orange-50 border-orange-200',
        'Clarifier': 'text-blue-600 bg-blue-50 border-blue-200',
        'Summarizer': 'text-green-600 bg-green-50 border-green-200',
        'Predictor': 'text-purple-600 bg-purple-50 border-purple-200',
    };

    const handlePost = (content: string, tool: ClassStreamPost['activeTool']) => {
        if (!content.trim()) return;
        onPostStream?.(content, tool);

        // Clear specific draft
        if (tool === 'Questioner') setQuestionDraft('');
        if (tool === 'Clarifier') setClarifyTerm('');
        if (tool === 'Summarizer') setSummaryDraft('');
        if (tool === 'Predictor') setPredictionDraft('');

        // Switch to stream to see it (optional, but good UX)
        setActiveTab('class-stream');
    };

    const handleLookup = () => {
        if (!clarifyTerm.trim()) return;
        window.open(`https://www.google.com/search?q=define+${encodeURIComponent(clarifyTerm)}`, '_blank');
    };

    const getRoleIcon = (r: string) => {
        switch (r) {
            case 'Questioner': return <HelpCircle size={14} />;
            case 'Clarifier': return <Lightbulb size={14} />;
            case 'Summarizer': return <PenTool size={14} />;
            case 'Predictor': return <BookOpen size={14} />;
            default: return <MessageSquare size={14} />;
        }
    };

    return (
        <div className={`flex flex-col h-full transition-opacity duration-500 ${isFocused ? 'opacity-80 hover:opacity-100' : 'opacity-100'}`}>

            {/* Tab Navigation */}
            <div className="flex mb-4 bg-stone-100 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('my-tools')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'my-tools' ? 'bg-white shadow-sm text-stone-900 border border-stone-200' : 'text-stone-500 hover:text-stone-700'
                        }`}
                >
                    <PenTool size={14} />
                    {customToolsTabLabel || t.thinkingTools}
                </button>
                <button
                    onClick={() => setActiveTab('class-stream')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all relative ${activeTab === 'class-stream' ? 'bg-white shadow-sm text-stone-900 border border-stone-200' : 'text-stone-500 hover:text-stone-700'
                        }`}
                >
                    <Users size={14} />
                    {t.classStream}
                    {classStream.length > 0 && (
                        <span className="absolute top-1 right-2 w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                    )}
                </button>
            </div>

            {/* MY TOOLS TAB */}
            {activeTab === 'my-tools' && (
                customToolsContent ? (
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                        {customToolsContent}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">

                        {/* Active Role Tool Card */}
                        {role ? (
                            <div className={`mb-2 p-4 rounded-lg border-l-4 shadow-sm bg-white ${roleColors[role].replace('bg-', 'border-').split(' ')[2]}`}>
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                    {getRoleIcon(role)}
                                    Your Task: {role}
                                </h3>

                                {role === 'Questioner' && (
                                    <div>
                                        <p className="text-xs text-stone-500 mb-2">Post a discussion question for the class.</p>
                                        <textarea
                                            value={questionDraft}
                                            onChange={(e) => setQuestionDraft(e.target.value)}
                                            className="w-full text-sm p-3 border border-stone-200 rounded font-serif mb-2 focus:ring-1 focus:ring-orange-200 outline-none resize-none"
                                            placeholder="Why did the author..."
                                            rows={3}
                                        />
                                        <button
                                            onClick={() => handlePost(questionDraft, 'Questioner')}
                                            disabled={!questionDraft.trim()}
                                            className="w-full text-xs bg-stone-900 text-white px-3 py-2 rounded-md font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <Send size={12} /> Post Question
                                        </button>
                                    </div>
                                )}

                                {role === 'Clarifier' && (
                                    <div>
                                        <p className="text-xs text-stone-500 mb-2">Share a clarified word or concept.</p>
                                        <div className="flex gap-2">
                                            <input
                                                value={clarifyTerm}
                                                onChange={(e) => setClarifyTerm(e.target.value)}
                                                className="w-full text-sm p-2 border border-stone-200 rounded font-serif focus:ring-1 focus:ring-blue-200 outline-none"
                                                placeholder="Definition of..."
                                            />
                                            <button
                                                onClick={() => handlePost(clarifyTerm, 'Clarifier')}
                                                disabled={!clarifyTerm.trim()}
                                                className="text-xs bg-stone-900 text-white px-3 py-1 rounded-md font-bold hover:bg-stone-700 transition-colors disabled:opacity-50"
                                            >
                                                Share
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {role === 'Summarizer' && (
                                    <div>
                                        <p className="text-xs text-stone-500 mb-2">Draft a running summary of the text so far.</p>
                                        <textarea
                                            value={summaryDraft}
                                            onChange={(e) => setSummaryDraft(e.target.value)}
                                            className="w-full text-sm p-3 border border-stone-200 rounded font-serif mb-2 focus:ring-1 focus:ring-green-200 outline-none resize-none"
                                            placeholder="First, the text explains..."
                                            rows={4}
                                        />
                                        <button
                                            onClick={() => handlePost(summaryDraft, 'Summarizer')}
                                            disabled={!summaryDraft.trim()}
                                            className="w-full text-xs bg-stone-900 text-white px-3 py-2 rounded-md font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <Send size={12} /> Share Summary
                                        </button>
                                    </div>
                                )}

                                {role === 'Predictor' && (
                                    <div>
                                        <p className="text-xs text-stone-500 mb-2">What do you think will happen next?</p>
                                        <textarea
                                            value={predictionDraft}
                                            onChange={(e) => setPredictionDraft(e.target.value)}
                                            className="w-full text-sm p-3 border border-stone-200 rounded font-serif mb-2 focus:ring-1 focus:ring-purple-200 outline-none resize-none"
                                            placeholder="I predict that..."
                                            rows={3}
                                        />
                                        <button
                                            onClick={() => handlePost(predictionDraft, 'Predictor')}
                                            disabled={!predictionDraft.trim()}
                                            className="w-full text-xs bg-stone-900 text-white px-3 py-2 rounded-md font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <Send size={12} /> Log Prediction
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 text-center mb-4">
                                <p className="text-xs text-stone-500">Pick a role in the Airlock to unlock specific tools.</p>
                            </div>
                        )}


                        {/* K-W-L Data display if present */}
                        {kwlData && (
                            <div className="bg-white border border-stone-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3 text-stone-700">
                                    <Lightbulb size={16} />
                                    <h3 className="font-serif font-bold text-sm">{t.activeSchema}</h3>
                                </div>

                                <div className="mb-4">
                                    <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide font-sans">{t.iKnow}</p>
                                    <p className="text-sm text-stone-800 font-serif italic border-l-2 border-stone-300 pl-3">
                                        {kwlData.knowledge || t.nothingSpecified}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide font-sans">{t.iWonder}</p>
                                    <p className="text-sm text-stone-800 font-serif italic border-l-2 border-stone-300 pl-3">
                                        {kwlData.curiosity || t.nothingSpecified}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Annotations List */}
                        {annotations.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide font-sans mb-2">{t.journalEntries}</h3>
                                {annotations.map((ann) => (
                                    <div
                                        key={ann.id}
                                        onClick={() => onAnnotationClick?.(ann.id)}
                                        className="bg-white border border-stone-200 rounded-lg p-3 hover:shadow-md transition-shadow group cursor-pointer hover:border-stone-400"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                                            ${ann.tag === "I'm confused" ? 'bg-orange-100 text-orange-700' : ''}
                                            ${ann.tag === 'How/Why Question' ? 'bg-purple-100 text-purple-700' : ''}
                                            ${ann.tag === 'Self-Connection' ? 'bg-blue-100 text-blue-700' : ''}
                                            ${ann.tag === 'World-Connection' ? 'bg-green-100 text-green-700' : ''}
                                        `}>
                                                {ann.tag}
                                            </span>
                                        </div>
                                        <p className="text-sm font-serif text-stone-800 mb-2 leading-snug">{ann.note}</p>
                                        <div className="text-xs text-stone-400 font-serif italic border-l-2 border-stone-200 pl-2 line-clamp-2 group-hover:line-clamp-none transition-all">
                                            &quot;{ann.text}&quot;
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            )}

            {/* CLASS STREAM TAB */}
            {activeTab === 'class-stream' && (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {classStream.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-400">
                                <MessageSquare size={24} />
                            </div>
                            <p className="text-stone-500 font-serif text-sm italic">{t.noPosts}</p>
                        </div>
                    ) : (
                        classStream.map((post) => (
                            <div key={post.id} className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm animate-in slide-in-from-bottom-2 group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${roleColors[post.activeTool]?.split(' ')[1] || 'bg-stone-100'} ${roleColors[post.activeTool]?.split(' ')[0] || 'text-stone-600'}`}>
                                            {getRoleIcon(post.activeTool)}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${roleColors[post.activeTool]?.split(' ')[0] || 'text-stone-500'}`}>
                                            {post.activeTool}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-stone-400">
                                            {post.timestamp?.seconds
                                                ? new Date(post.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : 'Just now'
                                            }
                                        </span>
                                        {((currentUserId === post.studentId) || isTeacher) && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {currentUserId === post.studentId && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingPostId(post.id);
                                                            setEditContent(post.content);
                                                        }}
                                                        className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-blue-500"
                                                        title="Edit"
                                                    >
                                                        <PenTool size={10} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onDeletePost?.(post.id)}
                                                    className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <Users size={10} className="rotate-45" /> {/* Using generic icon as 'X' not strictly imported but X is available */}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {editingPostId === post.id ? (
                                    <div className="mb-3">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full text-sm p-2 border border-blue-200 rounded focus:ring-1 focus:ring-blue-200 outline-none"
                                            rows={2}
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => setEditingPostId(null)}
                                                className="text-xs text-stone-500 hover:text-stone-700 font-bold"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onEditPost?.(post.id, editContent);
                                                    setEditingPostId(null);
                                                }}
                                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-bold"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm font-serif text-stone-800 leading-relaxed mb-3">
                                        {post.content}
                                    </p>
                                )}

                                {/* Replies Section */}
                                {post.replies && post.replies.length > 0 && (
                                    <div className="ml-4 mb-3 space-y-2 border-l-2 border-stone-100 pl-3">
                                        {post.replies.map((reply, ridx) => (
                                            <div key={ridx} className="text-xs">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span className="font-bold text-stone-600">{reply.authorName}</span>
                                                    <span className="text-[9px] text-stone-400">{new Date(reply.timestamp?.seconds * 1000 || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-stone-700">{reply.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                                    <span className="text-xs font-bold text-stone-500">
                                        {post.studentName}
                                    </span>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setReplyingToPostId(replyingToPostId === post.id ? null : post.id)}
                                            className="text-xs text-stone-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
                                        >
                                            <MessageSquare size={12} /> Reply
                                        </button>
                                        <button
                                            onClick={() => onLikePost?.(post.id)}
                                            className={`text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded-full ${(post.likes?.length || 0) > 0 ? 'text-red-500 bg-red-50' : 'text-stone-400 hover:text-red-500 hover:bg-stone-50'
                                                }`}
                                        >
                                            <span className="text-[10px]">❤️</span> {post.likes?.length || 0}
                                        </button>
                                    </div>
                                </div>

                                {replyingToPostId === post.id && (
                                    <div className="mt-3 flex gap-2 animate-in slide-in-from-top-1">
                                        <input
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="Write a reply..."
                                            className="flex-1 text-xs p-2 border border-stone-200 rounded outline-none focus:border-blue-300"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (replyContent.trim()) {
                                                        onReplyPost?.(post.id, replyContent);
                                                        setReplyContent('');
                                                        setReplyingToPostId(null);
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                if (replyContent.trim()) {
                                                    onReplyPost?.(post.id, replyContent);
                                                    setReplyContent('');
                                                    setReplyingToPostId(null);
                                                }
                                            }}
                                            disabled={!replyContent.trim()}
                                            className="text-xs bg-stone-900 text-white px-2 rounded font-bold hover:bg-stone-700"
                                        >
                                            Send
                                        </button>
                                        <button
                                            onClick={() => {
                                                setReplyingToPostId(null);
                                                setReplyContent('');
                                            }}
                                            className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded"
                                            title="Cancel"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
