"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import LZString from "lz-string";
import { Sparkles, Terminal, Calendar, FileText, Download, ChevronRight, ChevronDown, Lock, CheckCircle2, Award, Zap, Loader2 } from "lucide-react";
import { useProStatus } from "@/hooks/useProStatus";
import { supabase } from "@/lib/supabase";
import ProBadge from "@/components/ProBadge";

// Dynamically import hello-pangea/dnd to avoid SSR issues
const DragDropContext = dynamic(
  () => import("@hello-pangea/dnd").then((mod) => mod.DragDropContext),
  { ssr: false }
);
const Droppable = dynamic(
  () => import("@hello-pangea/dnd").then((mod) => mod.Droppable),
  { ssr: false }
);
const Draggable = dynamic(
  () => import("@hello-pangea/dnd").then((mod) => mod.Draggable),
  { ssr: false }
);

interface TechStack {
  frontend: string[];
  backend: string[];
  database: string[];
  hostingAndTools: string[];
}

interface Task {
  id: string;
  title: string;
  week: number;
  description: string;
}

interface RoadmapWeek {
  weekNumber: number;
  focusGoal: string;
  tasks: Task[];
  aiToolGuide: {
    recommendedAiTool: string;
    toolJustification: string;
    masterPrompt: string;
  };
}

interface Chapter {
  chapterNumber: number;
  title: string;
  subsections: string[];
}

interface ReportOutline {
  abstract: string;
  chapters: Chapter[];
}

interface VivaQuestion {
  question: string;
  idealAnswer: string;
}

interface ProjectPlan {
  projectTitle: string;
  description: string;
  difficultyRating: string;
  techStack: TechStack;
  roadmapWeeks: RoadmapWeek[];
  githubStructure: string;
  reportOutline: ReportOutline;
  vivaQuestions: VivaQuestion[];
}

const encodeSharedData = (data: any): string => {
  try {
    return LZString.compressToEncodedURIComponent(JSON.stringify(data));
  } catch (err) {
    console.error("Encoding failed:", err);
    return "";
  }
};

const decodeSharedData = (str: string): any => {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(str);
    if (!decompressed) return null;
    return JSON.parse(decompressed);
  } catch (err) {
    console.error("Decoding failed:", err);
    return null;
  }
};

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  // Selection states
  const [domain, setDomain] = React.useState("Web Development");
  const [complexity, setComplexity] = React.useState("Intermediate");
  const [skillLevel, setSkillLevel] = React.useState("Competent");
  const [customKeywords, setCustomKeywords] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"overview" | "tech" | "roadmap" | "report" | "copilot">("overview");
  const [plan, setPlan] = React.useState<ProjectPlan | null>(null);
  const [selectedCopilotWeek, setSelectedCopilotWeek] = React.useState<number>(1);
  const [error, setError] = React.useState<string | null>(null);

  // Freemium states — checked live directly against the database via useProStatus
  const { isPro: isPremium, loading: isProLoading } = useProStatus();

  const [generatedCount, setGeneratedCount] = React.useState(() => {
    if (typeof window !== "undefined") {
      const count = localStorage.getItem("project_generation_count");
      return count ? parseInt(count, 10) : 0;
    }
    return 0;
  });

  // Premium PDF and simulated Ad states
  const [showPremiumPdfModal, setShowPremiumPdfModal] = React.useState(false);
  const [showLimitModal, setShowLimitModal] = React.useState(false);
  const [adWatching, setAdWatching] = React.useState(false);
  const [adCountdown, setAdCountdown] = React.useState(3);

  // Kanban Board states
  const [kanbanTasks, setKanbanTasks] = React.useState<Record<string, Task[]>>({
    todo: [],
    in_progress: [],
    completed: [],
  });

  // Tutor Chat states
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<{ sender: "user" | "tutor"; text: string; timestamp: Date }[]>([]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatLoading, setChatLoading] = React.useState(false);

  // Share link state
  const [shareToast, setShareToast] = React.useState(false);

  // Debugger modal states
  const [debugTask, setDebugTask] = React.useState<Task | null>(null);
  const [debugErrorInput, setDebugErrorInput] = React.useState("");
  const [debugResult, setDebugResult] = React.useState("");
  const [debugLoading, setDebugLoading] = React.useState(false);

  // Copied state for week prompts
  const [copiedWeek, setCopiedWeek] = React.useState<number | null>(null);

  const getToolForTask = (task: Task) => {
    if (!plan || !plan.roadmapWeeks) return null;
    const weekObj = plan.roadmapWeeks.find((w) => w.weekNumber === task.week);
    return weekObj?.aiToolGuide?.recommendedAiTool || null;
  };

  const getToolBadgeColor = (toolName: string) => {
    const name = toolName.toLowerCase();
    if (name.includes("bolt")) return "bg-green-500/10 border-green-500/20 text-green-400";
    if (name.includes("cursor")) return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    if (name.includes("v0")) return "bg-purple-500/10 border-purple-500/20 text-purple-400";
    return "bg-slate-500/10 border-slate-500/20 text-slate-400";
  };

  const handleFixCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debugErrorInput.trim() || !plan || !debugTask || debugLoading) return;
    
    setDebugLoading(true);
    setDebugResult("");
    
    try {
      const queryText = `I am working on the task: "${debugTask.title}" (from Week ${debugTask.week}): "${debugTask.description}".
I have encountered the following error or broken code:
\`\`\`
${debugErrorInput.trim()}
\`\`\`
Please provide a step-by-step explanation and code fixes to resolve this issue.`;

      const response = await fetch("/api/tutor-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageHistory: [
            { sender: "user", text: queryText, timestamp: new Date() }
          ],
          projectBlueprint: plan
        }),
      });
      
      if (!response.ok) {
        throw new Error("Debugger failed to get reply from tutor.");
      }
      
      const data = await response.json();
      setDebugResult(data.text || "I apologize, but I could not formulate a fix right now.");
    } catch (err: any) {
      console.error(err);
      setDebugResult("Sorry, I could not connect to the API. Here is a local debugger suggestion:\n\n1. Double-check your environment configurations (.env.local).\n2. Review matching brackets and typescript imports.\n3. Make sure local packages are fully installed.");
    } finally {
      setDebugLoading(false);
    }
  };

  // Auto-generate a default plan or load shared plan on first load
  React.useEffect(() => {
    setMounted(true);

    // Intercept loaded database project history blueprint
    const loadedPlan = localStorage.getItem("loaded_project_blueprint");
    if (loadedPlan) {
      try {
        const parsed = JSON.parse(loadedPlan);
        if (parsed) {
          setPlan(parsed);
          setSelectedCopilotWeek(1);
          setActiveTab("overview");
        }
      } catch (e) {
        console.error("Failed to parse loaded blueprint:", e);
      } finally {
        localStorage.removeItem("loaded_project_blueprint");
      }
      return;
    }

    // Intercept shared link data parameter
    const params = new URLSearchParams(window.location.search);
    const sharedParam = params.get("shared");
    if (sharedParam) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(sharedParam);
        if (decompressed) {
          const decoded = JSON.parse(decompressed);
          if (decoded && decoded.plan) {
            setPlan(decoded.plan);
            setSelectedCopilotWeek(1);
            if (decoded.kanbanTasks) setKanbanTasks(decoded.kanbanTasks);
            if (decoded.domain) setDomain(decoded.domain);
            if (decoded.complexity) setComplexity(decoded.complexity);
            if (decoded.skillLevel) setSkillLevel(decoded.skillLevel);
            if (decoded.customKeywords) setCustomKeywords(decoded.customKeywords);
          }
        }
      } catch (err) {
        console.error("Failed to restore shared plan from URL query:", err);
      } finally {
        // Clean query parameters from URL history without reloading page
        const newUrl = `${window.location.origin}${window.location.pathname}`;
        window.history.replaceState({}, document.title, newUrl);
      }
      return;
    }

    // Removed handleGenerate(true) auto-trigger on mount to avoid stuck loading animation on initial load.
  }, []);

  // Update Kanban state and seed chat welcome message whenever a new plan is loaded
  React.useEffect(() => {
    if (plan) {
      const allTasks: Task[] = [];
      plan.roadmapWeeks?.forEach((week) => {
        if (week.tasks && Array.isArray(week.tasks)) {
          week.tasks.forEach((task) => {
            allTasks.push({
              id: task.id || `task-${week.weekNumber}-${Math.random()}`,
              title: task.title || "",
              week: task.week || week.weekNumber,
              description: task.description || "",
            });
          });
        }
      });
      setKanbanTasks({
        todo: allTasks,
        in_progress: [],
        completed: [],
      });

      // Seed initial welcoming message from Tutor
      setChatMessages([
        {
          sender: "tutor",
          text: `Hello! I am your Project Tutor. I've analyzed your blueprint for "${plan.projectTitle}". Ask me any questions about setting up the tech stack, designing database schemas, or writing specific code files!`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [plan]);

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !plan || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");

    // Add user message to history
    const updatedMessages = [
      ...chatMessages,
      { sender: "user" as const, text: userMsg, timestamp: new Date() }
    ];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const response = await fetch("/api/tutor-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageHistory: updatedMessages,
          projectBlueprint: plan
        }),
      });

      if (!response.ok) {
        throw new Error("Chat tutor response failed.");
      }

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        { sender: "tutor" as const, text: data.text || "I apologize, but I could not formulate a response.", timestamp: new Date() }
      ]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { sender: "tutor" as const, text: "Sorry, I am having trouble connecting to my servers right now. Please try again.", timestamp: new Date() }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const parseFolderTree = (treeText: string): { files: string[]; dirs: string[] } => {
    const files: string[] = [];
    const dirs: string[] = [];
    const lines = treeText.split("\n");
    const pathStack: string[] = [];

    lines.forEach((line) => {
      if (!line.trim()) return;

      // Clean out tree branches like ├──, └──, │
      const cleanLine = line
        .replace(/[├└─││││├─└─]/g, "")
        .trim();

      if (!cleanLine) return;

      // Calculate depth by counting characters matching tree prefixes
      const match = line.match(/^[\s│├└─]*/);
      const prefixLength = match ? match[0].length : 0;
      const depth = Math.floor(prefixLength / 4);

      const isDir = cleanLine.endsWith("/");
      const name = isDir ? cleanLine.slice(0, -1) : cleanLine;

      pathStack.length = depth;
      pathStack[depth] = name;

      const fullPath = pathStack.filter(Boolean).join("/");

      if (isDir) {
        dirs.push(fullPath);
      } else {
        files.push(fullPath);
      }
    });

    return { files, dirs };
  };

  const handleDownloadBoilerplate = async () => {
    if (!plan) return;
    if (!isPremium) {
      router.push("/dashboard/pricing");
      return;
    }
    try {
      setLoading(true);
      // Dynamically import jszip to avoid SSR issues
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Parse AI's folder tree layout
      const { files, dirs } = parseFolderTree(plan.githubStructure);

      // Create folder directories in zip structure
      dirs.forEach((dirPath) => {
        zip.folder(dirPath);
      });

      // Write empty files as placeholder stubs
      files.forEach((filePath) => {
        // Skip package.json and README.md, we will custom-generate them below
        const lowercasePath = filePath.toLowerCase();
        if (lowercasePath.endsWith("package.json") || lowercasePath.endsWith("readme.md")) {
          return;
        }
        zip.file(filePath, ""); // create an empty placeholder file
      });

      // Find the root folder name from our parsing
      const rootFolder = dirs[0] || "college-project";

      // 1. Generate package.json content
      const cleanProjName = plan.projectTitle
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "") || "academic-project";
        
      const packageJsonContent = {
        name: cleanProjName,
        version: "0.1.0",
        private: true,
        description: plan.description,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint"
        },
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          next: "^16.2.0"
        },
        devDependencies: {
          typescript: "^5.0.0",
          "@types/node": "^20.0.0",
          "@types/react": "^19.0.0",
          tailwindcss: "^4.0.0"
        }
      };

      zip.file(`${rootFolder}/package.json`, JSON.stringify(packageJsonContent, null, 2));

      // 2. Generate README.md content
      const readmeContent = `# ${plan.projectTitle}

${plan.description}

This project boilerplate was generated using the **AI College Project Builder**.

## Recommended Technology Stack

- **Frontend**: ${plan.techStack.frontend.join(", ")}
- **Backend**: ${plan.techStack.backend.join(", ")}
- **Database**: ${plan.techStack.database.join(", ")}
- **Hosting & Tools**: ${plan.techStack.hostingAndTools.join(", ")}

## Getting Started

1. Clone or extract this workspace template.
2. Install dependencies inside the root folder:
   \`\`\`bash
   npm install
   \`\`\`
3. Spin up the local development web server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open [http://localhost:3000](http://localhost:3000) to view your landing viewport.

## Academic Deliverables & Roadmap
For detailed viva questions, chapter thesis blueprints, and week-by-week checkpoints, refer to the PDF export inside your builder dashboard.
`;

      zip.file(`${rootFolder}/README.md`, readmeContent);

      // Generate the zip blob package
      const contentBlob = await zip.generateAsync({ type: "blob" });

      // Trigger browser-side download
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(contentBlob);
      downloadLink.download = `${cleanProjName}-starter-code.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error("Failed to generate starter code zip:", err);
      alert("Failed to build boilerplate zip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareProject = () => {
    if (!plan) return;
    try {
      const dataToShare = {
        plan,
        kanbanTasks,
        domain,
        complexity,
        skillLevel,
        customKeywords
      };
      const encoded = encodeSharedData(dataToShare);
      if (!encoded) return;

      const shareUrl = `${window.location.origin}${window.location.pathname}?shared=${encodeURIComponent(encoded)}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2500);
      });
    } catch (err) {
      console.error("Failed to generate share link:", err);
      alert("Failed to create shareable link. Please try again.");
    }
  };

  const onDragEnd = (result: any) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceCol = source.droppableId as keyof typeof kanbanTasks;
    const destCol = destination.droppableId as keyof typeof kanbanTasks;

    const sourceTasks = Array.from(kanbanTasks[sourceCol]);
    const destTasks = Array.from(kanbanTasks[destCol]);

    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (sourceCol === destCol) {
      sourceTasks.splice(destination.index, 0, movedTask);
      setKanbanTasks({
        ...kanbanTasks,
        [sourceCol]: sourceTasks,
      });
    } else {
      destTasks.splice(destination.index, 0, movedTask);
      setKanbanTasks({
        ...kanbanTasks,
        [sourceCol]: sourceTasks,
        [destCol]: destTasks,
      });
    }
  };

  const handleGenerate = async (isInitial = false) => {
    if (loading) return;

    // Quota validation for Free Tier
    if (!isPremium && generatedCount >= 1) {
      setShowLimitModal(true);
      return;
    }

    let token = typeof window !== "undefined" ? localStorage.getItem("pro_session") || "" : "";
    if (!token && typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token || "";
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ domain, complexity, skillLevel, customKeywords, generatedCount }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Generation request failed. Please check key configuration.");
      }

      const data = await response.json();
      setPlan(data);
      setSelectedCopilotWeek(1);
      if (!isInitial) {
        setActiveTab("overview");
      }
      
      // Increment generation count
      setGeneratedCount((prev) => {
        const next = prev + 1;
        localStorage.setItem("project_generation_count", next.toString());
        return next;
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate project plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!plan) return;
    try {
      // Dynamically import html2pdf.js to avoid SSR errors
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("pdf-template");
      if (!element) return;

      // Format clean filename based on project title
      const cleanTitle = plan.projectTitle
        .replace(/[^a-z0-9]/gi, "_")
        .replace(/_{2,}/g, "_")
        .replace(/^_+|_+$/g, "");
      const filename = `Project_Plan_${cleanTitle || "Blueprint"}.pdf`;

      const opt = {
        margin: 0.5,
        filename: filename,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          onclone: (clonedDoc: Document) => {
            const elements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < elements.length; i++) {
              const el = elements[i] as HTMLElement;
              const style = window.getComputedStyle(el);
              if (style.backgroundColor && (style.backgroundColor.includes('lab') || style.backgroundColor.includes('oklch'))) {
                el.style.backgroundColor = '#0f172a';
              }
              if (style.color && (style.color.includes('lab') || style.color.includes('oklch'))) {
                el.style.color = '#ffffff';
              }
            }
          }
        },
        jsPDF: { unit: "in" as const, format: "letter" as const, orientation: "portrait" as const },
        pagebreak: { mode: "avoid-all" as const }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF generation failed, falling back to window.print():", err);
      window.print();
    }
  };

  const handleUpgradePremium = () => {
    setAdWatching(true);
    setAdCountdown(3);
    
    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      setAdWatching(false);
      setShowPremiumPdfModal(false);
      alert("Simulated upgrade complete.");
      if (plan) {
        handleDownloadPDF();
      }
    }, 3000);
  };

  const handlePremiumPdfClick = () => {
    if (isPremium) {
      handleDownloadPDF();
    } else {
      router.push("/dashboard/pricing");
    }
  };

  const handleSignOut = () => {
    // Clear mock session cookie
    document.cookie = "mock-logged-in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/auth");
  };

  const handleChatOpen = () => {
    if (!isPremium) {
      router.push("/dashboard/pricing");
    } else {
      setIsChatOpen(true);
    }
  };

  const handleDebugClick = (task: Task) => {
    if (!isPremium) {
      router.push("/dashboard/pricing");
    } else {
      setDebugTask(task);
    }
  };

  if (isProLoading) {
    return (
      <div className="min-h-[400px] w-full flex items-center justify-center text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-semibold text-foreground/70 animate-pulse">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16 animate-fade-in max-w-7xl mx-auto">
      
      {/* Two-Part Structured Dashboard Grid (Hidden during printing via CSS no-print) */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Form (lg:col-span-7) */}
        <section className="lg:col-span-7 p-6 rounded-xl border border-white/[0.08] bg-[#0d121c] flex flex-col gap-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight flex items-center gap-2 text-[#f8fafc]">
                <Zap className="w-4 h-4 text-indigo-400" />
                <span>Configure Your AI Blueprint</span>
                {isPremium && <ProBadge />}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Define preferences to generate a custom-tailored academic project plan.
              </p>
            </div>
            
            {/* Account Tier Status Badge */}
            <div className="flex items-center select-none shrink-0">
              {isPremium ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Premium: Unlimited</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300">
                  <span>Free ({1 - generatedCount > 0 ? 1 - generatedCount : 0}/1 left)</span>
                  <button
                    onClick={() => router.push("/dashboard/pricing")}
                    className="ml-1 px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Upgrade
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Domain Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">
                Domain
              </label>
              <div className="relative">
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-lg border border-white/[0.1] hover:border-slate-600 bg-[#111622] text-[#f8fafc] text-xs font-medium focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Apps">Mobile Apps</option>
                  <option value="AI/ML">AI / Machine Learning</option>
                  <option value="Blockchain">Blockchain Tech</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="IoT">Internet of Things (IoT)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Complexity Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">
                Complexity
              </label>
              <div className="relative">
                <select
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-lg border border-white/[0.1] hover:border-slate-600 bg-[#111622] text-[#f8fafc] text-xs font-medium focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="Basic">Basic (Scaffolding)</option>
                  <option value="Intermediate">Intermediate (Full-Stack)</option>
                  <option value="Advanced">Advanced (Scale)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Skill Level Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">
                Skill Level
              </label>
              <div className="relative">
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-lg border border-white/[0.1] hover:border-slate-600 bg-[#111622] text-[#f8fafc] text-xs font-medium focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="Beginner">Beginner (1st/2nd Yr)</option>
                  <option value="Competent">Competent (3rd Yr)</option>
                  <option value="Expert">Expert (Capstone)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Custom Keywords Input */}
          <div className={`relative flex flex-col gap-1.5 p-3 rounded-lg border border-white/[0.08] bg-[#111622]/60 transition-colors ${!isPremium ? 'opacity-90 select-none' : ''}`}>
            {!isPremium && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded-lg pointer-events-auto z-10">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161c28] border border-amber-500/30 text-amber-300 text-xs font-medium">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Pro Feature (Custom Keywords)</span>
                </div>
              </div>
            )}
            <label htmlFor="customKeywords" className="text-xs font-medium text-slate-300">
              Project Focus / Specific Keywords (Optional)
            </label>
            <input
              id="customKeywords"
              type="text"
              placeholder="e.g., E-commerce, Healthcare, Fitness tracker, Real-time telemetry..."
              value={customKeywords}
              onChange={(e) => setCustomKeywords(e.target.value)}
              disabled={!isPremium}
              className="px-3.5 py-2 rounded-lg border border-white/[0.1] bg-[#111622] text-[#f8fafc] text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-colors"
            />
          </div>

          {/* Generate Trigger Button & Premium Action */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => handleGenerate(false)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-sm border border-indigo-400/30 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Generating Scaffolding...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Build Project Plan</span>
                </>
              )}
            </button>

            {plan && (
              <button
                onClick={handlePremiumPdfClick}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.1] bg-[#161c28] hover:bg-[#1c2433] text-slate-200 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {isPremium ? (
                  <>
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Download PDF</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Get Premium PDF</span>
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        {/* Right Column: Live Blueprint Preview / Recent Specs (lg:col-span-5) */}
        <aside className="lg:col-span-5 p-6 rounded-xl border border-white/[0.08] bg-[#0d121c] flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-[#f8fafc]">Live Blueprint Specs</h3>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
              Active Parameters
            </span>
          </div>

          {/* Dynamic Wireframe / Specs Card */}
          <div className="p-3.5 rounded-lg border border-white/[0.06] bg-[#07090e] flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Domain</span>
              <span className="text-white font-medium">{domain}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Complexity Rating</span>
              <span className="text-indigo-300 font-medium">{complexity}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Year / Level</span>
              <span className="text-slate-300 font-medium">{skillLevel}</span>
            </div>
            {customKeywords && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Custom Keywords</span>
                <span className="text-slate-300 font-mono text-[11px] truncate max-w-[150px]">{customKeywords}</span>
              </div>
            )}
          </div>

          {/* Deliverables Overview Checklist */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Included in this generation:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded-md bg-[#111622] border border-white/[0.05]">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Full Repo Tree</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-[#111622] border border-white/[0.05]">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>6-Wk Kanban</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-[#111622] border border-white/[0.05]">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>IEEE Report Doc</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-[#111622] border border-white/[0.05]">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Viva Q&A Prep</span>
              </div>
            </div>
          </div>

          {/* Quick Tip / Dev note */}
          <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 text-[11px] text-slate-400 leading-relaxed">
            <span className="text-indigo-300 font-semibold">Pro tip: </span>
            All blueprints include starter boilerplate downloads and personalized AI Copilot master prompts.
          </div>
        </aside>
      </div>

      {/* Error Card */}
      {error && (
        <div className="no-print p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium animate-fade-in flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Main Output Plan Container */}
      {plan && (
        <div className="flex flex-col gap-6" id="printable-area">
          
          {/* Printable Layout Header (Visible only when printing) */}
          <div className="hidden print:flex flex-col gap-2 border-b border-slate-300 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-black">AI College Project Blueprint</h1>
            <p className="text-sm text-slate-600">
              Generated blueprint for: <span className="font-semibold">{domain}</span> | Complexity: <span className="font-semibold">{complexity}</span> | Skill Level: <span className="font-semibold">{skillLevel}</span>
            </p>
          </div>

          {/* Tab Switcher Controls (Hidden during printing via CSS no-print) */}
          <div className="no-print flex items-center justify-between border-b border-white/[0.08] gap-2 overflow-x-auto select-none">
            <div className="flex gap-1 md:gap-2">
              {[
                { id: "overview", label: "Overview", icon: Award },
                { id: "tech", label: "Tech & GitHub", icon: Terminal },
                { id: "roadmap", label: "Roadmap", icon: Calendar },
                { id: "report", label: "Report & Viva", icon: FileText },
                { id: "copilot", label: "AI Copilot Guides", icon: Zap },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 cursor-pointer transition-colors ${
                      isActive
                        ? "border-indigo-400 text-indigo-300 font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick action buttons (Hidden during print) */}
            <div className="flex gap-2 items-center py-2">
              {/* Share Project Button */}
              <button
                onClick={handleShareProject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#161c28] hover:bg-[#1c2433] text-slate-200 font-medium text-xs transition-colors cursor-pointer"
              >
                Share
              </button>

              {/* Premium PDF Download */}
              <button
                onClick={handlePremiumPdfClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#161c28] hover:bg-[#1c2433] text-slate-200 font-medium text-xs transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>PDF Blueprint</span>
              </button>

              {/* Quick print action button */}
              {isPremium && (
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              )}

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-500/20 text-[#94a3b8] hover:text-red-400 hover:bg-red-500/10 font-medium text-xs transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Active Tab Panel Content */}
          <div className="flex flex-col gap-6">
            
            {/* TAB 1: OVERVIEW PANEL (Always visible in prints) */}
            <div className={`${activeTab === "overview" ? "block" : "hidden print:block"} flex flex-col gap-4 animate-fade-in`}>
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold tracking-tight text-[#f8fafc]">{plan.projectTitle}</h3>
                <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border border-zinc-700 bg-zinc-800 text-zinc-300">
                  {plan.difficultyRating}
                </span>
              </div>
              <p className="text-sm text-[#94a3b8] leading-relaxed border-l-2 border-zinc-700 pl-4 py-1">
                {plan.description}
              </p>
            </div>

            {/* TAB 2: TECH STACK & GITHUB PANEL (Always visible in prints) */}
            <div className={`${activeTab === "tech" ? "block" : "hidden print:block"} flex flex-col gap-6 animate-fade-in`}>
              <div>
                <h4 className="text-xs font-medium mb-3 uppercase tracking-wider text-[#94a3b8] print:text-black">
                  Recommended Tech Stack
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Frontend Card */}
                  <div className="p-4 rounded-lg border border-white/[0.08] bg-[#161a24] text-[#f8fafc]">
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Frontend</span>
                    <ul className="mt-2 text-xs space-y-1.5 list-disc list-inside text-[#94a3b8]">
                      {plan.techStack.frontend.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                  {/* Backend Card */}
                  <div className="p-4 rounded-lg border border-white/[0.08] bg-[#161a24] text-[#f8fafc]">
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Backend</span>
                    <ul className="mt-2 text-xs space-y-1.5 list-disc list-inside text-[#94a3b8]">
                      {plan.techStack.backend.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                  {/* Database Card */}
                  <div className="p-4 rounded-lg border border-white/[0.08] bg-[#161a24] text-[#f8fafc]">
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Database</span>
                    <ul className="mt-2 text-xs space-y-1.5 list-disc list-inside text-[#94a3b8]">
                      {plan.techStack.database.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                  {/* Hosting & Tools Card */}
                  <div className="p-4 rounded-lg border border-white/[0.08] bg-[#161a24] text-[#f8fafc]">
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Hosting & Tools</span>
                    <ul className="mt-2 text-xs space-y-1.5 list-disc list-inside text-[#94a3b8]">
                      {plan.techStack.hostingAndTools.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* GitHub Structure Terminal */}
              <div className="page-break">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-[#94a3b8] print:text-black">
                    Repository Directory Tree
                  </h4>
                  <button
                    onClick={handleDownloadBoilerplate}
                    className="no-print self-start flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
                  >
                    {isPremium ? "📦 Download Starter Boilerplate" : "🔒 Unlock Starter Boilerplate"}
                  </button>
                </div>
                <div className="rounded-lg overflow-hidden border border-white/[0.08] bg-[#0a0a0c]">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border-b border-white/[0.08] no-print">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <span className="text-xs text-zinc-400 font-mono ml-2">repository-structure.txt</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs text-zinc-300 font-mono leading-relaxed max-h-[350px] print:max-h-none print:text-black print:bg-white print:border print:border-slate-200">
                    <code>{plan.githubStructure}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* TAB 3: ROADMAP PANEL - INTERACTIVE KANBAN BOARD */}
            <div className={`${activeTab === "roadmap" ? "block" : "hidden"} flex flex-col gap-6 animate-fade-in`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
                    Interactive Roadmap Kanban Board
                  </h4>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Drag and drop cards between status columns to update your implementation progress.
                  </p>
                </div>
              </div>

              {!mounted ? (
                <div className="flex items-center justify-center p-12 border border-dashed border-white/[0.08] rounded-lg bg-[#11141c]">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                    <span className="text-xs text-[#94a3b8]">Loading Kanban Board...</span>
                  </div>
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {(["todo", "in_progress", "completed"] as const).map((columnKey) => {
                      const columnTitle = 
                        columnKey === "todo" ? "To Do" : 
                        columnKey === "in_progress" ? "In Progress" : 
                        "Completed";
                      const columnTasks = kanbanTasks[columnKey] || [];

                      return (
                        <div key={columnKey} className="flex flex-col rounded-lg border border-white/[0.08] bg-[#11141c] p-4 h-[600px] overflow-hidden">
                          {/* Column Header */}
                          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-xs font-medium border border-zinc-700 bg-zinc-800/80 text-zinc-300">
                                {columnTitle}
                              </span>
                              <span className="text-xs font-mono text-[#64748b]">
                                {columnTasks.length}
                              </span>
                            </div>
                          </div>

                          {/* Column Body Droppable Area */}
                          <Droppable droppableId={columnKey}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 pb-4 transition-colors rounded-lg ${
                                  snapshot.isDraggingOver ? "bg-white/[0.02]" : ""
                                }`}
                              >
                                {columnTasks.map((task, index) => (
                                  <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(draggableProvided, draggableSnapshot) => (
                                      <div
                                        ref={draggableProvided.innerRef}
                                        {...draggableProvided.draggableProps}
                                        {...draggableProvided.dragHandleProps}
                                        className={`p-3.5 rounded-lg border bg-[#161a24] cursor-grab active:cursor-grabbing hover:border-zinc-600 transition-colors select-none ${
                                          draggableSnapshot.isDragging 
                                            ? "border-zinc-400 shadow-xl" 
                                            : "border-white/[0.08]"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                          <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700 uppercase tracking-wider">
                                            Week {task.week}
                                          </span>
                                          {getToolForTask(task) && (
                                            <span className="text-[9px] font-medium text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 uppercase tracking-wider">
                                              {getToolForTask(task)}
                                            </span>
                                          )}
                                        </div>
                                        <h5 className="text-xs font-semibold text-[#f8fafc] leading-tight mb-1">
                                          {task.title}
                                        </h5>
                                        <p className="text-[11px] text-[#94a3b8] leading-normal line-clamp-2">
                                          {task.description}
                                        </p>
                                        <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                                          <span className="text-[9px] text-[#64748b] font-mono">ID: {task.id}</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDebugClick(task);
                                            }}
                                            className="px-2 py-0.5 rounded border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 font-medium text-[10px] transition-colors cursor-pointer"
                                          >
                                            Debug
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                {columnTasks.length === 0 && (
                                  <div className="flex-1 flex items-center justify-center border border-dashed border-white/[0.08] rounded-lg py-12">
                                    <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Empty</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      );
                    })}
                  </div>
                </DragDropContext>
              )}
            </div>

            {/* TAB 4: REPORT SKELETON & VIVA PANEL (Always visible in prints) */}
            <div className={`${activeTab === "report" ? "block" : "hidden print:block"} flex flex-col gap-6 animate-fade-in page-break`}>
              {/* Thesis Outline Abstract */}
              <div>
                <h4 className="text-xs font-medium mb-3 uppercase tracking-wider text-[#94a3b8] print:text-black">
                  Report Abstract Skeleton
                </h4>
                <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed bg-[#161a24] p-4 rounded-lg border border-white/[0.08]">
                  {plan.reportOutline.abstract}
                </p>
              </div>

              {/* Collapsible Chapter Layout (HTML Details Accordions) */}
              <div>
                <h4 className="text-xs font-medium mb-3 uppercase tracking-wider text-[#94a3b8] print:text-black">
                  Chapter Breakdown
                </h4>
                <div className="flex flex-col gap-2">
                  {plan.reportOutline.chapters.map((chapter, idx) => (
                    <details
                      key={idx}
                      className="group p-3.5 rounded-lg border border-white/[0.08] bg-[#161a24] open:bg-[#11141c] transition-colors"
                    >
                      <summary className="flex items-center justify-between text-xs sm:text-sm font-medium text-[#f8fafc] cursor-pointer select-none outline-none">
                        <span className="flex items-center gap-2">
                          <span className="text-zinc-400 font-mono text-xs">Chapter {chapter.chapterNumber}.</span>
                          {chapter.title}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-open:rotate-90 transition-transform duration-150 no-print" />
                      </summary>
                      
                      <div className="mt-2.5 pl-4 border-l border-zinc-700 space-y-1">
                        {chapter.subsections.map((sub, sidx) => (
                          <div key={sidx} className="text-xs text-[#94a3b8] py-0.5">
                            {chapter.chapterNumber}.{sidx + 1} {sub}
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              {/* Viva Exam Questions */}
              <div className="page-break">
                <h4 className="text-xs font-medium mb-3 uppercase tracking-wider text-[#94a3b8] print:text-black">
                  Viva Practice Question Sheet
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {plan.vivaQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-white/[0.08] bg-[#161a24]">
                      <div className="flex gap-2.5 items-start">
                        <span className="text-xs font-bold text-zinc-400 shrink-0 font-mono">Q{idx + 1}.</span>
                        <h6 className="text-xs sm:text-sm font-medium text-[#f8fafc]">{q.question}</h6>
                      </div>
                      <div className="mt-2.5 pl-5 text-xs text-[#94a3b8] print:text-gray-900 leading-relaxed border-t border-white/[0.06] pt-2">
                        <span className="font-semibold text-zinc-300 print:text-zinc-900 uppercase mr-1 text-[10px]">Ideal Answer:</span>
                        {q.idealAnswer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download Action Footer (Hidden when printing) */}
              <div className="no-print flex items-center justify-end pt-3 border-t border-white/[0.08]">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Save Report Blueprint as PDF</span>
                </button>
              </div>

            </div>

            {/* TAB 5: AI COPILOT GUIDES PANEL */}
            <div className={`${activeTab === "copilot" ? "block" : "hidden"} flex flex-col gap-6 animate-fade-in no-print`}>
              {/* Hero Header */}
              <div className="p-5 rounded-lg border border-white/[0.08] bg-[#11141c] flex flex-col gap-1.5">
                <h4 className="text-sm font-semibold text-[#f8fafc] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-zinc-300" />
                  Select a week below for tool recommendations and development prompts.
                </h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  These guides matching your generated blueprint week objectives are custom compiled by our academic AI engine.
                </p>
              </div>

              {/* Horizontal Row of Clickable Week Buttons */}
              <div className="flex gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto select-none">
                {plan.roadmapWeeks?.map((week) => (
                  <button
                    key={week.weekNumber}
                    onClick={() => setSelectedCopilotWeek(week.weekNumber)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      selectedCopilotWeek === week.weekNumber
                        ? "bg-white text-zinc-950 border-white"
                        : "border-white/[0.08] text-[#94a3b8] hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    Week {week.weekNumber}
                  </button>
                ))}
              </div>

              {/* Selected Week Details Card */}
              {(() => {
                const currentWeekObj = plan.roadmapWeeks?.find((w) => w.weekNumber === selectedCopilotWeek);
                if (!currentWeekObj) return null;
                const tool = currentWeekObj.aiToolGuide?.recommendedAiTool || "AI Assistant";
                const justification = currentWeekObj.aiToolGuide?.toolJustification || "";
                const prompt = currentWeekObj.aiToolGuide?.masterPrompt || "";

                return (
                  <div className="p-6 rounded-lg border border-white/[0.08] bg-[#11141c] flex flex-col gap-4">
                    {/* Tool Badge & Goal */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                      <div>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Phase {selectedCopilotWeek} Focus</span>
                        <h4 className="text-sm sm:text-base font-semibold text-[#f8fafc] mt-0.5">
                          {currentWeekObj.focusGoal}
                        </h4>
                      </div>
                      
                      <span className="px-2.5 py-1 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs font-medium">
                        {tool}
                      </span>
                    </div>

                    {/* Why this tool? */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider">Why this tool?</span>
                      <p className="text-xs text-[#94a3b8] leading-relaxed bg-[#161a24] p-3.5 rounded-lg border border-white/[0.08]">
                        {justification}
                      </p>
                    </div>

                    {/* Master Prompt */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider">AI Master Prompt</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(prompt);
                            setCopiedWeek(selectedCopilotWeek);
                            setTimeout(() => setCopiedWeek(null), 2000);
                          }}
                          className="px-3 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-zinc-200 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          {copiedWeek === selectedCopilotWeek ? "✓ Copied!" : "Copy Master Prompt"}
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={prompt}
                        className="w-full h-56 p-3.5 bg-[#0a0a0c] border border-white/[0.08] rounded-lg text-xs font-mono leading-relaxed text-zinc-300 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>

          {/* Off-screen Printable PDF Layout Container */}
          <div 
            id="pdf-template" 
            className="absolute -left-[9999px] -top-[9999px] w-[750px] bg-white text-slate-950 p-8 flex flex-col gap-6 font-sans select-none"
            style={{ color: "#090d16", backgroundColor: "#ffffff" }}
          >
            {/* Header */}
            <div className="border-b-2 border-slate-300 pb-4 mb-2 flex flex-col gap-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">{plan.projectTitle}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-700 font-bold uppercase tracking-wide">
                <span>Domain: {domain}</span>
                <span>Complexity: {complexity}</span>
                <span>Skill Level: {skillLevel}</span>
                <span>Rating: {plan.difficultyRating}</span>
              </div>
            </div>

            {/* Section 1: Overview */}
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-1">1. Project Overview</h2>
              <p className="text-xs text-slate-800 leading-relaxed">{plan.description}</p>
            </div>

            {/* Section 2: Tech Stack */}
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-1">2. Recommended Technology Stack</h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Frontend</span>
                  <ul className="list-disc list-inside text-slate-800 mt-1 space-y-0.5">
                    {plan.techStack.frontend.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Backend</span>
                  <ul className="list-disc list-inside text-slate-800 mt-1 space-y-0.5">
                    {plan.techStack.backend.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Database</span>
                  <ul className="list-disc list-inside text-slate-800 mt-1 space-y-0.5">
                    {plan.techStack.database.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Hosting & Tools</span>
                  <ul className="list-disc list-inside text-slate-800 mt-1 space-y-0.5">
                    {plan.techStack.hostingAndTools.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 3: Repository Tree */}
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-1">3. Repository Structure Tree</h2>
              <pre className="p-4 bg-slate-950 text-cyan-500 text-[10px] font-mono rounded-lg overflow-x-auto leading-relaxed border border-slate-800">
                <code>{plan.githubStructure}</code>
              </pre>
            </div>

            {/* Section 4: Roadmap */}
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-1">4. 6-Week Implementation Roadmap</h2>
              <div className="flex flex-col gap-3">
                {plan.roadmapWeeks.map((week, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-slate-50/40">
                    <span className="font-bold text-xs text-slate-955">Week {week.weekNumber}: {week.focusGoal}</span>
                    <ul className="list-disc list-inside text-xs text-slate-800 mt-1 space-y-0.5 pl-1">
                      {week.tasks.map((task, ti) => (
                        <li key={ti}>
                          <span className="font-semibold text-slate-900">{task.title}</span>: {task.description}
                        </li>
                      ))}
                    </ul>
                    {week.aiToolGuide && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-800 flex flex-col gap-1">
                        <div>
                          <span className="font-bold text-slate-900 text-[10px]">Recommended AI Tool: </span>
                          <span className="font-semibold text-purple-800 text-[10px]">{week.aiToolGuide.recommendedAiTool}</span>
                        </div>
                        <p className="italic text-slate-600 text-[10px]">"{week.aiToolGuide.toolJustification}"</p>
                        <div className="mt-1">
                          <span className="font-bold text-slate-900 block mb-0.5 text-[10px]">AI Master Prompt:</span>
                          <pre className="p-2 bg-slate-950 text-cyan-500 text-[9px] font-mono rounded overflow-x-auto whitespace-pre-wrap border border-slate-800 leading-normal">
                            <code>{week.aiToolGuide.masterPrompt}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Report Outline */}
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-1">5. Thesis Outline Report Skeleton</h2>
              <div className="flex flex-col gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-955 text-[10px] uppercase tracking-wide block mb-1">Abstract</span>
                  <p className="text-xs text-slate-800 leading-relaxed">{plan.reportOutline.abstract}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {plan.reportOutline.chapters.map((chapter, idx) => (
                    <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-slate-50/20">
                      <span className="font-bold text-xs text-slate-900 block mb-1">Chapter {chapter.chapterNumber}: {chapter.title}</span>
                      <ul className="list-decimal list-inside text-xs text-slate-800 pl-2 space-y-0.5">
                        {chapter.subsections.map((sub, si) => <li key={si}>{sub}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 6: Viva Questions */}
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-1">6. Viva Exam Practice Sheet</h2>
              <div className="flex flex-col gap-3">
                {plan.vivaQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-slate-50/20">
                    <h5 className="text-xs font-bold text-slate-900">Q{idx + 1}. {q.question}</h5>
                    <p className="text-xs text-slate-950 mt-1 leading-relaxed"><span className="font-extrabold text-emerald-800 uppercase mr-1 text-[10px]">Ideal Answer:</span> {q.idealAnswer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Floating Action Button - Ask Tutor */}
      {plan && (
        <button
          onClick={handleChatOpen}
          className={`no-print fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full font-bold text-sm shadow-xl transition-all duration-200 hover:scale-[1.04] active:scale-[0.98] cursor-pointer animate-fade-in ${
            isPremium
              ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25"
              : "border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 shadow-amber-500/10 backdrop-blur-md"
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <span>{isPremium ? "💬 Ask Tutor" : "🔒 Unlock Tutor (Pro)"}</span>
        </button>
      )}

      {/* Slide-out Tutor Chat Sidebar */}
      {plan && (
        <div
          className={`no-print fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white/95 dark:bg-[#0f172a]/95 border-l border-slate-200 dark:border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            isChatOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-sm font-bold tracking-wide uppercase text-slate-900 dark:text-slate-100">Project Tutor</h4>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-semibold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Chat Bubbles Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {chatMessages.map((msg, idx) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${isUser ? "self-end items-end" : "self-start items-start"}`}
                >
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? "bg-cyan-500 text-slate-950 font-medium rounded-br-none shadow-md shadow-cyan-500/15"
                        : "bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/10 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap font-sans leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase mt-1 px-1 tracking-wide">
                    {isUser ? "You" : "Tutor"} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                </div>
              );
            })}

            {/* Typing Indicator Loading State */}
            {chatLoading && (
              <div className="self-start flex flex-col items-start gap-1 max-w-[85%]">
                <div className="p-3.5 rounded-2xl rounded-bl-none bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                </div>
                <span className="text-[9px] text-slate-400 font-semibold uppercase px-1 tracking-wide">
                  Tutor is typing...
                </span>
              </div>
            )}
          </div>

          {/* Input Bar Form */}
          <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 flex gap-2">
            <input
              type="text"
              placeholder="Ask Tutor a question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 placeholder:text-slate-400 disabled:opacity-50 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 cursor-pointer shadow-md shadow-cyan-500/20"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Debugger Get Help Modal */}
      {debugTask && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-[#11141c] rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.08] bg-zinc-900/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#f8fafc] flex items-center gap-2">
                  Tutor Debugger: Task Support
                </h3>
                <span className="text-xs text-[#94a3b8] mt-0.5 block">
                  Task: <span className="font-medium text-[#f8fafc]">"{debugTask.title}"</span>
                </span>
              </div>
              <button
                onClick={() => {
                  setDebugTask(null);
                  setDebugErrorInput("");
                  setDebugResult("");
                }}
                className="p-1.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex flex-col gap-4 flex-1">
              <form onSubmit={handleFixCode} className="flex flex-col gap-3">
                <label className="text-xs font-medium text-[#94a3b8]">
                  Paste Broken Code or Console Error
                </label>
                <textarea
                  required
                  placeholder="e.g., TypeError: Cannot read properties of undefined (reading 'map')... or paste your active component code here."
                  value={debugErrorInput}
                  onChange={(e) => setDebugErrorInput(e.target.value)}
                  disabled={debugLoading}
                  className="w-full h-32 p-3 bg-[#0a0a0c] border border-white/[0.1] rounded-lg text-xs font-mono leading-relaxed text-zinc-300 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 placeholder:text-[#64748b] disabled:opacity-50 transition-colors"
                />
                
                <button
                  type="submit"
                  disabled={!debugErrorInput.trim() || debugLoading}
                  className="self-end px-4 py-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-xs active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  {debugLoading ? "Analyzing Error..." : "Fix Code"}
                </button>
              </form>

              {/* Debug Result Display */}
              {(debugLoading || debugResult) && (
                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/[0.08]">
                  <span className="text-xs font-medium text-[#94a3b8]">
                    Tutor Diagnostic Resolution
                  </span>
                  
                  {debugLoading ? (
                    <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#161a24] flex items-center gap-3">
                      <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                      <span className="text-xs text-[#94a3b8]">Tutor is analyzing your stack trace...</span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#0a0a0c] overflow-x-auto max-h-[300px]">
                      <pre className="text-xs text-zinc-200 font-sans leading-relaxed whitespace-pre-wrap">
                        {debugResult}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for sharing */}
      {shareToast && (
        <div className="no-print fixed bottom-6 right-6 z-50 px-3.5 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-medium shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Link copied to clipboard!</span>
        </div>
      )}

      {/* Limit Reached Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="w-full max-w-md p-6 rounded-xl border border-white/[0.08] bg-[#11141c] shadow-2xl flex flex-col gap-5 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 mb-1">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#f8fafc]">Weekly Generation Limit Reached</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                You've reached your free weekly limit. Upgrade to Pro for unlimited project scaffolds, full source downloads, and AI guides.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowLimitModal(false);
                  router.push("/dashboard/pricing");
                }}
                className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-colors cursor-pointer"
              >
                Upgrade to Pro
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
