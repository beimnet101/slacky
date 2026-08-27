"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  FileText,
  Star,
  FolderOpen,
  ChevronDown,
  X,
  FileIcon,
} from "lucide-react";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetCanvases } from "@/features/canvases/api/use-get-canvases";
import { useCreateCanvas } from "@/features/canvases/api/use-create-canvas";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TEMPLATES = [
  { id: "onboarding", name: "Employee Onboarding", description: "Welcome new people.", preview: "Welcome [name]! We're happy you're here.\n\n✅ Your First Week Tasks\nMake sure to complete these tasks before the end of the week.\n□ Use the checklist format so you can track progress over time.\n\n📅 Meetings to Attend\nHere's an overview of sessions and events during your first few weeks." },
  { id: "newsletter", name: "Monthly Newsletter", description: "Broadcast your announcements.", preview: "👋 Hello Team!\n\nHere's what happened this month...\n\n📌 Highlights\n- Add your highlights here\n\n📢 Announcements\n- Share important updates" },
  { id: "ooo", name: "Out of Office Coverage Plan", description: "Share how your work will be covered.", preview: "🗓 OOO Details\n\nDates offline: Add your dates here\n\nAvailability: Will you be completely off the grid?" },
  { id: "benefits", name: "Employee Benefits", description: "Document your benefits.", preview: "# Employee Benefits\n\nHere is an overview of benefits available to you..." },
  { id: "incident", name: "Incident Summary", description: "Document incidents.", preview: "# Incident Summary\n\nDate: \nSeverity: \nDescription: " },
  { id: "product-brief", name: "Product Brief", description: "Plan your product.", preview: "# Product Brief\n\nObjective: \nTarget users: \nKey features: " },
  { id: "tech-spec", name: "Technical Specifications", description: "Document technical details.", preview: "# Technical Specifications\n\nOverview: \nArchitecture: \nAPIs: " },
  { id: "marketing", name: "Marketing Project Outline", description: "Plan marketing projects.", preview: "# Marketing Project\n\nGoal: \nTarget audience: \nChannels: " },
  { id: "sales", name: "Sales Enablement Hub", description: "Enable your sales team.", preview: "# Sales Hub\n\nKey messaging: \nCompetitive landscape: " },
  { id: "okr", name: "Objectives and Key Results (OKR)", description: "Track goals.", preview: "# OKRs\n\nObjective: \nKey Results:\n1. \n2. \n3. " },
  { id: "weekly-sync", name: "Weekly Sync", description: "Structure weekly meetings.", preview: "# Weekly Sync\n\nAgenda:\n1. Updates\n2. Blockers\n3. Next steps" },
  { id: "event", name: "Event Planning", description: "Plan events.", preview: "# Event Planning\n\nEvent name: \nDate: \nVenue: \nAttendees: " },
  { id: "shared-resources", name: "Shared Resources", description: "Centralize resources.", preview: "# Shared Resources\n\nLinks:\n- \nDocs:\n- " },
  { id: "agenda", name: "Agenda", description: "Meeting agendas.", preview: "# Meeting Agenda\n\nDate: \nAttendees: \nTopics:\n1. " },
  { id: "channel-overview", name: "Channel Overview", description: "Describe your channel.", preview: "# Channel Overview\n\nPurpose: \nAudience: \nRules: " },
  { id: "todo", name: "To-do list", description: "Track tasks.", preview: "# To-do List\n\n□ Task 1\n□ Task 2\n□ Task 3" },
  { id: "weekly-11", name: "Weekly 1:1", description: "Structure 1-on-1 meetings.", preview: "# Weekly 1:1\n\nUpdates: \nBlockers: \nFeedback: " },
  { id: "handbook", name: "Company Handbook", description: "Document company culture.", preview: "# Company Handbook\n\nMission: \nValues: \nPolicies: " },
];

type ActiveView = "all" | "canvases" | "starred";
type ActiveTab = "all" | "created" | "shared";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Canvas {
  _id: string;
  _creationTime: number;
  title: string;
  content: string;
  memberId: string;
  workspaceId: string;
  templateId?: string;
  isStarred?: boolean;
  creator?: { name?: string; image?: string; memberId: string };
}

interface TemplatePicker {
  open: boolean;
  onClose: () => void;
  onCreateCanvas: (templateId: string, title: string, content: string) => void;
}

function TemplatePickerModal({ open, onClose, onCreateCanvas }: TemplatePicker) {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [templateSearch, setTemplateSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filtered = TEMPLATES.filter((t) =>
    t.name.toLowerCase().includes(templateSearch.toLowerCase())
  );
  const current = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];

  const handleCreate = async () => {
    setIsCreating(true);
    await onCreateCanvas(current.id, current.name, current.preview);
    setIsCreating(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-3xl bg-[#1a1d21] border border-white/10 text-white overflow-hidden">
        <div className="flex h-[520px]">
          {/* Left panel */}
          <div className="w-[260px] border-r border-white/10 flex flex-col">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="font-semibold text-sm">Templates</span>
              <button onClick={onClose} className="text-white/50 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
            <div className="px-3 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-white/40" />
                <input
                  className="w-full bg-white/10 rounded text-sm pl-7 pr-3 py-1.5 outline-none placeholder:text-white/40 text-white"
                  placeholder="Search templates"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedTemplate === t.id
                      ? "bg-[#5E2C5F] text-white"
                      : "text-white/70 hover:bg-white/5"
                  }`}
                  onClick={() => setSelectedTemplate(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-white/10">
              <p className="text-xs text-white/40">
                Every channel has its own canvas for notes and resources.
              </p>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="font-semibold text-base">{current.name}</h2>
              <p className="text-sm text-white/50 mt-0.5">{current.description}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
                {current.preview}
              </pre>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="bg-[#007a5a] hover:bg-[#006649] disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
              >
                {isCreating ? "Creating..." : "Create Canvas with Template"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CanvasListItem({ canvas }: { canvas: Canvas }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg cursor-pointer group">
      <div className="flex-shrink-0 w-8 h-8 bg-teal-600/20 rounded flex items-center justify-center">
        <FileIcon className="size-4 text-teal-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{canvas.title}</p>
        <p className="text-xs text-white/50">
          {canvas.creator?.name ?? "Unknown"} &middot; {formatDate(canvas._creationTime)}
        </p>
      </div>
    </div>
  );
}

function AllFilesView({
  canvases,
  search,
  setSearch,
  activeTab,
  setActiveTab,
  currentMemberId,
  onOpenTemplateModal,
}: {
  canvases: Canvas[];
  search: string;
  setSearch: (v: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (v: ActiveTab) => void;
  currentMemberId?: string;
  onOpenTemplateModal: () => void;
}) {
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const filtered = canvases.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "created") return matchesSearch && c.creator?.memberId === currentMemberId;
    if (activeTab === "shared") return matchesSearch && c.creator?.memberId !== currentMemberId;
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search bar */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
          <input
            className="w-full bg-white/10 rounded-md text-sm pl-9 pr-4 py-2 outline-none placeholder:text-white/40 text-white border border-white/10 focus:border-white/30 transition-colors"
            placeholder="Search files"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Promo banner */}
        <div className="bg-[#0d3d2e] border border-[#1a5c47] rounded-lg p-4 mb-6 flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-teal-500/20 rounded flex items-center justify-center mt-0.5">
            <FileText className="size-4 text-teal-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Create and share canvases</p>
            <p className="text-xs text-white/60 mt-1">
              Canvases let you create rich documents, wikis, and notes right in your workspace.
            </p>
          </div>
          <button
            onClick={onOpenTemplateModal}
            className="flex-shrink-0 bg-[#007a5a] hover:bg-[#006649] text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
          >
            Create canvas
          </button>
        </div>

        {/* Templates section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            Start from a template
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.slice(0, 3).map((t) => (
              <button
                key={t.id}
                onClick={onOpenTemplateModal}
                className="text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 transition-colors"
              >
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="text-xs text-white/50 mt-1">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-3">
          {(["all", "created", "shared"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm pb-2 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-white text-white"
                  : "border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              {tab === "all" ? "All" : tab === "created" ? "Created by you" : "Shared with you"}
            </button>
          ))}
          <div className="ml-auto relative">
            <button
              onClick={() => setShowTypeFilter(!showTypeFilter)}
              className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
            >
              Type <ChevronDown className="size-3.5" />
            </button>
            {showTypeFilter && (
              <div className="absolute right-0 top-full mt-1 bg-[#1a1d21] border border-white/10 rounded-lg shadow-lg z-10 w-36">
                {["All types", "Canvas", "File"].map((type) => (
                  <button
                    key={type}
                    className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5"
                    onClick={() => setShowTypeFilter(false)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Canvas list or empty state */}
        {filtered.length > 0 ? (
          <div className="space-y-1">
            {filtered.map((canvas) => (
              <CanvasListItem key={canvas._id} canvas={canvas} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
              <FileText className="size-6 text-white/30" />
            </div>
            <p className="text-sm font-medium text-white/70">No files yet</p>
            <p className="text-xs text-white/40 mt-1">
              Create a canvas to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CanvasesView({
  canvases,
  search,
  setSearch,
  onOpenTemplateModal,
}: {
  canvases: Canvas[];
  search: string;
  setSearch: (v: string) => void;
  onOpenTemplateModal: () => void;
}) {
  const filtered = canvases.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search + create */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
          <input
            className="w-full bg-white/10 rounded-md text-sm pl-9 pr-4 py-2 outline-none placeholder:text-white/40 text-white border border-white/10 focus:border-white/30 transition-colors"
            placeholder="Search canvases"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={onOpenTemplateModal}
          className="flex items-center gap-1.5 bg-[#007a5a] hover:bg-[#006649] text-white text-sm font-medium px-3 py-2 rounded transition-colors"
        >
          <Plus className="size-4" /> New canvas
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filtered.length > 0 ? (
          <div className="space-y-1">
            {filtered.map((canvas) => (
              <CanvasListItem key={canvas._id} canvas={canvas} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
              <FileText className="size-6 text-white/30" />
            </div>
            <p className="text-sm font-medium text-white/70">No canvases yet</p>
            <p className="text-xs text-white/40 mt-1">
              Create your first canvas from a template
            </p>
            <button
              onClick={onOpenTemplateModal}
              className="mt-4 bg-[#007a5a] hover:bg-[#006649] text-white text-sm font-medium px-4 py-2 rounded transition-colors"
            >
              Create canvas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StarredView({ canvases }: { canvases: Canvas[] }) {
  const starred = canvases.filter((c) => c.isStarred);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="font-semibold text-white">Starred</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {starred.length > 0 ? (
          <div className="space-y-1">
            {starred.map((canvas) => (
              <CanvasListItem key={canvas._id} canvas={canvas} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
              <Star className="size-6 text-white/30" />
            </div>
            <p className="text-sm font-medium text-white/70">No starred files</p>
            <p className="text-xs text-white/40 mt-1">
              Star files to find them quickly here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FilesPage() {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const { data: canvases = [], isLoading } = useGetCanvases({ workspaceId });
  const { data: currentMember } = useCurrentMember({ workspaceId });
  const { mutate: createCanvas } = useCreateCanvas();

  const [activeView, setActiveView] = useState<ActiveView>("all");
  const [search, setSearch] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");

  const navItems = [
    { id: "all" as ActiveView, label: "All files", icon: FolderOpen },
    { id: "canvases" as ActiveView, label: "Canvases", icon: FileText },
    { id: "starred" as ActiveView, label: "Starred", icon: Star },
  ];

  const handleCreateCanvas = async (templateId: string, title: string, content: string) => {
    await createCanvas({ workspaceId, title, content, templateId });
  };

  return (
    <div className="flex h-full bg-[#1a1d21] text-white">
      {/* Left sidebar */}
      <div className="w-[260px] border-r border-white/10 flex flex-col flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h1 className="font-semibold text-white">Files</h1>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <nav className="py-2 flex-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                activeView === id
                  ? "bg-[#5E2C5F] text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="size-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeView === "all" && (
          <AllFilesView
            canvases={canvases as Canvas[]}
            search={search}
            setSearch={setSearch}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentMemberId={currentMember?._id}
            onOpenTemplateModal={() => setShowTemplateModal(true)}
          />
        )}
        {activeView === "canvases" && (
          <CanvasesView
            canvases={canvases as Canvas[]}
            search={search}
            setSearch={setSearch}
            onOpenTemplateModal={() => setShowTemplateModal(true)}
          />
        )}
        {activeView === "starred" && (
          <StarredView canvases={canvases as Canvas[]} />
        )}
      </div>

      {/* Template picker modal */}
      <TemplatePickerModal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onCreateCanvas={handleCreateCanvas}
      />
    </div>
  );
}
