"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { TimeBlockCard } from "./time-block-card";
import { BlockEditor } from "./block-editor";
import { DateScrubber } from "./date-scrubber";
import { TaskDrawer } from "./task-drawer";
import { TaskPill } from "./task-pill";
import { DroppableSlot } from "./droppable-slot";
import { GCalEventChip, GCalAllDayBanner } from "./gcal-event-chip";
import { GCalSettings } from "./gcal-settings";
import type { TimeBlock, Task, GCalEvent } from "@/types";

const SLOT_HEIGHT = 60;
const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2;

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function slotToTime(slotIndex: number): string {
  const hour = START_HOUR + Math.floor(slotIndex / 2);
  const minute = (slotIndex % 2) * 30;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function getNowOffset(): number | null {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const originMin = START_HOUR * 60;
  const endMin = END_HOUR * 60;
  if (mins < originMin || mins > endMin) return null;
  return ((mins - originMin) / 30) * SLOT_HEIGHT;
}

interface DayViewProps {
  initialBlocks: TimeBlock[];
  initialTasks: Task[];
  initialGCalEvents?: GCalEvent[];
}

export function DayView({ initialBlocks, initialTasks, initialGCalEvents = [] }: DayViewProps) {
  // Initialize as "" so server and client agree (avoids UTC vs local timezone hydration mismatch).
  // useEffect below sets it to the correct local date after mount.
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [blocks, setBlocks] = useState<TimeBlock[]>(initialBlocks);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [gcalEvents, setGcalEvents] = useState<GCalEvent[]>(initialGCalEvents);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [confirmingDeleteBlock, setConfirmingDeleteBlock] = useState<TimeBlock | null>(null);
  const [showGcalSettings, setShowGcalSettings] = useState(false);
  const [nowOffset, setNowOffset] = useState<number | null>(getNowOffset);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didScrollRef = useRef(false);

  // Set local date after mount — never during SSR — so server/client always agree on ""
  useEffect(() => {
    setSelectedDate(getToday());
    setMounted(true);
  }, []);

  const isToday = selectedDate === getToday();

  // Separate scheduled vs unscheduled tasks
  const { scheduledMap, unscheduledTasks } = useMemo(() => {
    const map = new Map<string, Task>();
    const unscheduled: Task[] = [];
    for (const t of tasks) {
      if (t.timeBlockId) {
        map.set(t.timeBlockId, t);
      } else if (!t.isDone) {
        unscheduled.push(t);
      }
    }
    return { scheduledMap: map, unscheduledTasks: unscheduled };
  }, [tasks]);

  // Auto-scroll to current time on mount (today only)
  useEffect(() => {
    if (!didScrollRef.current && scrollRef.current) {
      didScrollRef.current = true;
      const offset = isToday ? getNowOffset() : null;
      const scrollTo = offset != null ? Math.max(0, offset - 200) : SLOT_HEIGHT * 2; // default to 8AM
      scrollRef.current.scrollTop = scrollTo;
    }
  }, [isToday]);

  // Update "now" line every 60s
  useEffect(() => {
    if (!isToday) {
      setNowOffset(null);
      return;
    }
    setNowOffset(getNowOffset());
    const interval = setInterval(() => setNowOffset(getNowOffset()), 60_000);
    return () => clearInterval(interval);
  }, [isToday]);

  // Fetch data when date changes
  useEffect(() => {
    if (!selectedDate) return; // not mounted yet
    let cancelled = false;
    async function fetchData() {
      try {
        const [blocksRes, tasksRes] = await Promise.all([
          fetch(`/api/time-blocks?date=${selectedDate}`),
          fetch(`/api/tasks?date=${selectedDate}`),
        ]);
        if (cancelled) return;
        const newBlocks = await blocksRes.json();
        const newTasks = await tasksRes.json();
        setBlocks(newBlocks);
        setTasks(newTasks);
      } catch {
        // silently fail, keep current state
      }
      // Fetch gcal events separately so failures don't block the rest
      try {
        const gcalRes = await fetch(`/api/google/events?date=${selectedDate}`);
        if (cancelled) return;
        const events = await gcalRes.json();
        setGcalEvents(events);
      } catch {
        setGcalEvents([]);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [selectedDate]);

  // Refetch gcal events when connection changes
  const handleGcalConnectionChange = useCallback(async () => {
    try {
      const res = await fetch(`/api/google/events?date=${selectedDate}`);
      const events = await res.json();
      setGcalEvents(events);
    } catch {
      setGcalEvents([]);
    }
  }, [selectedDate]);

  // Check if a slot overlaps existing blocks
  const isSlotOccupied = useCallback(
    (startTime: string) => {
      const startMin = timeToMinutes(startTime);
      const endMin = startMin + 30;
      return blocks.some((b) => {
        const bs = timeToMinutes(b.startTime);
        const be = timeToMinutes(b.endTime);
        return startMin < be && endMin > bs;
      });
    },
    [blocks]
  );

  // Tap empty slot to create a block
  const handleGridClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("[data-block]")) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top + (scrollRef.current?.scrollTop || 0);
      const slotIndex = Math.floor(y / SLOT_HEIGHT);
      if (slotIndex < 0 || slotIndex >= TOTAL_SLOTS) return;

      const startTime = slotToTime(slotIndex);
      const endTime = addMinutes(startTime, 30);

      if (isSlotOccupied(startTime)) return;

      // Optimistic
      const tempId = crypto.randomUUID();
      const tempBlock: TimeBlock = {
        id: tempId,
        date: selectedDate,
        startTime,
        endTime,
        label: null,
        color: null,
        createdAt: new Date(),
      };
      setBlocks((prev) => [...prev, tempBlock]);

      try {
        const res = await fetch("/api/time-blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedDate, startTime, endTime }),
        });
        const created = await res.json();
        setBlocks((prev) => prev.map((b) => (b.id === tempId ? created : b)));
      } catch {
        setBlocks((prev) => prev.filter((b) => b.id !== tempId));
      }
    },
    [selectedDate, isSlotOccupied]
  );

  // Block editor handlers
  const handleUpdateBlock = useCallback(
    async (blockId: string, updates: Partial<TimeBlock>) => {
      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
      );
      try {
        await fetch(`/api/time-blocks/${blockId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      } catch {
        // refetch on error
        const res = await fetch(`/api/time-blocks?date=${selectedDate}`);
        setBlocks(await res.json());
      }
      setEditingBlock(null);
    },
    [selectedDate]
  );

  const handleDeleteBlock = useCallback(
    async (blockId: string) => {
      const prev = blocks;
      setBlocks((b) => b.filter((x) => x.id !== blockId));
      // Unlink any task that was on this block
      setTasks((prev) =>
        prev.map((t) => (t.timeBlockId === blockId ? { ...t, timeBlockId: null } : t))
      );
      setEditingBlock(null);
      try {
        await fetch(`/api/time-blocks/${blockId}`, { method: "DELETE" });
      } catch {
        setBlocks(prev);
      }
    },
    [blocks]
  );

  const handleLongPress = useCallback((block: TimeBlock) => {
    setConfirmingDeleteBlock(block);
  }, []);

  const handleUnlinkTask = useCallback(
    async (taskId: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, timeBlockId: null } : t))
      );
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeBlockId: null }),
        });
      } catch {
        // refetch
        const res = await fetch(`/api/tasks?date=${selectedDate}`);
        setTasks(await res.json());
      }
    },
    [selectedDate]
  );

  // Tap unscheduled task → schedule to next available slot
  const handleTaskTap = useCallback(
    async (task: Task) => {
      // Find next available 30-min slot
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Start searching from current time (rounded up to next 30-min) if today,
      // otherwise from 9 AM
      let searchStart: number;
      if (isToday) {
        searchStart = Math.ceil(currentMinutes / 30) * 30;
      } else {
        searchStart = 9 * 60; // 9 AM
      }

      const startMin = START_HOUR * 60;
      const endMin = END_HOUR * 60;

      // Clamp to calendar bounds
      if (searchStart < startMin) searchStart = startMin;

      let foundSlot: string | null = null;
      for (let min = searchStart; min < endMin; min += 30) {
        const time = `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
        if (!isSlotOccupied(time)) {
          foundSlot = time;
          break;
        }
      }

      // If no slot found after current time, try from the beginning of the day
      if (!foundSlot) {
        for (let min = startMin; min < searchStart; min += 30) {
          const time = `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
          if (!isSlotOccupied(time)) {
            foundSlot = time;
            break;
          }
        }
      }

      if (!foundSlot) return; // No available slots

      const endTime = addMinutes(foundSlot, 30);

      // Optimistically create block + assign task
      const tempBlockId = crypto.randomUUID();
      const tempBlock: TimeBlock = {
        id: tempBlockId,
        date: selectedDate,
        startTime: foundSlot,
        endTime,
        label: null,
        color: null,
        createdAt: new Date(),
      };
      setBlocks((prev) => [...prev, tempBlock]);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, timeBlockId: tempBlockId } : t))
      );

      // Scroll to the new block
      if (scrollRef.current) {
        const slotMinutes = timeToMinutes(foundSlot);
        const offset = ((slotMinutes - START_HOUR * 60) / 30) * SLOT_HEIGHT;
        scrollRef.current.scrollTo({
          top: Math.max(0, offset - 100),
          behavior: "smooth",
        });
      }

      try {
        const blockRes = await fetch("/api/time-blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedDate, startTime: foundSlot, endTime }),
        });
        const createdBlock = await blockRes.json();
        setBlocks((prev) =>
          prev.map((b) => (b.id === tempBlockId ? createdBlock : b))
        );
        await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeBlockId: createdBlock.id }),
        });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, timeBlockId: createdBlock.id } : t
          )
        );
      } catch {
        // Revert on error
        setBlocks((prev) => prev.filter((b) => b.id !== tempBlockId));
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, timeBlockId: null } : t))
        );
      }
    },
    [selectedDate, isToday, isSlotOccupied]
  );

  // dnd-kit sensors
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { distance: 8 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveTaskId(event.active.id as string);
    },
    []
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveTaskId(null);
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const overId = over.id as string;

      if (overId.startsWith("slot-")) {
        // Dropped on empty slot — create block + assign task
        const startTime = overId.replace("slot-", "");
        if (isSlotOccupied(startTime)) return;
        const endTime = addMinutes(startTime, 30);

        // Create time block
        const tempBlockId = crypto.randomUUID();
        const tempBlock: TimeBlock = {
          id: tempBlockId,
          date: selectedDate,
          startTime,
          endTime,
          label: null,
          color: null,
          createdAt: new Date(),
        };
        setBlocks((prev) => [...prev, tempBlock]);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, timeBlockId: tempBlockId } : t))
        );

        try {
          const blockRes = await fetch("/api/time-blocks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: selectedDate, startTime, endTime }),
          });
          const createdBlock = await blockRes.json();
          setBlocks((prev) =>
            prev.map((b) => (b.id === tempBlockId ? createdBlock : b))
          );
          // Assign task to the real block
          await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timeBlockId: createdBlock.id }),
          });
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, timeBlockId: createdBlock.id } : t
            )
          );
        } catch {
          // Revert
          setBlocks((prev) => prev.filter((b) => b.id !== tempBlockId));
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, timeBlockId: null } : t))
          );
        }
      } else if (overId.startsWith("block-")) {
        // Dropped on existing block
        const blockId = overId.replace("block-", "");
        // Check if block already has a task
        if (scheduledMap.has(blockId)) return;

        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, timeBlockId: blockId } : t))
        );
        try {
          await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timeBlockId: blockId }),
          });
        } catch {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, timeBlockId: null } : t))
          );
        }
      }
    },
    [selectedDate, isSlotOccupied, scheduledMap]
  );

  const activeTask = activeTaskId
    ? tasks.find((t) => t.id === activeTaskId) ?? null
    : null;

  // Split gcal events into all-day and timed
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay: GCalEvent[] = [];
    const timed: GCalEvent[] = [];
    for (const e of gcalEvents) {
      if (e.isAllDay) allDay.push(e);
      else timed.push(e);
    }
    return { allDayEvents: allDay, timedEvents: timed };
  }, [gcalEvents]);

  // Generate slot data
  const slots = useMemo(() => {
    return Array.from({ length: TOTAL_SLOTS }, (_, i) => {
      const time = slotToTime(i);
      const hour = START_HOUR + Math.floor(i / 2);
      const isHour = i % 2 === 0;
      return { index: i, time, hour, isHour };
    });
  }, []);

  // Don't render until mounted — avoids SSR/client date mismatch
  if (!mounted) return null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col fixed inset-0 top-[env(safe-area-inset-top)] bottom-[calc(50px+env(safe-area-inset-bottom))] px-5 pt-2 pb-2">
        <DateScrubber
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onSettingsTap={() => setShowGcalSettings(true)}
        />

        {/* Scrollable grid */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-border bg-surface"
        >
          {/* All-day Google Calendar events */}
          <GCalAllDayBanner events={allDayEvents} />

          <div
            className="relative"
            style={{ height: TOTAL_SLOTS * SLOT_HEIGHT }}
            onClick={handleGridClick}
          >
            {/* Slot rows with time labels */}
            {slots.map((slot) => (
              <DroppableSlot
                key={slot.time}
                id={`slot-${slot.time}`}
                isOccupied={isSlotOccupied(slot.time)}
              >
                <div
                  className="absolute left-0 right-0 flex"
                  style={{ top: slot.index * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                >
                  {/* Hour label */}
                  <div className="w-[48px] flex-shrink-0 pr-2 flex items-start justify-end pt-[-2px]">
                    {slot.isHour && (
                      <span className="text-[11px] font-mono text-text-muted leading-none -translate-y-[5px]">
                        {formatHour(slot.hour)}
                      </span>
                    )}
                  </div>
                  {/* Grid line */}
                  <div
                    className={`flex-1 border-t ${
                      slot.isHour ? "border-border" : "border-border/40 border-dashed"
                    }`}
                  />
                </div>
              </DroppableSlot>
            ))}

            {/* Google Calendar events layer (behind time blocks) */}
            {timedEvents.length > 0 && (
              <div className="absolute top-0 left-[48px] right-0 bottom-0 pointer-events-none z-[5]">
                {timedEvents.map((event) => (
                  <GCalEventChip key={event.id} event={event} />
                ))}
              </div>
            )}

            {/* Time blocks layer */}
            <div className="absolute top-0 left-[48px] right-0 bottom-0 pointer-events-none z-[10]">
              <AnimatePresence>
                {blocks.map((block) => (
                  <div key={block.id} className="pointer-events-auto" data-block>
                    <TimeBlockCard
                      block={block}
                      task={scheduledMap.get(block.id) ?? null}
                      onTap={setEditingBlock}
                      onLongPress={handleLongPress}
                    />
                  </div>
                ))}
              </AnimatePresence>
            </div>

            {/* Current time indicator */}
            {isToday && nowOffset != null && (
              <div
                className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                style={{ top: nowOffset }}
              >
                <div className="w-[48px] flex justify-end pr-1">
                  <div className="w-2 h-2 rounded-full bg-danger" />
                </div>
                <div className="flex-1 h-[1.5px] bg-danger" />
              </div>
            )}
          </div>
        </div>

        {/* Task drawer */}
        <TaskDrawer tasks={unscheduledTasks} onTaskTap={handleTaskTap} />
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask && <TaskPill task={activeTask} isDragging />}
      </DragOverlay>

      {/* Block editor */}
      <BlockEditor
        block={editingBlock}
        task={editingBlock ? scheduledMap.get(editingBlock.id) ?? null : null}
        onClose={() => setEditingBlock(null)}
        onUpdate={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        onUnlinkTask={handleUnlinkTask}
      />

      {/* Google Calendar settings */}
      <GCalSettings
        open={showGcalSettings}
        onClose={() => setShowGcalSettings(false)}
        onConnectionChange={handleGcalConnectionChange}
      />

      {/* Long-press delete confirmation */}
      <AnimatePresence>
        {confirmingDeleteBlock && (
          <>
            <motion.div
              key="confirm-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[55] bg-black/60"
              onClick={() => setConfirmingDeleteBlock(null)}
            />
            <motion.div
              key="confirm-sheet"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[56] px-4 pb-[calc(68px+env(safe-area-inset-bottom))]"
            >
              <div className="bg-surface-2 rounded-2xl p-4 border border-border">
                <p className="text-[15px] font-semibold text-text text-center mb-1">
                  Delete time block?
                </p>
                <p className="text-[13px] text-text-secondary text-center mb-4">
                  {confirmingDeleteBlock.label
                    ? `"${confirmingDeleteBlock.label}" will be removed.`
                    : "This block will be removed."}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmingDeleteBlock(null)}
                    className="flex-1 py-3 rounded-xl bg-surface border border-border text-[14px] font-medium text-text-secondary active:bg-border transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteBlock(confirmingDeleteBlock.id);
                      setConfirmingDeleteBlock(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-danger/[0.08] border border-danger/20 text-[14px] font-medium text-danger active:bg-danger/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DndContext>
  );
}
