"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateCoverLetter({ companyName, jobDescription, jobTitle }) {
    console.log(2);
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const prompt = `
    Write a professional Cover Letter for a ${jobTitle} position at ${companyName}.
    
    About the candidate:
    - Industry: ${user.industry}
    - Years of Experience: ${user.experience}
    - Skills: ${user.skills?.join(", ")}
    - Professional Background: ${user?.bio}
    
    Job Description:
    ${jobDescription}
    
    Requirements:
    1. Use a professional, enthusiastic tone
    2. Highlight relevant skills and experience
    3. Show understanding of the company's needs
    4. Keep it concise (max 400 words)
    5. Use proper business letter formatting in markdown
    6. Include specific examples of achievements
    7. Relate candidate's background to job requirements
    
    Format the letter in markdown(two or more spaces for next line).
    For example:
"[Your Name]  
[Your Address]  
[Your Phone Number]  
[Your Email Address]  

[Date]  

[Hiring Manager Name]   
Google Hiring Team  
[Google Address]  

### Subject: Application for Software Development Engineer I Position  

Dear Google Hiring Team,  

I am writing to express my enthusiastic interest in the Software Development Engineer I position at Google, as advertised on [Platform where you saw the job posting]. With four years of experience in the tech-software-development industry and a strong foundation in Python and Java, I am confident I possess the skills and drive to contribute significantly to your team.

In my previous roles, I have consistently focused on building and implementing functional programs, aligning perfectly with the core responsibilities outlined in your job description. I have hands-on experience in designing algorithms and flowcharts, producing clean and efficient code, and integrating software components. For example, in a project at First Try, I developed a Python-based data processing tool that improved data retrieval efficiency by 30%, demonstrating my ability to deliver tangible results.

Furthermore, my familiarity with Agile development methodologies and test-driven environments aligns with Google’s collaborative and efficient development practices. I am a team player with a keen eye for detail and strong problem-solving skills, essential for troubleshooting and debugging software. I am also adept at learning new languages and technologies, as evidenced by my rapid adoption of new frameworks and tools throughout my career.

Google’s commitment to innovation and its impact on a global scale deeply resonates with my professional aspirations. I am particularly drawn to Google’s culture of continuous improvement and its dedication to creating solutions that serve user needs effectively. I believe my technical skills, combined with my passion for creating high-quality software, make me an ideal candidate for this role.

I am eager to contribute to Google’s mission and am available for an interview at your earliest convenience. Thank you for your time and consideration.

Sincerely,  
[Your Name]  "
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const content = response.text().trim();
        console.log(response);

        const coverLetter = await db.coverLetter.create({
            data: {
                content: content,
                jobDescription: jobDescription,
                companyName: companyName,
                jobTitle: jobTitle,
                //status: "completed",
                userId: user.id,
                updatedAt: new Date(),
            },
        });

        return coverLetter;
    } catch (error) {
        console.error("Error generating cover letter:", error.message);
        throw new Error("Failed to generate cover letter");
    }
}

export async function getCoverLetters() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    return await db.coverLetter.findMany({
        where: {
            userId: user.id,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function getCoverLetter(id) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    return await db.coverLetter.findUnique({
        where: {
            id,
            userId: user.id,
        },
    });
}

export async function deleteCoverLetter(id) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    return await db.coverLetter.delete({
        where: {
            id,
            userId: user.id,
        },
    });
}

export async function updateCoverLetter({id,content}) {
    console.log("Action fn",content);
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    try {
        const coverLetter = await db.coverLetter.update({
            where: {
                id,
                userId: user.id,
            },
            data: {
                content,
                updatedAt: new Date(),
            },
        });

        return coverLetter;
    } catch (error) {
        console.error("Error saving cover letter:", error.message);
        throw new Error("Failed to update cover letter");
    }
}