
import React, { useState } from 'react';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { HexagonTile, HexConnection } from '@/types';
import { X, Link2 } from 'lucide-react';

interface HexagonalCanvasProps {
    tiles: HexagonTile[];
    connections: HexConnection[];
    onTilesChange: (tiles: HexagonTile[]) => void;
    onConnectionsChange: (conns: HexConnection[]) => void;
    readOnly?: boolean;
}

// Draggable Hex Tile Component
function DraggableHex({ tile, readOnly }: { tile: HexagonTile, readOnly?: boolean }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: tile.id,
        data: tile,
        disabled: readOnly
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    // Hexagon Shape via Clip Path
    const hexStyle: React.CSSProperties = {
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        width: '120px',
        height: '104px', // Width * sqrt(3)/2
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '10px',
        position: 'absolute',
        top: tile.y,
        left: tile.x,
        cursor: readOnly ? 'default' : 'grab',
        zIndex: 10,
        ...style
    };

    const typeColors = {
        'Term': 'bg-blue-100 text-blue-900 border-blue-300',
        'Theme': 'bg-purple-100 text-purple-900 border-purple-300',
        'Character': 'bg-orange-100 text-orange-900 border-orange-300',
        'Evidence': 'bg-stone-100 text-stone-900 border-stone-300'
    };

    return (
        <div
            ref={setNodeRef}
            style={hexStyle}
            {...listeners}
            {...attributes}
            className={`${typeColors[tile.type]} shadow-md hover:scale-105 transition-transform text-xs font-bold select-none`}
        >
            {tile.content}
        </div>
    );
}

export function HexagonalCanvas({ tiles, connections, onTilesChange, onConnectionsChange, readOnly = false }: HexagonalCanvasProps) {
    const [connectMode, setConnectMode] = useState<{ active: boolean, startId: string | null }>({ active: false, startId: null });

    const handleDragEnd = (event: DragEndEvent) => {
        const { delta, active } = event;
        if (!delta) return;

        const tileId = active.id as string;
        const updatedTiles = tiles.map(t => {
            if (t.id === tileId) {
                return {
                    ...t,
                    x: t.x + delta.x,
                    y: t.y + delta.y
                };
            }
            return t;
        });

        onTilesChange(updatedTiles);
    };

    const handleTileClick = (id: string) => {
        if (readOnly) return;

        if (connectMode.startId === null) {
            setConnectMode({ active: true, startId: id });
        } else {
            if (connectMode.startId === id) {
                // Cancel
                setConnectMode({ active: false, startId: null });
            } else {
                // Create Connection
                const justification = prompt("How are these two concepts connected? (Justify your thinking)");
                if (justification) {
                    const newConn: HexConnection = {
                        id: Date.now().toString(),
                        tileId1: connectMode.startId,
                        tileId2: id,
                        justification
                    };
                    onConnectionsChange([...connections, newConn]);
                }
                setConnectMode({ active: false, startId: null });
            }
        }
    };

    const removeConnection = (id: string) => {
        if (readOnly) return;
        onConnectionsChange(connections.filter(c => c.id !== id));
    };

    return (
        <div className="relative w-full h-[500px] bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl overflow-hidden">

            {!readOnly && (
                <div className="absolute top-2 left-2 z-20 bg-white/80 p-2 rounded text-xs text-stone-500 pointer-events-none">
                    Drag connections to specific spots is not yet supported. Drag tiles first.
                    <br />Click two tiles to link them.
                </div>
            )}

            {/* Render Connections (SVG Lines) */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
                {connections.map(conn => {
                    const t1 = tiles.find(t => t.id === conn.tileId1);
                    const t2 = tiles.find(t => t.id === conn.tileId2);
                    if (!t1 || !t2) return null;

                    // Center points (approx)
                    const x1 = t1.x + 60;
                    const y1 = t1.y + 52;
                    const x2 = t2.x + 60;
                    const y2 = t2.y + 52;

                    return (
                        <g key={conn.id}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
                            <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r="10" fill="white" stroke="#94a3b8" />
                            <text x={(x1 + x2) / 2} y={(y1 + y2) / 2} dy="3" textAnchor="middle" fontSize="10">?</text>
                        </g>
                    );
                })}
            </svg>

            {/* Connection Labels (Interactive) */}
            {connections.map(conn => {
                const t1 = tiles.find(t => t.id === conn.tileId1);
                const t2 = tiles.find(t => t.id === conn.tileId2);
                if (!t1 || !t2) return null;
                const mx = (t1.x + 60 + t2.x + 60) / 2;
                const my = (t1.y + 52 + t2.y + 52) / 2;

                return (
                    <div
                        key={`label-${conn.id}`}
                        className="absolute z-20 bg-white shadow-lg p-2 rounded border border-stone-200 text-xs max-w-[150px]"
                        style={{ left: mx, top: my }}
                    >
                        <p className="italic mb-1">"{conn.justification}"</p>
                        {!readOnly && (
                            <button onClick={() => removeConnection(conn.id)} className="text-red-400 hover:text-red-600">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                );
            })}


            <DndContext onDragEnd={handleDragEnd}>
                {tiles.map(tile => (
                    <div key={tile.id} onClick={() => handleTileClick(tile.id)}>
                        <DraggableHex tile={tile} readOnly={readOnly} />
                        {connectMode.startId === tile.id && (
                            <div className="absolute z-30 w-4 h-4 bg-blue-500 rounded-full animate-ping"
                                style={{ top: tile.y + 40, left: tile.x + 50 }}></div>
                        )}
                    </div>
                ))}
            </DndContext>
        </div>
    );
}
