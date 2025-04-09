"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function saveResume(content) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    try {
        const resume = await db.resume.upsert({
            where: {
                userId: user.id,
            },
            update: {
                content,
            },
            create: {
                userId: user.id,
                content,
            },
        });

        revalidatePath("/resume");
        return resume;
    } catch (error) {
        console.error("Error saving resume:", error.message);
        throw new Error("Failed to save resume");
    }
}

export async function getResume() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    return await db.resume.findUnique({
        where: {
            userId: user.id,
        },
    });
}

export async function improveWithAI({ current, type }) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
        include: {
            industryInsight: true,
        },
    });
    
    if (!user) throw new Error("User not found");

    const prompt = type === "professional summary" ? `
    As an expert resume writer, transform the following professional summary for a ${user.industry} professional into a compelling career narrative.
    Make it more impactful, quantifiable, and aligned with current industry standards while positioning the candidate as an authority in their field.
    Current content: "${current}"

    Requirements:
    1. Begin with powerful action verbs that demonstrate leadership and expertise
    2. Dont't Include specific metrics, percentages, and quantifiable achievements
    3. Incorporate relevant technical skills and certifications
    4. Maintain a concise 3-4 line paragraph structure
    5. Emphasize notable accomplishments and career milestones
    6. Integrate industry-specific keywords and trending technologies
    7. Showcase unique value proposition and competitive advantages
    8. Highlight successful projects or innovations
    9. Include scope of responsibility (team size, budget, or market reach)
    10. Demonstrate progression and growth in career trajectory
    11. Add relevant soft skills valued in ${user.industry}
    12. Incorporate current industry buzzwords and methodologies

    Format the response as a single, impactful paragraph without bullet points or additional explanations, using professional language and tone appropriate for executive-level communication.
` : `
    As an expert resume writer, improve the following ${type} description for a ${user.industry} professional.
    Make it more impactful, quantifiable, and aligned with industry standards.
    Current content: "${current}"

    Requirements:
    1. Use action verbs
    2. Include metrics and results where possible
    3. Highlight relevant technical skills
    4. Keep it concise but detailed
    5. Focus on achievements over responsibilities
    6. Use industry-specific keywords
    
    Format the response as bullet points(atleast 4) without any additional text or explanations.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const improvedContent = response.text().trim();

        return improvedContent;
    } catch (error) {
        console.error("Error improving content:", error);
        throw new Error("Failed to improve content");
    }
}