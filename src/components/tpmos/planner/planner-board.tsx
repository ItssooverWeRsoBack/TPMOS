"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EpicCard } from "./epic-card";
import { LineDivider } from "./line-divider";
import { computeLine, reorderEpics } from "@/lib/tpmos/domain/planner-line";
import type { EpicWithVotes } from "@/lib/tpmos/api/epics";
import type { EpicStatus } from "@/lib/tpmos/schemas/epic";

interface PlannerBoardProps {
  epics: EpicWithVotes[];
  availableWeeks: number;
  onReorder: (epicIds: string[]) => void;
  onVoteClick?: (epicId: string) => void;
  isReordering?: boolean;
  readOnly?: boolean;
}

export function PlannerBoard({
  epics,
  availableWeeks,
  onReorder,
  onVoteClick,
  isReordering,
  readOnly,
}: PlannerBoardProps) {
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Use local order during drag, otherwise use server order
  const orderedIds = localOrder ?? epics.map((e) => e.id);
  const orderedEpics = orderedIds
    .map((id) => epics.find((e) => e.id === id))
    .filter(Boolean) as EpicWithVotes[];

  // Compute line
  const lineResult = useMemo(
    () =>
      computeLine(
        orderedEpics.map((e) => ({ id: e.id, weeks: e.driCommittedWeeks })),
        availableWeeks
      ),
    [orderedEpics, availableWeeks]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setLocalOrder(null);
      return;
    }

    const oldIndex = orderedIds.indexOf(active.id as string);
    const newIndex = orderedIds.indexOf(over.id as string);
    const newOrder = reorderEpics(orderedIds, oldIndex, newIndex);

    setLocalOrder(newOrder);
    onReorder(newOrder);
    // Reset local order after server confirms (via query invalidation)
    setTimeout(() => setLocalOrder(null), 500);
  }

  if (epics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No epics yet. Create one to start planning.
      </div>
    );
  }

  return (
    <DndContext
      sensors={readOnly ? [] : sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {orderedEpics.map((epic, index) => {
            const belowLine = index >= lineResult.lineIndex;
            const showDivider = index === lineResult.lineIndex && lineResult.lineIndex > 0;

            return (
              <div key={epic.id}>
                {showDivider && (
                  <LineDivider
                    committedWeeks={lineResult.committedWeeks}
                    availableWeeks={availableWeeks}
                  />
                )}
                <SortableEpicCard
                  epic={epic}
                  belowLine={belowLine}
                  cumulativeWeeks={lineResult.cumulativeWeeks[index] ?? 0}
                  onVoteClick={onVoteClick ? () => onVoteClick(epic.id) : undefined}
                  disabled={readOnly}
                />
              </div>
            );
          })}

          {/* Show divider at the end if all epics are above the line */}
          {lineResult.lineIndex >= orderedEpics.length && orderedEpics.length > 0 && (
            <LineDivider
              committedWeeks={lineResult.committedWeeks}
              availableWeeks={availableWeeks}
            />
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableEpicCard({
  epic,
  belowLine,
  cumulativeWeeks,
  onVoteClick,
  disabled,
}: {
  epic: EpicWithVotes;
  belowLine: boolean;
  cumulativeWeeks: number;
  onVoteClick?: () => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: epic.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : undefined,
    scale: isDragging ? "1.02" : undefined,
    boxShadow: isDragging ? "0 8px 25px -5px rgba(0,0,0,0.3)" : undefined,
  };

  return (
    <EpicCard
      ref={setNodeRef}
      id={epic.id}
      title={epic.title}
      weeks={epic.driCommittedWeeks}
      status={epic.status as EpicStatus}
      wsjfScore={epic.wsjf.score}
      voteCount={epic.wsjf.voteCount}
      atRisk={epic.atRisk}
      carried={!!epic.carriedFromEpicId}
      belowLine={belowLine}
      cumulativeWeeks={cumulativeWeeks}
      dragHandleProps={{ ...attributes, ...listeners }}
      onVoteClick={onVoteClick}
      style={style}
    />
  );
}
