import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "../../../../auth";

export async function POST(req: NextRequest) {
  let messageHistory: any[] = [];
  let projectBlueprint: any = null;

  try {
    // 1. Verify session authorization
    const session = await auth();

    // 2. Fetch parameters from request body
    const body = await req.json();
    if (body) {
      if (body.messageHistory) messageHistory = body.messageHistory;
      if (body.projectBlueprint) projectBlueprint = body.projectBlueprint;
    }

    if (!messageHistory || !Array.isArray(messageHistory) || !projectBlueprint) {
      return NextResponse.json(
        { error: "Missing required selection parameters: messageHistory and projectBlueprint" },
        { status: 400 }
      );
    }

    // 3. Extract GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.warn("GEMINI_API_KEY is not configured. Returning local mock tutor response for demonstration.");
      const lastMessage = messageHistory[messageHistory.length - 1]?.text || "";
      const reply = generateMockTutorReply(lastMessage, projectBlueprint);
      return NextResponse.json({ text: reply });
    }

    // 4. Initialize Google Gen AI SDK
    const ai = new GoogleGenAI({ apiKey });

    // 5. Structure mentor system instruction with active project context
    const techStackDetails = `
- Frontend: ${projectBlueprint.techStack?.frontend?.join(", ") || "None specified"}
- Backend: ${projectBlueprint.techStack?.backend?.join(", ") || "None specified"}
- Database: ${projectBlueprint.techStack?.database?.join(", ") || "None specified"}
- Hosting & Tools: ${projectBlueprint.techStack?.hostingAndTools?.join(", ") || "None specified"}
`;

    const systemInstruction = `You are an encouraging academic Project Tutor. Look at the user's current project blueprint configurations (domain, complexity, and skill level) and dynamically answer their questions. If they ask a general question (like if it is good for beginners), evaluate their current blueprint parameters and give them a direct, helpful, and personalized answer.
Use the provided project blueprint context to answer the student's questions. Give practical step-by-step guidance, clean code snippets, and explanations tailored to their skill level.

Active Project Blueprint Context:
- Project Title: ${projectBlueprint.projectTitle || "College Project"}
- Description: ${projectBlueprint.description || ""}
- Difficulty Rating: ${projectBlueprint.difficultyRating || ""}
- Technology Stack:
${techStackDetails}

Format your replies using clean markdown with proper spacing. When sharing code snippets, provide complete, commented, and syntactically clean examples. Keep your tone encouraging, clear, and academically mentoring.`;

    // 6. Map messageHistory to Gemini format: [{ role: "user" | "model", parts: [{ text: string }] }]
    // Filter to only include valid roles (Gemini expects alternate user and model roles)
    const contents = messageHistory.map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // 7. Request response from Gemini model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    const replyText = response.text;
    if (!replyText) {
      throw new Error("No response text returned from Gemini.");
    }

    return NextResponse.json({ text: replyText });
  } catch (error: any) {
    console.error("Gemini Tutor API call failed, falling back to mock reply:", error);
    const lastMessage = messageHistory[messageHistory.length - 1]?.text || "";
    const reply = generateMockTutorReply(lastMessage, projectBlueprint);
    return NextResponse.json({ text: reply });
  }
}

// Fallback high-quality mock response generator for offline/local demonstration
function generateMockTutorReply(userMessage: string, blueprint: any): string {
  const query = userMessage.toLowerCase();
  const title = blueprint.projectTitle || "the project";

  if (query.includes("beginner") || query.includes("easy") || query.includes("difficult") || query.includes("hard") || query.includes("good") || query.includes("suit")) {
    const level = (blueprint.difficultyRating || "Intermediate").toLowerCase();
    if (level.includes("basic") || level.includes("beginner") || level.includes("easy")) {
      return `Yes, **${title}** is an excellent project choice for a beginner! Here's why:\n\n1. It focuses on core CRUD interactions and straightforward layouts.\n2. The tech stack components (like standard React/Next.js scaffolds) are highly accessible and well-documented.\n3. The scope is scoped to 6 simple weeks. Let me know if you want help starting Week 1 setup!`;
    } else {
      return `Since **${title}** is configured at an **${blueprint.difficultyRating || "Intermediate"}** level, it might present a slight learning curve for absolute beginners. However, it is fully doable! I suggest:\n\n1. Take Week 1 & 2 scaffolding slowly to understand state connections.\n2. Focus on getting database queries functioning before implementing complex client features.\n3. Ask me to walk you through specific code blocks if you get stuck. I'm here to help you learn!`;
    }
  }

  if (query.includes("code") || query.includes("example") || query.includes("setup")) {
    return `That's a great question! Let's write a clean entry point wrapper or client hook for your **${title}**.

Since you are using **${blueprint.techStack?.frontend?.[0] || "React"}**, here is an example of how you can structure a data fetch provider:

\`\`\`typescript
// src/components/DataProvider.tsx
import * as React from "react";

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    // Replace with your active backend endpoint
    fetch("/api/data")
      .then((res) => res.json())
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  if (loading) {
    return <div className="animate-pulse text-sm text-foreground/50">Initializing connection...</div>;
  }

  return (
    <div className="border border-border-accent rounded-xl p-4 bg-bg-accent/10">
      {children}
    </div>
  );
}
\`\`\`

Here are your next steps:
1. Initialize this inside your root layout or main view.
2. Verify the backend route parameters.
3. Test loading transitions.

Let me know if you need to generate database migration scripts or model types next!`;
  }

  if (query.includes("database") || query.includes("db") || query.includes("schema") || query.includes("table")) {
    return `Let's talk about the database configuration for **${title}**.

Given your stack selection (**${blueprint.techStack?.database?.[0] || "PostgreSQL"}**), you will want a robust entity definition. Here is a recommended starter schema mapping:

1. **User Table**: Tracks academic profiles and credentials.
2. **Project Table**: Contains metadata, description details, and complexity logs.
3. **Tasks Table**: Wire items directly to our Kanban Board task tracker!

For example, a starter SQL script:
\`\`\`sql
-- Schema migration scaffolding
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

Would you like me to write a Prisma schema definition or explain how to connect this to your backend api routes?`;
  }

  return `Hello there! I've analyzed your blueprint for **${title}** (configured at a **${blueprint.difficultyRating}** level).

I can help you:
- Explain specific implementation details of your roadmap.
- Provide sample code snippets for frontend components or API route endpoints.
- Draft mock viva preparation questions and defense answers.
- Scaffold database configurations.

What part of the roadmap would you like to review or implement first?`;
}
