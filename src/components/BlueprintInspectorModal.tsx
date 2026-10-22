/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Interactive 2D Spatial Blueprint Map & Original Architect PDF Sheet Inspector
 * for Mr. Kapila Liyanage's Residence at Yatiyana.
 */

import React, { useState } from 'react';
import {
  ARCHITECTURAL_ROOMS,
  DoorSpec,
  GRID_X_FT,
  GRID_Z_FT,
  PlacedPropInstance,
  RoomSpec,
} from '../architecture/blueprintData';

interface BlueprintInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerGx: number;
  playerGz: number;
  playerGy: number;
  playerYaw: number;
  doors: DoorSpec[];
  placedProps: PlacedPropInstance[];
  onTeleportToRoom: (room: RoomSpec) => void;
  onToggleDoor: (doorId: string) => void;
}

export const BlueprintInspectorModal: React.FC<BlueprintInspectorModalProps> = ({
  isOpen,
  onClose,
  playerGx,
  playerGz,
  playerGy,
  playerYaw,
  doors,
  placedProps,
  onTeleportToRoom,
  onToggleDoor,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<'ground' | 'first'>(
    playerGy >= 7.0 ? 'first' : 'ground'
  );
  const [viewTab, setViewTab] = useState<'interactive_cad' | 'architect_pdf'>('interactive_cad');

  if (!isOpen) return null;

  const visibleRooms = ARCHITECTURAL_ROOMS.filter((r) =>
    selectedFloor === 'first'
      ? r.floor === 'first'
      : r.floor === 'ground' || r.id === 'gf_car_porch'
  );

  // SVG Coordinate transform: gx (-6..45) -> x, gz (-10..48) -> y (North is Up)
  const mapX = (gx: number) => 70 + (gx + 6) * 11.2;
  const mapY = (gz: number) => 530 - (gz + 8) * 9.2;

  const pdfUrl =
    selectedFloor === 'ground'
      ? '/assets/aistudio/REVISED_GROUND_FLOOR_-MR.KAPILA_-A3___6016b5ed.pdf'
      : '/assets/aistudio/REVISED_FIRST_FLOOR_-OPTION_03_-MR.KAPILA_-A3__06115abb.pdf';

  return (
    <div
      role="dialog"
      aria-label="Architectural Blueprint & Spatial Mapping Inspector"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto"
    >
      <div className="w-full max-w-6xl rounded-xl border border-amber-500/25 bg-[#0f141c] text-[#f4f1ea] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4 bg-[#141b26]">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Architectural Spatial Blueprint — Mr. Kapila Liyanage Residence (Yatiyana)
            </h2>
            <p className="text-xs text-slate-400">
              Archt. Nelum Idamgedara AIA, SL (Studio Red) · Scale 8 Feet to an Inch · Total Area 2,262.45 sq.ft (210.18 sq.m)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Floor Switcher */}
            <div className="flex items-center rounded-lg bg-[#0b0f16] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedFloor('ground')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedFloor === 'ground'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Ground Floor (1,157 sq.ft)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFloor('first')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedFloor === 'first'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                First Floor Option 03 (1,105.45 sq.ft)
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center rounded-lg bg-[#0b0f16] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setViewTab('interactive_cad')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  viewTab === 'interactive_cad'
                    ? 'bg-slate-800 text-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Interactive CAD Grid
              </button>
              <button
                type="button"
                onClick={() => setViewTab('architect_pdf')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  viewTab === 'architect_pdf'
                    ? 'bg-slate-800 text-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Original Architect Sheet (PDF)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Blueprint Inspector"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              Close [Esc]
            </button>
          </div>
        </div>

        {/* Body */}
        {viewTab === 'interactive_cad' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
            {/* Left 8 Cols: Interactive SVG CAD Plan */}
            <div className="lg:col-span-8 bg-[#0a0e14] p-4 flex flex-col items-center justify-center relative overflow-auto border-b lg:border-b-0 lg:border-r border-white/10">
              <svg
                viewBox="0 0 680 580"
                className="w-full h-auto max-h-[68vh] select-none"
                role="img"
                aria-label={`Interactive ${selectedFloor} floor architectural CAD map`}
              >
                {/* Structural Grid Lines 2..8 (Vertical) */}
                {Object.entries(GRID_X_FT).map(([label, gx]) => {
                  const x = mapX(gx);
                  return (
                    <g key={`gx-${label}`}>
                      <line
                        x1={x}
                        y1={35}
                        x2={x}
                        y2={545}
                        stroke="rgba(217, 155, 78, 0.22)"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <circle
                        cx={x}
                        cy={558}
                        r={10}
                        fill="#141b26"
                        stroke="rgba(217, 155, 78, 0.65)"
                        strokeWidth="1.2"
                      />
                      <text
                        x={x}
                        y={562}
                        textAnchor="middle"
                        fill="#f4f1ea"
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Structural Grid Lines A..E (Horizontal) */}
                {Object.entries(GRID_Z_FT).map(([label, gz]) => {
                  const y = mapY(gz);
                  return (
                    <g key={`gz-${label}`}>
                      <line
                        x1={40}
                        y1={y}
                        x2={625}
                        y2={y}
                        stroke="rgba(217, 155, 78, 0.22)"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <circle
                        cx={642}
                        cy={y}
                        r={10}
                        fill="#141b26"
                        stroke="rgba(217, 155, 78, 0.65)"
                        strokeWidth="1.2"
                      />
                      <text
                        x={642}
                        y={y + 3.5}
                        textAnchor="middle"
                        fill="#f4f1ea"
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* First Floor VOID Indicator */}
                {selectedFloor === 'first' && (
                  <g>
                    <rect
                      x={mapX(28)}
                      y={mapY(30.75)}
                      width={mapX(35.5) - mapX(28)}
                      height={mapY(18.75) - mapY(30.75)}
                      fill="rgba(15, 23, 42, 0.85)"
                      stroke="#f59e0b"
                      strokeDasharray="5 3"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={mapX(28)}
                      y1={mapY(30.75)}
                      x2={mapX(35.5)}
                      y2={mapY(18.75)}
                      stroke="rgba(245, 158, 11, 0.4)"
                      strokeWidth="1"
                    />
                    <line
                      x1={mapX(35.5)}
                      y1={mapY(30.75)}
                      x2={mapX(28)}
                      y2={mapY(18.75)}
                      stroke="rgba(245, 158, 11, 0.4)"
                      strokeWidth="1"
                    />
                    <text
                      x={(mapX(28) + mapX(35.5)) / 2}
                      y={(mapY(18.75) + mapY(30.75)) / 2}
                      textAnchor="middle"
                      fill="#fbbf24"
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      VOID TO LIVING
                    </text>
                  </g>
                )}

                {/* Rooms */}
                {visibleRooms.map((room) => {
                  const rx = mapX(room.gxMin);
                  const ry = mapY(room.gzMax);
                  const rw = mapX(room.gxMax) - mapX(room.gxMin);
                  const rh = mapY(room.gzMin) - mapY(room.gzMax);
                  const shortCadName: Record<string, string> = {
                    gf_verandah: 'VERANDAH',
                    gf_tv_lobby: 'TV LOBBY',
                    gf_bedroom_01: 'BED ROOM 01',
                    gf_stair_lobby: 'STAIR & UTILITY',
                    gf_bathroom: 'BATHROOM',
                    gf_dining: 'DINING AREA',
                    gf_living: 'LIVING AREA',
                    gf_kitchen: 'KITCHEN',
                    gf_store: 'STORE',
                    gf_bedroom_02: 'BED ROOM 02',
                    gf_car_porch: 'CAR PORCH',
                    ff_tv_lobby: 'UPPER TV LOBBY',
                    ff_terrace: 'TERRACE',
                    ff_bedroom_03: 'BED ROOM 03',
                    ff_bedroom_04: 'BED ROOM 04',
                    ff_bathroom_common: 'BATHROOM',
                    ff_upper_living: 'UPPER LIVING',
                    ff_master_bedroom: 'MASTER BED ROOM',
                  };
                  const displayTitle = shortCadName[room.id] || room.name.split(' (')[0];
                  const isCompactBox = rh < 50 || rw < 95;
                  return (
                    <g
                      key={room.id}
                      onClick={() => {
                        onTeleportToRoom(room);
                        onClose();
                      }}
                      className="cursor-pointer group"
                    >
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        fill="rgba(30, 41, 59, 0.65)"
                        stroke="#cbd5e1"
                        strokeWidth="1.8"
                        className="group-hover:fill-amber-500/20 transition-colors"
                      />
                      <text
                        x={rx + rw / 2}
                        y={ry + rh / 2 - (isCompactBox ? 3 : 6)}
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize={isCompactBox ? '8.5' : '10'}
                        fontWeight="600"
                      >
                        {displayTitle}
                      </text>
                      <text
                        x={rx + rw / 2}
                        y={ry + rh / 2 + (isCompactBox ? 7 : 8)}
                        textAnchor="middle"
                        fill="#fbbf24"
                        fontSize={isCompactBox ? '7.5' : '8.5'}
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {isCompactBox
                          ? room.levelLabel.replace(' LEVEL', '')
                          : `${room.dimensionsLabel.split(' ')[0]} · ${room.levelLabel.replace(' LEVEL', '')}`}
                      </text>
                    </g>
                  );
                })}

                {/* Interactive Doors on Active Floor */}
                {doors
                  .filter((d) => d.floor === selectedFloor)
                  .map((d) => {
                    const dx = mapX(d.gx);
                    const dy = mapY(d.gz);
                    return (
                      <g
                        key={d.id}
                        onClick={() => onToggleDoor(d.id)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={dx}
                          cy={dy}
                          r={6}
                          fill={d.isOpen ? '#10b981' : '#f59e0b'}
                          stroke="#0f172a"
                          strokeWidth="1.5"
                        />
                        <text
                          x={dx + 8}
                          y={dy + 3}
                          fill="#cbd5e1"
                          fontSize="8"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {d.code}
                        </text>
                      </g>
                    );
                  })}

                {/* Placed Physics Props */}
                {placedProps
                  .filter((p) => (selectedFloor === 'first' ? p.gy >= 7 : p.gy < 7))
                  .map((p) => (
                    <circle
                      key={p.id}
                      cx={mapX(p.gx)}
                      cy={mapY(p.gz)}
                      r={4.5}
                      fill="#38bdf8"
                      stroke="#0f172a"
                      strokeWidth="1.2"
                    >
                      <title>{p.name}</title>
                    </circle>
                  ))}

                {/* Live Player Position & Heading Cone */}
                <g transform={`translate(${mapX(playerGx)}, ${mapY(playerGz)})`}>
                  <circle r={7} fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                  <line
                    x1={0}
                    y1={0}
                    x2={-Math.sin(playerYaw) * 18}
                    y2={-Math.cos(playerYaw) * 18}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                </g>
              </svg>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span>Click any room on the CAD map to teleport directly inside</span>
                <span aria-hidden="true">·</span>
                <span>Click any door node (D1/D2/D3/DW2) to toggle open/closed</span>
              </div>
            </div>

            {/* Right 4 Cols: Architectural Room Schedule & Instant Teleport */}
            <div className="lg:col-span-4 p-5 overflow-y-auto space-y-4 bg-[#0f141c]">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {selectedFloor === 'ground'
                    ? 'Ground Floor Spatial Schedule'
                    : 'First Floor (Option 03) Spatial Schedule'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select any architectural zone to move there immediately.
                </p>
              </div>

              <div className="space-y-2">
                {visibleRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      onTeleportToRoom(room);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-lg border border-white/10 bg-[#151c28] hover:border-amber-500/50 hover:bg-[#1a2332] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">
                        {room.code} · {room.name}
                      </span>
                      <span className="text-[11px] font-mono text-amber-300 tabular-nums shrink-0">
                        {room.levelLabel}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-slate-400 tabular-nums">
                      Dimensions: {room.dimensionsLabel} · {room.areaSqFt} sq.ft
                    </div>
                    <p className="mt-1 text-xs text-slate-300 line-clamp-2">
                      {room.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-[#0a0e14] p-4 flex flex-col overflow-hidden min-h-[65vh]">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
              <span>
                Viewing Official Architectural Sheet:{' '}
                <strong className="text-amber-300">
                  {selectedFloor === 'ground'
                    ? 'REVISED GROUND FLOOR - MR. KAPILA (A3)'
                    : 'REVISED FIRST FLOOR - OPTION 03 - MR. KAPILA (A3)'}
                </strong>
              </span>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline font-medium"
              >
                Open Full Sheet PDF
              </a>
            </div>
            <iframe
              src={pdfUrl}
              title={`Architectural Sheet ${selectedFloor}`}
              className="w-full flex-1 rounded-lg border border-white/10 bg-white min-h-[58vh]"
            />
          </div>
        )}
      </div>
    </div>
  );
};
